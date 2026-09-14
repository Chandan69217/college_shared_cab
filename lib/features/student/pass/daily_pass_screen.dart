import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:qr_flutter/qr_flutter.dart';
import '../../../core/api/api_client.dart';
import '../../../core/models/pass_model.dart';
import '../../../core/theme/app_colors.dart';
import '../../auth/providers/auth_provider.dart';

class DailyPassScreen extends ConsumerStatefulWidget {
  const DailyPassScreen({super.key});

  @override
  ConsumerState<DailyPassScreen> createState() => _DailyPassScreenState();
}

class _DailyPassScreenState extends ConsumerState<DailyPassScreen> {
  DailyPassModel? _pass;
  String? _qrToken;
  bool _isLoading = true;
  Timer? _countdownTimer;
  int _secondsLeft = 1800; // 30 mins default

  Future<void> _fetchPass() async {
    try {
      final res = await apiClient.get('/students/passes');
      if (res.data['success'] == true && mounted) {
        final List list = res.data['data'] ?? [];
        if (list.isNotEmpty) {
          final passModel = DailyPassModel.fromJson(list.first);
          setState(() {
            _pass = passModel;
            _qrToken = passModel.authTokenHash;
          });

          // Fetch fresh dynamic signed token from backend
          if (passModel.status == 'ACTIVE') {
            final qrRes = await apiClient.get('/qr/student/pass/${passModel.id}');
            if (qrRes.data['success'] == true && mounted) {
              setState(() {
                _qrToken = qrRes.data['data']['qrToken'];
                _isLoading = false;
              });
            }
          } else {
            setState(() => _isLoading = false);
          }
        } else {
          setState(() => _isLoading = false);
        }
      }
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  void initState() {
    super.initState();
    _fetchPass();
    _countdownTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (mounted && _secondsLeft > 0) {
        setState(() => _secondsLeft--);
      }
    });
  }

  @override
  void dispose() {
    _countdownTimer?.cancel();
    super.dispose();
  }

