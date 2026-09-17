class AppMessages {
  // Authentication & Session
  static const String loginSuccess = 'Signed in successfully.';
  static const String registrationSuccess = 'Registration submitted successfully. Welcome to CampusRide!';
  static const String sessionExpired = 'Your session has expired. Please sign in again.';
  static const String logoutSuccess = 'Signed out successfully.';
  static const String invalidCredentials = 'Invalid email/phone or password. Please check your credentials.';
  static const String userNotFound = 'No account found with these credentials.';
  static const String accountSuspended = 'Your account is suspended. Please contact campus administration.';
  static const String accountDeactivated = 'Your account is deactivated. Please contact support.';
  static const String otpSent = 'Verification OTP sent to your registered contact.';
  static const String otpVerified = 'Verification code confirmed successfully.';
  static const String passwordResetSuccess = 'Password reset successfully. Please sign in with your new password.';

  // Bookings & Rides
  static const String bookingConfirmed = 'Ride booked successfully. Your travel pass is ready.';
  static const String bookingCancelled = 'Booking cancelled successfully. 1 ride credit refunded.';
  static const String noCabAvailable = 'No eligible cab is currently available for your selected pickup point.';
  static const String pickupPointPassed = 'Available cabs have already passed this pickup point. Please select another stop.';
  static const String cabFull = 'The selected cab is full. All cabs on this route have reached maximum capacity.';
  static const String alreadyBooked = 'You already have an active booking for this trip.';
  static const String kycRequiredToBook = 'Your student verification is pending. Booking will be enabled once approved.';
  static const String subscriptionRequiredToBook = 'Active subscription required. Please purchase ride credits to book.';

  // Trips & Driver Operations
  static const String tripStarted = 'Trip started successfully. Live location sharing is now active.';
  static const String tripCompleted = 'Trip completed successfully. Have a great day!';
  static const String tripDelayReported = 'Trip delay reported. Booked passengers have been notified.';
  static const String gpsPermissionRequired = 'Location permission is required to start live trip tracking.';
  static const String gpsServiceDisabled = 'Please enable device GPS / Location services to start the trip.';
  static const String boardingConfirmed = 'Passenger boarding verified successfully.';
  static const String passengerNoShow = 'Passenger marked as No-Show.';

  // QR Scanning & Passes
  static const String qrPassValid = 'Passenger verified successfully. Boarding approved.';
  static const String qrPassInvalid = 'Invalid QR code. Please scan the passenger\'s active travel pass.';
  static const String qrPassExpired = 'Travel pass expired. Student must refresh their pass.';
  static const String qrPassAlreadyUsed = 'REPLAY DETECTED: This pass has already been used for boarding.';
  static const String qrWrongTrip = 'This travel pass is for a different scheduled trip.';

  // Payments & Subscriptions
  static const String paymentSuccess = 'Payment confirmed! Your subscription is now active.';
  static const String paymentFailed = 'Payment could not be completed. Please try again.';
  static const String paymentVerifying = 'Verifying your payment transaction. Please wait...';

  // Profile & Support
  static const String profileUpdated = 'Profile updated successfully.';
  static const String kycSubmitted = 'Student ID documents submitted for verification.';
  static const String complaintCreated = 'Support ticket submitted successfully. We will respond within 24 hours.';

  // General & Network
  static const String networkError = 'No internet connection. Please check your connection and try again.';
  static const String serverError = 'Something went wrong on the server. Please try again later.';
  static const String timeoutError = 'Request timed out. Please check your connection and try again.';
  static const String copiedToClipboard = 'Copied to clipboard.';
}
