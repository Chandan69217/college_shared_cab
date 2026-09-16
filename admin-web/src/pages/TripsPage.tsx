import React, { useEffect, useState } from 'react';
import {
  Navigation,
  Car,
  ShieldCheck,
  CheckCircle2,
  Clock,
  MapPin,
  Plus,
  RefreshCw,
  Calendar,
  AlertCircle,
  Users,
} from 'lucide-react';
import { DataTable, Column } from '../components/DataTable';
import { Modal } from '../components/Modal';
import { api, getApiErrorMessage } from '../services/api';
import { Trip, Route, Vehicle, User } from '../types';

export const TripsPage: React.FC = () => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [activeLocations, setActiveLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Schedule Modal State
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<User[]>([]);

  const [formData, setFormData] = useState({
    route_id: '',
    vehicle_id: '',
    driver_id: '',
    trip_date: new Date().toISOString().split('T')[0],
    trip_type: 'MORNING_PICKUP',
    scheduled_departure_time: '07:30:00',
  });

  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const fetchTrips = async () => {
    setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  const fetchDependencies = async () => {
    try {
      const [rRes, vRes, dRes] = await Promise.all([
        api.get('/catalog/routes'),
        api.get('/admin/vehicles'),
        api.get('/admin/drivers'),
      ]);
      if (rRes.data.success) setRoutes(rRes.data.data || []);
      if (vRes.data.success) setVehicles(vRes.data.data || []);
      if (dRes.data.success) setDrivers(dRes.data.data || []);
    } catch (err) {
      console.error('Error loading schedule dependencies', err);
    }
  };

  useEffect(() => {
    fetchTrips();
    fetchDependencies();
    const interval = setInterval(fetchTrips, 15000); // 15s poll
    return () => clearInterval(interval);
  }, []);

  const handleOpenScheduleModal = () => {
    fetchDependencies();
    const defaultRoute = routes.length > 0 ? routes[0] : null;
    setFormData({
      route_id: defaultRoute?.id || '',
      vehicle_id: defaultRoute?.default_vehicle_id || (vehicles.length > 0 ? vehicles[0].id : ''),
      driver_id: defaultRoute?.default_driver_id || (drivers.length > 0 ? drivers[0].id : ''),
      trip_date: new Date().toISOString().split('T')[0],
      trip_type: 'MORNING_PICKUP',
      scheduled_departure_time: defaultRoute?.morning_departure_time || '07:30:00',
    });
    setModalError('');
    setScheduleModalOpen(true);
  };

  const handleRouteChange = (routeId: string) => {
    const selectedRoute = routes.find((r) => r.id === routeId);
    setFormData((prev) => ({
      ...prev,
      route_id: routeId,
      vehicle_id: selectedRoute?.default_vehicle_id || prev.vehicle_id,
      driver_id: selectedRoute?.default_driver_id || prev.driver_id,
      scheduled_departure_time:
        prev.trip_type === 'MORNING_PICKUP'
          ? selectedRoute?.morning_departure_time || prev.scheduled_departure_time
          : selectedRoute?.evening_departure_time || prev.scheduled_departure_time,
    }));
  };

  const handleCreateTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.route_id || !formData.vehicle_id || !formData.driver_id) {
      setModalError('Please select a route, vehicle, and operating driver.');
      return;
    }

    setModalLoading(true);
    setModalError('');
    try {
      const res = await api.post('/trips', formData);
      if (res.data.success) {
        setSuccessMessage('Trip scheduled successfully! Driver schedule updated.');
        setScheduleModalOpen(false);
        fetchTrips();
        setTimeout(() => setSuccessMessage(''), 4000);
      }
    } catch (err) {
      setModalError(getApiErrorMessage(err));
    } finally {
      setModalLoading(false);
    }
  };

  const columns: Column<Trip>[] = [
    {
      header: 'Trip Route & Schedule',
      accessor: (t) => (
        <div>
          <p className="font-semibold text-white">{t.route?.name || 'Assigned Route'}</p>
          <p className="text-[11px] text-slate-400 font-mono">
            {t.trip_date || 'Today'} • {t.scheduled_departure_time || '07:30 AM'} • {t.trip_type === 'MORNING_PICKUP' ? 'Morning Pickup' : 'Evening Drop'}
          </p>
        </div>
      ),
    },
    {
      header: 'Assigned Vehicle',
      accessor: (t) => (
        <div>
          <p className="font-bold text-white font-mono">{t.vehicle?.vehicle_number || 'Unassigned'}</p>
          {t.vehicle?.model && <p className="text-[11px] text-slate-400">{t.vehicle.model}</p>}
        </div>
      ),
    },
    {
      header: 'Assigned Driver',
      accessor: (t) => (
        <div>
          <p className="text-slate-200 font-medium">{t.driver?.full_name || 'Unassigned'}</p>
          {t.driver?.phone && <p className="text-[11px] text-slate-400">{t.driver.phone}</p>}
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
              style={{ width: `${Math.min(100, (t.booked_seats / (t.max_capacity || 1)) * 100)}%` }}
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Active Trips & Fleet Telemetry Monitor</h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time GPS vehicle tracking, live passenger boarding counters, and operational dispatch
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchTrips}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={handleOpenScheduleModal}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition shadow-lg shadow-emerald-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule Trip</span>
          </button>
        </div>
      </div>

      {successMessage && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Live Active Fleet Radar Box */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <h3 className="font-bold text-sm text-white">Active Vehicle Live Radar</h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">Telemetry Auto-Sync: 15s</span>
        </div>

        {activeLocations.length === 0 ? (
          <div className="text-center py-6 text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl">
            No live vehicles currently broadcasting GPS telemetry. Vehicles appear automatically when drivers start a trip.
          </div>
        ) : (
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
                  <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-400">
                    <MapPin className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400 font-medium">
                      Live GPS Active
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
        )}
      </div>

      <DataTable columns={columns} data={trips} />

      {/* Schedule Trip Modal */}
      <Modal
        isOpen={scheduleModalOpen}
        onClose={() => setScheduleModalOpen(false)}
        title="Schedule Trip & Assign Driver"
      >
        <form onSubmit={handleCreateTrip} className="space-y-4 text-xs">
          {modalError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{modalError}</span>
            </div>
          )}

          <div>
            <label className="block text-slate-300 font-medium mb-1">
              Select Transit Corridor / Route <span className="text-emerald-400">*</span>
            </label>
            <select
              value={formData.route_id}
              onChange={(e) => handleRouteChange(e.target.value)}
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-emerald-500"
            >
              <option value="">-- Choose Route --</option>
              {routes.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.code})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Assign Vehicle <span className="text-emerald-400">*</span>
              </label>
              <select
                value={formData.vehicle_id}
                onChange={(e) => setFormData({ ...formData, vehicle_id: e.target.value })}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-emerald-500"
              >
                <option value="">-- Choose Vehicle --</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.vehicle_number} ({v.model} • {v.seating_capacity} seats)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Assign Operating Driver <span className="text-emerald-400">*</span>
              </label>
              <select
                value={formData.driver_id}
                onChange={(e) => setFormData({ ...formData, driver_id: e.target.value })}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-emerald-500"
              >
                <option value="">-- Choose Driver --</option>
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.full_name} ({d.phone})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Trip Date <span className="text-emerald-400">*</span>
              </label>
              <input
                type="date"
                value={formData.trip_date}
                onChange={(e) => setFormData({ ...formData, trip_date: e.target.value })}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Trip Type <span className="text-emerald-400">*</span>
              </label>
              <select
                value={formData.trip_type}
                onChange={(e) => setFormData({ ...formData, trip_type: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-emerald-500"
              >
                <option value="MORNING_PICKUP">Morning Pickup</option>
                <option value="EVENING_DROP">Evening Drop</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Departure Time <span className="text-emerald-400">*</span>
              </label>
              <input
                type="time"
                step="1"
                value={formData.scheduled_departure_time}
                onChange={(e) => setFormData({ ...formData, scheduled_departure_time: e.target.value })}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="pt-3">
            <button
              type="submit"
              disabled={modalLoading}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition shadow-lg shadow-emerald-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {modalLoading ? 'Scheduling Trip...' : 'Create Scheduled Trip'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