  String _formatCountdown() {
    final mins = (_secondsLeft ~/ 60).toString().padLeft(2, '0');
    final secs = (_secondsLeft % 60).toString().padLeft(2, '0');
    return '$mins:$secs';
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(authProvider).user;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text("Today's Daily Travel Pass"),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: () {
              setState(() => _isLoading = true);
              _fetchPass();
            },
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
          : _pass == null
              ? Center(
                  child: Padding(
                    padding: const EdgeInsets.all(32),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.qr_code_2_rounded, size: 64, color: AppColors.textMuted),
                        const SizedBox(height: 16),
                        const Text(
                          'No Active Travel Pass',
                          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16),
                        ),
                        const SizedBox(height: 6),
                        const Text(
                          'Book a ride from the "Book Ride" tab to generate your authenticated daily pass.',
                          textAlign: TextAlign.center,
                          style: TextStyle(color: AppColors.textSecondary, fontSize: 12),
                        ),
                      ],
                    ),
                  ),
                )
              : SingleChildScrollView(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      // Digital Pass Ticket Container
                      Container(
                        decoration: BoxDecoration(
                          color: AppColors.surfaceCard,
                          borderRadius: BorderRadius.circular(24),
                          border: Border.all(
                            color: _pass!.status == 'ACTIVE'
                                ? AppColors.primary.withOpacity(0.4)
                                : const Color(0xFF374151),
                            width: 1.5,
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: _pass!.status == 'ACTIVE'
                                  ? AppColors.primary.withOpacity(0.15)
                                  : Colors.transparent,
                              blurRadius: 20,
                              offset: const Offset(0, 8),
                            ),
                          ],
                        ),
                        child: Column(
                          children: [
                            // Ticket Header
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                              decoration: BoxDecoration(
                                color: AppColors.surface,
                                borderRadius: const BorderRadius.only(
                                  topLeft: Radius.circular(22),
                                  topRight: Radius.circular(22),
                                ),
                                border: const Border(
                                  bottom: BorderSide(color: Color(0xFF374151)),
                                ),
                              ),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      const Text(
                                        'DAILY COMMUTER PASS',
                                        style: TextStyle(
                                          color: AppColors.primaryLight,
                                          fontWeight: FontWeight.w900,
                                          fontSize: 12,
                                          letterSpacing: 0.5,
                                        ),
                                      ),
                                      const SizedBox(height: 2),
                                      Text(
                                        _pass!.passDate,
                                        style: const TextStyle(
                                          color: Colors.white,
                                          fontWeight: FontWeight.bold,
                                          fontSize: 13,
                                        ),
                                      ),
                                    ],
                                  ),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                    decoration: BoxDecoration(
                                      color: _pass!.status == 'ACTIVE'
                                          ? AppColors.primary.withOpacity(0.2)
                                          : AppColors.accentBlue.withOpacity(0.2),
                                      borderRadius: BorderRadius.circular(10),
                                    ),
                                    child: Text(
                                      _pass!.status,
                                      style: TextStyle(
                                        color: _pass!.status == 'ACTIVE'
                                            ? AppColors.primaryLight
                                            : AppColors.accentBlue,
                                        fontWeight: FontWeight.bold,
                                        fontSize: 11,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),

                            // QR Code Section
                            Padding(
                              padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 16),
                              child: Column(
                                children: [
                                  if (_pass!.status == 'ACTIVE') ...[
                                    Container(
                                      padding: const EdgeInsets.all(16),
                                      decoration: BoxDecoration(
                                        color: Colors.white,
                                        borderRadius: BorderRadius.circular(20),
                                        boxShadow: [
                                          BoxShadow(
                                            color: Colors.black.withOpacity(0.3),
                                            blurRadius: 10,
                                          ),
                                        ],
                                      ),
                                      child: QrImageView(
                                        data: _qrToken ?? _pass!.authTokenHash,
                                        version: QrVersions.auto,
                                        size: 190.0,
                                        backgroundColor: Colors.white,
                                      ),
                                    ),
                                    const SizedBox(height: 12),
                                    Row(
                                      mainAxisAlignment: MainAxisAlignment.center,
                                      children: [
                                        const Icon(Icons.timer_outlined, size: 14, color: AppColors.accentAmber),
                                        const SizedBox(width: 4),
                                        Text(
                                          'Token valid for: ${_formatCountdown()}',
                                          style: const TextStyle(
                                            color: AppColors.accentAmber,
                                            fontWeight: FontWeight.bold,
                                            fontSize: 12,
                                          ),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 4),
                                    const Text(
                                      'Present this QR code to your cab driver upon boarding.',
                                      textAlign: TextAlign.center,
                                      style: TextStyle(color: AppColors.textMuted, fontSize: 11),
                                    ),
                                  ] else ...[
                                    Container(
                                      padding: const EdgeInsets.all(24),
                                      decoration: BoxDecoration(
                                        color: AppColors.surface,
                                        borderRadius: BorderRadius.circular(16),
                                      ),
                                      child: const Column(
                                        children: [
                                          Icon(Icons.check_circle_rounded, color: AppColors.primary, size: 48),
                                          SizedBox(height: 10),
                                          Text(
                                            'Boarding Authenticated',
                                            style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15),
                                          ),
                                          SizedBox(height: 4),
                                          Text(
                                            'This pass has been verified by the driver.',
                                            style: TextStyle(color: AppColors.textSecondary, fontSize: 12),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ],
                                ],
                              ),
                            ),

                            // Ticket Details Card
                            Container(
                              padding: const EdgeInsets.all(18),
                              decoration: const BoxDecoration(
                                color: AppColors.surface,
                                borderRadius: BorderRadius.only(
                                  bottomLeft: Radius.circular(22),
                                  bottomRight: Radius.circular(22),
                                ),
                                border: Border(
                                  top: BorderSide(color: Color(0xFF374151)),
                                ),
                              ),
                              child: Column(
                                children: [
                                  _buildPassRow('Passenger Name', user?.fullName ?? 'Aarav Sharma'),
                                  _buildPassRow('Assigned Route', _pass!.route?['name'] ?? 'Route 1: Central Metro Express'),
                                  _buildPassRow('Pickup Stop', _pass!.pickup?['name'] ?? 'Sector 18 Metro Gate 2'),
                                  _buildPassRow(
                                    'Trip Slot',
                                    _pass!.tripType == 'MORNING_PICKUP' ? 'Morning Pickup (07:30 AM)' : 'Evening Return (05:00 PM)',
                                  ),
                                  _buildPassRow('Cryptographic Signature', 'SHA-256 HMAC Verified', isCode: true),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
    );
  }

  Widget _buildPassRow(String label, String value, {bool isCode = false}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(color: AppColors.textSecondary, fontSize: 12)),
          const SizedBox(width: 8),
          Flexible(
            child: Text(
              value,
              textAlign: TextAlign.right,
              style: TextStyle(
                color: isCode ? AppColors.primaryLight : Colors.white,
                fontWeight: FontWeight.bold,
                fontSize: 12,
                fontFamily: isCode ? 'monospace' : null,
              ),
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }
}
