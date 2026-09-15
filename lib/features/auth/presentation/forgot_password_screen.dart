import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_colors.dart';
import '../providers/auth_provider.dart';

class ForgotPasswordScreen extends ConsumerStatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  ConsumerState<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends ConsumerState<ForgotPasswordScreen> {
  int _step = 1; // 1: Identifier (Email/Mobile), 2: OTP, 3: New Password, 4: Success

  final _identifierController = TextEditingController();
  final _otpController = TextEditingController();
  final _newPasswordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();

  bool _obscurePassword = true;
  bool _isLoading = false;
  String? _errorMessage;
  String? _infoMessage;
  String? _resetToken;

  int _cooldownSeconds = 0;
  Timer? _timer;

  @override
  void dispose() {
    _identifierController.dispose();
    _otpController.dispose();
    _newPasswordController.dispose();
    _confirmPasswordController.dispose();
    _timer?.cancel();
    super.dispose();
  }

  void _startCooldown(int seconds) {
    setState(() => _cooldownSeconds = seconds);
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_cooldownSeconds <= 1) {
        timer.cancel();
        if (mounted) setState(() => _cooldownSeconds = 0);
      } else {
        if (mounted) setState(() => _cooldownSeconds--);
      }
    });
  }

  Future<void> _handleRequestOtp() async {
    final identifier = _identifierController.text.trim();

    if (identifier.isEmpty) {
      setState(() => _errorMessage = 'Please enter your registered email address or mobile number.');
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
      _infoMessage = null;
    });

    final res = await ref.read(authProvider.notifier).forgotPassword(identifier);

    setState(() => _isLoading = false);

    if (res['success'] == true) {
      setState(() {
        _infoMessage = res['message'];
        _step = 2;
      });
      _startCooldown(res['cooldownSeconds'] ?? 60);
    } else {
      setState(() => _errorMessage = res['message']);
    }
  }

  Future<void> _handleVerifyOtp() async {
    final otp = _otpController.text.trim();
    if (otp.length != 6) {
      setState(() => _errorMessage = 'Please enter the complete 6-digit OTP code.');
      return;
    }

    final identifier = _identifierController.text.trim();

    setState(() {
      _isLoading = true;
      _errorMessage = null;
      _infoMessage = null;
    });

    final res = await ref.read(authProvider.notifier).verifyRecoveryOtp(identifier, otp);
    setState(() => _isLoading = false);

    if (res['success'] == true && res['resetToken'] != null) {
      setState(() {
        _resetToken = res['resetToken'];
        _infoMessage = 'Code verified! Please create a new password.';
        _step = 3;
      });
    } else {
      setState(() => _errorMessage = res['message']);
    }
  }

  Future<void> _handleResendOtp() async {
    if (_cooldownSeconds > 0) return;
    await _handleRequestOtp();
  }

  Future<void> _handleResetPassword() async {
    final newPass = _newPasswordController.text.trim();
    final confirmPass = _confirmPasswordController.text.trim();

    if (newPass.length < 8) {
      setState(() => _errorMessage = 'Password must be at least 8 characters long.');
      return;
    }

    if (newPass != confirmPass) {
      setState(() => _errorMessage = 'New password and confirmation do not match.');
      return;
    }

    final identifier = _identifierController.text.trim();

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    final res = await ref.read(authProvider.notifier).resetPassword(
      identifier,
      _resetToken ?? '',
      newPass,
      confirmPass,
    );

    setState(() => _isLoading = false);

    if (res['success'] == true) {
      setState(() => _step = 4);
    } else {
      setState(() => _errorMessage = res['message']);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Account Recovery'),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Header Icon
              Center(
                child: Container(
                  width: 64,
                  height: 64,
                  decoration: BoxDecoration(
                    color: AppColors.primary.withValues(alpha: 0.15),
                    shape: BoxShape.circle,
                    border: Border.all(color: AppColors.primary.withValues(alpha: 0.3)),
                  ),
                  child: const Icon(Icons.lock_reset_rounded, color: AppColors.primaryLight, size: 32),
                ),
              ),
              const SizedBox(height: 16),
              const Text(
                'Password Recovery',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Colors.white),
              ),
              const SizedBox(height: 6),
              Text(
                _step == 1
                    ? 'Enter your registered email or mobile number to receive a 6-digit verification code.'
                    : _step == 2
                    ? 'Enter the 6-digit verification code sent to your registered contact channels.'
                    : _step == 3
                    ? 'Create a strong, new password for your account.'
                    : 'Your account password has been updated.',
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 13, color: AppColors.textSecondary),
              ),
              const SizedBox(height: 24),

              // Alerts
              if (_errorMessage != null) ...[
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppColors.accentRose.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppColors.accentRose.withValues(alpha: 0.3)),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.error_outline, color: AppColors.accentRose, size: 18),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          _errorMessage!,
                          style: const TextStyle(color: AppColors.accentRose, fontSize: 12),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
              ],

              if (_infoMessage != null) ...[
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppColors.primary.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppColors.primary.withValues(alpha: 0.3)),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.check_circle_outline, color: AppColors.primaryLight, size: 18),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          _infoMessage!,
                          style: const TextStyle(color: AppColors.primaryLight, fontSize: 12),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
              ],

              // STEP 1: Enter Unified Identifier (Email or Mobile Phone)
              if (_step == 1) ...[
                TextFormField(
                  controller: _identifierController,
                  keyboardType: TextInputType.text,
                  style: const TextStyle(color: Colors.white, fontSize: 14),
                  decoration: const InputDecoration(
                    labelText: 'Registered Email or Mobile Number',
                    hintText: 'student@college.edu or 9876543210',
                    prefixIcon: Icon(Icons.contact_mail_outlined, size: 20),
                  ),
                ),
                const SizedBox(height: 14),

                // Multi-channel delivery info badge
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppColors.surfaceCard,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppColors.surfaceCardLight),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: const [
                          Icon(Icons.mark_email_read_outlined, size: 16, color: AppColors.primaryLight),
                          SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              'Dual-Channel Verification',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      const Text(
                        'When you submit, we will find your account and send the verification OTP to both your registered Email address and mobile SMS.',
                        style: TextStyle(color: AppColors.textSecondary, fontSize: 11, height: 1.4),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),

                ElevatedButton(
                  onPressed: _isLoading ? null : _handleRequestOtp,
                  child: _isLoading
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                        )
                      : const Text('Send Verification Code'),
                ),
                const SizedBox(height: 14),
                TextButton.icon(
                  onPressed: () => context.pop(),
                  icon: const Icon(Icons.arrow_back, size: 16),
                  label: const Text('Back to Sign In'),
                ),
              ],

              // STEP 2: Verify 6-digit OTP
              if (_step == 2) ...[
                TextFormField(
                  controller: _otpController,
                  keyboardType: TextInputType.number,
                  maxLength: 6,
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 8,
                  ),
                  decoration: const InputDecoration(
                    labelText: '6-Digit Verification Code',
                    hintText: '000000',
                    counterText: '',
                    prefixIcon: Icon(Icons.pin_outlined, size: 20),
                  ),
                ),
                const SizedBox(height: 14),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    TextButton(
                      onPressed: _cooldownSeconds > 0 || _isLoading ? null : _handleResendOtp,
                      child: Text(
                        _cooldownSeconds > 0
                            ? 'Resend OTP in ${_cooldownSeconds}s'
                            : 'Resend OTP',
                        style: TextStyle(
                          fontSize: 12,
                          color: _cooldownSeconds > 0 ? AppColors.textMuted : AppColors.primaryLight,
                        ),
                      ),
                    ),
                    TextButton(
                      onPressed: () => setState(() => _step = 1),
                      child: const Text('Change identifier', style: TextStyle(fontSize: 12)),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                ElevatedButton(
                  onPressed: _isLoading ? null : _handleVerifyOtp,
                  child: _isLoading
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                        )
                      : const Text('Verify Code'),
                ),
              ],

              // STEP 3: Enter New Password
              if (_step == 3) ...[
                TextFormField(
                  controller: _newPasswordController,
                  obscureText: _obscurePassword,
                  style: const TextStyle(color: Colors.white, fontSize: 14),
                  decoration: InputDecoration(
                    labelText: 'New Password',
                    prefixIcon: const Icon(Icons.lock_outline, size: 20),
                    suffixIcon: IconButton(
                      icon: Icon(_obscurePassword ? Icons.visibility_off : Icons.visibility, size: 20),
                      onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
                    ),
                  ),
                ),
                const SizedBox(height: 14),
                TextFormField(
                  controller: _confirmPasswordController,
                  obscureText: _obscurePassword,
                  style: const TextStyle(color: Colors.white, fontSize: 14),
                  decoration: const InputDecoration(
                    labelText: 'Confirm New Password',
                    prefixIcon: Icon(Icons.lock_reset, size: 20),
                  ),
                ),
                const SizedBox(height: 24),
                ElevatedButton(
                  onPressed: _isLoading ? null : _handleResetPassword,
                  child: _isLoading
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                        )
                      : const Text('Update Password & Complete'),
                ),
              ],

              // STEP 4: Success
              if (_step == 4) ...[
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: AppColors.surfaceCard,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: const Color(0xFF374151)),
                  ),
                  child: Column(
                    children: [
                      const Icon(Icons.check_circle_rounded, color: AppColors.success, size: 56),
                      const SizedBox(height: 14),
                      const Text(
                        'Password Reset Complete!',
                        style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white),
                      ),
                      const SizedBox(height: 6),
                      const Text(
                        'Your password has been changed securely. You can now sign in with your new password.',
                        textAlign: TextAlign.center,
                        style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
                      ),
                      const SizedBox(height: 20),
                      ElevatedButton(
                        onPressed: () => context.go('/login'),
                        child: const Text('Return to Sign In'),
                      ),
                    ],
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
