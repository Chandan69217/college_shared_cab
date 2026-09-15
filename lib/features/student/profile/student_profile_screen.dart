import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../auth/providers/auth_provider.dart';

class StudentProfileScreen extends ConsumerStatefulWidget {
  const StudentProfileScreen({super.key});

  @override
  ConsumerState<StudentProfileScreen> createState() => _StudentProfileScreenState();
}

class _StudentProfileScreenState extends ConsumerState<StudentProfileScreen> {
  @override
  void initState() {
    super.initState();
    Future.microtask(() => ref.read(authProvider.notifier).fetchProfile());
  }

  void _showEditProfileDialog() {
    final user = ref.read(authProvider).user;
    final profile = user?.profile;

    final nameController = TextEditingController(text: user?.fullName ?? '');
    final phoneController = TextEditingController(text: user?.phone ?? '');
    final courseController = TextEditingController(text: profile?['course'] ?? '');
    int semester = profile?['semester'] is int ? profile!['semester'] : 1;
    bool isLoading = false;
    String? dialogError;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.surfaceCard,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) {
        return StatefulBuilder(
          builder: (ctx, setModalState) {
            return Padding(
              padding: EdgeInsets.only(
                left: 20,
                right: 20,
                top: 20,
                bottom: MediaQuery.of(ctx).viewInsets.bottom + 20,
              ),
              child: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Edit Commuter Profile',
                          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white),
                        ),
                        IconButton(
                          icon: const Icon(Icons.close, color: AppColors.textMuted, size: 20),
                          onPressed: () => Navigator.pop(ctx),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),

                    if (dialogError != null) ...[
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: AppColors.accentRose.withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: AppColors.accentRose.withValues(alpha: 0.3)),
                        ),
                        child: Text(dialogError!, style: const TextStyle(color: AppColors.accentRose, fontSize: 12)),
                      ),
                      const SizedBox(height: 12),
                    ],

                    TextFormField(
                      controller: nameController,
                      style: const TextStyle(color: Colors.white, fontSize: 14),
                      decoration: const InputDecoration(
                        labelText: 'Full Name',
                        prefixIcon: Icon(Icons.person_outline, size: 20),
                      ),
                    ),
                    const SizedBox(height: 12),

                    TextFormField(
                      controller: phoneController,
                      keyboardType: TextInputType.phone,
                      style: const TextStyle(color: Colors.white, fontSize: 14),
                      decoration: const InputDecoration(
                        labelText: 'Mobile Phone Number',
                        prefixIcon: Icon(Icons.phone_outlined, size: 20),
                      ),
                    ),
                    const SizedBox(height: 12),

                    TextFormField(
                      controller: courseController,
                      style: const TextStyle(color: Colors.white, fontSize: 14),
                      decoration: const InputDecoration(
                        labelText: 'Course / Degree Program',
                        prefixIcon: Icon(Icons.menu_book_outlined, size: 20),
                      ),
                    ),
                    const SizedBox(height: 12),

                    DropdownButtonFormField<int>(
                      value: semester,
                      isExpanded: true,
                      dropdownColor: AppColors.surface,
                      style: const TextStyle(color: Colors.white, fontSize: 14),
                      decoration: const InputDecoration(
                        labelText: 'Current Semester',
                        prefixIcon: Icon(Icons.format_list_numbered, size: 20),
                      ),
                      items: List.generate(8, (i) => i + 1).map((s) {
                        return DropdownMenuItem(value: s, child: Text('Semester $s'));
                      }).toList(),
                      onChanged: (v) {
                        if (v != null) setModalState(() => semester = v);
                      },
                    ),
                    const SizedBox(height: 20),

                    ElevatedButton(
                      onPressed: isLoading
                          ? null
                          : () async {
                              setModalState(() {
                                isLoading = true;
                                dialogError = null;
                              });

                              final success = await ref.read(authProvider.notifier).updateProfile({
                                'full_name': nameController.text.trim(),
                                'phone': phoneController.text.trim(),
                                'course': courseController.text.trim(),
                                'semester': semester,
                              });

                              if (success && mounted) {
                                Navigator.pop(ctx);
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(
                                    content: Text('Profile updated successfully!'),
                                    backgroundColor: AppColors.success,
                                  ),
                                );
                              } else {
                                setModalState(() {
                                  isLoading = false;
                                  dialogError = ref.read(authProvider).error ?? 'Update failed.';
                                });
                              }
                            },
                      child: isLoading
                          ? const SizedBox(
                              height: 20,
                              width: 20,
                              child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                            )
                          : const Text('Save Profile Changes'),
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }

  void _showChangePasswordDialog() {
    final currentPassController = TextEditingController();
    final newPassController = TextEditingController();
    final confirmPassController = TextEditingController();
    bool isLoading = false;
    String? dialogError;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.surfaceCard,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) {
        return StatefulBuilder(
          builder: (ctx, setModalState) {
            return Padding(
              padding: EdgeInsets.only(
                left: 20,
                right: 20,
                top: 20,
                bottom: MediaQuery.of(ctx).viewInsets.bottom + 20,
              ),
              child: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Change Password',
                          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white),
                        ),
                        IconButton(
                          icon: const Icon(Icons.close, color: AppColors.textMuted, size: 20),
                          onPressed: () => Navigator.pop(ctx),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),

                    if (dialogError != null) ...[
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: AppColors.accentRose.withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: AppColors.accentRose.withValues(alpha: 0.3)),
                        ),
                        child: Text(dialogError!, style: const TextStyle(color: AppColors.accentRose, fontSize: 12)),
                      ),
                      const SizedBox(height: 12),
                    ],

                    TextFormField(
                      controller: currentPassController,
                      obscureText: true,
                      style: const TextStyle(color: Colors.white, fontSize: 14),
                      decoration: const InputDecoration(
                        labelText: 'Current Password',
                        prefixIcon: Icon(Icons.lock_outline, size: 20),
                      ),
                    ),
                    const SizedBox(height: 12),

                    TextFormField(
                      controller: newPassController,
                      obscureText: true,
                      style: const TextStyle(color: Colors.white, fontSize: 14),
                      decoration: const InputDecoration(
                        labelText: 'New Password (min 8 chars)',
                        prefixIcon: Icon(Icons.lock_reset, size: 20),
                      ),
                    ),
                    const SizedBox(height: 12),

                    TextFormField(
                      controller: confirmPassController,
                      obscureText: true,
                      style: const TextStyle(color: Colors.white, fontSize: 14),
                      decoration: const InputDecoration(
                        labelText: 'Confirm New Password',
                        prefixIcon: Icon(Icons.check_circle_outline, size: 20),
                      ),
                    ),
                    const SizedBox(height: 20),

                    ElevatedButton(
                      onPressed: isLoading
                          ? null
                          : () async {
                              final curr = currentPassController.text.trim();
                              final nPass = newPassController.text.trim();
                              final cPass = confirmPassController.text.trim();

                              if (curr.isEmpty || nPass.isEmpty || cPass.isEmpty) {
                                setModalState(() => dialogError = 'All password fields are required.');
                                return;
                              }
                              if (nPass != cPass) {
                                setModalState(() => dialogError = 'New password and confirmation do not match.');
                                return;
                              }

                              setModalState(() {
                                isLoading = true;
                                dialogError = null;
                              });

                              final success = await ref.read(authProvider.notifier).changePassword(curr, nPass, cPass);

                              if (success && mounted) {
                                Navigator.pop(ctx);
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(
                                    content: Text('Password updated successfully!'),
                                    backgroundColor: AppColors.success,
                                  ),
                                );
                              } else {
                                setModalState(() {
                                  isLoading = false;
                                  dialogError = ref.read(authProvider).error ?? 'Password update failed.';
                                });
                              }
                            },
                      child: isLoading
                          ? const SizedBox(
                              height: 20,
                              width: 20,
                              child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                            )
                          : const Text('Update Password'),
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }

  void _showDeleteAccountDialog() {
    final confirmController = TextEditingController();
    bool isLoading = false;
    String? dialogError;

    showDialog(
      context: context,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (ctx, setDialogState) {
            return AlertDialog(
              backgroundColor: AppColors.surfaceCard,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
              title: const Row(
                children: [
                  Icon(Icons.warning_amber_rounded, color: AppColors.accentRose, size: 24),
                  SizedBox(width: 8),
                  Text('Delete Account', style: TextStyle(color: Colors.white, fontSize: 16)),
                ],
              ),
              content: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Are you sure you want to delete your commuter account permanently? This action cannot be undone.',
                    style: TextStyle(color: AppColors.textSecondary, fontSize: 12),
                  ),
                  const SizedBox(height: 12),

                  if (dialogError != null) ...[
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: AppColors.accentRose.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(dialogError!, style: const TextStyle(color: AppColors.accentRose, fontSize: 11)),
                    ),
                    const SizedBox(height: 12),
                  ],

                  const Text(
                    'Type "DELETE" to confirm:',
                    style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 6),
                  TextField(
                    controller: confirmController,
                    style: const TextStyle(color: Colors.white, fontSize: 13),
                    decoration: const InputDecoration(
                      hintText: 'DELETE',
                      hintStyle: TextStyle(color: AppColors.textMuted),
                    ),
                  ),
                ],
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(ctx),
                  child: const Text('Cancel', style: TextStyle(color: AppColors.textSecondary)),
                ),
                ElevatedButton(
                  onPressed: isLoading
                      ? null
                      : () async {
                          if (confirmController.text.trim() != 'DELETE') {
                            setDialogState(() => dialogError = 'Please type "DELETE" to confirm.');
                            return;
                          }

                          setDialogState(() {
                            isLoading = true;
                            dialogError = null;
                          });

                          final success = await ref.read(authProvider.notifier).deleteAccount();
                          if (success && mounted) {
                            Navigator.pop(ctx);
                            context.go('/login');
                          } else {
                            setDialogState(() {
                              isLoading = false;
                              dialogError = ref.read(authProvider).error ?? 'Account deletion failed.';
                            });
                          }
                        },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.accentRose,
                    foregroundColor: Colors.white,
                  ),
                  child: isLoading
                      ? const SizedBox(
                          height: 16,
                          width: 16,
                          child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                        )
                      : const Text('Permanently Delete'),
                ),
              ],
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(authProvider).user;
    final profile = user?.profile;
    final kycStatus = profile?['verification_status'] ?? 'PENDING';

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Student Profile & Account'),
        actions: [
          IconButton(
            icon: const Icon(Icons.edit_outlined, size: 20),
            onPressed: _showEditProfileDialog,
            tooltip: 'Edit Profile',
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () => ref.read(authProvider.notifier).fetchProfile(),
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // User Avatar Card
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: AppColors.surfaceCard,
                  borderRadius: BorderRadius.circular(22),
                  border: Border.all(color: const Color(0xFF374151)),
                ),
                child: Column(
                  children: [
                    Container(
                      width: 70,
                      height: 70,
                      decoration: BoxDecoration(
                        color: AppColors.primary,
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(
                            color: AppColors.primary.withValues(alpha: 0.3),
                            blurRadius: 16,
                          ),
                        ],
                      ),
                      child: Center(
                        child: Text(
                          user?.fullName.isNotEmpty == true ? user!.fullName[0] : 'S',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 28,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                    Text(
                      user?.fullName ?? 'Student',
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      user?.email ?? '',
                      style: const TextStyle(color: AppColors.textSecondary, fontSize: 12),
                    ),
                    const SizedBox(height: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: kycStatus == 'VERIFIED'
                            ? AppColors.primary.withValues(alpha: 0.15)
                            : AppColors.accentAmber.withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(
                          color: kycStatus == 'VERIFIED'
                              ? AppColors.primary.withValues(alpha: 0.3)
                              : AppColors.accentAmber.withValues(alpha: 0.3),
                        ),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            kycStatus == 'VERIFIED' ? Icons.verified : Icons.pending,
                            color: kycStatus == 'VERIFIED' ? AppColors.primaryLight : AppColors.accentAmber,
                            size: 14,
                          ),
                          const SizedBox(width: 4),
                          Text(
                            'KYC $kycStatus',
                            style: TextStyle(
                              color: kycStatus == 'VERIFIED' ? AppColors.primaryLight : AppColors.accentAmber,
                              fontWeight: FontWeight.bold,
                              fontSize: 11,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              // Academic & Enrollment Details Card
              Container(
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  color: AppColors.surfaceCard,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: const Color(0xFF374151)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Academic Information',
                          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
                        ),
                        GestureDetector(
                          onTap: _showEditProfileDialog,
                          child: const Text('Edit', style: TextStyle(color: AppColors.primaryLight, fontSize: 12, fontWeight: FontWeight.bold)),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    _buildDetailRow('Student ID', profile?['student_id_number'] ?? 'N/A', isMono: true),
                    _buildDetailRow('Roll Number', profile?['roll_number'] ?? profile?['student_id_number'] ?? 'N/A', isMono: true),
                    _buildDetailRow('Course', profile?['course'] ?? 'N/A'),
                    _buildDetailRow('Semester', profile?['semester'] != null ? 'Semester ${profile!['semester']}' : 'N/A'),
                    _buildDetailRow('Registered Mobile', user?.phone ?? 'N/A'),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              // Profile Actions Card
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: AppColors.surfaceCard,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: const Color(0xFF374151)),
                ),
                child: Column(
                  children: [
                    _buildActionTile(
                      icon: Icons.lock_outline,
                      title: 'Change Account Password',
                      onTap: _showChangePasswordDialog,
                    ),
                    _buildActionTile(
                      icon: Icons.confirmation_number_outlined,
                      title: 'Subscription History & Invoices',
                      onTap: () => context.push('/student/plans'),
                    ),
                    _buildActionTile(
                      icon: Icons.history_rounded,
                      title: 'My Commute History',
                      onTap: () => context.push('/student/history'),
                    ),
                    _buildActionTile(
                      icon: Icons.support_agent_rounded,
                      title: 'Support Desk & Campus SOS',
                      onTap: () => context.push('/student/support'),
                    ),
                    _buildActionTile(
                      icon: Icons.delete_outline_rounded,
                      title: 'Delete Account Permanently',
                      iconColor: AppColors.accentRose,
                      onTap: _showDeleteAccountDialog,
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              // Logout Button
              ElevatedButton.icon(
                onPressed: () async {
                  await ref.read(authProvider.notifier).logout();
                  if (context.mounted) context.go('/login');
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.surface,
                  foregroundColor: AppColors.accentRose,
                  side: const BorderSide(color: Color(0xFF374151)),
                ),
                icon: const Icon(Icons.logout_rounded, size: 18),
                label: const Text('Sign Out of CampusRide'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildDetailRow(String label, String value, {bool isMono = false}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(color: AppColors.textSecondary, fontSize: 12)),
          Text(
            value,
            style: TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.bold,
              fontSize: 12,
              fontFamily: isMono ? 'monospace' : null,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildActionTile({
    required IconData icon,
    required String title,
    required VoidCallback onTap,
    Color? iconColor,
  }) {
    return ListTile(
      leading: Icon(icon, color: iconColor ?? AppColors.primary, size: 20),
      title: Text(
        title,
        style: TextStyle(
          color: iconColor != null ? AppColors.accentRose : Colors.white,
          fontSize: 13,
          fontWeight: FontWeight.w500,
        ),
      ),
      trailing: const Icon(Icons.chevron_right_rounded, color: AppColors.textMuted, size: 18),
      onTap: onTap,
      dense: true,
      visualDensity: VisualDensity.compact,
    );
  }
}
