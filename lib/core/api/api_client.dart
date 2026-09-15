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
    'VALIDATION_ERROR': 'Please check the entered fields and ensure all information is valid.',
    'INVALID_CREDENTIALS': 'Invalid email/phone or password. Please check your credentials and try again.',
    'USER_NOT_REGISTERED': 'Account not found. We couldn\'t find an account with the credentials you entered. Please check your details or create an account.',
    'ACCOUNT_NOT_FOUND': 'Account not found. We couldn\'t find an account with the credentials you entered. Please check your details or create an account.',
    'ACCOUNT_SUSPENDED': 'Account suspended. Your account is currently suspended. Please contact support for assistance.',
    'ACCOUNT_DEACTIVATED': 'Account deactivated. This account is no longer active. Please contact support.',
    'ACCOUNT_LOCKED': 'Account locked. Please contact administration for assistance.',
    'ROLE_MISMATCH': 'Access restricted. This account is not authorized for this application.',
    'VERIFICATION_PENDING': 'Verification pending. Your student verification is still under review.',
    'VERIFICATION_REJECTED': 'Verification rejected. Your student verification was not approved. Please review your details and contact support.',
    'OTP_INVALID': 'Invalid OTP. The OTP you entered is incorrect. Please try again.',
    'OTP_EXPIRED': 'OTP expired. This OTP has expired. Please request a new OTP.',
    'OTP_RATE_LIMITED': 'Too many attempts. Please wait before requesting or entering another OTP.',
    'AUTH_RATE_LIMIT_EXCEEDED': 'Too many login attempts. Please wait 15 minutes and try again.',
    'SUBSCRIPTION_REQUIRED': 'Active subscription required. Please purchase or activate a transportation plan before booking a ride.',
    'SUBSCRIPTION_EXPIRED': 'Subscription expired. Your transportation subscription has expired. Please renew your plan to continue.',
    'PAYMENT_REQUIRED': 'Payment required. Please complete the payment to activate your subscription.',
    'BOOKING_FULL': 'Ride fully booked. There are no seats available on this trip. Please select another trip.',
    'ALREADY_BOOKED': 'Already booked. You already have a booking for this trip.',
    'CANCELLATION_UNAVAILABLE': 'Cancellation unavailable. This booking can no longer be cancelled according to the cancellation policy.',
    'INVALID_ROUTE': 'Invalid route. This route is not available for your selected booking.',
    'PASS_INVALID': 'Invalid pass. This travel pass could not be verified.',
    'PASS_EXPIRED': 'Pass expired. This travel pass has expired. Please use a valid pass.',
    'PASS_ALREADY_USED': 'Pass already used. This travel pass has already been used for boarding.',
    'NO_TRIP_ASSIGNED': 'No trip assigned. You do not have a trip assigned for this time.',
    'NETWORK_ERROR': 'Connection problem. We couldn\'t connect to the server. Please check your internet connection and try again.',
    'TIMEOUT': 'Request timed out. The server took too long to respond. Please try again.',
    'INTERNAL_SERVER_ERROR': 'Something went wrong. We couldn\'t complete your request right now. Please try again later.',
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
          return data['message'].toString();
        }
        if (data['error'] is Map && data['error']['message'] != null) {
          return data['error']['message'].toString();
        }
        if (data['error'] is String && data['error'].toString().trim().isNotEmpty) {
          return data['error'].toString();
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
            return 'Something went wrong. We couldn\'t complete your request right now. Please try again later.';
          }
          return 'Request failed with status $statusCode.';
        case DioExceptionType.cancel:
          return 'Request was cancelled.';
        default:
          return 'Connection problem. We couldn\'t connect to the server. Please check your internet connection and try again.';
      }
    }

    if (error != null) {
      final str = error.toString();
      if (str.startsWith('Exception: ')) {
        return str.substring(11);
      }
      return str;
    }

    return 'Something went wrong. We couldn\'t complete your request right now. Please try again later.';
  }
}

final apiClient = ApiClient();


