import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/app_feedback.dart';
import '../../auth/providers/auth_provider.dart';

class DriverProfileScreen extends ConsumerStatefulWidget {
  const DriverProfileScreen({super.key});

  @override
  ConsumerState<DriverProfileScreen> createState() => _DriverProfileScreenState();
}

class _DriverProfileScreenState extends ConsumerState<DriverProfileScreen> {
  @override
  void initState() {
    super.initState();
    Future.microtask(() => ref.read(authProvider.notifier).fetchProfile());
  }

  void _showEditProfileDialog() {
    final driver = ref.read(authProvider).user;
    final profile = driver?.profile;

    final nameController = TextEditingController(text: driver?.fullName ?? '');
    final phoneController = TextEditingController(text: driver?.phone ?? '');
    final licenseController = TextEditingController(text: profile?['license_number'] ?? '');
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
                          'Edit Driver Profile',
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
                      controller: licenseController,
                      style: const TextStyle(color: Colors.white, fontSize: 14),
                      decoration: const InputDecoration(
                        labelText: 'Commercial Driving License #',
                        prefixIcon: Icon(Icons.badge_outlined, size: 20),
                      ),
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
                                'license_number': licenseController.text.trim(),
                              });

                              if (success && mounted) {
                                Navigator.pop(ctx);
                                AppFeedback.showSuccess(context, 'Driver profile updated successfully!');
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
                          : const Text('Save Changes'),
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
                                AppFeedback.showSuccess(context, 'Password updated successfully!');
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
                  Text('Delete Driver Account', style: TextStyle(color: Colors.white, fontSize: 16)),
                ],
              ),
              content: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Are you sure you want to delete your driver account permanently? This action will remove your driver profile and authentication credentials.',
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
    final driver = ref.watch(authProvider).user;
    final profile = driver?.profile;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Driver Profile & Vehicle Specs'),
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
              // Driver Profile Header Card
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
                        color: AppColors.accentBlue,
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(
                            color: AppColors.accentBlue.withValues(alpha: 0.3),
                            blurRadius: 16,
                          ),
                        ],
                      ),
                      child: Center(
                        child: Text(
                          driver?.fullName.isNotEmpty == true ? driver!.fullName[0] : 'D',
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
                      driver?.fullName ?? 'Driver',
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      'Campus Fleet Pilot • ${driver?.phone ?? 'N/A'}',
                      style: const TextStyle(color: AppColors.textSecondary, fontSize: 12),
                    ),
                    const SizedBox(height: 10),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: AppColors.primary.withValues(alpha: 0.15),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Row(
                            children: [
                              const Icon(Icons.star_rounded, color: AppColors.accentAmber, size: 16),
                              const SizedBox(width: 4),
                              Text(
                                '${profile?['rating'] ?? 5.0} Rating',
                                style: const TextStyle(color: AppColors.primaryLight, fontWeight: FontWeight.bold, fontSize: 11),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: AppColors.accentBlue.withValues(alpha: 0.15),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Text(
                            '${profile?['total_trips'] ?? 0} Trips Completed',
                            style: const TextStyle(color: AppColors.accentBlue, fontWeight: FontWeight.bold, fontSize: 11),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              // Assigned Vehicle Specs Card
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
                    const Text(
                      'Assigned Fleet Vehicle',
                      style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
                    ),
                    const SizedBox(height: 12),
                    _buildSpecRow('Vehicle Plate', profile?['vehicle']?['vehicle_number'] ?? 'Assigned Vehicle', isMono: true),
                    _buildSpecRow('Model', profile?['vehicle']?['model'] ?? 'Campus Shuttle'),
                    _buildSpecRow('Seating Capacity', '${profile?['vehicle']?['capacity'] ?? 6} Passengers'),
                    _buildSpecRow('Fitness Certificate', 'Verified & Active'),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              // Driver License Information Card
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
                          'Commercial License & Compliance',
                          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
                        ),
                        GestureDetector(
                          onTap: _showEditProfileDialog,
                          child: const Text('Edit', style: TextStyle(color: AppColors.primaryLight, fontSize: 12, fontWeight: FontWeight.bold)),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    _buildSpecRow('Commercial License #', profile?['license_number'] ?? 'N/A', isMono: true),
                    _buildSpecRow('Expiry Date', profile?['license_expiry'] ?? 'N/A'),
                    _buildSpecRow('Driving Experience', profile?['experience_years'] != null ? '${profile!['experience_years']} Years' : 'N/A'),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              // Security & Actions Card
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: AppColors.surfaceCard,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: const Color(0xFF374151)),
                ),
                child: Column(
                  children: [
                    ListTile(
                      leading: const Icon(Icons.lock_outline, color: AppColors.primary, size: 20),
                      title: const Text('Change Password', style: TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w500)),
                      trailing: const Icon(Icons.chevron_right_rounded, color: AppColors.textMuted, size: 18),
                      onTap: _showChangePasswordDialog,
                      dense: true,
                    ),
                    ListTile(
                      leading: const Icon(Icons.delete_outline_rounded, color: AppColors.accentRose, size: 20),
                      title: const Text('Delete Driver Account', style: TextStyle(color: AppColors.accentRose, fontSize: 13, fontWeight: FontWeight.w500)),
                      trailing: const Icon(Icons.chevron_right_rounded, color: AppColors.textMuted, size: 18),
                      onTap: _showDeleteAccountDialog,
                      dense: true,
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
                label: const Text('End Duty & Sign Out'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSpecRow(String label, String value, {bool isMono = false}) {
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
}
