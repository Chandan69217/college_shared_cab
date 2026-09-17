import 'dart:async';
import 'package:flutter/material.dart';
import '../theme/app_colors.dart';

enum FeedbackType { success, error, warning, info }

class AppFeedback {
  static final GlobalKey<ScaffoldMessengerState> rootScaffoldMessengerKey =
      GlobalKey<ScaffoldMessengerState>();

  // Anti-spam deduplication tracking
  static String? _lastMessage;
  static DateTime? _lastMessageTime;

  static bool _isDuplicate(String message) {
    final now = DateTime.now();
    if (_lastMessage == message &&
        _lastMessageTime != null &&
        now.difference(_lastMessageTime!).inMilliseconds < 2500) {
      return true;
    }
    _lastMessage = message;
    _lastMessageTime = now;
    return false;
  }

  /// Show professional, non-blocking Success Toast / SnackBar
  static void showSuccess(
    BuildContext? context,
    dynamic message, {
    String? title,
    Duration duration = const Duration(seconds: 3),
  }) {
    _showSnackBar(
      context: context,
      message: message,
      title: title,
      type: FeedbackType.success,
      duration: duration,
    );
  }

  /// Show professional Error Toast / SnackBar with optional retry action
  static void showError(
    BuildContext? context,
    dynamic message, {
    String? title,
    Duration duration = const Duration(seconds: 4),
    VoidCallback? onRetry,
  }) {
    _showSnackBar(
      context: context,
      message: message,
      title: title,
      type: FeedbackType.error,
      duration: duration,
      onRetry: onRetry,
    );
  }

  /// Show Warning Toast / SnackBar
  static void showWarning(
    BuildContext? context,
    dynamic message, {
    String? title,
    Duration duration = const Duration(seconds: 3),
  }) {
    _showSnackBar(
      context: context,
      message: message,
      title: title,
      type: FeedbackType.warning,
      duration: duration,
    );
  }

  /// Show Info Toast / SnackBar
  static void showInfo(
    BuildContext? context,
    dynamic message, {
    String? title,
    Duration duration = const Duration(seconds: 3),
  }) {
    _showSnackBar(
      context: context,
      message: message,
      title: title,
      type: FeedbackType.info,
      duration: duration,
    );
  }

