import React, { useEffect, useState, useRef } from 'react';
import {
  GoogleMap,
  useJsApiLoader,
  Marker,
  Polyline,
} from '@react-google-maps/api';
import {
  Route as RouteIcon,
  Clock,
  Users,
  MapPin,
  Plus,
  CheckCircle,
  XCircle,
  Edit2,
  Trash2,
  Eye,
  Car,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Navigation,
} from 'lucide-react';
import { DataTable, Column } from '../components/DataTable';
import { Modal } from '../components/Modal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { api, getApiErrorMessage } from '../services/api';
import { useToast } from '../context/ToastContext';
import { Route, Vehicle, User, PickupPoint } from '../types';
import { GOOGLE_MAPS_API_KEY, MAP_LIBRARIES, DARK_MAP_STYLE } from '../config/maps';

export const RoutesPage: React.FC = () => {
  const toast = useToast();
  const [routes, setRoutes] = useState<Route[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<User[]>([]);
  const [pickupPoints, setPickupPoints] = useState<PickupPoint[]>([]);
  const [colleges, setColleges] = useState<any[]>([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);

  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [actionLoading, setActionLoading] = useState(false);
  const [modalError, setModalError] = useState('');

  const [formData, setFormData] = useState({
    college_id: '',
    name: '',
    code: '',
    description: '',
    morning_departure_time: '07:30',
    evening_departure_time: '17:00',
    estimated_duration_mins: 45,
    max_capacity: 6,
    default_vehicle_id: '',
    default_driver_id: '',
    is_active: true,
  });

  const [selectedStops, setSelectedStops] = useState<{ pickup_point_id: string; sequence_order: number }[]>([]);

  const fetchData = async () => {
    try {
      const [rRes, vRes, dRes, pRes, cRes] = await Promise.all([
        api.get('/catalog/routes'),
        api.get('/catalog/vehicles'),
        api.get('/admin/drivers'),
        api.get('/catalog/pickup-points'),
        api.get('/catalog/colleges'),
      ]);

      if (rRes.data.success) setRoutes(rRes.data.data);
      if (vRes.data.success) setVehicles(vRes.data.data.filter((v: Vehicle) => v.status === 'ACTIVE'));
      if (dRes.data.success) setDrivers(dRes.data.data.filter((d: User) => d.profile?.status === 'ACTIVE'));
      if (pRes.data.success) setPickupPoints(pRes.data.data.filter((p: PickupPoint) => p.is_active));
      if (cRes.data.success) setColleges(cRes.data.data);
    } catch (err: any) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openAddModal = () => {
    setFormData({
      college_id: colleges[0]?.id || '',
      name: '',
      code: '',
      description: '',
      morning_departure_time: '07:30',
      evening_departure_time: '17:00',
      estimated_duration_mins: 45,
      max_capacity: 6,
      default_vehicle_id: '',
      default_driver_id: '',
      is_active: true,
    });
    setSelectedStops([]);
    setModalError('');
    setModalOpen(true);
  };

  const openEditModal = (r: Route) => {
    setSelectedRoute(r);
    setFormData({
      college_id: r.college_id || colleges[0]?.id || '',
      name: r.name,
      code: r.code,
      description: r.description || '',
      morning_departure_time: r.morning_departure_time || '07:30',
      evening_departure_time: r.evening_departure_time || '17:00',
      estimated_duration_mins: r.estimated_duration_mins || 45,
      max_capacity: r.max_capacity || 6,
      default_vehicle_id: r.default_vehicle_id || '',
      default_driver_id: r.default_driver_id || '',
      is_active: r.is_active ?? true,
    });
    setSelectedStops(
      (r.stops || []).map((s: any, idx: number) => ({
        pickup_point_id: s.pickup_point_id,
        sequence_order: s.sequence_order || idx + 1,
      }))
    );
    setModalError('');
    setEditModalOpen(true);
  };

  const openDeleteModal = (r: Route) => {
    setSelectedRoute(r);
    setModalError('');
    setDeleteModalOpen(true);
  };

  const handleAddStop = (pickupId: string) => {
    if (!pickupId) return;
    if (selectedStops.some((s) => s.pickup_point_id === pickupId)) return;
    setSelectedStops([...selectedStops, { pickup_point_id: pickupId, sequence_order: selectedStops.length + 1 }]);
  };

  const handleRemoveStop = (pickupId: string) => {
    const filtered = selectedStops.filter((s) => s.pickup_point_id !== pickupId);
    setSelectedStops(filtered.map((s, idx) => ({ ...s, sequence_order: idx + 1 })));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setModalError('');
    try {
      await api.post('/catalog/routes', {
        ...formData,
        default_vehicle_id: formData.default_vehicle_id || null,
        default_driver_id: formData.default_driver_id || null,
        stops: selectedStops,
      });
      setModalOpen(false);
      toast.success(`Route "${formData.name}" created successfully.`);
      fetchData();
    } catch (err: any) {
      toast.error(err);
      setModalError(getApiErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoute) return;

    setActionLoading(true);
    setModalError('');
    try {
      await api.put(`/admin/routes/${selectedRoute.id}`, {
        ...formData,
        default_vehicle_id: formData.default_vehicle_id || null,
        default_driver_id: formData.default_driver_id || null,
        stops: selectedStops,
      });
      setEditModalOpen(false);
      toast.success(`Route "${formData.name}" updated successfully.`);
      fetchData();
    } catch (err: any) {
      toast.error(err);
      setModalError(getApiErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedRoute) return;

    setActionLoading(true);
    setModalError('');
    try {
      await api.delete(`/admin/routes/${selectedRoute.id}`);
      setDeleteModalOpen(false);
      toast.success(`Route "${selectedRoute.name}" deleted successfully.`);
      fetchData();
    } catch (err: any) {
      toast.error(err);
      setModalError(getApiErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  const filteredRoutes = routes.filter((r) => {
    if (statusFilter === 'OPERATIONAL') return r.is_active;
    if (statusFilter === 'INACTIVE') return !r.is_active;
    return true;
  });

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
          <p className="text-slate-300">
            🌅 Morning: <span className="font-mono text-emerald-400 font-semibold">{r.morning_departure_time}</span>
          </p>
          <p className="text-slate-400">
            🌆 Evening: <span className="font-mono text-blue-400 font-semibold">{r.evening_departure_time}</span>
          </p>
        </div>
      ),
    },
    {
      header: 'Assigned Allocation',
      accessor: (r) => (
        <div className="space-y-1 text-[11px]">
          <div className="flex items-center gap-1.5 text-slate-200">
            <Car className="w-3 h-3 text-emerald-400" />
            <span>{r.default_vehicle ? r.default_vehicle.vehicle_number : 'Vehicle Unassigned'}</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-400">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            <span>{r.default_driver ? r.default_driver.full_name : 'Driver Unassigned'}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Stops & Capacity',
      accessor: (r) => (
        <div>
          <p className="text-slate-200 font-medium">{r.max_capacity} Passenger Seats</p>
          <p className="text-[11px] text-slate-400">{r.stops?.length || 0} sequential boarding stops</p>
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: (r) => (
        <span
          className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${
            r.is_active
              ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
              : 'text-slate-400 bg-slate-500/10 border-slate-500/20'
          }`}
        >
          {r.is_active ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
          {r.is_active ? 'Operational' : 'Inactive'}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Route Management & Stop Sequencer</h2>
          <p className="text-xs text-slate-400 mt-1">
            Configure transit lines, sequence pickup stops, set morning/evening departure slots, and allocate vehicles
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-emerald-600/20 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Route</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 p-3 rounded-xl text-xs">
        <span className="text-slate-400 font-medium">Filter Routes:</span>
        {['ALL', 'OPERATIONAL', 'INACTIVE'].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3 py-1 rounded-lg font-medium transition ${
              statusFilter === st
                ? 'bg-emerald-500 text-white font-semibold'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={filteredRoutes}
        searchPlaceholder="Search route name, code, vehicle..."
        searchFilter={(r, q) =>
          r.name.toLowerCase().includes(q) ||
          r.code.toLowerCase().includes(q) ||
          (r.default_vehicle?.vehicle_number || '').toLowerCase().includes(q) ||
          (r.default_driver?.full_name || '').toLowerCase().includes(q)
        }
        actions={(r) => (
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => setSelectedRoute(r)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition"
              title="View Stops Sequence"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Stops</span>
            </button>
            <button
              onClick={() => openEditModal(r)}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
              title="Edit Route"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => openDeleteModal(r)}
              className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition"
              title="Delete Route"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      />

      {/* Add Route Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Create Campus Route">
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          {modalError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium">
              {modalError}
            </div>
          )}

          {colleges.length > 1 && (
            <div>
              <label className="block text-slate-300 font-medium mb-1">Campus Institution</label>
              <select
                value={formData.college_id}
                onChange={(e) => setFormData({ ...formData, college_id: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-emerald-500"
              >
                {colleges.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Route Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-emerald-500"
                placeholder="e.g., Express Line A - Noida Sec 62"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">Route Code</label>
              <input
                type="text"
                required
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono focus:border-emerald-500"
                placeholder="RT-NOIDA-01"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Description</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-emerald-500"
              placeholder="Morning pickup & evening drop covering Sector 62, 59, and Botanical Garden"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Morning Departure</label>
              <input
                type="time"
                required
                value={formData.morning_departure_time}
                onChange={(e) => setFormData({ ...formData, morning_departure_time: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">Evening Departure</label>
              <input
                type="time"
                required
                value={formData.evening_departure_time}
                onChange={(e) => setFormData({ ...formData, evening_departure_time: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">Max Capacity</label>
              <input
                type="number"
                required
                min={1}
                value={formData.max_capacity}
                onChange={(e) => setFormData({ ...formData, max_capacity: parseInt(e.target.value) || 6 })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Default Assigned Vehicle</label>
              <select
                value={formData.default_vehicle_id}
                onChange={(e) => setFormData({ ...formData, default_vehicle_id: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-emerald-500"
              >
                <option value="">-- Optional: Assign Later --</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.vehicle_number} ({v.model} - {v.seating_capacity} seats)
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">Default Operating Driver</label>
              <select
                value={formData.default_driver_id}
                onChange={(e) => setFormData({ ...formData, default_driver_id: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-emerald-500"
              >
                <option value="">-- Optional: Assign Later --</option>
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.full_name} ({d.phone})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Sequential Stops Selector */}
          <div className="border border-slate-800 rounded-xl p-3 bg-slate-950 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-slate-300 font-semibold text-[11px] uppercase tracking-wider">
                Sequential Pickup Stops ({selectedStops.length})
              </label>
              <select
                onChange={(e) => {
                  handleAddStop(e.target.value);
                  e.target.value = '';
                }}
                className="bg-slate-900 border border-slate-700 text-xs text-white rounded-lg px-2 py-1"
              >
                <option value="">+ Add Pickup Stop</option>
                {pickupPoints.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.address})
                  </option>
                ))}
              </select>
            </div>

            {selectedStops.length === 0 ? (
              <p className="text-slate-500 text-[11px] text-center py-2">No pickup stops added to this route yet.</p>
            ) : (
              <div className="space-y-1.5">
                {selectedStops.map((stop, idx) => {
                  const point = pickupPoints.find((p) => p.id === stop.pickup_point_id);
                  return (
                    <div
                      key={stop.pickup_point_id}
                      className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="font-medium text-white">{point?.name || 'Pickup Point'}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveStop(stop.pickup_point_id)}
                        className="text-rose-400 hover:text-rose-300 text-[11px] px-1"
                      >
                        Remove
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={actionLoading}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-lg shadow-emerald-600/20 transition disabled:opacity-50"
            >
              {actionLoading ? 'Creating Route...' : 'Create Route & Deploy Stops'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Route Modal */}
      <Modal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} title="Update Campus Route">
        <form onSubmit={handleUpdate} className="space-y-4 text-xs">
          {modalError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium">
              {modalError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Route Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">Route Code</label>
              <input
                type="text"
                required
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Description</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Morning Departure</label>
              <input
                type="time"
                required
                value={formData.morning_departure_time}
                onChange={(e) => setFormData({ ...formData, morning_departure_time: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">Evening Departure</label>
              <input
                type="time"
                required
                value={formData.evening_departure_time}
                onChange={(e) => setFormData({ ...formData, evening_departure_time: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">Max Capacity</label>
              <input
                type="number"
                required
                min={1}
                value={formData.max_capacity}
                onChange={(e) => setFormData({ ...formData, max_capacity: parseInt(e.target.value) || 6 })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">Status</label>
              <select
                value={formData.is_active ? 'ACTIVE' : 'INACTIVE'}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'ACTIVE' })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-emerald-500"
              >
                <option value="ACTIVE">OPERATIONAL</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Default Assigned Vehicle</label>
              <select
                value={formData.default_vehicle_id}
                onChange={(e) => setFormData({ ...formData, default_vehicle_id: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-emerald-500"
              >
                <option value="">-- No Vehicle Assigned --</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.vehicle_number} ({v.model} - {v.seating_capacity} seats)
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">Default Operating Driver</label>
              <select
                value={formData.default_driver_id}
                onChange={(e) => setFormData({ ...formData, default_driver_id: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-emerald-500"
              >
                <option value="">-- No Driver Assigned --</option>
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.full_name} ({d.phone})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Sequential Stops Selector */}
          <div className="border border-slate-800 rounded-xl p-3 bg-slate-950 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-slate-300 font-semibold text-[11px] uppercase tracking-wider">
                Sequential Pickup Stops ({selectedStops.length})
              </label>
              <select
                onChange={(e) => {
                  handleAddStop(e.target.value);
                  e.target.value = '';
                }}
                className="bg-slate-900 border border-slate-700 text-xs text-white rounded-lg px-2 py-1"
              >
                <option value="">+ Add Pickup Stop</option>
                {pickupPoints.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.address})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              {selectedStops.map((stop, idx) => {
                const point = pickupPoints.find((p) => p.id === stop.pickup_point_id);
                return (
                  <div
                    key={stop.pickup_point_id}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span className="font-medium text-white">{point?.name || 'Pickup Point'}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveStop(stop.pickup_point_id)}
                      className="text-rose-400 hover:text-rose-300 text-[11px] px-1"
                    >
                      Remove
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={actionLoading}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-lg shadow-emerald-600/20 transition disabled:opacity-50"
            >
              {actionLoading ? 'Saving Changes...' : 'Save Route Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Stops Sequence & Interactive Map Viewer Modal */}
      <Modal
        isOpen={!!selectedRoute && !editModalOpen && !deleteModalOpen}
        onClose={() => setSelectedRoute(null)}
        title={`Route Stop Sequence & Map: ${selectedRoute?.name || ''}`}
      >
        {selectedRoute && (
          <div className="space-y-4 text-xs">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-400">Route Code:</span>
                <span className="font-mono text-emerald-400 font-bold">{selectedRoute.code}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Departure:</span>
                <span className="text-white">
                  🌅 {selectedRoute.morning_departure_time} | 🌆 {selectedRoute.evening_departure_time}
                </span>
              </div>
              <p className="text-slate-300 text-[11px] pt-1 border-t border-slate-800">
                {selectedRoute.description || 'Standard commuter shuttle corridor.'}
              </p>
            </div>

            {/* Interactive Route Polyline & Stops Map */}
            {(() => {
              const stopMarkers: { lat: number; lng: number; title: string; seq: number }[] = [];
              const polylinePoints: { lat: number; lng: number }[] = [];

              if (selectedRoute.stops && Array.isArray(selectedRoute.stops)) {
                selectedRoute.stops.forEach((s: any, idx: number) => {
                  if (s.pickup_point?.latitude && s.pickup_point?.longitude) {
                    const pt = {
                      lat: parseFloat(s.pickup_point.latitude),
                      lng: parseFloat(s.pickup_point.longitude),
                      title: `Stop #${s.sequence_order || idx + 1}: ${s.pickup_point.name}`,
                      seq: s.sequence_order || idx + 1,
                    };
                    stopMarkers.push(pt);
                    polylinePoints.push(pt);
                  }
                });
              }

              if (stopMarkers.length === 0) return null;

              return (
                <div className="h-56 rounded-xl overflow-hidden border border-slate-800 relative">
                  <GoogleMap
                    mapContainerStyle={{ width: '100%', height: '100%' }}
                    center={stopMarkers[0]}
                    zoom={13}
                    options={{
                      styles: DARK_MAP_STYLE,
                      disableDefaultUI: true,
                      zoomControl: true,
                    }}
                  >
                    {stopMarkers.map((m, idx) => (
                      <Marker
                        key={idx}
                        position={{ lat: m.lat, lng: m.lng }}
                        title={m.title}
                        label={{
                          text: `${m.seq}`,
                          color: '#FFFFFF',
                          fontWeight: 'bold',
                          fontSize: '11px',
                        }}
                      />
                    ))}
                    {polylinePoints.length > 1 && (
                      <Polyline
                        path={polylinePoints}
                        options={{
                          strokeColor: '#10B981',
                          strokeOpacity: 0.8,
                          strokeWeight: 4,
                        }}
                      />
                    )}
                  </GoogleMap>
                </div>
              );
            })()}

            <div className="space-y-2">
              <p className="font-semibold text-slate-300 uppercase tracking-wider text-[11px]">
                Ordered Pickup Sequence (Morning Direction):
              </p>
              {selectedRoute.stops && selectedRoute.stops.length > 0 ? (
                selectedRoute.stops.map((stop: any, idx: number) => (
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
                        <p className="text-[10px] text-slate-400">
                          {stop.pickup_point?.address || 'Designated boarding area'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right font-mono">
                      <span className="text-emerald-400 font-semibold">{stop.morning_pickup_time}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-slate-500 text-center py-4">No stops mapped to this route.</p>
              )}

              <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300">
                <div className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-bold text-xs">
                  ★
                </div>
                <div>
                  <p className="font-bold text-white">Campus Hub Destination</p>
                  <p className="text-[10px] text-emerald-400">Scheduled Arrival: Morning Inbound</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Remove Route Corridor"
        message={`Are you sure you want to delete route "${selectedRoute?.name}" (${selectedRoute?.code})? Routes with active student bookings or scheduled trips cannot be deleted without reassigning those dependencies.`}
        confirmText="Confirm Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={actionLoading}
      />
    </div>
  );
};
