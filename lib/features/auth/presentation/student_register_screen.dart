import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/api/api_client.dart';
import '../../../core/theme/app_colors.dart';
import '../providers/auth_provider.dart';

class StudentRegisterScreen extends ConsumerStatefulWidget {
  const StudentRegisterScreen({super.key});

  @override
  ConsumerState<StudentRegisterScreen> createState() => _StudentRegisterScreenState();
}

class _StudentRegisterScreenState extends ConsumerState<StudentRegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _passwordController = TextEditingController();
  final _collegeCodeController = TextEditingController();
  final _studentIdController = TextEditingController();
  final _courseController = TextEditingController();
  int _semester = 1;

  List<dynamic> _availableColleges = [];
  String? _selectedCollegeCode;

  @override
  void initState() {
    super.initState();
    _fetchColleges();
  }

  Future<void> _fetchColleges() async {
    try {
      final res = await apiClient.get('/catalog/colleges');
      if (mounted && res.data['success'] == true) {
        final List list = res.data['data'] ?? [];
        setState(() {
          _availableColleges = list;
          if (_availableColleges.isNotEmpty && _selectedCollegeCode == null) {
            final firstCode = _availableColleges.first['code']?.toString() ?? '';
            _selectedCollegeCode = firstCode;
            _collegeCodeController.text = firstCode;
          }
        });
      }
    } catch (_) {}
  }

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _passwordController.dispose();
    _collegeCodeController.dispose();
    _studentIdController.dispose();
    _courseController.dispose();
    super.dispose();
  }

  Future<void> _handleRegister() async {
    if (!_formKey.currentState!.validate()) return;

    final code = _collegeCodeController.text.trim().toUpperCase();

    final success = await ref.read(authProvider.notifier).registerStudent({
      'full_name': _nameController.text.trim(),
      'email': _emailController.text.trim(),
      'phone': _phoneController.text.trim(),
      'password': _passwordController.text.trim(),
      'college_code': code,
      'student_id_number': _studentIdController.text.trim(),
      'course': _courseController.text.trim(),
      'semester': _semester,
    });

    if (success && mounted) {
      context.go('/student');
    }
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Student Commuter Registration'),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const Text(
                  'Create Your Account',
                  style: TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.bold,
                    color: AppColors.textPrimary,
                  ),
                ),
                const SizedBox(height: 6),
                const Text(
                  'Campus Shared Transit Access & Student Onboarding',
                  style: TextStyle(color: AppColors.textSecondary, fontSize: 13),
                ),
                const SizedBox(height: 24),

                if (authState.error != null) ...[
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: AppColors.accentRose.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: AppColors.accentRose.withValues(alpha: 0.3),
                      ),
                    ),
                    child: Text(
                      authState.error!,
                      style: const TextStyle(color: AppColors.accentRose, fontSize: 12),
                    ),
                  ),
                  const SizedBox(height: 16),
                ],

                // COLLEGE SELECTION DROPDOWN
                if (_availableColleges.isNotEmpty) ...[
                  DropdownButtonFormField<String>(
                    value: _availableColleges.any((c) => c['code'] == _selectedCollegeCode)
                        ? _selectedCollegeCode
                        : null,
                    isExpanded: true,
                    dropdownColor: AppColors.surface,
                    style: const TextStyle(color: Colors.white, fontSize: 14),
                    decoration: const InputDecoration(
                      labelText: 'Select Your Institution / Campus',
                      prefixIcon: Icon(Icons.school_outlined, size: 20),
                    ),
                    selectedItemBuilder: (BuildContext context) {
                      return _availableColleges.map<Widget>((c) {
                        return Align(
                          alignment: Alignment.centerLeft,
                          child: Text(
                            '${c['name']} (${c['code']})',
                            overflow: TextOverflow.ellipsis,
                            maxLines: 1,
                            style: const TextStyle(color: Colors.white, fontSize: 14),
                          ),
                        );
                      }).toList();
                    },
                    items: _availableColleges.map((c) {
                      return DropdownMenuItem<String>(
                        value: c['code']?.toString(),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              c['name']?.toString() ?? 'Unnamed College',
                              style: const TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.w600,
                                fontSize: 13,
                              ),
                              overflow: TextOverflow.ellipsis,
                              maxLines: 1,
                            ),
                            const SizedBox(height: 2),
                            Text(
                              'Code: ${c['code']} • ${c['address'] ?? 'Campus'}',
                              style: const TextStyle(
                                color: AppColors.textSecondary,
                                fontSize: 11,
                              ),
                              overflow: TextOverflow.ellipsis,
                              maxLines: 1,
                            ),
                          ],
                        ),
                      );
                    }).toList(),
                    onChanged: (val) {
                      if (val != null) {
                        setState(() {
                          _selectedCollegeCode = val;
                          _collegeCodeController.text = val;
                        });
                      }
                    },
                  ),
                  const SizedBox(height: 14),
                ],

                // COLLEGE CODE INPUT
                TextFormField(
                  controller: _collegeCodeController,
                  textCapitalization: TextCapitalization.characters,
                  style: const TextStyle(color: Colors.white, fontSize: 14),
                  decoration: const InputDecoration(
                    labelText: 'College / Campus Code',
                    hintText: 'e.g. APEX-ENG, IIT-B',
                    prefixIcon: Icon(Icons.account_balance_outlined, size: 20),
                    helperText: 'Enter or confirm your official campus code.',
                  ),
                  onChanged: (val) {
                    final upper = val.trim().toUpperCase();
                    final match = _availableColleges.firstWhere(
                      (c) => (c['code']?.toString().toUpperCase() ?? '') == upper,
                      orElse: () => null,
                    );
                    if (match != null && _selectedCollegeCode != match['code']) {
                      setState(() {
                        _selectedCollegeCode = match['code']?.toString();
                      });
                    } else if (match == null && _selectedCollegeCode != null) {
                      setState(() {
                        _selectedCollegeCode = null;
                      });
                    }
                  },
                  validator: (v) {
                    if (v == null || v.trim().isEmpty) return 'College code is required.';
                    if (v.trim().length < 2) return 'Please enter a valid college code.';
                    return null;
                  },
                ),
                const SizedBox(height: 14),

                TextFormField(
                  controller: _nameController,
                  style: const TextStyle(color: Colors.white, fontSize: 14),
                  decoration: const InputDecoration(
                    labelText: 'Full Name',
                    prefixIcon: Icon(Icons.person_outline, size: 20),
                  ),
                  validator: (v) => v == null || v.trim().isEmpty ? 'Full name is required.' : null,
                ),
                const SizedBox(height: 14),

                TextFormField(
                  controller: _emailController,
                  keyboardType: TextInputType.emailAddress,
                  style: const TextStyle(color: Colors.white, fontSize: 14),
                  decoration: const InputDecoration(
                    labelText: 'College Official Email',
                    prefixIcon: Icon(Icons.email_outlined, size: 20),
                  ),
                  validator: (v) {
                    if (v == null || v.trim().isEmpty) return 'Email is required.';
                    if (!RegExp(r'^[\w\.-]+@([\w-]+\.)+[\w-]{2,4}$').hasMatch(v.trim())) {
                      return 'Please enter a valid email address.';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 14),

                TextFormField(
                  controller: _phoneController,
                  keyboardType: TextInputType.phone,
                  style: const TextStyle(color: Colors.white, fontSize: 14),
                  decoration: const InputDecoration(
                    labelText: 'Mobile Number',
                    prefixIcon: Icon(Icons.phone_outlined, size: 20),
                  ),
                  validator: (v) {
                    if (v == null || v.trim().isEmpty) return 'Phone number is required.';
                    if (v.trim().length < 10) return 'Please enter a valid mobile number.';
                    return null;
                  },
                ),
                const SizedBox(height: 14),

                TextFormField(
                  controller: _passwordController,
                  obscureText: true,
                  style: const TextStyle(color: Colors.white, fontSize: 14),
                  decoration: const InputDecoration(
                    labelText: 'Password',
                    prefixIcon: Icon(Icons.lock_outline, size: 20),
                  ),
                  validator: (v) {
                    if (v == null || v.trim().isEmpty) return 'Password is required.';
                    if (v.trim().length < 6) return 'Password must be at least 6 characters.';
                    return null;
                  },
                ),
                const SizedBox(height: 14),

                TextFormField(
                  controller: _studentIdController,
                  style: const TextStyle(color: Colors.white, fontSize: 14),
                  decoration: const InputDecoration(
                    labelText: 'College Student ID Number',
                    prefixIcon: Icon(Icons.badge_outlined, size: 20),
                  ),
                  validator: (v) => v == null || v.trim().isEmpty ? 'Student ID is required.' : null,
                ),
                const SizedBox(height: 14),

                TextFormField(
                  controller: _courseController,
                  style: const TextStyle(color: Colors.white, fontSize: 14),
                  decoration: const InputDecoration(
                    labelText: 'Course / Degree Program',
                    prefixIcon: Icon(Icons.menu_book_outlined, size: 20),
                  ),
                  validator: (v) => v == null || v.trim().isEmpty ? 'Course name is required.' : null,
                ),
                const SizedBox(height: 14),

                // Semester Selector
                DropdownButtonFormField<int>(
                  value: _semester,
                  isExpanded: true,
                  dropdownColor: AppColors.surface,
                  style: const TextStyle(color: Colors.white, fontSize: 14),
                  decoration: const InputDecoration(
                    labelText: 'Current Semester',
                    prefixIcon: Icon(Icons.format_list_numbered, size: 20),
                  ),
                  items: List.generate(8, (i) => i + 1).map((sem) {
                    return DropdownMenuItem(
                      value: sem,
                      child: Text('Semester $sem'),
                    );
                  }).toList(),
                  onChanged: (val) {
                    if (val != null) setState(() => _semester = val);
                  },
                ),
                const SizedBox(height: 24),

                ElevatedButton(
                  onPressed: authState.isLoading ? null : _handleRegister,
                  child: authState.isLoading
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                        )
                      : const Text('Complete Registration & Submit KYC'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