  static void _showSnackBar({
    required BuildContext? context,
    required dynamic message,
    String? title,
    required FeedbackType type,
    required Duration duration,
    VoidCallback? onRetry,
  }) {
    String cleanMessage = '';
    if (message != null) {
      cleanMessage = message.toString().trim();
      if (cleanMessage.startsWith('Exception: ')) {
        cleanMessage = cleanMessage.substring('Exception: '.length);
      }
    }
    if (cleanMessage.isEmpty) return;
    if (_isDuplicate(cleanMessage)) return;

    Color primaryColor;
    Color bgColor;
    IconData icon;

    switch (type) {
      case FeedbackType.success:
        primaryColor = AppColors.primary;
        bgColor = const Color(0xFF064E3B);
        icon = Icons.check_circle_rounded;
        break;
      case FeedbackType.error:
        primaryColor = AppColors.error;
        bgColor = const Color(0xFF450A0A);
        icon = Icons.error_rounded;
        break;
      case FeedbackType.warning:
        primaryColor = AppColors.accentAmber;
        bgColor = const Color(0xFF451A03);
        icon = Icons.warning_amber_rounded;
        break;
      case FeedbackType.info:
        primaryColor = AppColors.accentBlue;
        bgColor = const Color(0xFF172554);
        icon = Icons.info_rounded;
        break;
    }

    final messenger = context != null
        ? ScaffoldMessenger.maybeOf(context) ?? rootScaffoldMessengerKey.currentState
        : rootScaffoldMessengerKey.currentState;

    if (messenger == null) return;

    messenger.removeCurrentSnackBar();
    messenger.showSnackBar(
      SnackBar(
        duration: duration,
        elevation: 6,
        behavior: SnackBarBehavior.floating,
        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        padding: EdgeInsets.zero,
        backgroundColor: Colors.transparent,
        content: Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          decoration: BoxDecoration(
            color: AppColors.surfaceCard,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: primaryColor.withOpacity(0.5), width: 1.2),
            boxShadow: [
              BoxShadow(
                color: primaryColor.withOpacity(0.15),
                blurRadius: 12,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: bgColor.withOpacity(0.6),
                  shape: BoxShape.circle,
                ),
                child: Icon(icon, color: primaryColor, size: 20),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (title != null && title.isNotEmpty)
                      Padding(
                        padding: const EdgeInsets.only(bottom: 2),
                        child: Text(
                          title,
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.bold,
                            color: primaryColor,
                          ),
                        ),
                      ),
                    Text(
                      message,
                      style: const TextStyle(
                        fontSize: 12.5,
                        color: AppColors.textPrimary,
                        height: 1.3,
                      ),
                    ),
                  ],
                ),
              ),
              if (onRetry != null)
                TextButton(
                  onPressed: () {
                    messenger.hideCurrentSnackBar();
                    onRetry();
                  },
                  style: TextButton.styleFrom(
                    foregroundColor: primaryColor,
                    padding: const EdgeInsets.symmetric(horizontal: 8),
                  ),
                  child: const Text('Retry', style: TextStyle(fontWeight: FontWeight.bold)),
                ),
            ],
          ),
        ),
      ),
    );
  }

  /// Show a standardized Confirmation Dialog for destructive or major actions
  static Future<bool> showConfirmDialog(
    BuildContext context, {
    required String title,
    required String message,
    String confirmText = 'Confirm',
    String cancelText = 'Cancel',
    bool isDestructive = false,
    IconData? icon,
  }) async {
    final result = await showDialog<bool>(
      context: context,
      barrierDismissible: false,
      builder: (ctx) {
        return Dialog(
          backgroundColor: AppColors.surface,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
            side: BorderSide(
              color: isDestructive
                  ? AppColors.error.withOpacity(0.4)
                  : AppColors.surfaceCardLight,
            ),
          ),
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: isDestructive
                            ? AppColors.error.withOpacity(0.15)
                            : AppColors.primary.withOpacity(0.15),
                        shape: BoxShape.circle,
                      ),
                      child: Icon(
                        icon ?? (isDestructive ? Icons.warning_amber_rounded : Icons.help_outline_rounded),
                        color: isDestructive ? AppColors.error : AppColors.primary,
                        size: 22,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        title,
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: AppColors.textPrimary,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 14),
                Text(
                  message,
                  style: const TextStyle(
                    fontSize: 13,
                    color: AppColors.textSecondary,
                    height: 1.4,
                  ),
                ),
                const SizedBox(height: 20),
                Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    TextButton(
                      onPressed: () => Navigator.of(ctx).pop(false),
                      style: TextButton.styleFrom(
                        foregroundColor: AppColors.textSecondary,
                      ),
                      child: Text(cancelText),
                    ),
                    const SizedBox(width: 8),
                    ElevatedButton(
                      onPressed: () => Navigator.of(ctx).pop(true),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: isDestructive ? AppColors.error : AppColors.primary,
                        foregroundColor: isDestructive ? Colors.white : Colors.black,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                      ),
                      child: Text(
                        confirmText,
                        style: const TextStyle(fontWeight: FontWeight.bold),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );

    return result ?? false;
  }

  /// Show standard information/alert modal
  static Future<void> showAlertDialog(
    BuildContext context, {
    required String title,
    required String message,
    String buttonText = 'OK',
    FeedbackType type = FeedbackType.info,
  }) async {
    Color color;
    IconData icon;
    switch (type) {
      case FeedbackType.success:
        color = AppColors.primary;
        icon = Icons.check_circle_outline_rounded;
        break;
      case FeedbackType.error:
        color = AppColors.error;
        icon = Icons.error_outline_rounded;
        break;
      case FeedbackType.warning:
        color = AppColors.accentAmber;
        icon = Icons.warning_amber_rounded;
        break;
      case FeedbackType.info:
        color = AppColors.accentBlue;
        icon = Icons.info_outline_rounded;
        break;
    }

    await showDialog(
      context: context,
      builder: (ctx) => Dialog(
        backgroundColor: AppColors.surface,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: BorderSide(color: color.withOpacity(0.4)),
        ),
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: color.withOpacity(0.15),
                  shape: BoxShape.circle,
                ),
                child: Icon(icon, color: color, size: 28),
              ),
              const SizedBox(height: 14),
              Text(
                title,
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: AppColors.textPrimary,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                message,
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontSize: 13,
                  color: AppColors.textSecondary,
                  height: 1.4,
                ),
              ),
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () => Navigator.of(ctx).pop(),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: color,
                    foregroundColor: type == FeedbackType.success ? Colors.black : Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                  ),
                  child: Text(buttonText, style: const TextStyle(fontWeight: FontWeight.bold)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  /// Show loading HUD and return dismiss function
  static VoidCallback showLoading(
    BuildContext context, {
    String message = 'Please wait...',
  }) {
    var isDismissed = false;
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => PopScope(
        canPop: false,
        child: Dialog(
          backgroundColor: AppColors.surfaceCard,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const SizedBox(
                  width: 24,
                  height: 24,
                  child: CircularProgressIndicator(
                    color: AppColors.primary,
                    strokeWidth: 2.5,
                  ),
                ),
                const SizedBox(width: 18),
                Expanded(
                  child: Text(
                    message,
                    style: const TextStyle(
                      fontSize: 13,
                      color: AppColors.textPrimary,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );

    return () {
      if (!isDismissed && Navigator.canPop(context)) {
        isDismissed = true;
        Navigator.of(context, rootNavigator: true).pop();
      }
    };
  }
}
