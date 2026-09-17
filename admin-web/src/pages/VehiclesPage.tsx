import React, { useEffect, useState } from 'react';
import {
  Car,
  Plus,
  CheckCircle,
  AlertCircle,
  Edit2,
  Trash2,
  Wrench,
  XCircle,
  CheckCircle2,
} from 'lucide-react';
import { DataTable, Column } from '../components/DataTable';
import { Modal } from '../components/Modal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { api, getApiErrorMessage } from '../services/api';
import { useToast } from '../context/ToastContext';
import { Vehicle } from '../types';

export const VehiclesPage: React.FC = () => {
  const toast = useToast();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [colleges, setColleges] = useState<any[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');

  const [actionLoading, setActionLoading] = useState(false);
  const [modalError, setModalError] = useState('');

  const [formData, setFormData] = useState({
    college_id: '',
    vehicle_number: '',
    model: '',
    type: 'CAB_6',
    seating_capacity: 6,
    registration_number: '',
    insurance_validity: '',
    fitness_validity: '',
    status: 'ACTIVE',
  });

  const fetchVehicles = async () => {
    try {
      const [vRes, cRes] = await Promise.all([
        api.get('/catalog/vehicles'),
        api.get('/catalog/colleges'),
      ]);
      if (vRes.data.success) {
        setVehicles(vRes.data.data);
      }
      if (cRes.data.success) {
        setColleges(cRes.data.data);
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const openAddModal = () => {
    setFormData({
      college_id: colleges[0]?.id || '',
      vehicle_number: '',
      model: '',
      type: 'CAB_6',
      seating_capacity: 6,
      registration_number: '',
      insurance_validity: '2028-12-31',
      fitness_validity: '2028-12-31',
      status: 'ACTIVE',
    });
    setModalError('');
    setModalOpen(true);
  };

  const openEditModal = (v: Vehicle) => {
    setSelectedVehicle(v);
    setFormData({
      college_id: v.college_id || colleges[0]?.id || '',
      vehicle_number: v.vehicle_number,
      model: v.model,
      type: v.type,
      seating_capacity: v.seating_capacity,
      registration_number: v.registration_number,
      insurance_validity: v.insurance_validity || '2028-12-31',
      fitness_validity: v.fitness_validity || '2028-12-31',
      status: v.status,
    });
    setModalError('');
    setEditModalOpen(true);
  };

  const openDeleteModal = (v: Vehicle) => {
    setSelectedVehicle(v);
    setModalError('');
    setDeleteModalOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setModalError('');
    try {
      await api.post('/catalog/vehicles', formData);
      setModalOpen(false);
      toast.success(`Vehicle "${formData.vehicle_number}" registered successfully.`);
      fetchVehicles();
    } catch (err: any) {
      toast.error(err);
      setModalError(getApiErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicle) return;

    setActionLoading(true);
    setModalError('');
    try {
      await api.put(`/admin/vehicles/${selectedVehicle.id}`, formData);
      setEditModalOpen(false);
      toast.success(`Vehicle "${formData.vehicle_number}" updated successfully.`);
      fetchVehicles();
    } catch (err: any) {
      toast.error(err);
      setModalError(getApiErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedVehicle) return;

    setActionLoading(true);
    setModalError('');
    try {
      await api.delete(`/admin/vehicles/${selectedVehicle.id}`);
      setDeleteModalOpen(false);
      toast.success(`Vehicle "${selectedVehicle.vehicle_number}" removed from fleet.`);
      fetchVehicles();
    } catch (err: any) {
      toast.error(err);
      setModalError(getApiErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  const filteredVehicles = vehicles.filter((v) => {
    if (statusFilter !== 'ALL' && v.status !== statusFilter) return false;
    if (typeFilter !== 'ALL' && v.type !== typeFilter) return false;
    return true;
  });

  const columns: Column<Vehicle>[] = [
    {
      header: 'Vehicle Number & Model',
      accessor: (v) => (
        <div>
          <p className="font-bold text-white font-mono">{v.vehicle_number}</p>
          <p className="text-[11px] text-slate-400">{v.model}</p>
        </div>
      ),
    },
    {
      header: 'Type & Capacity',
      accessor: (v) => (
        <div>
          <span className="font-semibold text-emerald-400">{v.type.replace('_', ' ')}</span>
          <p className="text-[11px] text-slate-400">{v.seating_capacity} Passenger Seats</p>
        </div>
      ),
    },
    {
      header: 'Registration No.',
      accessor: 'registration_number',
      className: 'font-mono text-slate-300',
    },
    {
      header: 'Fitness & Insurance',
      accessor: (v) => (
        <div className="space-y-0.5 text-[11px]">
          <p className="text-slate-300">Fitness: {v.fitness_validity}</p>
          <p className="text-slate-400">Insurance: {v.insurance_validity}</p>
        </div>
      ),
    },
    {
      header: 'Fleet Status',
      accessor: (v) => {
        const badges = {
          ACTIVE: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
          INACTIVE: 'text-slate-400 bg-slate-500/10 border-slate-500/20',
          MAINTENANCE: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
        };
        const icons = {
          ACTIVE: CheckCircle,
          INACTIVE: XCircle,
          MAINTENANCE: Wrench,
        };
        const Icon = icons[v.status as keyof typeof icons] || CheckCircle;

        return (
          <span
            className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${
              badges[v.status as keyof typeof badges] || badges.ACTIVE
            }`}
          >
            <Icon className="w-3 h-3" /> {v.status}
          </span>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Vehicle Fleet Inventory</h2>
          <p className="text-xs text-slate-400 mt-1">
            Registered cabs, MPVs, and shuttles with capacity monitoring and fitness tracking
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-emerald-600/20 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Register Vehicle</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 bg-slate-900 border border-slate-800 p-3 rounded-xl text-xs">
        <span className="text-slate-400 font-medium">Filter by Status:</span>
        {['ALL', 'ACTIVE', 'MAINTENANCE', 'INACTIVE'].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-2.5 py-1 rounded-lg font-medium transition ${
              statusFilter === st
                ? 'bg-emerald-500 text-white font-semibold'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {st}
          </button>
        ))}

        <div className="h-4 w-px bg-slate-800 mx-2 hidden sm:block" />

        <span className="text-slate-400 font-medium">Filter by Type:</span>
        {['ALL', 'CAB_4', 'CAB_6', 'SHUTTLE_12', 'BUS_24'].map((tp) => (
          <button
            key={tp}
            onClick={() => setTypeFilter(tp)}
            className={`px-2.5 py-1 rounded-lg font-medium transition ${
              typeFilter === tp
                ? 'bg-blue-600 text-white font-semibold'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {tp.replace('_', ' ')}
          </button>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={filteredVehicles}
        searchPlaceholder="Search vehicle number, model, plate..."
        searchFilter={(v, q) =>
          v.vehicle_number.toLowerCase().includes(q) ||
          v.model.toLowerCase().includes(q) ||
          v.registration_number.toLowerCase().includes(q)
        }
        actions={(v) => (
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => openEditModal(v)}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
              title="Edit Vehicle"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => openDeleteModal(v)}
              className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition"
              title="Delete Vehicle"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      />

      {/* Add Vehicle Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Register Fleet Vehicle">
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          {modalError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium">
              {modalError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Vehicle License Plate</label>
              <input
                type="text"
                required
                value={formData.vehicle_number}
                onChange={(e) => setFormData({ ...formData, vehicle_number: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono focus:border-emerald-500"
                placeholder="UP16-AB-1234"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">Vehicle Model</label>
              <input
                type="text"
                required
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-emerald-500"
                placeholder="Maruti Ertiga / Innova"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Vehicle Type</label>
              <select
                value={formData.type}
                onChange={(e) => {
                  const val = e.target.value;
                  const cap = val === 'CAB_4' ? 4 : val === 'CAB_6' ? 6 : val === 'SHUTTLE_12' ? 12 : 24;
                  setFormData({ ...formData, type: val as any, seating_capacity: cap });
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-emerald-500"
              >
                <option value="CAB_4">Cab (4 Seater)</option>
                <option value="CAB_6">Cab (6 Seater MPV)</option>
                <option value="SHUTTLE_12">Shuttle (12 Seater)</option>
                <option value="BUS_24">Campus Bus (24 Seater)</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">Seating Capacity</label>
              <input
                type="number"
                required
                min={1}
                max={50}
                value={formData.seating_capacity}
                onChange={(e) => setFormData({ ...formData, seating_capacity: parseInt(e.target.value) || 1 })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-emerald-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-slate-300 font-medium mb-1">Registration Certificate #</label>
            <input
              type="text"
              required
              value={formData.registration_number}
              onChange={(e) => setFormData({ ...formData, registration_number: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-emerald-500 font-mono"
              placeholder="DL-VA-2024-XXXX"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Fitness Certificate Expiry</label>
              <input
                type="date"
                required
                value={formData.fitness_validity}
                onChange={(e) => setFormData({ ...formData, fitness_validity: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">Insurance Validity Expiry</label>
              <input
                type="date"
                required
                value={formData.insurance_validity}
                onChange={(e) => setFormData({ ...formData, insurance_validity: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-emerald-500"
              />
            </div>
          </div>
          <div className="pt-2">
            <button
              type="submit"
              disabled={actionLoading}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-lg shadow-emerald-600/20 transition disabled:opacity-50"
            >
              {actionLoading ? 'Registering...' : 'Add to Active Fleet'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Vehicle Modal */}
      <Modal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} title="Update Fleet Vehicle">
        <form onSubmit={handleUpdate} className="space-y-4 text-xs">
          {modalError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium">
              {modalError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Vehicle License Plate</label>
              <input
                type="text"
                required
                value={formData.vehicle_number}
                onChange={(e) => setFormData({ ...formData, vehicle_number: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">Vehicle Model</label>
              <input
                type="text"
                required
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Vehicle Type</label>
              <select
                value={formData.type}
                onChange={(e) => {
                  const val = e.target.value;
                  const cap = val === 'CAB_4' ? 4 : val === 'CAB_6' ? 6 : val === 'SHUTTLE_12' ? 12 : 24;
                  setFormData({ ...formData, type: val as any, seating_capacity: cap });
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-emerald-500"
              >
                <option value="CAB_4">Cab (4 Seater)</option>
                <option value="CAB_6">Cab (6 Seater MPV)</option>
                <option value="SHUTTLE_12">Shuttle (12 Seater)</option>
                <option value="BUS_24">Campus Bus (24 Seater)</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">Seating Capacity</label>
              <input
                type="number"
                required
                min={1}
                max={50}
                value={formData.seating_capacity}
                onChange={(e) => setFormData({ ...formData, seating_capacity: parseInt(e.target.value) || 1 })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">Fleet Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-emerald-500"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="MAINTENANCE">MAINTENANCE</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Registration Certificate #</label>
            <input
              type="text"
              required
              value={formData.registration_number}
              onChange={(e) => setFormData({ ...formData, registration_number: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-emerald-500 font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Fitness Certificate Expiry</label>
              <input
                type="date"
                required
                value={formData.fitness_validity}
                onChange={(e) => setFormData({ ...formData, fitness_validity: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">Insurance Validity Expiry</label>
              <input
                type="date"
                required
                value={formData.insurance_validity}
                onChange={(e) => setFormData({ ...formData, insurance_validity: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={actionLoading}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-lg shadow-emerald-600/20 transition disabled:opacity-50"
            >
              {actionLoading ? 'Saving Changes...' : 'Save Vehicle Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Remove Vehicle from Fleet"
        message={`Are you sure you want to delete vehicle "${selectedVehicle?.vehicle_number}" (${selectedVehicle?.model}) from the fleet? Active route or trip assignments must be unassigned first.`}
        confirmText="Confirm Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={actionLoading}
      />
    </div>
  );
};
