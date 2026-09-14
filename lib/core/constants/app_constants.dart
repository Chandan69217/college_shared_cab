import 'dart:io' show Platform;
import 'package:flutter/foundation.dart' show kIsWeb;

class AppConstants {
  static const String appName = 'CampusRide';

  /// Base API URL dynamically configured based on platform:
  /// - Android Emulator: Uses `http://10.0.2.2:5000/api/v1` (host loopback)
  /// - Web / iOS Simulator / Desktop: Uses `http://127.0.0.1:5000/api/v1`
  /// - Physical device via USB: Run `adb reverse tcp:5000 tcp:5000` or use your PC's Wi-Fi IP (e.g., `http://192.168.1.X:5000/api/v1`)
  static String get apiBaseUrl {
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

  static const String defaultCollegeId = '11111111-1111-1111-1111-111111111111';
  
  // Storage keys
  static const String tokenKey = 'campus_ride_auth_token';
  static const String userKey = 'campus_ride_user_data';
  static const String roleKey = 'campus_ride_user_role';
}
