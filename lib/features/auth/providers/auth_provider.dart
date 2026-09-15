import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_client.dart';
import '../../../core/models/user_model.dart';
import '../../../core/storage/storage_service.dart';

class AuthState {
  final bool isLoading;
  final bool isAuthenticated;
  final UserModel? user;
  final String? role;
  final String? token;
  final String? error;

  AuthState({
    this.isLoading = false,
    this.isAuthenticated = false,
    this.user,
    this.role,
    this.token,
    this.error,
  });

  AuthState copyWith({
    bool? isLoading,
    bool? isAuthenticated,
    UserModel? user,
    String? role,
    String? token,
    String? error,
  }) {
    return AuthState(
      isLoading: isLoading ?? this.isLoading,
      isAuthenticated: isAuthenticated ?? this.isAuthenticated,
      user: user ?? this.user,
      role: role ?? this.role,
      token: token ?? this.token,
      error: error,
    );
  }
}

class AuthNotifier extends StateNotifier<AuthState> {
  AuthNotifier() : super(AuthState(isLoading: true)) {
    _init();
  }

  Future<void> _init() async {
    await StorageService.init();
    final token = StorageService.getToken();
    final userData = StorageService.getUserData();
    final role = StorageService.getUserRole();

    if (token != null && userData != null) {
      state = AuthState(
        isLoading: false,
        isAuthenticated: true,
        user: UserModel.fromJson(userData),
        role: role,
        token: token,
      );
      // Refresh profile in background
      fetchProfile();
    } else {
      state = AuthState(isLoading: false, isAuthenticated: false);
    }
  }

  Future<void> fetchProfile() async {
    try {
      final res = await apiClient.get('/profile');
      if (res.data['success'] == true) {
        final profileData = res.data['data'];
        final updatedUser = UserModel.fromJson({
          ...profileData['user'],
          'profile': profileData['profile'],
        });
        await StorageService.saveUserData(updatedUser.toJson(), updatedUser.role);
        state = state.copyWith(user: updatedUser);
      }
    } catch (_) {}
  }

  Future<bool> login(String emailOrPhone, String password, String role) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final res = await apiClient.post('/auth/login', data: {
        'emailOrPhone': emailOrPhone,
        'password': password,
        'role': role,
      });

