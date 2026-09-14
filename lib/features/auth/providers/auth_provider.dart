import 'package:dio/dio.dart';
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
    } else {
      state = AuthState(isLoading: false, isAuthenticated: false);
    }
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
        final user = UserModel.fromJson(data['user']);
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
      String errMsg = 'Invalid email/phone or password.';
      if (e is DioException && e.response?.data?['message'] != null) {
        errMsg = e.response!.data['message'];
      }
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
        final user = UserModel.fromJson(respData['user']);
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
      String errMsg = 'Registration failed.';
      if (e is DioException && e.response?.data?['message'] != null) {
        errMsg = e.response!.data['message'];
      }
      state = state.copyWith(isLoading: false, error: errMsg);
      return false;
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
