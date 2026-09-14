class UserModel {
  final String id;
  final String email;
  final String phone;
  final String fullName;
  final String role;
  final String status;
  final Map<String, dynamic>? profile;

  UserModel({
    required this.id,
    required this.email,
    required this.phone,
    required this.fullName,
    required this.role,
    required this.status,
    this.profile,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id'] ?? '',
      email: json['email'] ?? '',
      phone: json['phone'] ?? '',
      fullName: json['full_name'] ?? '',
      role: json['role'] ?? 'STUDENT',
      status: json['status'] ?? 'ACTIVE',
      profile: json['profile'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'email': email,
      'phone': phone,
      'full_name': fullName,
      'role': role,
      'status': status,
      'profile': profile,
    };
  }
}
