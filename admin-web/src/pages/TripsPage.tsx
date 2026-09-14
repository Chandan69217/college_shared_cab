import React, { useEffect, useState } from 'react';
import { Navigation, Car, ShieldCheck, CheckCircle, Clock, MapPin } from 'lucide-react';
import { DataTable, Column } from '../components/DataTable';
import { api } from '../services/api';
import { Trip } from '../types';

export const TripsPage: React.FC = () => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [activeLocations, setActiveLocations] = useState<any[]>([]);

  const fetchTrips = async () => {
    try {
      const res = await api.get('/trips');
      if (res.data.success) {
        setTrips(res.data.data);
      }
      const locRes = await api.get('/trips/active-locations');
      if (locRes.data.success) {
        setActiveLocations(locRes.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchTrips();
    const interval = setInterval(fetchTrips, 15000); // 15s poll
    return () => clearInterval(interval);
  }, []);

  const columns: Column<Trip>[] = [
    {
      header: 'Trip Route & Schedule',
      accessor: (t) => (
        <div>
          <p className="font-semibold text-white">{t.route?.name || 'Route 1: Central Metro Express'}</p>
          <p className="text-[11px] text-slate-400 font-mono">
            {t.trip_date} • {t.scheduled_departure_time}
          </p>
        </div>
      ),
    },
    {
      header: 'Assigned Vehicle',
      accessor: (t) => (
        <div>
          <p className="font-bold text-white font-mono">{t.vehicle?.vehicle_number || 'UP16-CZ-8821'}</p>
          <p className="text-[11px] text-slate-400">{t.vehicle?.model || 'Maruti Ertiga'}</p>
        </div>
      ),
    },
    {
      header: 'Assigned Driver',
      accessor: (t) => (
        <div>
          <p className="text-slate-200 font-medium">{t.driver?.full_name || 'Rajesh Kumar'}</p>
          <p className="text-[11px] text-slate-400">{t.driver?.phone || '+919999900002'}</p>
        </div>
      ),
    },
    {
      header: 'Live Occupancy',
      accessor: (t) => (
        <div className="flex items-center gap-2">
          <div className="w-20 bg-slate-800 rounded-full h-2 overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full"
              style={{ width: `${(t.booked_seats / t.max_capacity) * 100}%` }}
            />
          </div>
          <span className="text-xs font-mono font-semibold text-white">
            {t.booked_seats}/{t.max_capacity} Seats
          </span>
        </div>
      ),
    },
    {
      header: 'Boarded Pax',
      accessor: (t) => (
        <span className="font-semibold text-emerald-400 font-mono">
          {t.boarded_passengers || 0} Boarded
        </span>
      ),
    },
    {
      header: 'Trip Status',
      accessor: (t) => {
        const badges = {
          SCHEDULED: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
          IN_PROGRESS: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 animate-pulse',
          COMPLETED: 'bg-slate-800 text-slate-300 border-slate-700',
          CANCELLED: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
        };
        return (
          <span
            className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
              badges[t.status as keyof typeof badges] || badges.SCHEDULED
            }`}
          >
            {t.status}
          </span>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Active Trips & Fleet Telemetry Monitor</h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time GPS vehicle tracking, live passenger boarding counters, and operational dispatch
          </p>
        </div>
      </div>

      {/* Live Active Fleet Radar Box */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <h3 className="font-bold text-sm text-white">Active Vehicle Live Radar</h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">Telemetry Auto-Sync: 15s</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeLocations.map((veh: any) => (
            <div
              key={veh.tripId}
              className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex items-start justify-between"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-white text-sm">{veh.vehicle?.number}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20">
                    {veh.tripStatus}
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1 font-medium">{veh.routeName}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Driver: {veh.driver?.name}</p>
                <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                  <MapPin className="w-3 h-3 text-emerald-400" />
                  <span>
                    {veh.latitude.toFixed(4)}, {veh.longitude.toFixed(4)}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-emerald-400">
                  {veh.bookedSeats}/{veh.maxCapacity} Booked
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <DataTable columns={columns} data={trips} />
    </div>
  );
};
