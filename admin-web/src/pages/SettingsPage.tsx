import React, { useEffect, useState } from 'react';
import {
  Settings as SettingsIcon,
  Save,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  Phone,
  Mail,
  Car,
  Clock,
  Radio,
  Sliders,
} from 'lucide-react';
import { api, getApiErrorMessage } from '../services/api';
import { useToast } from '../context/ToastContext';

export interface SystemSettings {
  serviceRadiusKm: number;
  cancellationBufferHours: number;
  requireAdminKycApproval: boolean;
  enableDynamicQrReplayProtection: boolean;
  emergencySosBroadcast: boolean;
  defaultVehicleCapacity: number;
  concurrencyBookingLockTimeoutSec: number;
  maintenanceMode: boolean;
  supportPhone: string;
  supportEmail: string;
  allowRoundTripBooking: boolean;
}

export const SettingsPage: React.FC = () => {
  const toast = useToast();
  const [settings, setSettings] = useState<SystemSettings>({
    serviceRadiusKm: 10.0,
    cancellationBufferHours: 2,
    requireAdminKycApproval: true,
    enableDynamicQrReplayProtection: true,
    emergencySosBroadcast: true,
    defaultVehicleCapacity: 6,
    concurrencyBookingLockTimeoutSec: 15,
    maintenanceMode: false,
    supportPhone: '+91 98765 43210',
    supportEmail: 'transport-support@college.edu',
    allowRoundTripBooking: true,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/admin/settings');
      if (res.data.success && res.data.data) {
        setSettings((prev) => ({ ...prev, ...res.data.data }));
      }
    } catch (err) {
      setError(getApiErrorMessage(err));
      toast.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      const res = await api.put('/admin/settings', settings);
      if (res.data.success) {
        setSettings((prev) => ({ ...prev, ...res.data.data }));
        toast.success('System configuration saved and synchronized successfully!');
      }
    } catch (err) {
      setError(getApiErrorMessage(err));
      toast.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[350px] text-slate-400 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
        <p className="text-sm font-medium">Loading system platform configuration from Supabase...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl pb-10">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <Sliders className="w-5 h-5 text-emerald-400" />
          <span>System & Transportation Platform Settings</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Configure institutional boundaries, anti-overbooking constraints, KYC requirements, and security policies
        </p>
      </div>

      {error && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6 text-xs">
        {/* Maintenance Mode Warning Section */}
        {settings.maintenanceMode && (
          <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-300 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm">System Maintenance Mode Active</p>
              <p className="text-xs text-amber-300/80 mt-0.5">
                New ride bookings are currently paused for students. Admin management functions remain fully accessible.
              </p>
            </div>
          </div>
        )}

        {/* 1. Service Area & Geospatial Boundary */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h3 className="font-bold text-sm text-white flex items-center gap-2">
            <SettingsIcon className="w-4 h-4 text-emerald-400" />
            Service Area & Geospatial Boundaries
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Default Service Radius (km from College Campus)
              </label>
              <input
                type="number"
                step="0.5"
                min="1"
                max="100"
                required
                value={settings.serviceRadiusKm}
                onChange={(e) => setSettings({ ...settings, serviceRadiusKm: parseFloat(e.target.value) || 10 })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-emerald-500 focus:outline-none"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Pickup points beyond this radius require explicit manual approval.
              </p>
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                Standard Cancellation Window (Hours Before Departure)
              </label>
              <input
                type="number"
                min="0"
                max="48"
                required
                value={settings.cancellationBufferHours}
                onChange={(e) => setSettings({ ...settings, cancellationBufferHours: parseInt(e.target.value) || 2 })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-emerald-500 focus:outline-none"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Students can cancel up to this threshold before scheduled trip departure for a full ride credit refund.
              </p>
            </div>
          </div>
        </div>

        {/* 2. Security, KYC & Concurrency Policies */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h3 className="font-bold text-sm text-white flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-emerald-400" />
            Identity Verification & Security Policies
          </h3>
          <div className="space-y-3">
            <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700 transition">
              <input
                type="checkbox"
                checked={settings.requireAdminKycApproval}
                onChange={(e) => setSettings({ ...settings, requireAdminKycApproval: e.target.checked })}
                className="rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
              />
              <div>
                <p className="font-semibold text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Mandatory Administrative KYC Verification
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  When enabled, students cannot purchase commuter subscription passes or book rides until their student ID is approved by admin.
                </p>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700 transition">
              <input
                type="checkbox"
                checked={settings.enableDynamicQrReplayProtection}
                onChange={(e) => setSettings({ ...settings, enableDynamicQrReplayProtection: e.target.checked })}
                className="rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
              />
              <div>
                <p className="font-semibold text-white">Strict Dynamic QR Anti-Replay Protection</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Daily travel passes expire immediately upon driver boarding scan and cannot be reused for the same trip.
                </p>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700 transition">
              <input
                type="checkbox"
                checked={settings.emergencySosBroadcast}
                onChange={(e) => setSettings({ ...settings, emergencySosBroadcast: e.target.checked })}
                className="rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
              />
              <div>
                <p className="font-semibold text-white flex items-center gap-1.5">
                  <Radio className="w-4 h-4 text-rose-400" />
                  Immediate Campus Security SOS Dispatch
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Broadcast live telemetry to campus police and admin notification channels when a student triggers an in-app SOS alert.
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* 3. Operational & Fleet Configuration */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h3 className="font-bold text-sm text-white flex items-center gap-2">
            <Car className="w-4 h-4 text-purple-400" />
            Operations, Fleet & Support Contacts
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Default Vehicle Seating Capacity
              </label>
              <input
                type="number"
                min="2"
                max="60"
                required
                value={settings.defaultVehicleCapacity}
                onChange={(e) => setSettings({ ...settings, defaultVehicleCapacity: parseInt(e.target.value) || 6 })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-emerald-500 focus:outline-none"
              />
              <p className="text-[10px] text-slate-500 mt-1">Default passenger seats allocated when enrolling new cabs.</p>
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Seat Lock Timeout (Seconds)
              </label>
              <input
                type="number"
                min="5"
                max="120"
                required
                value={settings.concurrencyBookingLockTimeoutSec}
                onChange={(e) => setSettings({ ...settings, concurrencyBookingLockTimeoutSec: parseInt(e.target.value) || 15 })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-emerald-500 focus:outline-none"
              />
              <p className="text-[10px] text-slate-500 mt-1">Prevents race conditions when multiple students select the final seat.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-slate-300 font-medium mb-1 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                Campus Helpline / Support Phone
              </label>
              <input
                type="text"
                required
                value={settings.supportPhone}
                onChange={(e) => setSettings({ ...settings, supportPhone: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-blue-400" />
                Transport Helpdesk Email
              </label>
              <input
                type="email"
                required
                value={settings.supportEmail}
                onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700 transition">
              <input
                type="checkbox"
                checked={settings.allowRoundTripBooking}
                onChange={(e) => setSettings({ ...settings, allowRoundTripBooking: e.target.checked })}
                className="rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
              />
              <div>
                <p className="font-semibold text-white">Enable Round-Trip (Evening Return) Bookings</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Allows students to reserve seats for both morning pickup and evening return shifts.
                </p>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-950 border border-amber-500/30 cursor-pointer hover:border-amber-500/50 transition bg-amber-500/5">
              <input
                type="checkbox"
                checked={settings.maintenanceMode}
                onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                className="rounded bg-slate-900 border-slate-700 text-amber-500 focus:ring-amber-500 w-4 h-4 cursor-pointer"
              />
              <div>
                <p className="font-semibold text-amber-300 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  Activate Platform Maintenance Mode
                </p>
                <p className="text-[11px] text-amber-300/70 mt-0.5">
                  Temporarily pause student ride bookings for system upgrades or holiday closures.
                </p>
              </div>
            </label>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-lg shadow-emerald-600/20 transition disabled:opacity-50 cursor-pointer"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving to Supabase...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Configuration to Supabase</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
