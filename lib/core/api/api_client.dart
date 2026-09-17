import 'package:dio/dio.dart';
import '../constants/app_constants.dart';
import '../storage/storage_service.dart';

class ApiClient {
  late final Dio _dio;

  ApiClient() {
    _dio = Dio(
      BaseOptions(
        baseUrl: AppConstants.apiBaseUrl,
        connectTimeout: const Duration(seconds: 10),
        receiveTimeout: const Duration(seconds: 10),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ),
    );

    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) {
          final token = StorageService.getToken();
          if (token != null && token.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          return handler.next(options);
        },
        onError: (DioException error, handler) {
          // Centralized error interceptor
          return handler.next(error);
        },
      ),
    );
  }

  Dio get dio => _dio;

  Future<Response> get(String path, {Map<String, dynamic>? queryParameters}) async {
    return _dio.get(path, queryParameters: queryParameters);
  }

  Future<Response> post(String path, {dynamic data}) async {
    return _dio.post(path, data: data);
  }

  Future<Response> patch(String path, {dynamic data}) async {
    return _dio.patch(path, data: data);
  }

  Future<Response> put(String path, {dynamic data}) async {
    return _dio.put(path, data: data);
  }

  Future<Response> delete(String path, {dynamic data}) async {
    return _dio.delete(path, data: data);
  }

  static final Map<String, String> _codeToMessage = {
    // Auth
    'AUTH_INVALID_CREDENTIALS': 'Invalid email/phone or password. Please check your credentials and try again.',
    'INVALID_CREDENTIALS': 'Invalid email/phone or password. Please check your credentials and try again.',
    'AUTH_USER_NOT_FOUND': 'Account not found. We couldn\'t find an account with the credentials provided.',
    'USER_NOT_REGISTERED': 'Account not found. We couldn\'t find an account with the credentials provided.',
    'ACCOUNT_NOT_FOUND': 'Account not found. We couldn\'t find an account with the credentials provided.',
    'AUTH_SESSION_EXPIRED': 'Your session has expired. Please sign in again to continue.',
    'AUTH_UNAUTHORIZED': 'Authentication required. Please sign in to access this feature.',
    'AUTH_FORBIDDEN': 'Access restricted. You do not have permission to perform this action.',
    'AUTH_ROLE_MISMATCH': 'Access restricted. You are not authorized to use this application.',
    'ROLE_MISMATCH': 'Access restricted. You are not authorized to use this application.',
    'AUTH_ACCOUNT_SUSPENDED': 'Account suspended. Please contact campus administration for assistance.',
    'ACCOUNT_SUSPENDED': 'Account suspended. Please contact campus administration for assistance.',
    'AUTH_ACCOUNT_DEACTIVATED': 'Account deactivated. This account is no longer active.',
    'ACCOUNT_DEACTIVATED': 'Account deactivated. This account is no longer active.',
    'AUTH_ACCOUNT_LOCKED': 'Account locked due to security policy. Please contact campus administration.',
    'ACCOUNT_LOCKED': 'Account locked due to security policy. Please contact campus administration.',
    'AUTH_RATE_LIMIT_EXCEEDED': 'Too many attempts. Please wait 15 minutes before trying again.',
    'OTP_INVALID': 'Invalid OTP code. Please check the code and try again.',
    'OTP_EXPIRED': 'OTP has expired. Please request a new verification code.',
    'OTP_RATE_LIMITED': 'Too many verification attempts. Please wait a moment before requesting another code.',

    // Validation
    'VALIDATION_ERROR': 'Please verify the submitted details and ensure all required fields are filled.',
    'VALIDATION_REQUIRED_FIELD': 'Please fill in all required fields.',
    'VALIDATION_INVALID_DATA': 'The submitted data is invalid. Please review your input.',
    'INVALID_ID_FORMAT': 'Invalid identifier format.',
    'DUPLICATE_RESOURCE': 'A record with this information already exists in the system.',

    // Operational & Catalog
    'COLLEGE_NOT_FOUND': 'The specified college institution was not found.',
    'ROUTE_NOT_FOUND': 'Selected shuttle route could not be found.',
    'PICKUP_POINT_NOT_FOUND': 'Selected pickup point is invalid or not available.',
    'INVALID_PICKUP_STOP': 'This pickup point does not belong to the selected route.',
    'INVALID_DROP_STOP': 'This drop point is not valid for the selected route.',
    'INVALID_STOP_SEQUENCE': 'Drop point must be located after the pickup point along the route.',
    'PICKUP_STOP_ALREADY_PASSED': 'All available cabs have already passed this pickup point. Please select another available pickup point.',
    'VEHICLE_NOT_FOUND': 'The specified vehicle record was not found.',
    'DRIVER_NOT_FOUND': 'The specified driver record was not found.',
    'DRIVER_UNAVAILABLE': 'No driver is currently available for this trip.',
    'UNAUTHORIZED_DRIVER': 'You are not authorized as the assigned driver for this trip.',
    'PROTECTED_RECORD_REFERENCE': 'This record cannot be permanently deleted because active operational records are linked to it.',

    // Booking & Cab Availability
    'NO_CAB_AVAILABLE': 'No eligible cab is currently available for your selected route and pickup point.',
    'ALL_CABS_PASSED_STOP': 'All available cabs have already passed this pickup point. Please try another pickup point or try again later.',
    'ALL_CABS_FULL': 'The selected cab is full. All cabs on this route have reached maximum capacity.',
    'BOOKING_FULL': 'Sorry, this trip is now fully booked.',
    'BOOKING_NOT_FOUND': 'Booking record not found.',
    'BOOKING_ALREADY_EXISTS': 'You already have a confirmed booking for this trip.',
    'ALREADY_BOOKED': 'You already have a confirmed booking for this trip.',
    'BOOKING_CANCELLED': 'This booking has been cancelled.',
    'CANCELLATION_UNAVAILABLE': 'This booking can no longer be cancelled according to the cancellation policy.',

    // Trips
    'TRIP_NOT_FOUND': 'Scheduled trip record not found.',
    'TRIP_UNAVAILABLE': 'This trip is not currently open for bookings.',
    'TRIP_NOT_ACTIVE': 'GPS updates are only active during trips that are currently in progress.',
    'TRIP_ALREADY_COMPLETED': 'This trip has already concluded.',
    'NO_TRIP_ASSIGNED': 'You do not have a trip assigned for this time.',

    // Pass & QR
    'PASS_NOT_FOUND': 'Daily travel pass not found.',
    'PASS_INACTIVE': 'This pass is no longer active for travel.',
    'PASS_EXPIRED': 'This travel pass has expired. Please refresh your pass.',
    'PASS_INVALID': 'Invalid pass. This travel pass could not be verified.',
    'PASS_ALREADY_USED': 'Pass already used. This travel pass has already been used for boarding.',
    'QR_INVALID': 'Invalid or counterfeit QR code signature.',
    'QR_EXPIRED': 'QR code expired. Please refresh your daily pass.',
    'QR_ALREADY_USED': 'REPLAY DETECTED: This pass has already been scanned for boarding.',
    'QR_WRONG_TRIP': 'This pass is for a different scheduled trip.',

    // KYC
    'STUDENT_NOT_VERIFIED': 'Student account is pending administrative verification. Booking is disabled.',
    'KYC_REQUIRED': 'Student KYC is pending administrative approval. Subscription purchase is only allowed once your ID documents are verified.',
    'VERIFICATION_PENDING': 'Your student verification is currently under review by campus administrators.',
    'VERIFICATION_REJECTED': 'Your student verification was not approved. Please update your ID documents.',

    // Subscriptions
    'PLAN_NOT_FOUND': 'Subscription plan not found.',
    'PLAN_INACTIVE': 'This subscription plan is not currently available.',
    'SUBSCRIPTION_REQUIRED': 'Active subscription required. Please purchase a plan before booking a ride.',
    'NO_ACTIVE_SUBSCRIPTION': 'No active subscription with available ride credits found. Please purchase a plan.',
    'SUBSCRIPTION_EXPIRED': 'Your subscription has expired. Please renew your plan.',
    'NO_RIDES_REMAINING': 'You have used all ride credits in your subscription plan. Please renew to continue.',

    // Payments
    'PAYMENT_NOT_FOUND': 'Payment record not found.',
    'PAYMENT_FAILED': 'Payment transaction could not be completed. Please try again.',
    'PAYMENT_REQUIRED': 'Payment is required to activate your transportation plan.',
    'PAYMENT_NOT_VERIFIED': 'Payment verification failed. Please check your transaction details.',
    'PAYMENT_ALREADY_PROCESSED': 'This payment transaction has already been processed.',
    'INVALID_PAYMENT_PAYLOAD': 'Payment transaction information is invalid or incomplete.',

    // GPS
    'GPS_PERMISSION_REQUIRED': 'Location permission is required to start live trip tracking.',
    'GPS_UNAVAILABLE': 'GPS location service is unavailable on your device.',
    'INVALID_COORDINATES': 'Invalid GPS coordinates received.',
    'SUSPICIOUS_GPS_SPEED': 'GPS update rejected: speed exceeds realistic vehicle limits.',
    'SPOOFING_DETECTED': 'GPS update rejected: impossible coordinate jump detected.',
    'LOCATION_UPDATE_FAILED': 'Unable to update vehicle location.',

    // System
    'MAINTENANCE_MODE': 'Transportation booking is temporarily suspended for scheduled platform maintenance.',
    'DATABASE_UNAVAILABLE': 'Database service is temporarily unavailable. Please try again in a moment.',
    'SERVER_ERROR': 'Something went wrong. We couldn\'t complete your request right now. Please try again later.',
    'INTERNAL_ERROR': 'An unexpected error occurred. Please try again later.',
    'NETWORK_ERROR': 'Connection problem. We couldn\'t connect to the server. Please check your internet connection and try again.',
    'TIMEOUT': 'Request timed out. The server took too long to respond. Please try again.',
  };

  /// Extracts user-friendly error messages from DioExceptions or other errors
  static String getErrorMessage(dynamic error) {
    if (error is DioException) {
      if (error.response?.data is Map) {
        final data = error.response!.data as Map;
        final errorCode = data['error'] is Map ? data['error']['code'] : data['error'];
        if (errorCode != null && _codeToMessage.containsKey(errorCode.toString())) {
          return _codeToMessage[errorCode.toString()]!;
        }
        if (data['message'] != null && data['message'].toString().trim().isNotEmpty) {
          final msg = data['message'].toString();
          // Filter out raw Postgres/Postgrest errors if leaked
          if (!msg.contains('PostgrestException') && !msg.contains('violates foreign key') && !msg.contains('syntax error')) {
            return msg;
          }
        }
        if (data['error'] is Map && data['error']['message'] != null) {
          return data['error']['message'].toString();
        }
        if (data['error'] is String && data['error'].toString().trim().isNotEmpty) {
          final errStr = data['error'].toString();
          if (_codeToMessage.containsKey(errStr)) {
            return _codeToMessage[errStr]!;
          }
          if (!errStr.contains('PostgrestException') && !errStr.contains('violates') && !errStr.contains('Error:')) {
            return errStr;
          }
        }
      }

      switch (error.type) {
        case DioExceptionType.connectionTimeout:
        case DioExceptionType.sendTimeout:
        case DioExceptionType.receiveTimeout:
          return 'Request timed out. The server took too long to respond. Please try again.';
        case DioExceptionType.connectionError:
          return 'Connection problem. We couldn\'t connect to the server. Please check your internet connection and try again.';
        case DioExceptionType.badResponse:
          final statusCode = error.response?.statusCode;
          if (statusCode == 400) return 'Invalid request. Please verify your details.';
          if (statusCode == 401) return 'Invalid email/phone or password. Please check your credentials and try again.';
          if (statusCode == 403) return 'Access restricted. You do not have permission to perform this action.';
          if (statusCode == 404) return 'Requested resource was not found.';
          if (statusCode == 409) return 'A conflicting record already exists in the system.';
          if (statusCode == 422) return 'Validation failed on the provided data.';
          if (statusCode == 429) return 'Too many attempts. Please wait a moment and try again.';
          if (statusCode != null && statusCode >= 500) {
            return 'Something went wrong on our end. Please try again later.';
          }
          return 'Request failed. Please try again.';
        case DioExceptionType.cancel:
          return 'Request was cancelled.';
        default:
          return 'Connection problem. We couldn\'t connect to the server. Please check your internet connection and try again.';
      }
    }

    if (error != null) {
      final str = error.toString();
      if (str.startsWith('Exception: ')) {
        final clean = str.substring(11);
        if (_codeToMessage.containsKey(clean)) {
          return _codeToMessage[clean]!;
        }
        return clean;
      }
      if (_codeToMessage.containsKey(str)) {
        return _codeToMessage[str]!;
      }
      if (!str.contains('PostgrestException') && !str.contains('SocketException') && !str.contains('HttpException')) {
        return str;
      }
    }

    return 'Something went wrong. We couldn\'t complete your request right now. Please try again later.';
  }
}

final apiClient = ApiClient();


