import 'dart:async';
import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:geolocator/geolocator.dart';
import 'package:permission_handler/permission_handler.dart';
import '../api/api_client.dart';

enum LocationPermissionState {
  granted,
  denied,
  permanentlyDenied,
  serviceDisabled,
}

class GpsTrackingStatus {
  final bool isTracking;
  final String? activeTripId;
  final String? routeName;
  final String? vehiclePlate;
  final double? lastLatitude;
  final double? lastLongitude;
  final double? accuracyMeters;
  final double? speedKmh;
  final double? headingDegrees;
  final DateTime? lastTransmittedAt;
  final int totalTransmissions;
  final int queuedOfflineUpdates;
  final String? errorMessage;
  final bool isOnline;

  const GpsTrackingStatus({
    this.isTracking = false,
    this.activeTripId,
    this.routeName,
    this.vehiclePlate,
    this.lastLatitude,
    this.lastLongitude,
    this.accuracyMeters,
    this.speedKmh,
    this.headingDegrees,
    this.lastTransmittedAt,
    this.totalTransmissions = 0,
    this.queuedOfflineUpdates = 0,
    this.errorMessage,
    this.isOnline = true,
  });

  String get gpsQuality {
    if (accuracyMeters == null) return 'NO_SIGNAL';
    if (accuracyMeters! <= 12) return 'EXCELLENT';
    if (accuracyMeters! <= 25) return 'GOOD';
    if (accuracyMeters! <= 50) return 'FAIR';
    return 'POOR';
  }

  GpsTrackingStatus copyWith({
    bool? isTracking,
    String? activeTripId,
    String? routeName,
    String? vehiclePlate,
    double? lastLatitude,
    double? lastLongitude,
    double? accuracyMeters,
    double? speedKmh,
    double? headingDegrees,
    DateTime? lastTransmittedAt,
    int? totalTransmissions,
    int? queuedOfflineUpdates,
    String? errorMessage,
    bool? isOnline,
  }) {
    return GpsTrackingStatus(
      isTracking: isTracking ?? this.isTracking,
      activeTripId: activeTripId ?? this.activeTripId,
      routeName: routeName ?? this.routeName,
      vehiclePlate: vehiclePlate ?? this.vehiclePlate,
      lastLatitude: lastLatitude ?? this.lastLatitude,
      lastLongitude: lastLongitude ?? this.lastLongitude,
      accuracyMeters: accuracyMeters ?? this.accuracyMeters,
      speedKmh: speedKmh ?? this.speedKmh,
      headingDegrees: headingDegrees ?? this.headingDegrees,
      lastTransmittedAt: lastTransmittedAt ?? this.lastTransmittedAt,
      totalTransmissions: totalTransmissions ?? this.totalTransmissions,
      queuedOfflineUpdates: queuedOfflineUpdates ?? this.queuedOfflineUpdates,
      errorMessage: errorMessage ?? this.errorMessage,
      isOnline: isOnline ?? this.isOnline,
    );
  }
}

class GpsTrackingService {
  static final GpsTrackingService _instance = GpsTrackingService._internal();
  factory GpsTrackingService() => _instance;
  GpsTrackingService._internal();

  StreamSubscription<Position>? _positionSubscription;
  String? _activeTripId;
  String? _routeName;
  String? _vehiclePlate;
  DateTime? _lastTransmissionTime;
  final List<Map<String, dynamic>> _offlineQueue = [];
  static const int _maxQueueSize = 30;

  String? get activeTripId => _activeTripId;
  String? get routeName => _routeName;
  String? get vehiclePlate => _vehiclePlate;

  final ValueNotifier<GpsTrackingStatus> statusNotifier =
      ValueNotifier<GpsTrackingStatus>(const GpsTrackingStatus());

  GpsTrackingStatus get currentStatus => statusNotifier.value;

  /// Check and request device GPS and notification permissions
  Future<LocationPermissionState> checkAndRequestPermission() async {
    // 1. Check if hardware location services are enabled
    final serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      statusNotifier.value = statusNotifier.value.copyWith(
        errorMessage: 'Device GPS / Location Services are turned off. Please enable GPS in your device settings.',
      );
      return LocationPermissionState.serviceDisabled;
    }

