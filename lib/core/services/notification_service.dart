import 'package:flutter/foundation.dart';
import '../api/api_client.dart';
import '../models/notification_model.dart';
import '../storage/storage_service.dart';

class NotificationService {
  static final NotificationService instance = NotificationService._internal();
  NotificationService._internal();

  final ValueNotifier<int> unreadCountNotifier = ValueNotifier<int>(0);

  /// Fetch notifications for current authenticated user
  Future<Map<String, dynamic>> fetchNotifications({
    String filter = 'ALL',
    int page = 1,
    int limit = 30,
  }) async {
    try {
      final res = await apiClient.get(
        '/notifications',
        queryParameters: {
          'filter': filter,
          'page': page,
          'limit': limit,
        },
      );

      if (res.data != null && res.data['success'] == true) {
        final data = res.data['data'] as Map<String, dynamic>;
        final rawList = data['notifications'] as List? ?? [];
        final notifications = rawList
            .map((item) => AppNotificationModel.fromJson(item as Map<String, dynamic>))
            .toList();

        final unreadCount = data['unreadCount'] is int ? data['unreadCount'] as int : 0;
        unreadCountNotifier.value = unreadCount;

        return {
          'notifications': notifications,
          'unreadCount': unreadCount,
          'total': data['total'] ?? notifications.length,
          'page': data['page'] ?? page,
          'totalPages': data['totalPages'] ?? 1,
        };
      }
    } catch (e) {
      debugPrint('Error fetching notifications: $e');
    }
    return {
      'notifications': <AppNotificationModel>[],
      'unreadCount': unreadCountNotifier.value,
      'total': 0,
      'page': page,
      'totalPages': 1,
    };
  }

  /// Fetch real-time unread count from server and update notifier
  Future<int> fetchUnreadCount() async {
    try {
      final token = StorageService.getToken();
      if (token == null || token.isEmpty) return 0;

      final res = await apiClient.get('/notifications/unread-count');
      if (res.data != null && res.data['success'] == true) {
        final unreadCount = res.data['data']?['unreadCount'] as int? ?? 0;
        unreadCountNotifier.value = unreadCount;
        return unreadCount;
      }
    } catch (e) {
      debugPrint('Error fetching unread count: $e');
    }
    return unreadCountNotifier.value;
  }

  /// Mark single notification as read
  Future<bool> markAsRead(String notificationId) async {
    try {
      final res = await apiClient.post('/notifications/$notificationId/read');
      if (res.data != null && res.data['success'] == true) {
        if (unreadCountNotifier.value > 0) {
          unreadCountNotifier.value = unreadCountNotifier.value - 1;
        }
        return true;
      }
    } catch (e) {
      debugPrint('Error marking notification as read: $e');
    }
    return false;
  }

  /// Mark all notifications as read
  Future<bool> markAllAsRead() async {
    try {
      final res = await apiClient.post('/notifications/read-all');
      if (res.data != null && res.data['success'] == true) {
        unreadCountNotifier.value = 0;
        return true;
      }
    } catch (e) {
      debugPrint('Error marking all notifications as read: $e');
    }
    return false;
  }

  /// Register device push token with backend
  Future<bool> registerDeviceToken(
    String deviceToken, {
    String platform = 'android',
    String? deviceName,
    String? appVersion,
  }) async {
    try {
      final res = await apiClient.post('/notifications/device-token', data: {
        'deviceToken': deviceToken,
        'platform': platform,
        if (deviceName != null) 'deviceName': deviceName,
        if (appVersion != null) 'appVersion': appVersion,
      });
      return res.data != null && res.data['success'] == true;
    } catch (e) {
      debugPrint('Error registering device token: $e');
      return false;
    }
  }

  /// Deactivate device token on logout
  Future<bool> removeDeviceToken(String deviceToken) async {
    try {
      final res = await apiClient.delete('/notifications/device-token', data: {
        'deviceToken': deviceToken,
      });
      return res.data != null && res.data['success'] == true;
    } catch (e) {
      debugPrint('Error removing device token: $e');
      return false;
    }
  }
}
