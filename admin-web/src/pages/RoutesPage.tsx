import React, { useEffect, useState } from 'react';
import { Route as RouteIcon, Clock, Users, MapPin, Plus, CheckCircle } from 'lucide-react';
import { DataTable, Column } from '../components/DataTable';
import { Modal } from '../components/Modal';
import { api } from '../services/api';
import { Route } from '../types';

export const RoutesPage: React.FC = () => {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);

  const fetchRoutes = async () => {
    try {
      const res = await api.get('/catalog/routes');
      if (res.data.success) {
        setRoutes(res.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchRoutes();
  }, []);

  const columns: Column<Route>[] = [
    {
      header: 'Route Name & Code',
      accessor: (r) => (
        <div>
          <p className="font-semibold text-white">{r.name}</p>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-emerald-400 border border-slate-700">
            {r.code}
          </span>
        </div>
      ),
    },
    {
      header: 'Schedule Timings',
      accessor: (r) => (
        <div className="space-y-0.5 text-xs">
          <p className="text-slate-300">🌅 Morning: <span className="font-mono text-emerald-400 font-semibold">{r.morning_departure_time}</span></p>
          <p className="text-slate-400">🌆 Evening: <span className="font-mono text-blue-400 font-semibold">{r.evening_departure_time}</span></p>
        </div>
      ),
    },
    {
      header: 'Duration & Stops',
      accessor: (r) => (
        <div>
          <p className="text-slate-200 font-medium">{r.estimated_duration_mins} mins travel</p>
          <p className="text-[11px] text-slate-400">{r.stops?.length || 3} sequential stops</p>
        </div>
      ),
    },
    {
      header: 'Max Capacity',
      accessor: (r) => (
        <span className="font-semibold text-slate-200">
          {r.max_capacity} Seats
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: (r) => (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
          <CheckCircle className="w-3 h-3" /> Operational
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Route Management & Stop Sequencer</h2>
          <p className="text-xs text-slate-400 mt-1">
            Visual route stops, morning pickup sequence, evening drop order, and vehicle allocations
          </p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={routes}
        searchFilter={(r, q) => r.name.toLowerCase().includes(q) || r.code.toLowerCase().includes(q)}
        actions={(r) => (
          <button
            onClick={() => setSelectedRoute(r)}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition"
          >
            View Sequence
          </button>
        )}
      />

      <Modal
        isOpen={!!selectedRoute}
        onClose={() => setSelectedRoute(null)}
        title={`Route Stop Sequence: ${selectedRoute?.name}`}
      >
        {selectedRoute && (
          <div className="space-y-4 text-xs">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <p className="text-slate-400 mb-1">Route Description:</p>
              <p className="text-slate-200">{selectedRoute.description}</p>
            </div>

            <div className="space-y-3">
              <p className="font-semibold text-slate-300 uppercase tracking-wider text-[11px]">
                Ordered Pickup Sequence (Morning Direction):
              </p>
              {selectedRoute.stops?.map((stop: any, idx: number) => (
                <div
                  key={stop.id || idx}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs border border-emerald-500/30">
                      {stop.sequence_order || idx + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-white">{stop.pickup_point?.name || `Stop #${idx + 1}`}</p>
                      <p className="text-[10px] text-slate-400">{stop.pickup_point?.address || 'Designated boarding area'}</p>
                    </div>
                  </div>
                  <div className="text-right font-mono">
                    <span className="text-emerald-400 font-semibold">{stop.morning_pickup_time}</span>
                  </div>
                </div>
              ))}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300">
                <div className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-bold text-xs">
                  ★
                </div>
                <div>
                  <p className="font-bold text-white">Apex Campus Destination</p>
                  <p className="text-[10px] text-emerald-400">Estimated Arrival: 08:15 AM</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
