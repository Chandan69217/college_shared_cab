import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'core/theme/app_theme.dart';
import 'core/storage/storage_service.dart';
import 'features/auth/presentation/login_screen.dart';
import 'features/auth/presentation/student_register_screen.dart';
import 'features/auth/presentation/forgot_password_screen.dart';
import 'features/auth/providers/auth_provider.dart';
import 'features/student/student_main_shell.dart';
import 'features/student/plans/plans_checkout_screen.dart';
import 'features/student/history/ride_history_screen.dart';
import 'features/student/support/support_screen.dart';
import 'features/driver/driver_main_shell.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await StorageService.init();
  runApp(const ProviderScope(child: CampusRideApp()));
}

final routerProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authProvider);

  return GoRouter(
    initialLocation: '/login',
    redirect: (context, state) {
      final isAuth = authState.isAuthenticated;
      final isLoggingIn = state.matchedLocation == '/login' ||
          state.matchedLocation == '/register' ||
          state.matchedLocation == '/forgot-password';

      if (!isAuth) {
        return isLoggingIn ? null : '/login';
      }

      if (isLoggingIn) {
        return authState.role == 'DRIVER' ? '/driver' : '/student';
      }

      return null;
    },
    routes: [
      GoRoute(
        path: '/login',
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: '/register',
        builder: (context, state) => const StudentRegisterScreen(),
      ),
      GoRoute(
        path: '/forgot-password',
        builder: (context, state) => const ForgotPasswordScreen(),
      ),
      GoRoute(
        path: '/student',
        builder: (context, state) => const StudentMainShell(),
        routes: [
          GoRoute(
            path: 'plans',
            builder: (context, state) => const PlansCheckoutScreen(),
          ),
          GoRoute(
            path: 'history',
            builder: (context, state) => const RideHistoryScreen(),
          ),
          GoRoute(
            path: 'support',
            builder: (context, state) => const SupportScreen(),
          ),
        ],
      ),
      GoRoute(
        path: '/driver',
        builder: (context, state) => const DriverMainShell(),
      ),
    ],
  );
});

class CampusRideApp extends ConsumerWidget {
  const CampusRideApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(routerProvider);

    return MaterialApp.router(
      title: 'CampusRide',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.darkTheme,
      routerConfig: router,
    );
  }
}
