import 'dart:io' show Platform;
import 'package:flutter/foundation.dart' show kIsWeb;
import '../storage/storage_service.dart';

class AppConstants {
  static const String appName = 'CampusRide';

  /// Base API URL dynamically configured based on platform & environment:
  /// 1. `--dart-define=API_URL=...` or `--dart-define=API_BASE_URL=...`
  /// 2. User-saved custom API URL in SharedPreferences (for physical phone testing over LAN)
  /// 3. Android Emulator: `http://10.0.2.2:5000/api/v1`
  /// 4. Web / iOS / Desktop: `http://127.0.0.1:5000/api/v1`
  static String get apiBaseUrl {
    const dartDefineUrl = String.fromEnvironment('API_URL',
        defaultValue: String.fromEnvironment('API_BASE_URL', defaultValue: ''));
    if (dartDefineUrl.isNotEmpty) {
      return dartDefineUrl;
    }

    final customUrl = StorageService.getCustomApiUrl();
    if (customUrl != null && customUrl.trim().isNotEmpty) {
      return customUrl.trim();
    }

    if (kIsWeb) {
      return 'http://127.0.0.1:5000/api/v1';
    }
    try {
      if (Platform.isAndroid) {
        return 'http://10.0.2.2:5000/api/v1';
      }
    } catch (_) {}
    return 'http://127.0.0.1:5000/api/v1';
  }

  // Storage keys
  static const String tokenKey = 'campus_ride_auth_token';
  static const String userKey = 'campus_ride_user_data';
  static const String roleKey = 'campus_ride_user_role';
  static const String customApiUrlKey = 'campus_ride_custom_api_url';
}