    // 2. Request Notification Permission for Android 13+ foreground service notification
    try {
      if (defaultTargetPlatform == TargetPlatform.android) {
        final notifStatus = await Permission.notification.status;
        if (notifStatus.isDenied) {
          await Permission.notification.request();
        }
      }
    } catch (e) {
      debugPrint('[GpsTrackingService] Notification permission notice: $e');
    }

    // 3. Check Location Permission
    LocationPermission permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) {
        statusNotifier.value = statusNotifier.value.copyWith(
          errorMessage: 'Location permission denied. Real GPS access is required to share vehicle location with students during trips.',
        );
        return LocationPermissionState.denied;
      }
    }

    if (permission == LocationPermission.deniedForever) {
      statusNotifier.value = statusNotifier.value.copyWith(
        errorMessage: 'Location permissions are permanently denied. Please grant permission in App Settings.',
      );
      return LocationPermissionState.permanentlyDenied;
    }

    return LocationPermissionState.granted;
  }

  /// Get immediate one-shot position fix from GPS sensor
  Future<Position?> getCurrentPosition() async {
    try {
      final permission = await checkAndRequestPermission();
      if (permission != LocationPermissionState.granted) return null;

      return await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
          timeLimit: Duration(seconds: 10),
        ),
      );
    } catch (e) {
      debugPrint('[GpsTrackingService] One-shot GPS fix notice: $e');
      return null;
    }
  }

  /// Start real device background GPS tracking using Android Foreground Service
  Future<bool> startTracking(
    String tripId, {
    String? routeName,
    String? vehiclePlate,
  }) async {
    if (_positionSubscription != null && _activeTripId == tripId) {
      debugPrint('[GpsTrackingService] GPS tracking already active for trip $tripId');
      return true;
    }

    final permission = await checkAndRequestPermission();
    if (permission != LocationPermissionState.granted) {
      return false;
    }

    // Cancel any previous tracking stream
    await stopTracking();

    _activeTripId = tripId;
    _routeName = routeName;
    _vehiclePlate = vehiclePlate;
    _offlineQueue.clear();

    statusNotifier.value = GpsTrackingStatus(
      isTracking: true,
      activeTripId: tripId,
      routeName: routeName,
      vehiclePlate: vehiclePlate,
      totalTransmissions: 0,
      queuedOfflineUpdates: 0,
      isOnline: true,
    );

    // Initial position fix to immediately broadcast location on start
    try {
      final initialPosition = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
          timeLimit: Duration(seconds: 8),
        ),
      );
      await _transmitLocation(initialPosition, isInitial: true);
    } catch (e) {
      debugPrint('[GpsTrackingService] Initial GPS fix notice: $e');
    }

    // Configure Location Settings with Android Foreground Service support
    late final LocationSettings locationSettings;

    if (defaultTargetPlatform == TargetPlatform.android) {
      locationSettings = AndroidSettings(
        accuracy: LocationAccuracy.high,
        distanceFilter: 10, // 10 meters movement filter
        intervalDuration: const Duration(seconds: 8), // 8 seconds update interval
        forceLocationManager: false,
        foregroundNotificationConfig: ForegroundNotificationConfig(
          notificationTitle: 'CampusRide: Trip in Progress',
          notificationText: routeName != null && routeName.isNotEmpty
              ? 'Live location sharing is active • $routeName'
              : 'Live vehicle location sharing is active with students and dispatch',
          enableWakeLock: true,
          setOngoing: true,
          notificationIcon: const AndroidResource(name: 'ic_launcher', defType: 'mipmap'),
        ),
      );
    } else {
      locationSettings = const LocationSettings(
        accuracy: LocationAccuracy.high,
        distanceFilter: 10,
      );
    }

    _positionSubscription = Geolocator.getPositionStream(
      locationSettings: locationSettings,
    ).listen(
      (Position position) {
        _handlePositionUpdate(position);
      },
      onError: (error) {
        debugPrint('[GpsTrackingService] GPS stream error: $error');
        statusNotifier.value = statusNotifier.value.copyWith(
          errorMessage: 'GPS Signal lost or interrupted: $error',
        );
      },
      cancelOnError: false,
    );

    debugPrint('[GpsTrackingService] Started real device background GPS tracking for trip $tripId');
    return true;
  }

  /// Process incoming location updates from real device GPS sensor
  void _handlePositionUpdate(Position position) {
    if (_activeTripId == null) return;

    // Filter out low accuracy noise (> 65 meters)
    if (position.accuracy > 65) {
      debugPrint('[GpsTrackingService] Skipping low accuracy GPS point (${position.accuracy}m)');
      return;
    }

    // Rate-limit transmissions to avoid battery drain (at least 5 seconds between updates)
    final now = DateTime.now();
    if (_lastTransmissionTime != null &&
        now.difference(_lastTransmissionTime!).inSeconds < 5) {
      return;
    }

    _transmitLocation(position);
  }

  /// Transmit real location payload to Node.js backend & Supabase
  Future<void> _transmitLocation(Position position, {bool isInitial = false}) async {
    if (_activeTripId == null) return;

    final double speedKmh = (position.speed * 3.6).clamp(0.0, 160.0);
    final double headingDeg = position.heading.clamp(0.0, 360.0);
    final String timestampIso = position.timestamp.toUtc().toIso8601String();

    final locationPayload = {
      'trip_id': _activeTripId,
      'latitude': position.latitude,
      'longitude': position.longitude,
      'accuracy': position.accuracy,
      'speed': speedKmh,
      'heading': headingDeg,
      'timestamp': timestampIso,
    };

    try {
      final res = await apiClient.post(
        '/trips/$_activeTripId/location',
        data: locationPayload,
      );

      if (res.data != null && res.data['success'] == true) {
        _lastTransmissionTime = DateTime.now();

        // Flush offline queue if connection restored
        if (_offlineQueue.isNotEmpty) {
          _flushOfflineQueue();
        }

        statusNotifier.value = statusNotifier.value.copyWith(
          lastLatitude: position.latitude,
          lastLongitude: position.longitude,
          accuracyMeters: position.accuracy,
          speedKmh: speedKmh,
          headingDegrees: headingDeg,
          lastTransmittedAt: _lastTransmissionTime,
          totalTransmissions: statusNotifier.value.totalTransmissions + 1,
          queuedOfflineUpdates: _offlineQueue.length,
          errorMessage: null,
          isOnline: true,
        );
      }
    } catch (e) {
      final errorMsg = ApiClient.getErrorMessage(e);
      debugPrint('[GpsTrackingService] GPS transmit notice: $e ($errorMsg)');

      bool shouldBuffer = true;
      if (e is DioException && e.response?.statusCode != null) {
        final code = e.response!.statusCode!;
        if (code >= 400 && code < 500) {
          shouldBuffer = false; // Validation rejection (e.g. trip already completed)
        }
      }

      if (shouldBuffer) {
        if (_offlineQueue.length >= _maxQueueSize) {
          _offlineQueue.removeAt(0);
        }
        _offlineQueue.add(locationPayload);
      } else {
        _offlineQueue.clear();
      }

      statusNotifier.value = statusNotifier.value.copyWith(
        lastLatitude: position.latitude,
        lastLongitude: position.longitude,
        accuracyMeters: position.accuracy,
        speedKmh: speedKmh,
        headingDegrees: headingDeg,
        queuedOfflineUpdates: _offlineQueue.length,
        isOnline: false,
        errorMessage: errorMsg.isNotEmpty
            ? errorMsg
            : 'Connection interrupted. Location points queued for sync.',
      );
    }
  }

  /// Flush buffered offline updates once connection is restored
  Future<void> _flushOfflineQueue() async {
    if (_offlineQueue.isEmpty || _activeTripId == null) return;

    final itemsToSync = List<Map<String, dynamic>>.from(_offlineQueue);
    _offlineQueue.clear();

    for (final item in itemsToSync) {
      try {
        await apiClient.post('/trips/$_activeTripId/location', data: item);
      } catch (_) {
        if (_offlineQueue.length < _maxQueueSize) {
          _offlineQueue.add(item);
        }
      }
    }

    statusNotifier.value = statusNotifier.value.copyWith(
      queuedOfflineUpdates: _offlineQueue.length,
    );
  }

  /// Stop background GPS tracking when trip is completed or cancelled
  Future<void> stopTracking() async {
    await _positionSubscription?.cancel();
    _positionSubscription = null;
    _activeTripId = null;
    _routeName = null;
    _vehiclePlate = null;
    _offlineQueue.clear();

    statusNotifier.value = GpsTrackingStatus(
      isTracking: false,
      activeTripId: null,
      errorMessage: null,
      isOnline: true,
    );
    debugPrint('[GpsTrackingService] Stopped GPS tracking and foreground service.');
  }
}
