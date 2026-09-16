import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import 'home/student_home_screen.dart';
import 'booking/book_ride_screen.dart';
import 'pass/daily_pass_screen.dart';
import 'tracking/vehicle_tracking_screen.dart';
import 'profile/student_profile_screen.dart';

class StudentMainShell extends StatefulWidget {
  const StudentMainShell({super.key});

  @override
  State<StudentMainShell> createState() => _StudentMainShellState();
}

class _StudentMainShellState extends State<StudentMainShell> {
  int _currentIndex = 0;
  late final List<Widget> _screens;

  @override
  void initState() {
    super.initState();
    _screens = [
      StudentHomeScreen(onNavigateTab: _onTabSelected),
      BookRideScreen(onNavigateTab: _onTabSelected),
      const DailyPassScreen(),
      const VehicleTrackingScreen(),
      const StudentProfileScreen(),
    ];
  }

  void _onTabSelected(int index) {
    setState(() => _currentIndex = index);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: IndexedStack(
        index: _currentIndex,
        children: _screens,
      ),
      bottomNavigationBar: Container(
        decoration: const BoxDecoration(
          border: Border(
            top: BorderSide(color: Color(0xFF1F2937), width: 1),
          ),
        ),
        child: BottomNavigationBar(
          currentIndex: _currentIndex,
          onTap: _onTabSelected,
          items: const [
            BottomNavigationBarItem(
              icon: Icon(Icons.home_outlined),
              activeIcon: Icon(Icons.home_rounded),
              label: 'Home',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.add_road_outlined),
              activeIcon: Icon(Icons.add_road_rounded),
              label: 'Book Ride',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.qr_code_2_outlined),
              activeIcon: Icon(Icons.qr_code_2_rounded),
              label: "Today's Pass",
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.navigation_outlined),
              activeIcon: Icon(Icons.navigation_rounded),
              label: 'Track',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.person_outline),
              activeIcon: Icon(Icons.person_rounded),
              label: 'Profile',
            ),
          ],
        ),
      ),
    );
  }
}
