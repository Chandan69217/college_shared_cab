import 'dart:io' show Platform;
import 'package:flutter/foundation.dart' show kIsWeb, kReleaseMode;
import '../storage/storage_service.dart';

class AppConstants {
  static const String appName = 'CampusRide';

  /// Live Render Production Backend API URL
  static const String productionApiUrl =
      'https://college-shared-cab-api.onrender.com/api/v1';

  /// Local Development Backend API URL (for Web / iOS / Desktop)
  static const String localHostApiUrl = 'http://127.0.0.1:5000/api/v1';

  /// Local Development Backend API URL (for Android Emulator)
  static const String androidEmulatorApiUrl = 'http://10.0.2.2:5000/api/v1';

  /// Base API URL dynamically resolved with smart fallback hierarchy:
  /// 1. `--dart-define=API_URL=...` (explicit compile-time override)
  /// 2. In-App User-saved custom API URL (configured in app storage)
  /// 3. In Release mode (`flutter build apk / ipa`): Live Render Production API
  /// 4. In Debug / Development mode (`flutter run`): Local development backend
  static String get apiBaseUrl {
    // 1. Check if passed via --dart-define=API_URL=... or --dart-define=API_BASE_URL=...
    const dartDefineUrl = String.fromEnvironment(
      'API_URL',
      defaultValue: String.fromEnvironment('API_BASE_URL', defaultValue: ''),
    );
    if (dartDefineUrl.isNotEmpty) {
      return dartDefineUrl;
    }

    // 2. Check user-saved custom URL (if configured in app storage)
    final customUrl = StorageService.getCustomApiUrl();
    if (customUrl != null && customUrl.trim().isNotEmpty) {
      return customUrl.trim();
    }

    // 3. In Release mode, always default to the live Render Production API
    if (kReleaseMode) {
      return productionApiUrl;
    }

    // 4. In Debug / Development mode, default to local dev server
    if (kIsWeb) {
      return localHostApiUrl;
    }
    try {
      if (Platform.isAndroid) {
        return androidEmulatorApiUrl;
      }
    } catch (_) {}
    return localHostApiUrl;
  }

  // Storage keys
  static const String tokenKey = 'campus_ride_auth_token';
  static const String userKey = 'campus_ride_user_data';
  static const String roleKey = 'campus_ride_user_role';
  static const String customApiUrlKey = 'campus_ride_custom_api_url';
}
