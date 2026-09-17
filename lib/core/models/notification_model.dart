class AppNotificationModel {
  final String id;
  final String userId;
  final String recipientRole;
  final String title;
  final String message;
  final String type;
  final String? entityType;
  final String? entityId;
  final String priority;
  final bool isRead;
  final DateTime? readAt;
  final Map<String, dynamic>? data;
  final DateTime createdAt;

  AppNotificationModel({
    required this.id,
    required this.userId,
    required this.recipientRole,
    required this.title,
    required this.message,
    required this.type,
    this.entityType,
    this.entityId,
    required this.priority,
    required this.isRead,
    this.readAt,
    this.data,
    required this.createdAt,
  });

  factory AppNotificationModel.fromJson(Map<String, dynamic> json) {
    return AppNotificationModel(
      id: json['id']?.toString() ?? '',
      userId: json['user_id']?.toString() ?? '',
      recipientRole: json['recipient_role']?.toString() ?? 'STUDENT',
      title: json['title']?.toString() ?? '',
      message: json['message']?.toString() ?? '',
      type: json['type']?.toString() ?? 'SYSTEM_ANNOUNCEMENT',
      entityType: json['entity_type']?.toString(),
      entityId: json['entity_id']?.toString(),
      priority: json['priority']?.toString() ?? 'NORMAL',
      isRead: json['is_read'] == true,
      readAt: json['read_at'] != null ? DateTime.tryParse(json['read_at'].toString()) : null,
      data: json['data'] is Map<String, dynamic> ? json['data'] as Map<String, dynamic> : null,
      createdAt: json['created_at'] != null
          ? (DateTime.tryParse(json['created_at'].toString()) ?? DateTime.now())
          : DateTime.now(),
    );
  }

  AppNotificationModel copyWith({
    bool? isRead,
    DateTime? readAt,
  }) {
    return AppNotificationModel(
      id: id,
      userId: userId,
      recipientRole: recipientRole,
      title: title,
      message: message,
      type: type,
      entityType: entityType,
      entityId: entityId,
      priority: priority,
      isRead: isRead ?? this.isRead,
      readAt: readAt ?? this.readAt,
      data: data,
      createdAt: createdAt,
    );
  }
}
