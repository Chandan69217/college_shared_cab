import React, { useEffect, useState } from 'react';
import { BarChart3, Download, TrendingUp, Users, Car, ShieldCheck } from 'lucide-react';
import { api } from '../services/api';

export const ReportsPage: React.FC = () => {
  const [reportData, setReportData] = useState<any>(null);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await api.get('/reports');
        if (res.data.success) {
          setReportData(res.data.data);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchReports();
  }, []);

  const handleExportCsv = (reportName: string) => {
    alert(`Exporting ${reportName} dataset as CSV for institutional compliance audit.`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Institutional Reports & Compliance Analytics</h2>
          <p className="text-xs text-slate-400 mt-1">
            Auditable metrics for student transportation, fuel efficiency, driver performance, and billing ledger
          </p>
        </div>
      </div>

      {/* Reports Export Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between">
          <div>
            <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 w-fit mb-3">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-white">Student Ridership Report</h3>
            <p className="text-xs text-slate-400 mt-1">
              Active student commuters, verification logs, and attendance ratios.
            </p>
          </div>
          <button
            onClick={() => handleExportCsv('Student Ridership')}
            className="mt-4 flex items-center justify-center gap-2 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between">
          <div>
            <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 w-fit mb-3">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-white">Revenue & Subscription Ledger</h3>
            <p className="text-xs text-slate-400 mt-1">
              Plan collections, UPI reconciliation, and gateway transaction IDs.
            </p>
          </div>
          <button
            onClick={() => handleExportCsv('Revenue Ledger')}
            className="mt-4 flex items-center justify-center gap-2 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between">
          <div>
            <div className="p-2.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20 w-fit mb-3">
              <Car className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-white">Vehicle Fleet Utilization</h3>
            <p className="text-xs text-slate-400 mt-1">
              Kilometers traveled, fitness certification expiry, and occupancy load.
            </p>
          </div>
          <button
            onClick={() => handleExportCsv('Fleet Utilization')}
            className="mt-4 flex items-center justify-center gap-2 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between">
          <div>
            <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 w-fit mb-3">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-white">Driver Safety Scorecard</h3>
            <p className="text-xs text-slate-400 mt-1">
              Completed trips, student rating averages, and safety compliance records.
            </p>
          </div>
          <button
            onClick={() => handleExportCsv('Driver Safety Scorecard')}
            className="mt-4 flex items-center justify-center gap-2 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* Driver Scorecard Table */}
      {reportData?.driverPerformance && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <h3 className="font-bold text-sm text-white mb-3">Driver Safety & Operations Scorecard</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase font-semibold">
                <tr>
                  <th className="px-4 py-3">Driver Name</th>
                  <th className="px-4 py-3">License Number</th>
                  <th className="px-4 py-3">Completed Trips</th>
                  <th className="px-4 py-3">Rating Score</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {reportData.driverPerformance.map((d: any) => (
                  <tr key={d.driverId} className="hover:bg-slate-800/40">
                    <td className="px-4 py-3 font-semibold text-white">{d.name}</td>
                    <td className="px-4 py-3 font-mono text-slate-400">{d.license}</td>
                    <td className="px-4 py-3 font-mono font-bold text-slate-200">{d.tripsCompleted}</td>
                    <td className="px-4 py-3 font-bold text-amber-400">★ {d.rating} / 5.0</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {d.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
