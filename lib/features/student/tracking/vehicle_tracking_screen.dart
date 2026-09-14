import 'dart:async';
import 'package:flutter/material.dart';
import '../../../core/api/api_client.dart';
import '../../../core/theme/app_colors.dart';

class VehicleTrackingScreen extends StatefulWidget {
  const VehicleTrackingScreen({super.key});

  @override
  State<VehicleTrackingScreen> createState() => _VehicleTrackingScreenState();
}

class _VehicleTrackingScreenState extends State<VehicleTrackingScreen> {
  Map<String, dynamic>? _trackingData;
  bool _isLoading = true;
  Timer? _locationPollTimer;
  int _etaMinutes = 7;

  Future<void> _fetchTracking() async {
    try {
      final res = await apiClient.get('/trips/active-locations');
      if (res.data['success'] == true && mounted) {
        final List list = res.data['data'] ?? [];
        if (list.isNotEmpty) {
          setState(() {
            _trackingData = list.first;
            _isLoading = false;
          });
        } else {
          setState(() => _isLoading = false);
        }
      }
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  void initState() {
    super.initState();
    _fetchTracking();
    _locationPollTimer = Timer.periodic(const Duration(seconds: 10), (_) {
      _fetchTracking();
    });
  }

  @override
  void dispose() {
    _locationPollTimer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Live Vehicle Tracking & ETA'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: () {
              setState(() => _isLoading = true);
              _fetchTracking();
            },
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Live Map View Box Simulator
                  Container(
                    height: 240,
                    decoration: BoxDecoration(
                      color: const Color(0xFF0F172A),
                      borderRadius: BorderRadius.circular(22),
                      border: Border.all(color: const Color(0xFF374151)),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.3),
                          blurRadius: 15,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: Stack(
                      children: [
                        // Map grid pattern
                        Positioned.fill(
                          child: CustomPaint(
                            painter: _MapGridPainter(),
                          ),
                        ),

                        // Animated Cab Pin
                        Align(
                          alignment: const Alignment(-0.2, -0.1),
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                decoration: BoxDecoration(
                                  color: AppColors.primary,
                                  borderRadius: BorderRadius.circular(12),
                                  boxShadow: [
                                    BoxShadow(
                                      color: AppColors.primary.withOpacity(0.5),
                                      blurRadius: 10,
                                    ),
                                  ],
                                ),
                                child: Text(
                                  _trackingData?['vehicle']?['number'] ?? 'UP16-CZ-8821',
                                  style: const TextStyle(
                                    color: Colors.black,
                                    fontWeight: FontWeight.w900,
                                    fontSize: 10,
                                    fontFamily: 'monospace',
                                  ),
                                ),
                              ),
                              const SizedBox(height: 4),
                              Container(
                                width: 38,
                                height: 38,
                                decoration: BoxDecoration(
                                  color: Colors.black,
                                  shape: BoxShape.circle,
                                  border: Border.all(color: AppColors.primary, width: 2),
                                ),
                                child: const Icon(Icons.directions_car_rounded, color: AppColors.primary, size: 22),
                              ),
                            ],
                          ),
                        ),

                        // Destination Campus Marker
                        const Align(
                          alignment: Alignment(0.6, 0.5),
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Icons.school_rounded, color: AppColors.accentBlue, size: 28),
                              Text(
                                'Apex Campus',
                                style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 10),
                              ),
                            ],
                          ),
                        ),

                        // ETA Badge Overlay
                        Positioned(
                          top: 14,
                          left: 14,
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                            decoration: BoxDecoration(
                              color: AppColors.surface.withOpacity(0.92),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: const Color(0xFF374151)),
                            ),
                            child: Row(
                              children: [
                                const Icon(Icons.access_time_filled_rounded, color: AppColors.primary, size: 14),
                                const SizedBox(width: 6),
                                Text(
                                  'ETA: $_etaMinutes mins to pickup',
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontWeight: FontWeight.bold,
                                    fontSize: 11,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 18),

                  // Driver & Cab Details Card
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: AppColors.surfaceCard,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: const Color(0xFF374151)),
                    ),
                    child: Column(
                      children: [
                        Row(
                          children: [
                            Container(
                              width: 46,
                              height: 46,
                              decoration: BoxDecoration(
                                color: AppColors.primary.withOpacity(0.15),
                                shape: BoxShape.circle,
                              ),
                              child: const Icon(Icons.person, color: AppColors.primary, size: 26),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    _trackingData?['driver']?['name'] ?? 'Rajesh Kumar Yadav',
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontWeight: FontWeight.bold,
                                      fontSize: 14,
                                    ),
                                  ),
                                  const SizedBox(height: 2),
                                  const Row(
                                    children: [
                                      Icon(Icons.star_rounded, color: AppColors.accentAmber, size: 14),
                                      SizedBox(width: 3),
                                      Text('4.92 / 5.0 (420 Trips)', style: TextStyle(color: AppColors.textSecondary, fontSize: 11)),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                            IconButton(
                              onPressed: () {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(content: Text('Calling driver: +91 99999 00002')),
                                );
                              },
                              style: IconButton.styleFrom(
                                backgroundColor: AppColors.primary.withOpacity(0.15),
                              ),
                              icon: const Icon(Icons.phone_in_talk_rounded, color: AppColors.primary, size: 20),
                            ),
                          ],
                        ),
                        const Divider(color: Color(0xFF374151), height: 24),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text('Vehicle', style: TextStyle(color: AppColors.textMuted, fontSize: 11)),
                                Text(
                                  _trackingData?['vehicle']?['model'] ?? 'Maruti Ertiga (CNG)',
                                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12),
                                ),
                              ],
                            ),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.end,
                              children: [
                                const Text('Plate Number', style: TextStyle(color: AppColors.textMuted, fontSize: 11)),
                                Text(
                                  _trackingData?['vehicle']?['number'] ?? 'UP16-CZ-8821',
                                  style: const TextStyle(color: AppColors.primaryLight, fontWeight: FontWeight.bold, fontSize: 12, fontFamily: 'monospace'),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 18),

                  // Sequential Route Stops Progress Tracker
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: AppColors.surfaceCard,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: const Color(0xFF374151)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Route Progress Tracker',
                          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
                        ),
                        const SizedBox(height: 14),
                        _buildStopItem('Sector 18 Metro Gate 2', '07:30 AM', isPassed: true),
                        _buildStopItem('Botanical Garden Interchange', '07:40 AM', isCurrent: true),
                        _buildStopItem('Amity Gate 4 Crossing', '07:50 AM', isPassed: false),
                        _buildStopItem('Apex Campus Destination', '08:15 AM', isPassed: false, isLast: true),
                      ],
                    ),
                  ),
                ],
              ),
            ),
    );
  }

  Widget _buildStopItem(String name, String time, {bool isPassed = false, bool isCurrent = false, bool isLast = false}) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Column(
          children: [
            Container(
              width: 14,
              height: 14,
              decoration: BoxDecoration(
                color: isPassed
                    ? AppColors.primary
                    : isCurrent
                    ? AppColors.accentAmber
                    : const Color(0xFF374151),
                shape: BoxShape.circle,
                border: Border.all(color: Colors.white, width: 2),
              ),
            ),
            if (!isLast)
              Container(
                width: 2,
                height: 28,
                color: isPassed ? AppColors.primary : const Color(0xFF374151),
              ),
          ],
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                name,
                style: TextStyle(
                  color: isPassed || isCurrent ? Colors.white : AppColors.textSecondary,
                  fontWeight: isCurrent ? FontWeight.bold : FontWeight.w500,
                  fontSize: 12,
                ),
              ),
              Text(time, style: const TextStyle(color: AppColors.textMuted, fontSize: 10)),
              const SizedBox(height: 6),
            ],
          ),
        ),
      ],
    );
  }
}

class _MapGridPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = const Color(0xFF1E293B)
      ..strokeWidth = 1;

    for (double i = 0; i < size.width; i += 30) {
      canvas.drawLine(Offset(i, 0), Offset(i, size.height), paint);
    }
    for (double i = 0; i < size.height; i += 30) {
      canvas.drawLine(Offset(0, i), Offset(size.width, i), paint);
    }

    // Draw route path line
    final pathPaint = Paint()
      ..color = AppColors.primary.withOpacity(0.4)
      ..strokeWidth = 3
      ..style = PaintingStyle.stroke;

    final path = Path()
      ..moveTo(size.width * 0.1, size.height * 0.2)
      ..lineTo(size.width * 0.4, size.height * 0.45)
      ..lineTo(size.width * 0.8, size.height * 0.75);

    canvas.drawPath(path, pathPaint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
