import React, { useState } from 'react';
import { Settings as SettingsIcon, Save, ShieldAlert, Key } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState({
    serviceRadiusKm: 10.0,
    concurrencyBookingLockTimeoutSec: 15,
    cancellationBufferHours: 2,
    enableDynamicQrReplayProtection: true,
    requireAdminKycApproval: true,
    defaultVehicleCapacity: 6,
    emergencySosBroadcast: true,
  });
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">System & Transportation Platform Settings</h2>
        <p className="text-xs text-slate-400 mt-1">
          Configure institutional boundaries, anti-overbooking constraints, and security policies
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6 text-xs">
        {/* Service area settings */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h3 className="font-bold text-sm text-white flex items-center gap-2">
            <SettingsIcon className="w-4 h-4 text-emerald-400" />
            Service Area & Geospatial Boundary
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Default Service Radius (km from College)
              </label>
              <input
                type="number"
                step="0.5"
                value={settings.serviceRadiusKm}
                onChange={(e) => setSettings({ ...settings, serviceRadiusKm: parseFloat(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-emerald-500"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Pickup points beyond this radius require explicit manual approval.
              </p>
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Standard Cancellation Deadline (Hours)
              </label>
              <input
                type="number"
                value={settings.cancellationBufferHours}
                onChange={(e) => setSettings({ ...settings, cancellationBufferHours: parseInt(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Security & Concurrency Policy */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h3 className="font-bold text-sm text-white flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-emerald-400" />
            Anti-Overbooking & Cryptographic Pass Policies
          </h3>
          <div className="space-y-3">
            <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.enableDynamicQrReplayProtection}
                onChange={(e) => setSettings({ ...settings, enableDynamicQrReplayProtection: e.target.checked })}
                className="rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-emerald-500"
              />
              <div>
                <p className="font-semibold text-white">Strict Dynamic QR Anti-Replay Protection</p>
                <p className="text-[11px] text-slate-400">
                  Daily passes expire immediately upon driver boarding scan and cannot be reused for the same trip.
                </p>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.requireAdminKycApproval}
                onChange={(e) => setSettings({ ...settings, requireAdminKycApproval: e.target.checked })}
                className="rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-emerald-500"
              />
              <div>
                <p className="font-semibold text-white">Mandatory Administrative KYC Verification</p>
                <p className="text-[11px] text-slate-400">
                  Students must have an approved student ID card before booking rides.
                </p>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.emergencySosBroadcast}
                onChange={(e) => setSettings({ ...settings, emergencySosBroadcast: e.target.checked })}
                className="rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-emerald-500"
              />
              <div>
                <p className="font-semibold text-white">Immediate Campus Security SOS Dispatch</p>
                <p className="text-[11px] text-slate-400">
                  Broadcast live telemetry to campus police when student triggers in-app SOS alert.
                </p>
              </div>
            </label>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-lg shadow-emerald-600/20 transition"
          >
            <Save className="w-4 h-4" /> Save Configuration
          </button>
          {saved && (
            <span className="text-xs font-semibold text-emerald-400 animate-fadeIn">
              ✓ Platform settings saved successfully!
            </span>
          )}
        </div>
      </form>
    </div>
  );
};
