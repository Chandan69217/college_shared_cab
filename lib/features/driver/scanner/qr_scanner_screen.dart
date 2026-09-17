import 'dart:async';
import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:permission_handler/permission_handler.dart';
import '../../../core/api/api_client.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/app_feedback.dart';

class QrScannerScreen extends StatefulWidget {
  final bool isActive;
  const QrScannerScreen({super.key, this.isActive = true});

  @override
  State<QrScannerScreen> createState() => _QrScannerScreenState();
}

class _QrScannerScreenState extends State<QrScannerScreen>
    with SingleTickerProviderStateMixin, WidgetsBindingObserver {
  late final MobileScannerController _scannerController;
  final TextEditingController _tokenInputController = TextEditingController();
  late AnimationController _animationController;
  late Animation<double> _scanAnimation;

  bool _isVerifying = false;
  bool _isTorchOn = false;
  bool _isManualInputOpen = false;
  bool _hasPermission = true;
  bool _isCameraRunning = false;
  String? _activeTripId;
  String? _activeTripRouteName;
  String? _activeVehicleNumber;
  int _boardedCount = 0;
  int _bookedCount = 0;
  DateTime? _lastScanTime;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);

    _scannerController = MobileScannerController(
      detectionSpeed: DetectionSpeed.noDuplicates,
      facing: CameraFacing.back,
      torchEnabled: false,
      autoStart: false,
    );

    _animationController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    );

    _scanAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _animationController,
        curve: Curves.easeInOut,
      ),
    );

    _fetchActiveTrip();

    if (widget.isActive) {
      _animationController.repeat(reverse: true);
      WidgetsBinding.instance.addPostFrameCallback((_) {
        _startCamera();
      });
    }
  }

  @override
  void didUpdateWidget(covariant QrScannerScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.isActive != oldWidget.isActive) {
      if (widget.isActive) {
        _fetchActiveTrip();
        _animationController.repeat(reverse: true);
        _startCamera();
      } else {
        _animationController.stop();
        _stopCamera();
      }
    }
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    super.didChangeAppLifecycleState(state);
    if (!widget.isActive) return;

    if (state == AppLifecycleState.resumed) {
      _animationController.repeat(reverse: true);
      _startCamera();
    } else if (state == AppLifecycleState.inactive ||
        state == AppLifecycleState.paused ||
        state == AppLifecycleState.detached) {
      _animationController.stop();
      _stopCamera();
    }
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _animationController.dispose();
    _stopCamera();
    _scannerController.dispose();
    _tokenInputController.dispose();
    super.dispose();
  }

  Future<void> _startCamera() async {
    if (!mounted || !widget.isActive) return;

    try {
      final status = await Permission.camera.request();
      if (!mounted) return;

      if (!status.isGranted) {
        setState(() {
          _hasPermission = false;
          _isCameraRunning = false;
        });
        return;
      }

      setState(() {
        _hasPermission = true;
      });

      await _scannerController.start();
      if (mounted) {
        setState(() {
          _isCameraRunning = true;
        });
      }
    } catch (e) {
      debugPrint('[QrScannerScreen] Camera start error: $e');
    }
  }

  Future<void> _stopCamera() async {
    try {
      if (_isTorchOn) {
        _isTorchOn = false;
      }
      await _scannerController.stop();
      if (mounted) {
        setState(() {
          _isCameraRunning = false;
        });
      }
    } catch (e) {
      debugPrint('[QrScannerScreen] Camera stop error: $e');
    }
  }

  Future<void> _fetchActiveTrip() async {
    try {
      final res = await apiClient.get('/drivers/dashboard');
      if (res.data['success'] == true && mounted) {
        final activeTrip = res.data['data']?['activeTrip'];
        if (activeTrip != null) {
          setState(() {
            _activeTripId = activeTrip['id'];
            _activeTripRouteName = activeTrip['route']?['name'] ?? 'Scheduled Route';
            _activeVehicleNumber = activeTrip['vehicle']?['vehicle_number'] ?? 'Assigned Cab';
            _boardedCount = activeTrip['boarded_passengers'] ?? 0;
            _bookedCount = activeTrip['booked_seats'] ?? 0;
          });
        }
      }
    } catch (_) {}
  }

  Future<void> _onBarcodeDetected(BarcodeCapture capture) async {
    if (_isVerifying || !widget.isActive) return;

    final List<Barcode> barcodes = capture.barcodes;
    if (barcodes.isEmpty) return;

    final String? rawValue = barcodes.first.rawValue;
    if (rawValue == null || rawValue.trim().isEmpty) return;

    // Debounce duplicate scans within 2.5 seconds
    final now = DateTime.now();
    if (_lastScanTime != null && now.difference(_lastScanTime!).inMilliseconds < 2500) {
      return;
    }
    _lastScanTime = now;

    await _processVerification(rawValue.trim());
  }

  Future<void> _processVerification(String token) async {
    if (_isVerifying) return;

    if (_activeTripId == null) {
      await _fetchActiveTrip();
      if (_activeTripId == null) {
        if (mounted) {
          AppFeedback.showWarning(context, 'No active scheduled trip found for your account.');
        }
        return;
      }
    }

    setState(() => _isVerifying = true);

    try {
      final res = await apiClient.post('/qr/driver/verify-scan', data: {
        'trip_id': _activeTripId,
        'token': token,
      });

      if (!mounted) return;

      final data = res.data['data'] as Map<String, dynamic>? ?? {};
      final bool authorized = data['authorized'] == true;

      if (authorized) {
        setState(() {
          _boardedCount++;
        });
        _showSuccessModal(data);
      } else {
        _showRejectionModal(data);
      }
    } catch (e) {
      if (mounted) {
        _showRejectionModal({
          'authorized': false,
          'status': 'NOT_AUTHORIZED',
          'reason': 'VERIFICATION_ERROR',
          'message': ApiClient.getErrorMessage(e),
        });
      }
    } finally {
      if (mounted) {
        setState(() => _isVerifying = false);
      }
    }
  }

  void _showSuccessModal(Map<String, dynamic> data) {
    final student = data['student'] as Map<String, dynamic>? ?? {};
    final pickup = data['pickupPoint'] as Map<String, dynamic>? ?? {};

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        padding: const EdgeInsets.all(24),
        decoration: const BoxDecoration(
          color: AppColors.surfaceCard,
          borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
          border: Border(
            top: BorderSide(color: AppColors.primary, width: 2),
          ),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Center(
              child: Container(
                width: 44,
                height: 5,
                decoration: BoxDecoration(
                  color: Colors.white24,
                  borderRadius: BorderRadius.circular(10),
                ),
              ),
            ),
            const SizedBox(height: 18),
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppColors.primary.withValues(alpha: 0.2),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.check_circle_rounded,
                      color: AppColors.primaryLight, size: 36),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'BOARDING APPROVED',
                        style: TextStyle(
                          color: AppColors.primaryLight,
                          fontWeight: FontWeight.w900,
                          fontSize: 16,
                          letterSpacing: 0.5,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        data['message'] ?? 'Student verified for boarding.',
                        style: const TextStyle(
                            color: Colors.white70, fontSize: 12),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const Divider(color: Color(0xFF374151), height: 32),
            _buildDetailRow(
              icon: Icons.person_rounded,
              label: 'Student Name',
              value: student['full_name'] ?? 'Passenger',
            ),
            const SizedBox(height: 10),
            _buildDetailRow(
              icon: Icons.badge_rounded,
              label: 'Student ID / Roll',
              value: student['student_id_number'] ?? student['id']?.toString().substring(0, 8) ?? 'N/A',
              isCode: true,
            ),
            const SizedBox(height: 10),
            _buildDetailRow(
              icon: Icons.school_rounded,
              label: 'Course',
              value: student['course'] ?? 'Apex University',
            ),
            const SizedBox(height: 10),
            _buildDetailRow(
              icon: Icons.location_on_rounded,
              label: 'Pickup Stop',
              value: pickup['name'] ?? 'Assigned Stop',
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: () => Navigator.pop(ctx),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                minimumSize: const Size.fromHeight(48),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
              ),
              child: const Text(
                'Scan Next Student',
                style: TextStyle(
                  color: Colors.black,
                  fontWeight: FontWeight.bold,
                  fontSize: 14,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showRejectionModal(Map<String, dynamic> data) {
    final reason = data['reason'] ?? 'NOT_AUTHORIZED';
    final message = data['message'] ?? 'QR pass verification failed.';

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        padding: const EdgeInsets.all(24),
        decoration: const BoxDecoration(
          color: Color(0xFF1F1216),
          borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
          border: Border(
            top: BorderSide(color: AppColors.accentRose, width: 2),
          ),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Center(
              child: Container(
                width: 44,
                height: 5,
                decoration: BoxDecoration(
                  color: Colors.white24,
                  borderRadius: BorderRadius.circular(10),
                ),
              ),
            ),
            const SizedBox(height: 18),
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppColors.accentRose.withValues(alpha: 0.2),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.cancel_rounded,
                      color: AppColors.accentRose, size: 36),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'BOARDING DENIED',
                        style: TextStyle(
                          color: AppColors.accentRose,
                          fontWeight: FontWeight.w900,
                          fontSize: 16,
                          letterSpacing: 0.5,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        message,
                        style: const TextStyle(
                            color: Colors.white70, fontSize: 12),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 18),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              decoration: BoxDecoration(
                color: Colors.black.withValues(alpha: 0.4),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.accentRose.withValues(alpha: 0.3)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.warning_amber_rounded,
                      color: AppColors.accentRose, size: 18),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Rejection Code: $reason',
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                        fontSize: 12,
                        fontFamily: 'monospace',
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: () => Navigator.pop(ctx),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF374151),
                minimumSize: const Size.fromHeight(48),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
              ),
              child: const Text(
                'Dismiss & Retry Scan',
                style: TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                  fontSize: 14,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDetailRow({
    required IconData icon,
    required String label,
    required String value,
    bool isCode = false,
  }) {
    return Row(
      children: [
        Icon(icon, color: AppColors.textMuted, size: 18),
        const SizedBox(width: 10),
        Text(
          label,
          style: const TextStyle(color: AppColors.textSecondary, fontSize: 13),
        ),
        const Spacer(),
        Text(
          value,
          style: TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.bold,
            fontSize: 13,
            fontFamily: isCode ? 'monospace' : null,
          ),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Live QR Ticket Scanner'),
        actions: [
          IconButton(
            tooltip: _isTorchOn ? 'Turn Flash Off' : 'Turn Flash On',
            icon: Icon(
              _isTorchOn ? Icons.flash_on_rounded : Icons.flash_off_rounded,
              color: _isTorchOn ? AppColors.accentAmber : Colors.white70,
            ),
            onPressed: () async {
              try {
                await _scannerController.toggleTorch();
                setState(() => _isTorchOn = !_isTorchOn);
              } catch (_) {}
            },
          ),
          IconButton(
            tooltip: 'Switch Camera',
            icon: const Icon(Icons.cameraswitch_rounded, color: Colors.white70),
            onPressed: () async {
              try {
                await _scannerController.switchCamera();
              } catch (_) {}
            },
          ),
          IconButton(
            tooltip: 'Reload Camera',
            icon: const Icon(Icons.refresh_rounded, color: Colors.white70),
            onPressed: () {
              _startCamera();
            },
          ),
        ],
      ),
      body: Column(
        children: [
          // Trip Header Strip
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: const BoxDecoration(
              color: AppColors.surfaceCard,
              border: Border(
                bottom: BorderSide(color: Color(0xFF374151)),
              ),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        _activeTripRouteName ?? 'Active Trip Assignment',
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                          fontSize: 13,
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 2),
                      Text(
                        'Cab: ${_activeVehicleNumber ?? "N/A"}',
                        style: const TextStyle(
                          color: AppColors.textSecondary,
                          fontSize: 11,
                        ),
                      ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                  decoration: BoxDecoration(
                    color: AppColors.primary.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: AppColors.primary.withValues(alpha: 0.4)),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.how_to_reg_rounded,
                          color: AppColors.primaryLight, size: 14),
                      const SizedBox(width: 4),
                      Text(
                        '$_boardedCount / $_bookedCount Boarded',
                        style: const TextStyle(
                          color: AppColors.primaryLight,
                          fontWeight: FontWeight.bold,
                          fontSize: 11,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // Camera Scanner Area
          Expanded(
            child: widget.isActive
                ? Stack(
                    alignment: Alignment.center,
                    children: [
                      if (!_hasPermission)
                        Center(
                          child: Padding(
                            padding: const EdgeInsets.all(24),
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                const Icon(Icons.camera_alt_outlined,
                                    size: 56, color: AppColors.accentRose),
                                const SizedBox(height: 16),
                                const Text(
                                  'Camera Access Required',
                                  style: TextStyle(
                                      color: Colors.white,
                                      fontWeight: FontWeight.bold,
                                      fontSize: 16),
                                ),
                                const SizedBox(height: 6),
                                Text(
                                  'Please enable camera permissions in device settings to scan student tickets.',
                                  textAlign: TextAlign.center,
                                  style: TextStyle(
                                      color: Colors.white.withValues(alpha: 0.7),
                                      fontSize: 12),
                                ),
                                const SizedBox(height: 20),
                                ElevatedButton.icon(
                                  onPressed: () async {
                                    final status = await Permission.camera.request();
                                    if (status.isGranted) {
                                      _startCamera();
                                    } else if (status.isPermanentlyDenied) {
                                      openAppSettings();
                                    }
                                  },
                                  icon: const Icon(Icons.security_rounded, size: 16),
                                  label: const Text('Grant Camera Permission'),
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: AppColors.primary,
                                    foregroundColor: Colors.black,
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        )
                      else
                        MobileScanner(
                          controller: _scannerController,
                          onDetect: _onBarcodeDetected,
                          errorBuilder: (context, error, child) {
                            return Center(
                              child: Padding(
                                padding: const EdgeInsets.all(24),
                                child: Column(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    const Icon(Icons.camera_alt_outlined,
                                        size: 56, color: AppColors.accentRose),
                                    const SizedBox(height: 16),
                                    const Text(
                                      'Camera Access Error',
                                      style: TextStyle(
                                          color: Colors.white,
                                          fontWeight: FontWeight.bold,
                                          fontSize: 16),
                                    ),
                                    const SizedBox(height: 6),
                                    Text(
                                      error.errorCode == MobileScannerErrorCode.permissionDenied
                                          ? 'Please grant camera permission to scan student tickets.'
                                          : 'Unable to start camera stream. Tap below to retry.',
                                      textAlign: TextAlign.center,
                                      style: TextStyle(
                                          color: Colors.white.withValues(alpha: 0.7),
                                          fontSize: 12),
                                    ),
                                    const SizedBox(height: 20),
                                    ElevatedButton.icon(
                                      onPressed: () async {
                                        final status = await Permission.camera.request();
                                        if (status.isGranted) {
                                          _startCamera();
                                        } else if (status.isPermanentlyDenied) {
                                          openAppSettings();
                                        }
                                      },
                                      icon: const Icon(Icons.refresh_rounded, size: 16),
                                      label: const Text('Retry Camera'),
                                      style: ElevatedButton.styleFrom(
                                        backgroundColor: AppColors.primary,
                                        foregroundColor: Colors.black,
                                        shape: RoundedRectangleBorder(
                                          borderRadius: BorderRadius.circular(12),
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            );
                          },
                        ),

                      // Viewfinder Target Frame
                      if (_hasPermission)
                        SizedBox(
                          width: 250,
                          height: 250,
                          child: Stack(
                            children: [
                              // Viewfinder Corners
                              Positioned.fill(
                                child: Container(
                                  decoration: BoxDecoration(
                                    border: Border.all(
                                      color: AppColors.primary.withValues(alpha: 0.6),
                                      width: 2,
                                    ),
                                    borderRadius: BorderRadius.circular(24),
                                  ),
                                ),
                              ),

                              // Animated Laser Scan Line
                              AnimatedBuilder(
                                animation: _scanAnimation,
                                builder: (context, child) {
                                  return Positioned(
                                    top: _scanAnimation.value * 230,
                                    left: 8,
                                    right: 8,
                                    child: Container(
                                      height: 3,
                                      decoration: BoxDecoration(
                                        color: AppColors.primary,
                                        borderRadius: BorderRadius.circular(2),
                                        boxShadow: [
                                          BoxShadow(
                                            color: AppColors.primary.withValues(alpha: 0.9),
                                            blurRadius: 10,
                                            spreadRadius: 2,
                                          ),
                                        ],
                                      ),
                                    ),
                                  );
                                },
                              ),

                              // Verifying Spinner Overlay
                              if (_isVerifying)
                                Container(
                                  decoration: BoxDecoration(
                                    color: Colors.black.withValues(alpha: 0.6),
                                    borderRadius: BorderRadius.circular(24),
                                  ),
                                  child: const Center(
                                    child: Column(
                                      mainAxisAlignment: MainAxisAlignment.center,
                                      children: [
                                        CircularProgressIndicator(color: AppColors.primary),
                                        SizedBox(height: 12),
                                        Text(
                                          'Verifying Pass...',
                                          style: TextStyle(
                                            color: Colors.white,
                                            fontWeight: FontWeight.bold,
                                            fontSize: 12,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                            ],
                          ),
                        ),

                      // Instruction Label
                      if (_hasPermission)
                        Positioned(
                          bottom: 32,
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                            decoration: BoxDecoration(
                              color: Colors.black.withValues(alpha: 0.7),
                              borderRadius: BorderRadius.circular(20),
                              border: Border.all(color: Colors.white24),
                            ),
                            child: const Row(
                              children: [
                                Icon(Icons.qr_code_scanner_rounded,
                                    color: AppColors.primaryLight, size: 16),
                                SizedBox(width: 8),
                                Text(
                                  'Align student QR code within frame',
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontSize: 12,
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                    ],
                  )
                : Container(
                    color: AppColors.background,
                    child: Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.camera_alt_outlined,
                              size: 48,
                              color: Colors.white.withValues(alpha: 0.3)),
                          const SizedBox(height: 12),
                          Text(
                            'Camera Paused',
                            style: TextStyle(
                              color: Colors.white.withValues(alpha: 0.5),
                              fontSize: 14,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
          ),

          // Manual Token Entry Toggle Bar
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: const BoxDecoration(
              color: AppColors.surfaceCard,
              border: Border(
                top: BorderSide(color: Color(0xFF374151)),
              ),
            ),
            child: Column(
              children: [
                GestureDetector(
                  onTap: () {
                    setState(() => _isManualInputOpen = !_isManualInputOpen);
                  },
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Row(
                        children: [
                          Icon(Icons.keyboard_rounded,
                              color: AppColors.textSecondary, size: 18),
                          SizedBox(width: 8),
                          Text(
                            'Manual Code Entry Fallback',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                      Icon(
                        _isManualInputOpen
                            ? Icons.keyboard_arrow_down_rounded
                            : Icons.keyboard_arrow_up_rounded,
                        color: AppColors.textMuted,
                      ),
                    ],
                  ),
                ),
                if (_isManualInputOpen) ...[
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _tokenInputController,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 12,
                            fontFamily: 'monospace',
                          ),
                          decoration: InputDecoration(
                            hintText: 'Paste or type student token',
                            isDense: true,
                            contentPadding: const EdgeInsets.symmetric(
                                horizontal: 12, vertical: 10),
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(10),
                              borderSide:
                                  const BorderSide(color: Color(0xFF374151)),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      ElevatedButton(
                        onPressed: _isVerifying
                            ? null
                            : () {
                                final text = _tokenInputController.text.trim();
                                if (text.isNotEmpty) {
                                  _processVerification(text);
                                }
                              },
                        style: ElevatedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 14, vertical: 10),
                        ),
                        child: const Text('Verify', style: TextStyle(fontSize: 12)),
                      ),
                    ],
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}
