import 'package:flutter/material.dart';
import '../../../core/api/api_client.dart';
import '../../../core/theme/app_colors.dart';

class QrScannerScreen extends StatefulWidget {
  const QrScannerScreen({super.key});

  @override
  State<QrScannerScreen> createState() => _QrScannerScreenState();
}

class _QrScannerScreenState extends State<QrScannerScreen> {
  final _tokenInputController = TextEditingController();
  bool _isVerifying = false;
  Map<String, dynamic>? _lastScanResult;

  @override
  void dispose() {
    _tokenInputController.dispose();
    super.dispose();
  }

  Future<void> _handleVerifyToken([String? token]) async {
    final tokenToVerify = token ?? _tokenInputController.text.trim();
    if (tokenToVerify.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please scan or enter QR token.')),
      );
      return;
    }

    setState(() {
      _isVerifying = true;
      _lastScanResult = null;
    });

    try {
      final res = await apiClient.post('/qr/driver/verify-scan', data: {
        'trip_id': '77777777-7777-7777-7777-777777777771',
        'token': tokenToVerify,
        'client_latitude': 28.5708,
        'client_longitude': 77.3260,
      });

      if (mounted) {
        setState(() {
          _lastScanResult = res.data['data'];
          _isVerifying = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _lastScanResult = {
            'authorized': false,
            'status': 'NOT_AUTHORIZED',
            'reason': 'VERIFICATION_ERROR',
            'message': 'Failed to communicate with authentication server.',
          };
          _isVerifying = false;
        });
      }
    }
  }

  void _simulateScanValidPass() {
    _tokenInputController.text = 'DEMO_HASH_AARAV';
    _handleVerifyToken('DEMO_HASH_AARAV');
  }

  void _simulateScanAlreadyUsedPass() {
    _tokenInputController.text = 'DEMO_HASH_AARAV';
    _handleVerifyToken('DEMO_HASH_AARAV');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Dynamic QR Ticket Scanner'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Scanner Viewfinder Container
            Container(
              height: 220,
              decoration: BoxDecoration(
                color: Colors.black,
                borderRadius: BorderRadius.circular(24),
                border: Border.all(color: const Color(0xFF374151), width: 1.5),
              ),
              child: Stack(
                alignment: Alignment.center,
                children: [
                  // Viewfinder Grid Overlay
                  Container(
                    width: 170,
                    height: 170,
                    decoration: BoxDecoration(
                      border: Border.all(color: AppColors.primary, width: 2),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.qr_code_scanner_rounded, color: AppColors.primary, size: 48),
                        const SizedBox(height: 6),
                        Text(
                          'Point Camera at Student QR',
                          style: TextStyle(color: Colors.white.withOpacity(0.8), fontSize: 10, fontWeight: FontWeight.bold),
                        ),
                      ],
                    ),
                  ),

                  // Scanning Laser Line Simulator
                  Positioned(
                    top: 105,
                    left: 40,
                    right: 40,
                    child: Container(
                      height: 2,
                      decoration: BoxDecoration(
                        color: AppColors.primary,
                        boxShadow: [
                          BoxShadow(
                            color: AppColors.primary.withOpacity(0.8),
                            blurRadius: 8,
                            spreadRadius: 2,
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // One-Touch Simulation Bar
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: _simulateScanValidPass,
                    style: OutlinedButton.styleFrom(
                      foregroundColor: AppColors.primaryLight,
                      side: const BorderSide(color: Color(0xFF374151)),
                    ),
                    icon: const Icon(Icons.check_circle_outline, size: 16),
                    label: const Text('Simulate Valid Pass', style: TextStyle(fontSize: 11)),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: _simulateScanAlreadyUsedPass,
                    style: OutlinedButton.styleFrom(
                      foregroundColor: AppColors.accentRose,
                      side: const BorderSide(color: Color(0xFF374151)),
                    ),
                    icon: const Icon(Icons.replay_rounded, size: 16),
                    label: const Text('Simulate Replay Scan', style: TextStyle(fontSize: 11)),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),

            // Token Input Field
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _tokenInputController,
                    style: const TextStyle(color: Colors.white, fontSize: 13, fontFamily: 'monospace'),
                    decoration: const InputDecoration(
                      labelText: 'Manual Pass Token Input',
                      hintText: 'Enter base64 signed pass token',
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                ElevatedButton(
                  onPressed: _isVerifying ? null : () => _handleVerifyToken(),
                  style: ElevatedButton.styleFrom(padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14)),
                  child: _isVerifying
                      ? const SizedBox(
                          height: 16,
                          width: 16,
                          child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                        )
                      : const Text('Verify'),
                ),
              ],
            ),
            const SizedBox(height: 20),

            // Prominent Verification Result Banner
            if (_lastScanResult != null) ...[
              _buildVerificationBanner(_lastScanResult!),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildVerificationBanner(Map<String, dynamic> result) {
    final bool isAuthorized = result['authorized'] == true;

    return Container(
      decoration: BoxDecoration(
        color: isAuthorized ? const Color(0xFF064E3B) : const Color(0xFF881337),
        borderRadius: BorderRadius.circular(22),
        border: Border.all(
          color: isAuthorized ? AppColors.primary : AppColors.accentRose,
          width: 2,
        ),
        boxShadow: [
          BoxShadow(
            color: (isAuthorized ? AppColors.primary : AppColors.accentRose).withOpacity(0.3),
            blurRadius: 20,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      padding: const EdgeInsets.all(20),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                isAuthorized ? Icons.check_circle_rounded : Icons.cancel_rounded,
                color: Colors.white,
                size: 32,
              ),
              const SizedBox(width: 10),
              Text(
                isAuthorized ? 'AUTHORIZED' : 'NOT AUTHORIZED',
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w900,
                  fontSize: 20,
                  letterSpacing: 1,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            result['message'] ?? '',
            textAlign: TextAlign.center,
            style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w500),
          ),
          if (result['reason'] != null && !isAuthorized) ...[
            const SizedBox(height: 6),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: Colors.black.withOpacity(0.3),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                'REJECTION REASON: ${result['reason']}',
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                  fontSize: 11,
                  fontFamily: 'monospace',
                ),
              ),
            ),
          ],
          if (isAuthorized && result['student'] != null) ...[
            const Divider(color: Colors.white24, height: 24),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Passenger Name:', style: TextStyle(color: Colors.white70, fontSize: 12)),
                Text(
                  result['student']?['full_name'] ?? 'Aarav Sharma',
                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
                ),
              ],
            ),
            const SizedBox(height: 4),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Student ID:', style: TextStyle(color: Colors.white70, fontSize: 12)),
                Text(
                  result['student']?['student_id_number'] ?? 'STU-2024-042',
                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12, fontFamily: 'monospace'),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}
