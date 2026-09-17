import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/models/notification_model.dart';
import '../../../core/services/notification_service.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/app_feedback.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final NotificationService _notificationService = NotificationService.instance;

  List<AppNotificationModel> _allNotifications = [];
  List<AppNotificationModel> _unreadNotifications = [];
  bool _isLoading = true;
  bool _isMarkingAll = false;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _loadNotifications();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadNotifications() async {
    setState(() => _isLoading = true);
    try {
      final res = await _notificationService.fetchNotifications(filter: 'ALL', limit: 50);
      final list = (res['notifications'] as List<AppNotificationModel>?) ?? [];
      setState(() {
        _allNotifications = list;
        _unreadNotifications = list.where((n) => !n.isRead).toList();
        _isLoading = false;
      });
    } catch (_) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _markSingleAsRead(AppNotificationModel notification) async {
    if (notification.isRead) return;

    // Optimistic UI update
    setState(() {
      final idx = _allNotifications.indexWhere((n) => n.id == notification.id);
      if (idx != -1) {
        _allNotifications[idx] = notification.copyWith(isRead: true, readAt: DateTime.now());
      }
      _unreadNotifications.removeWhere((n) => n.id == notification.id);
    });

    final success = await _notificationService.markAsRead(notification.id);
    if (!success) {
      // Refresh count on failure
      _notificationService.fetchUnreadCount();
    }
  }

  Future<void> _handleMarkAllAsRead() async {
    if (_unreadNotifications.isEmpty || _isMarkingAll) return;
    setState(() => _isMarkingAll = true);
    final success = await _notificationService.markAllAsRead();
    if (success && mounted) {
      setState(() {
        _allNotifications = _allNotifications.map((n) => n.copyWith(isRead: true, readAt: DateTime.now())).toList();
        _unreadNotifications.clear();
        _isMarkingAll = false;
      });
      AppFeedback.showSuccess(context, 'All notifications marked as read.');
    } else {
      if (mounted) setState(() => _isMarkingAll = false);
    }
  }

  Future<void> _handleNotificationTap(AppNotificationModel notification) async {
    // 1. Mark as read immediately on tap
    if (!notification.isRead) {
      _markSingleAsRead(notification);
    }

    if (!mounted) return;

    // 2. Display the rich Notification Details Sheet
    _showNotificationDetailSheet(notification);
  }

  void _showNotificationDetailSheet(AppNotificationModel notification) {
    final color = _getNotificationColor(notification.type, notification.priority);
    final icon = _getNotificationIcon(notification.type, notification.priority);

    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.surfaceCard,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) => Padding(
        padding: EdgeInsets.only(
          left: 20,
          right: 20,
          top: 16,
          bottom: MediaQuery.of(ctx).padding.bottom + 20,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Handle bar
            Center(
              child: Container(
                width: 40,
                height: 4,
                margin: const EdgeInsets.only(bottom: 16),
                decoration: BoxDecoration(
                  color: AppColors.surfaceCardLight,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),

            // Header Row: Icon + Type/Priority + Close
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: color.withOpacity(0.15),
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: Icon(icon, color: color, size: 24),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2.5),
                            decoration: BoxDecoration(
                              color: color.withOpacity(0.15),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              notification.type.replaceAll('_', ' '),
                              style: TextStyle(
                                fontSize: 10,
                                fontWeight: FontWeight.bold,
                                color: color,
                              ),
                            ),
                          ),
                          if (notification.priority == 'HIGH' || notification.priority == 'CRITICAL') ...[
                            const SizedBox(width: 6),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2.5),
                              decoration: BoxDecoration(
                                color: notification.priority == 'CRITICAL'
                                    ? AppColors.accentRose.withOpacity(0.2)
                                    : AppColors.accentAmber.withOpacity(0.2),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Text(
                                notification.priority,
                                style: TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.bold,
                                  color: notification.priority == 'CRITICAL'
                                      ? AppColors.accentRose
                                      : AppColors.accentAmber,
                                ),
                              ),
                            ),
                          ],
                        ],
                      ),
                      const SizedBox(height: 4),
                      Text(
                        _formatTimestamp(notification.createdAt),
                        style: const TextStyle(fontSize: 12, color: AppColors.textMuted),
                      ),
                    ],
                  ),
                ),
                IconButton(
                  onPressed: () => Navigator.pop(ctx),
                  icon: const Icon(Icons.close, color: AppColors.textSecondary, size: 20),
                ),
              ],
            ),

            const SizedBox(height: 18),
            const Divider(color: AppColors.surfaceCardLight, height: 1),
            const SizedBox(height: 16),

            // Title
            Text(
              notification.title,
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 10),

            // Message (Selectable text for ease of copying codes/addresses)
            SelectableText(
              notification.message,
              style: const TextStyle(
                fontSize: 14,
                color: AppColors.textSecondary,
                height: 1.5,
              ),
            ),

            const SizedBox(height: 24),

            // Action button based on notification type
            _buildNotificationAction(notification, ctx),
          ],
        ),
      ),
    );
  }

  Widget _buildNotificationAction(AppNotificationModel notification, BuildContext sheetContext) {
    final type = notification.type;
    final entityType = notification.entityType;

    String? actionLabel;
    VoidCallback? onAction;

    if (type.contains('BOOKING') || entityType == 'BOOKING') {
      actionLabel = 'View Bookings';
      onAction = () {
        Navigator.pop(sheetContext);
        if (context.canPop()) context.pop();
      };
    } else if (type.contains('TRIP') || entityType == 'TRIP') {
      actionLabel = 'Track Ride';
      onAction = () {
        Navigator.pop(sheetContext);
        if (context.canPop()) context.pop();
      };
    } else if (type.contains('SUBSCRIPTION') || type.contains('PAYMENT') || entityType == 'PAYMENT') {
      actionLabel = 'Manage Subscriptions';
      onAction = () {
        Navigator.pop(sheetContext);
        try {
          context.push('/student/plans');
        } catch (_) {}
      };
    } else if (type.contains('COMPLAINT') || entityType == 'COMPLAINT') {
      actionLabel = 'View Support Ticket';
      onAction = () {
        Navigator.pop(sheetContext);
        try {
          context.push('/student/support');
        } catch (_) {}
      };
    }

    return SizedBox(
      width: double.infinity,
      child: ElevatedButton(
        onPressed: onAction ?? () => Navigator.pop(sheetContext),
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.primary,
          foregroundColor: Colors.black,
          padding: const EdgeInsets.symmetric(vertical: 14),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
        child: Text(
          actionLabel ?? 'Got It',
          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
        ),
      ),
    );
  }

  String _formatTimestamp(DateTime dt) {
    final now = DateTime.now();
    final diff = now.difference(dt);

    if (diff.inSeconds < 60) return 'Just now';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    if (diff.inDays == 1) return 'Yesterday';
    if (diff.inDays < 7) return '${diff.inDays}d ago';
    return '${dt.day}/${dt.month}/${dt.year}';
  }

  IconData _getNotificationIcon(String type, String priority) {
    if (priority == 'CRITICAL' || type == 'EMERGENCY_SOS') {
      return Icons.warning_amber_rounded;
    }
    if (type.contains('BOOKING')) {
      return Icons.confirmation_number_outlined;
    }
    if (type.contains('TRIP') || type.contains('DRIVER') || type.contains('VEHICLE')) {
      return Icons.directions_car_outlined;
    }
    if (type.contains('BOARDING') || type.contains('PASS') || type.contains('QR')) {
      return Icons.qr_code_2_rounded;
    }
    if (type.contains('PAYMENT') || type.contains('SUBSCRIPTION')) {
      return Icons.account_balance_wallet_outlined;
    }
    if (type.contains('ACCOUNT') || type.contains('KYC')) {
      return Icons.verified_user_outlined;
    }
    if (type.contains('COMPLAINT')) {
      return Icons.support_agent_rounded;
    }
    return Icons.notifications_none_rounded;
  }

  Color _getNotificationColor(String type, String priority) {
    if (priority == 'CRITICAL' || type == 'EMERGENCY_SOS') {
      return AppColors.accentRose;
    }
    if (priority == 'HIGH' || type == 'TRIP_DELAYED') {
      return AppColors.accentAmber;
    }
    if (type.contains('BOARDING') || type == 'BOOKING_CONFIRMED' || type == 'ACCOUNT_VERIFIED' || type == 'PAYMENT_SUCCESS') {
      return AppColors.primary;
    }
    if (type.contains('TRIP') || type.contains('DRIVER')) {
      return AppColors.accentBlue;
    }
    if (type.contains('COMPLAINT')) {
      return AppColors.accentPurple;
    }
    return AppColors.primaryLight;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text(
          'Notifications',
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
        ),
        actions: [
          ValueListenableBuilder<int>(
            valueListenable: _notificationService.unreadCountNotifier,
            builder: (context, unreadCount, _) {
              if (unreadCount == 0 && _unreadNotifications.isEmpty) {
                return const SizedBox.shrink();
              }
              return TextButton.icon(
                onPressed: _isMarkingAll ? null : _handleMarkAllAsRead,
                icon: _isMarkingAll
                    ? const SizedBox(
                        width: 14,
                        height: 14,
                        child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primary),
                      )
                    : const Icon(Icons.done_all_rounded, size: 18, color: AppColors.primary),
                label: const Text(
                  'Mark all read',
                  style: TextStyle(color: AppColors.primary, fontSize: 13),
                ),
              );
            },
          ),
          const SizedBox(width: 8),
        ],
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: AppColors.primary,
          indicatorWeight: 3,
          labelColor: AppColors.textPrimary,
          unselectedLabelColor: AppColors.textSecondary,
          tabs: [
            Tab(text: 'All (${_allNotifications.length})'),
            ValueListenableBuilder<int>(
              valueListenable: _notificationService.unreadCountNotifier,
              builder: (context, count, _) {
                return Tab(
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Text('Unread'),
                      if (count > 0 || _unreadNotifications.isNotEmpty) ...[
                        const SizedBox(width: 6),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: AppColors.primary,
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Text(
                            '${count > 0 ? count : _unreadNotifications.length}',
                            style: const TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                              color: Colors.black,
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                );
              },
            ),
          ],
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
          : TabBarView(
              controller: _tabController,
              children: [
                _buildNotificationList(_allNotifications, isUnreadTab: false),
                _buildNotificationList(_unreadNotifications, isUnreadTab: true),
              ],
            ),
    );
  }

  Widget _buildNotificationList(List<AppNotificationModel> list, {required bool isUnreadTab}) {
    if (list.isEmpty) {
      return RefreshIndicator(
        onRefresh: _loadNotifications,
        color: AppColors.primary,
        child: LayoutBuilder(
          builder: (context, constraints) => SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            child: ConstrainedBox(
              constraints: BoxConstraints(minHeight: constraints.maxHeight),
              child: Center(
                child: Padding(
                  padding: const EdgeInsets.all(32),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Container(
                        padding: const EdgeInsets.all(24),
                        decoration: BoxDecoration(
                          color: AppColors.surfaceCard,
                          shape: BoxShape.circle,
                          border: Border.all(color: AppColors.surfaceCardLight),
                        ),
                        child: Icon(
                          isUnreadTab ? Icons.mark_email_read_outlined : Icons.notifications_off_outlined,
                          size: 48,
                          color: AppColors.textMuted,
                        ),
                      ),
                      const SizedBox(height: 20),
                      Text(
                        isUnreadTab ? 'No unread notifications' : 'No notifications yet',
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: AppColors.textPrimary,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        isUnreadTab
                            ? 'You are all caught up! New updates will appear here.'
                            : 'Updates regarding your bookings, rides, passes, and campus transit announcements will appear here.',
                        textAlign: TextAlign.center,
                        style: const TextStyle(fontSize: 13, color: AppColors.textSecondary, height: 1.4),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _loadNotifications,
      color: AppColors.primary,
      child: ListView.separated(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        itemCount: list.length,
        separatorBuilder: (context, index) => const SizedBox(height: 10),
        itemBuilder: (context, index) {
          final item = list[index];
          final color = _getNotificationColor(item.type, item.priority);
          final icon = _getNotificationIcon(item.type, item.priority);

          return InkWell(
            onTap: () => _handleNotificationTap(item),
            borderRadius: BorderRadius.circular(12),
            child: Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: item.isRead ? AppColors.surfaceCard : AppColors.surfaceCard.withOpacity(0.9),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: item.isRead ? AppColors.surfaceCardLight.withOpacity(0.4) : color.withOpacity(0.5),
                  width: item.isRead ? 1 : 1.5,
                ),
                boxShadow: item.isRead
                    ? null
                    : [
                        BoxShadow(
                          color: color.withOpacity(0.08),
                          blurRadius: 8,
                          offset: const Offset(0, 2),
                        ),
                      ],
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: color.withOpacity(0.15),
                      shape: BoxShape.circle,
                    ),
                    child: Icon(icon, color: color, size: 20),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Expanded(
                              child: Text(
                                item.title,
                                style: TextStyle(
                                  fontSize: 14,
                                  fontWeight: item.isRead ? FontWeight.w600 : FontWeight.bold,
                                  color: AppColors.textPrimary,
                                ),
                              ),
                            ),
                            if (!item.isRead) ...[
                              const SizedBox(width: 6),
                              Container(
                                width: 8,
                                height: 8,
                                decoration: const BoxDecoration(
                                  color: AppColors.primary,
                                  shape: BoxShape.circle,
                                ),
                              ),
                              const SizedBox(width: 4),
                              GestureDetector(
                                onTap: () => _markSingleAsRead(item),
                                behavior: HitTestBehavior.opaque,
                                child: Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                  decoration: BoxDecoration(
                                    color: AppColors.primary.withOpacity(0.12),
                                    borderRadius: BorderRadius.circular(6),
                                    border: Border.all(color: AppColors.primary.withOpacity(0.3)),
                                  ),
                                  child: const Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Icon(Icons.done, size: 12, color: AppColors.primary),
                                      SizedBox(width: 3),
                                      Text(
                                        'Mark Read',
                                        style: TextStyle(
                                          fontSize: 10,
                                          fontWeight: FontWeight.w600,
                                          color: AppColors.primary,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ],
                          ],
                        ),
                        const SizedBox(height: 4),
                        Text(
                          item.message,
                          style: TextStyle(
                            fontSize: 13,
                            color: item.isRead ? AppColors.textSecondary : AppColors.textPrimary.withOpacity(0.9),
                            height: 1.35,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              _formatTimestamp(item.createdAt),
                              style: const TextStyle(fontSize: 11, color: AppColors.textMuted),
                            ),
                            if (item.priority == 'HIGH' || item.priority == 'CRITICAL')
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                decoration: BoxDecoration(
                                  color: color.withOpacity(0.2),
                                  borderRadius: BorderRadius.circular(4),
                                ),
                                child: Text(
                                  item.priority,
                                  style: TextStyle(
                                    fontSize: 10,
                                    fontWeight: FontWeight.bold,
                                    color: color,
                                  ),
                                ),
                              ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}
