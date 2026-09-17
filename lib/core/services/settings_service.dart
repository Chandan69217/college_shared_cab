import 'dart:convert';
import '../api/api_client.dart';
import '../storage/storage_service.dart';

class SettingsService {
  static final SettingsService instance = SettingsService._internal();
  SettingsService._internal();

  static const String _storageKey = 'cached_system_settings';

  bool requireAdminKycApproval = true;
  bool maintenanceMode = false;
  bool enableDynamicQrReplayProtection = true;
  bool emergencySosBroadcast = true;
  double serviceRadiusKm = 10.0;
  int cancellationBufferHours = 2;
  String supportPhone = '+91 98765 43210';
  String supportEmail = 'transport-support@college.edu';
  bool allowRoundTripBooking = true;
  int defaultVehicleCapacity = 6;
  int concurrencyBookingLockTimeoutSec = 15;

  bool _isInitialized = false;

  void initializeFromCache() {
    try {
      final cachedJson = StorageService.getString(_storageKey);
      if (cachedJson != null) {
        final data = jsonDecode(cachedJson) as Map<String, dynamic>;
        _applySettings(data);
      }
    } catch (_) {}
    _isInitialized = true;
  }

  Future<Map<String, dynamic>?> fetchSettings() async {
    if (!_isInitialized) {
      initializeFromCache();
    }
    try {
      final res = await apiClient.get('/settings');
      if (res.data != null && res.data['success'] == true && res.data['data'] != null) {
        final data = res.data['data'] as Map<String, dynamic>;
        _applySettings(data);
        await StorageService.setString(_storageKey, jsonEncode(data));
        return data;
      }
    } catch (_) {}
    return null;
  }

  void _applySettings(Map<String, dynamic> data) {
    if (data.containsKey('requireAdminKycApproval')) {
      requireAdminKycApproval = data['requireAdminKycApproval'] == true;
    }
    if (data.containsKey('maintenanceMode')) {
      maintenanceMode = data['maintenanceMode'] == true;
    }
    if (data.containsKey('enableDynamicQrReplayProtection')) {
      enableDynamicQrReplayProtection = data['enableDynamicQrReplayProtection'] == true;
    }
    if (data.containsKey('emergencySosBroadcast')) {
      emergencySosBroadcast = data['emergencySosBroadcast'] == true;
    }
    if (data.containsKey('serviceRadiusKm')) {
      serviceRadiusKm = (data['serviceRadiusKm'] as num?)?.toDouble() ?? 10.0;
    }
    if (data.containsKey('cancellationBufferHours')) {
      cancellationBufferHours = (data['cancellationBufferHours'] as num?)?.toInt() ?? 2;
    }
    if (data.containsKey('supportPhone') && data['supportPhone'] != null) {
      supportPhone = data['supportPhone'].toString();
    }
    if (data.containsKey('supportEmail') && data['supportEmail'] != null) {
      supportEmail = data['supportEmail'].toString();
    }
    if (data.containsKey('allowRoundTripBooking')) {
      allowRoundTripBooking = data['allowRoundTripBooking'] == true;
    }
    if (data.containsKey('defaultVehicleCapacity')) {
      defaultVehicleCapacity = (data['defaultVehicleCapacity'] as num?)?.toInt() ?? 6;
    }
    if (data.containsKey('concurrencyBookingLockTimeoutSec')) {
      concurrencyBookingLockTimeoutSec = (data['concurrencyBookingLockTimeoutSec'] as num?)?.toInt() ?? 15;
    }
  }
}
