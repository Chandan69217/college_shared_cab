import 'dart:async';
import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:geolocator/geolocator.dart';
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

  GpsTrackingStatus copyWith({
    bool? isTracking,
    String? activeTripId,
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
  DateTime? _lastTransmissionTime;
  final List<Map<String, dynamic>> _offlineQueue = [];
  static const int _maxQueueSize = 25;

  final ValueNotifier<GpsTrackingStatus> statusNotifier =
      ValueNotifier<GpsTrackingStatus>(const GpsTrackingStatus());

  GpsTrackingStatus get currentStatus => statusNotifier.value;

  /// Check and request location permissions with user-friendly handling
  Future<LocationPermissionState> checkAndRequestPermission() async {
    final serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      statusNotifier.value = statusNotifier.value.copyWith(
        errorMessage: 'Device GPS / Location Services are turned off. Please enable GPS in device settings.',
      );
      return LocationPermissionState.serviceDisabled;
    }

    LocationPermission permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) {
        statusNotifier.value = statusNotifier.value.copyWith(
          errorMessage: 'Location permission denied. GPS access is required to share vehicle location during active trips.',
        );
        return LocationPermissionState.denied;
      }
    }

    if (permission == LocationPermission.deniedForever) {
      statusNotifier.value = statusNotifier.value.copyWith(
        errorMessage: 'Location permissions are permanently denied. Please enable them in app settings.',
      );
      return LocationPermissionState.permanentlyDenied;
    }

    return LocationPermissionState.granted;
  }

  /// Get immediate one-shot current location
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
      debugPrint('Error getting current position: $e');
      return null;
    }
  }

  /// Start live GPS tracking for an active trip
  Future<bool> startTracking(String tripId) async {
    final permission = await checkAndRequestPermission();
    if (permission != LocationPermissionState.granted) {
      return false;
    }

    // Stop previous tracking if any
    await stopTracking();

    _activeTripId = tripId;
    _offlineQueue.clear();

    statusNotifier.value = GpsTrackingStatus(
      isTracking: true,
      activeTripId: tripId,
      totalTransmissions: 0,
      queuedOfflineUpdates: 0,
      isOnline: true,
    );

    // Initial position fix
    try {
      final initialPosition = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(accuracy: LocationAccuracy.high),
      );
      await _transmitLocation(initialPosition, isInitial: true);
    } catch (e) {
      debugPrint('Initial GPS fix warning: $e');
    }

    // Configure continuous position stream (updates every ~5-10 seconds, or 5m delta)
    const locationSettings = LocationSettings(
      accuracy: LocationAccuracy.high,
      distanceFilter: 5, // minimum 5 meters movement
    );

    _positionSubscription = Geolocator.getPositionStream(
      locationSettings: locationSettings,
    ).listen(
      (Position position) {
        _handlePositionUpdate(position);
      },
      onError: (error) {
        debugPrint('GPS stream error: $error');
        statusNotifier.value = statusNotifier.value.copyWith(
          errorMessage: 'GPS Signal lost or interrupted: $error',
        );
      },
    );

    return true;
  }

  /// Process incoming location updates from device GPS sensor
  void _handlePositionUpdate(Position position) {
    if (_activeTripId == null) return;

    // Filter out very low accuracy noise (> 65 meters)
    if (position.accuracy > 65) {
      debugPrint('Skipping low accuracy GPS point (${position.accuracy}m)');
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

  /// Transmit location payload to Node.js backend
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

      if (res.data['success'] == true) {
        _lastTransmissionTime = DateTime.now();

        // If we had queued offline updates, flush them
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

      // Only buffer for true network/connection drops or 5xx server errors, not 4xx validation rejections
      bool shouldBuffer = true;
      if (e is DioException && e.response?.statusCode != null) {
        final code = e.response!.statusCode!;
        if (code >= 400 && code < 500) {
          shouldBuffer = false;
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
        // If it fails again, re-enqueue
        if (_offlineQueue.length < _maxQueueSize) {
          _offlineQueue.add(item);
        }
      }
    }

    statusNotifier.value = statusNotifier.value.copyWith(
      queuedOfflineUpdates: _offlineQueue.length,
    );
  }

  /// Stop GPS tracking when trip ends
  Future<void> stopTracking() async {
    await _positionSubscription?.cancel();
    _positionSubscription = null;
    _activeTripId = null;
    _offlineQueue.clear();

    statusNotifier.value = statusNotifier.value.copyWith(
      isTracking: false,
      activeTripId: null,
      errorMessage: null,
    );
  }
}