      if (res.data['success'] == true) {
        final data = res.data['data'];
        final user = UserModel.fromJson({
          ...data['user'],
          'profile': data['profile'],
        });
        final token = data['token'] as String;

        await StorageService.saveToken(token);
        await StorageService.saveUserData(user.toJson(), role);

        state = AuthState(
          isLoading: false,
          isAuthenticated: true,
          user: user,
          role: role,
          token: token,
        );
        return true;
      } else {
        state = state.copyWith(
          isLoading: false,
          error: res.data['message'] ?? 'Login failed',
        );
        return false;
      }
    } catch (e) {
      final errMsg = ApiClient.getErrorMessage(e);
      state = state.copyWith(isLoading: false, error: errMsg);
      return false;
    }
  }

  Future<bool> registerStudent(Map<String, dynamic> data) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final res = await apiClient.post('/auth/register', data: data);
      if (res.data['success'] == true) {
        final respData = res.data['data'];
        final user = UserModel.fromJson({
          ...respData['user'],
          'profile': respData['profile'],
        });
        final token = respData['token'] as String;

        await StorageService.saveToken(token);
        await StorageService.saveUserData(user.toJson(), 'STUDENT');

        state = AuthState(
          isLoading: false,
          isAuthenticated: true,
          user: user,
          role: 'STUDENT',
          token: token,
        );
        return true;
      } else {
        state = state.copyWith(
          isLoading: false,
          error: res.data['message'] ?? 'Registration failed',
        );
        return false;
      }
    } catch (e) {
      final errMsg = ApiClient.getErrorMessage(e);
      state = state.copyWith(isLoading: false, error: errMsg);
      return false;
    }
  }

  Future<bool> updateProfile(Map<String, dynamic> updates) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final res = await apiClient.put('/profile', data: updates);
      if (res.data['success'] == true) {
        final profileData = res.data['data'];
        final updatedUser = UserModel.fromJson({
          ...profileData['user'],
          'profile': profileData['profile'],
        });
        await StorageService.saveUserData(updatedUser.toJson(), updatedUser.role);
        state = state.copyWith(isLoading: false, user: updatedUser);
        return true;
      } else {
        state = state.copyWith(
          isLoading: false,
          error: res.data['message'] ?? 'Failed to update profile.',
        );
        return false;
      }
    } catch (e) {
      final errMsg = ApiClient.getErrorMessage(e);
      state = state.copyWith(isLoading: false, error: errMsg);
      return false;
    }
  }

  Future<bool> changePassword(String currentPassword, String newPassword, String confirmPassword) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final res = await apiClient.post('/auth/change-password', data: {
        'currentPassword': currentPassword,
        'newPassword': newPassword,
        'confirmPassword': confirmPassword,
      });

      if (res.data['success'] == true) {
        state = state.copyWith(isLoading: false);
        return true;
      } else {
        state = state.copyWith(
          isLoading: false,
          error: res.data['message'] ?? 'Failed to change password.',
        );
        return false;
      }
    } catch (e) {
      final errMsg = ApiClient.getErrorMessage(e);
      state = state.copyWith(isLoading: false, error: errMsg);
      return false;
    }
  }

  Future<bool> deleteAccount() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final res = await apiClient.delete('/profile');
      if (res.data['success'] == true) {
        await logout();
        return true;
      } else {
        state = state.copyWith(
          isLoading: false,
          error: res.data['message'] ?? 'Failed to delete account.',
        );
        return false;
      }
    } catch (e) {
      final errMsg = ApiClient.getErrorMessage(e);
      state = state.copyWith(isLoading: false, error: errMsg);
      return false;
    }
  }

  Future<Map<String, dynamic>> forgotPassword(String identifier, {String role = 'STUDENT'}) async {
    try {
      final res = await apiClient.post('/auth/forgot-password', data: {
        'identifier': identifier.trim(),
        'role': role,
      });
      return {
        'success': res.data['success'] == true,
        'message': res.data['message'] ?? 'OTP sent if account exists.',
        'cooldownSeconds': res.data['data']?['cooldownSeconds'] ?? 60,
      };
    } catch (e) {
      return {
        'success': false,
        'message': ApiClient.getErrorMessage(e),
      };
    }
  }

  Future<Map<String, dynamic>> verifyRecoveryOtp(String identifier, String otp, {String role = 'STUDENT'}) async {
    try {
      final res = await apiClient.post('/auth/verify-otp', data: {
        'identifier': identifier.trim(),
        'otp': otp,
        'purpose': 'PASSWORD_RESET',
        'role': role,
      });
      if (res.data['success'] == true && res.data['data']?['resetToken'] != null) {
        return {
          'success': true,
          'resetToken': res.data['data']['resetToken'],
          'message': res.data['message'] ?? 'OTP verified successfully.',
        };
      }
      return {
        'success': false,
        'message': res.data['message'] ?? 'Verification failed.',
      };
    } catch (e) {
      return {
        'success': false,
        'message': ApiClient.getErrorMessage(e),
      };
    }
  }

  Future<Map<String, dynamic>> resetPassword(
    String identifier,
    String resetToken,
    String newPassword,
    String confirmPassword, {
    String role = 'STUDENT',
  }) async {
    try {
      final res = await apiClient.post('/auth/reset-password', data: {
        'identifier': identifier.trim(),
        'resetToken': resetToken,
        'newPassword': newPassword,
        'confirmPassword': confirmPassword,
        'role': role,
      });
      return {
        'success': res.data['success'] == true,
        'message': res.data['message'] ?? 'Password reset successfully.',
      };
    } catch (e) {
      return {
        'success': false,
        'message': ApiClient.getErrorMessage(e),
      };
    }
  }

  Future<void> logout() async {
    await StorageService.clearAll();
    state = AuthState(isAuthenticated: false);
  }
}

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  return AuthNotifier();
});
