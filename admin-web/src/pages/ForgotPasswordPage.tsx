import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  KeyRound,
  UserCheck,
  Lock,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Eye,
  EyeOff,
  ShieldCheck,
  Smartphone,
  Mail,
} from 'lucide-react';
import { api, getApiErrorMessage } from '../services/api';

export const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();

  // Wizard Steps: 1 = Request OTP, 2 = Verify OTP, 3 = Reset Password, 4 = Success
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Form Fields
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // UI States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  // Resend Timer
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    let timer: any = null;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [cooldown]);

  // Step 1: Request OTP
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');

    const cleanIdentifier = identifier.trim();
    if (!cleanIdentifier) {
      setError('Please enter your registered email address or mobile number.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/forgot-password', {
        identifier: cleanIdentifier,
        role: 'ADMIN',
      });

      setInfoMessage(
        res.data?.message ||
          'If the account details are registered, a 6-digit verification code has been dispatched to both your registered email and mobile SMS.'
      );
      setCooldown(res.data?.data?.cooldownSeconds || 60);
      setStep(2);
    } catch (err: any) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');

    if (!otp.trim() || otp.trim().length !== 6) {
      setError('Please enter the complete 6-digit verification code.');
      return;
    }

    setLoading(true);
    try {
      const cleanIdentifier = identifier.trim();
      const res = await api.post('/auth/verify-otp', {
        identifier: cleanIdentifier,
        otp: otp.trim(),
        purpose: 'PASSWORD_RESET',
        role: 'ADMIN',
      });

      if (res.data?.success && res.data?.data?.resetToken) {
        setResetToken(res.data.data.resetToken);
        setStep(3);
      } else {
        setError('Verification failed. Please check the code and try again.');
      }
    } catch (err: any) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (cooldown > 0) return;
    setError('');
    setInfoMessage('');
    setLoading(true);

    try {
      const res = await api.post('/auth/forgot-password', {
        identifier: identifier.trim(),
        role: 'ADMIN',
      });
      setInfoMessage('A new 6-digit verification code has been dispatched to both your email and mobile phone.');
      setCooldown(res.data?.data?.cooldownSeconds || 60);
    } catch (err: any) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New password and confirm password do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/reset-password', {
        identifier: identifier.trim(),
        resetToken,
        newPassword,
        confirmPassword,
        role: 'ADMIN',
      });

      if (res.data?.success) {
        setStep(4);
      }
    } catch (err: any) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Brand header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-emerald-500 text-white rounded-2xl flex items-center justify-center font-bold text-xl mx-auto mb-3 shadow-lg shadow-emerald-500/30">
            <KeyRound className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">Account Recovery</h2>
          <p className="text-xs text-slate-400 mt-1">
            Secure password reset for CampusRide administrator portal
          </p>
        </div>

        {/* Step Indicator */}
        {step < 4 && (
          <div className="flex items-center justify-center gap-2 mb-6">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  step === s ? 'w-8 bg-emerald-500' : step > s ? 'w-4 bg-emerald-700' : 'w-4 bg-slate-800'
                }`}
              />
            ))}
          </div>
        )}

        {/* Error / Info messages */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {infoMessage && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{infoMessage}</span>
          </div>
        )}

        {/* STEP 1: Enter Unified Identifier (Email or Mobile Phone) */}
        {step === 1 && (
          <form onSubmit={handleRequestOtp} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Registered Email Address or Mobile Number
              </label>
              <div className="relative">
                <UserCheck className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  autoFocus
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g. admin@college.edu or 9876543210"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-xs"
                />
              </div>
              <div className="mt-2.5 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-[11px] text-slate-400 space-y-1.5">
                <p className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Dual-Channel OTP Delivery
                </p>
                <div className="flex items-center gap-2 text-slate-400 text-[10px]">
                  <Mail className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span>Dispatched to registered Email inbox</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400 text-[10px]">
                  <Smartphone className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span>Dispatched to registered Mobile via SMS</span>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 mt-6 disabled:opacity-50"
            >
              {loading ? 'Finding Account & Sending OTP...' : 'Send Verification OTP'}
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="text-center pt-2">
              <Link to="/login" className="text-xs text-slate-400 hover:text-emerald-400 inline-flex items-center gap-1">
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
              </Link>
            </div>
          </form>
        )}

        {/* STEP 2: Enter 6-Digit OTP */}
        {step === 2 && (
          <form onSubmit={handleVerifyOtp} className="space-y-4 text-xs">
            <div className="text-center mb-2">
              <p className="text-xs text-slate-300 font-semibold">Enter the 6-Digit Security Code</p>
              <p className="text-[11px] text-slate-400 mt-1">
                Dispatched to both registered email and SMS for <span className="text-emerald-400 font-medium">"{identifier}"</span>. Code expires in 5 minutes.
              </p>
            </div>

            <div>
              <input
                type="text"
                maxLength={6}
                autoFocus
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="• • • • • •"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 text-center text-white text-2xl font-mono tracking-widest focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={cooldown > 0 || loading}
                className="text-emerald-400 hover:underline disabled:opacity-50 disabled:no-underline flex items-center gap-1 text-[11px]"
              >
                <RefreshCw className="w-3 h-3" />
                {cooldown > 0 ? `Resend OTP in ${cooldown}s` : 'Resend Code'}
              </button>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-slate-400 hover:text-slate-200 text-[11px]"
              >
                Change identifier
              </button>
            </div>

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
            >
              {loading ? 'Verifying OTP...' : 'Verify & Proceed'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* STEP 3: Reset Password */}
        {step === 3 && (
          <form onSubmit={handleResetPassword} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-medium mb-1">New Password *</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-10 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Confirm New Password *</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
              <p className="font-semibold text-slate-300">Password Policy:</p>
              <p>• At least 8 characters</p>
              <p>• Requires uppercase, lowercase, numbers, and special characters</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
            >
              {loading ? 'Resetting Password...' : 'Update Password & Finish'}
              <ShieldCheck className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* STEP 4: Success */}
        {step === 4 && (
          <div className="text-center space-y-4 py-4">
            <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white">Password Reset Successful!</h3>
            <p className="text-xs text-slate-400">
              Your password has been updated securely. Please sign in with your new password to access the console.
            </p>
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 mt-4"
            >
              <span>Sign In to Admin Console</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
