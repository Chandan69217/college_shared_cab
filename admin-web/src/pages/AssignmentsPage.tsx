import React, { useEffect, useState } from 'react';
import {
  GitFork,
  Car,
  ShieldCheck,
  Route as RouteIcon,
  CheckCircle2,
  AlertCircle,
  Users,
  Clock,
  ArrowRight,
  RefreshCw,
  Edit3,
} from 'lucide-react';
import { DataTable, Column } from '../components/DataTable';
import { Modal } from '../components/Modal';
import { StatCard } from '../components/StatCard';
import { api, getApiErrorMessage } from '../services/api';
import { useToast } from '../context/ToastContext';
import { RouteAssignment, Vehicle, User } from '../types';

export const AssignmentsPage: React.FC = () => {
  const toast = useToast();
  const [routes, setRoutes] = useState<RouteAssignment[]>([]);
  const [availableVehicles, setAvailableVehicles] = useState<Vehicle[]>([]);
  const [availableDrivers, setAvailableDrivers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [reassignModalOpen, setReassignModalOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<RouteAssignment | null>(null);

  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [selectedDriverId, setSelectedDriverId] = useState<string>('');
  const [actionLoading, setActionLoading] = useState(false);
  const [modalError, setModalError] = useState('');

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/assignments');
      if (res.data.success) {
        const mappedRoutes: RouteAssignment[] = (res.data.data.routes || []).map((r: RouteAssignment) => ({
          ...r,
          id: r.routeId,
        }));
        setRoutes(mappedRoutes);
        setAvailableVehicles(res.data.data.availableVehicles || []);
        setAvailableDrivers(res.data.data.availableDrivers || []);
      }
    } catch (err: any) {
      toast.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  const openReassignModal = (assignment: RouteAssignment) => {
    setSelectedAssignment(assignment);
    setSelectedVehicleId(assignment.assignedVehicle?.id || '');
    setSelectedDriverId(assignment.assignedDriver?.id || '');
    setModalError('');
    setReassignModalOpen(true);
  };

  const handleSaveAllocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignment) return;

    setActionLoading(true);
    setModalError('');
    try {
      const res = await api.post('/admin/assignments/route-allocation', {
        route_id: selectedAssignment.routeId,
        default_vehicle_id: selectedVehicleId || null,
        default_driver_id: selectedDriverId || null,
      });

      if (res.data.success) {
        toast.success(`Resource allocation updated for ${selectedAssignment.routeName}.`);
        setReassignModalOpen(false);
        fetchAssignments();
      }
    } catch (err: any) {
      toast.error(err);
      setModalError(getApiErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  const fullyAssignedCount = routes.filter((r) => r.assignedVehicle && r.assignedDriver).length;
  const unassignedCount = routes.length - fullyAssignedCount;

  const columns: Column<RouteAssignment>[] = [
    {
      header: 'Route Details',
      accessor: (r) => (
        <div>
          <p className="font-bold text-white text-xs">{r.routeName}</p>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-emerald-400 border border-slate-700">
            {r.routeCode}
          </span>
        </div>
      ),
    },
    {
      header: 'Assigned Vehicle',
      accessor: (r) =>
        r.assignedVehicle ? (
          <div>
            <div className="flex items-center gap-1.5 font-mono text-emerald-400 font-bold text-xs">
              <Car className="w-3.5 h-3.5" />
              <span>{r.assignedVehicle.vehicleNumber}</span>
            </div>
            <p className="text-[11px] text-slate-400">
              {r.assignedVehicle.model} ({r.assignedVehicle.seatingCapacity} seats)
            </p>
          </div>
        ) : (
          <span className="inline-flex items-center gap-1 text-[11px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full font-medium">
            <AlertCircle className="w-3 h-3" /> Vehicle Unassigned
          </span>
        ),
    },
    {
      header: 'Assigned Driver',
      accessor: (r) =>
        r.assignedDriver ? (
          <div>
            <div className="flex items-center gap-1.5 font-semibold text-slate-200 text-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>{r.assignedDriver.fullName}</span>
            </div>
            <p className="text-[11px] text-slate-400">{r.assignedDriver.phone}</p>
          </div>
        ) : (
          <span className="inline-flex items-center gap-1 text-[11px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full font-medium">
            <AlertCircle className="w-3 h-3" /> Driver Unassigned
          </span>
        ),
    },
    {
      header: 'Timings',
      accessor: (r) => (
        <div className="space-y-0.5 text-[11px]">
          <p className="text-slate-300">🌅 {r.morningDeparture}</p>
          <p className="text-slate-400">🌆 {r.eveningDeparture}</p>
        </div>
      ),
    },
    {
      header: 'Capacity & Load',
      accessor: (r) => {
        const pct = Math.min(100, Math.round((r.activeBookingsCount / (r.capacity || 1)) * 100));
        return (
          <div className="w-32 space-y-1">
            <div className="flex justify-between text-[10px]">
              <span className="text-slate-400">
                {r.activeBookingsCount} / {r.capacity} Seats
              </span>
              <span className={pct >= 100 ? 'text-rose-400 font-bold' : 'text-emerald-400 font-semibold'}>
                {pct}%
              </span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  pct >= 100 ? 'bg-rose-500' : pct > 75 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Centralized Resource & Route Allocation Matrix
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Assign active vehicles, verified drivers, and enforce seating capacity across campus routes
          </p>
        </div>
        <button
          onClick={fetchAssignments}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Matrix</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Scheduled Routes"
          value={routes.length}
          subtitle="Configured transit corridors"
          icon={RouteIcon}
          color="blue"
        />
        <StatCard
          title="Fully Allocated"
          value={fullyAssignedCount}
          subtitle="Assigned Driver + Vehicle"
          icon={CheckCircle2}
          color="emerald"
        />
        <StatCard
          title="Pending Allocation"
          value={unassignedCount}
          subtitle="Missing vehicle or driver"
          icon={AlertCircle}
          color="amber"
        />
        <StatCard
          title="Available Fleet"
          value={`${availableVehicles.length} Vehicles`}
          subtitle={`${availableDrivers.length} On-Duty Drivers`}
          icon={Car}
          color="purple"
        />
      </div>

      {/* Allocation Table */}
      <DataTable
        columns={columns}
        data={routes}
        searchPlaceholder="Search routes by name or code..."
        searchFilter={(r, q) => r.routeName.toLowerCase().includes(q) || r.routeCode.toLowerCase().includes(q)}
        actions={(r) => (
          <button
            onClick={() => openReassignModal(r)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-xs font-medium border border-emerald-500/30 transition shadow-sm"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Reallocate</span>
          </button>
        )}
      />

      {/* Reassign / Allocation Modal */}
      <Modal
        isOpen={reassignModalOpen}
        onClose={() => setReassignModalOpen(false)}
        title={`Allocate Resources: ${selectedAssignment?.routeName || ''}`}
      >
        <form onSubmit={handleSaveAllocation} className="space-y-4 text-xs">
          {modalError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium">
              {modalError}
            </div>
          )}

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5 text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-400">Route Code:</span>
              <span className="font-mono text-emerald-400 font-bold">{selectedAssignment?.routeCode}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Departure Times:</span>
              <span>
                🌅 {selectedAssignment?.morningDeparture} | 🌆 {selectedAssignment?.eveningDeparture}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Active Bookings:</span>
              <span className="font-semibold text-white">
                {selectedAssignment?.activeBookingsCount} Confirmed Students
              </span>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">
              Select Fleet Vehicle <span className="text-emerald-400">*</span>
            </label>
            <select
              value={selectedVehicleId}
              onChange={(e) => setSelectedVehicleId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-emerald-500"
            >
              <option value="">-- No Vehicle Assigned --</option>
              {availableVehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.vehicle_number} - {v.model} ({v.type.replace('_', ' ')} • {v.seating_capacity} seats)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">
              Select Operating Driver <span className="text-emerald-400">*</span>
            </label>
            <select
              value={selectedDriverId}
              onChange={(e) => setSelectedDriverId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-emerald-500"
            >
              <option value="">-- No Driver Assigned --</option>
              {availableDrivers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.full_name} ({d.phone} • License: {d.profile?.license_number || 'N/A'})
                </option>
              ))}
            </select>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={actionLoading}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition shadow-lg shadow-emerald-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {actionLoading ? 'Saving Allocation...' : 'Confirm & Save Allocation'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
