import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../constants/app_constants.dart';

class StorageService {
  static SharedPreferences? _prefs;

  static Future<void> init() async {
    _prefs = await SharedPreferences.getInstance();
  }

  static Future<void> saveToken(String token) async {
    await _prefs?.setString(AppConstants.tokenKey, token);
  }

  static String? getToken() {
    return _prefs?.getString(AppConstants.tokenKey);
  }

  static Future<void> saveUserData(Map<String, dynamic> user, String role) async {
    await _prefs?.setString(AppConstants.userKey, jsonEncode(user));
    await _prefs?.setString(AppConstants.roleKey, role);
  }

  static Map<String, dynamic>? getUserData() {
    final str = _prefs?.getString(AppConstants.userKey);
    if (str != null) {
      try {
        return jsonDecode(str) as Map<String, dynamic>;
      } catch (_) {}
    }
    return null;
  }

  static String? getUserRole() {
    return _prefs?.getString(AppConstants.roleKey);
  }

  static Future<void> saveCustomApiUrl(String url) async {
    await _prefs?.setString(AppConstants.customApiUrlKey, url);
  }

  static String? getCustomApiUrl() {
    return _prefs?.getString(AppConstants.customApiUrlKey);
  }

  static String? getString(String key) {
    return _prefs?.getString(key);
  }

  static Future<void> setString(String key, String value) async {
    await _prefs?.setString(key, value);
  }

  static Future<void> remove(String key) async {
    await _prefs?.remove(key);
  }

  static Future<void> clearAll() async {
    await _prefs?.remove(AppConstants.tokenKey);
    await _prefs?.remove(AppConstants.userKey);
    await _prefs?.remove(AppConstants.roleKey);
  }
}
