import React, { useEffect, useState } from 'react';
import {
  ShieldCheck,
  Plus,
  CheckCircle,
  Star,
  Edit2,
  Trash2,
  Clock,
  XCircle,
  AlertCircle,
  CheckCircle2,
  GraduationCap,
} from 'lucide-react';
import { DataTable, Column } from '../components/DataTable';
import { Modal } from '../components/Modal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { api, getApiErrorMessage } from '../services/api';
import { useToast } from '../context/ToastContext';
import { User, College } from '../types';

export const DriversPage: React.FC = () => {
  const toast = useToast();
  const [drivers, setDrivers] = useState<User[]>([]);
  const [colleges, setColleges] = useState<College[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<User | null>(null);

  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [actionLoading, setActionLoading] = useState(false);
  const [modalError, setModalError] = useState('');

  const [formData, setFormData] = useState({
    college_id: '',
    full_name: '',
    email: '',
    phone: '',
    password: '',
    license_number: '',
    license_expiry: '',
    experience_years: 1,
    aadhar_number: '',
    status: 'ACTIVE',
  });

  const fetchData = async () => {
    try {
      const [driversRes, collegesRes] = await Promise.all([
        api.get('/admin/drivers'),
        api.get('/admin/colleges'),
      ]);

      if (driversRes.data.success) {
        setDrivers(driversRes.data.data);
      }
      if (collegesRes.data.success) {
        setColleges(collegesRes.data.data);
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openAddModal = () => {
    setFormData({
      college_id: colleges.length > 0 ? colleges[0].id : '',
      full_name: '',
      email: '',
      phone: '',
      password: '',
      license_number: '',
      license_expiry: '',
      experience_years: 1,
      aadhar_number: '',
      status: 'ACTIVE',
    });
    setModalError('');
    setModalOpen(true);
  };

  const openEditModal = (d: User) => {
    setSelectedDriver(d);
    setFormData({
      college_id: d.profile?.college_id || (colleges.length > 0 ? colleges[0].id : ''),
      full_name: d.full_name,
      email: d.email,
      phone: d.phone,
      password: '',
      license_number: d.profile?.license_number || '',
      license_expiry: d.profile?.license_expiry || '',
      experience_years: d.profile?.experience_years || 1,
      aadhar_number: d.profile?.aadhar_number || '',
      status: d.profile?.status || 'ACTIVE',
    });
    setModalError('');
    setEditModalOpen(true);
  };

  const openDeleteModal = (d: User) => {
    setSelectedDriver(d);
    setModalError('');
    setDeleteModalOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');
    if (!formData.password || formData.password.length < 6) {
      toast.warning('Password is required and must be at least 6 characters.');
      setModalError('Password is required and must be at least 6 characters.');
      return;
    }
    setActionLoading(true);
    try {
      await api.post('/admin/drivers', formData);
      setModalOpen(false);
      toast.success(`Driver "${formData.full_name}" registered successfully.`);
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
    if (!selectedDriver) return;

    setActionLoading(true);
    setModalError('');
    try {
      await api.put(`/admin/drivers/${selectedDriver.id}`, {
        college_id: formData.college_id,
        full_name: formData.full_name,
        phone: formData.phone,
        license_number: formData.license_number,
        license_expiry: formData.license_expiry,
        experience_years: formData.experience_years,
        aadhar_number: formData.aadhar_number || undefined,
        status: formData.status,
      });
      setEditModalOpen(false);
      toast.success(`Driver "${formData.full_name}" updated successfully.`);
      fetchData();
    } catch (err: any) {
      toast.error(err);
      setModalError(getApiErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedDriver) return;

    setActionLoading(true);
    setModalError('');
    try {
      await api.delete(`/admin/drivers/${selectedDriver.id}`);
      setDeleteModalOpen(false);
      toast.success(`Driver "${selectedDriver.full_name}" deleted successfully.`);
      fetchData();
    } catch (err: any) {
      toast.error(err);
      setModalError(getApiErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  const filteredDrivers = drivers.filter((d) => {
    if (statusFilter !== 'ALL' && (d.profile?.status || d.status) !== statusFilter) return false;
    return true;
  });

  const columns: Column<User>[] = [
    {
      header: 'Driver Name & College',
      accessor: (d) => {
        const driverCollege = colleges.find((c) => c.id === d.profile?.college_id) || d.college || d.profile?.college;
        return (
          <div>
            <p className="font-semibold text-white">{d.full_name}</p>
            <p className="text-[11px] text-slate-400">{d.email}</p>
            {driverCollege && (
              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded mt-0.5 border border-emerald-500/20">
                <GraduationCap className="w-3 h-3" /> {driverCollege.name || driverCollege.code}
              </span>
            )}
          </div>
        );
      },
    },
    {
      header: 'Phone',
      accessor: 'phone',
      className: 'font-mono text-slate-300',
    },
    {
      header: 'Commercial Driving License',
      accessor: (d) => (
        <div>
          <p className="font-mono text-emerald-400 font-semibold">{d.profile?.license_number || 'DL-PENDING'}</p>
          <p className="text-[11px] text-slate-400">Valid until: {d.profile?.license_expiry || '2030'}</p>
        </div>
      ),
    },
    {
      header: 'Rating & Trips',
      accessor: (d) => (
        <div className="flex items-center gap-1.5">
          <span className="flex items-center gap-1 font-bold text-amber-400">
            <Star className="w-3.5 h-3.5 fill-amber-400" /> {d.profile?.rating_avg || 5.0}
          </span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-400">{d.profile?.total_trips || 0} trips</span>
        </div>
      ),
    },
    {
      header: 'Duty Status',
      accessor: (d) => {
        const st = d.profile?.status || 'ACTIVE';
        const badges = {
          ACTIVE: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
          ON_LEAVE: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
          INACTIVE: 'text-slate-400 bg-slate-500/10 border-slate-500/20',
          SUSPENDED: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
        };
        const icons = {
          ACTIVE: CheckCircle,
          ON_LEAVE: Clock,
          INACTIVE: XCircle,
          SUSPENDED: AlertCircle,
        };
        const Icon = icons[st as keyof typeof icons] || CheckCircle;

        return (
          <span
            className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${
              badges[st as keyof typeof badges] || badges.ACTIVE
            }`}
          >
            <Icon className="w-3 h-3" /> {st.replace('_', ' ')}
          </span>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Driver Fleet Directory</h2>
          <p className="text-xs text-slate-400 mt-1">
            Verified campus drivers, commercial licenses, ratings, and live duty status
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-emerald-600/20 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Driver</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 p-3 rounded-xl text-xs">
        <span className="text-slate-400 font-medium">Filter by Status:</span>
        {['ALL', 'ACTIVE', 'ON_LEAVE', 'INACTIVE', 'SUSPENDED'].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3 py-1 rounded-lg font-medium transition ${
              statusFilter === st
                ? 'bg-emerald-500 text-white font-semibold'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {st.replace('_', ' ')}
          </button>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={filteredDrivers}
        searchPlaceholder="Search driver name, phone, license..."
        searchFilter={(d, q) =>
          d.full_name.toLowerCase().includes(q) ||
          d.phone.includes(q) ||
          d.email.toLowerCase().includes(q) ||
          (d.profile?.license_number || '').toLowerCase().includes(q)
        }
        actions={(d) => (
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => openEditModal(d)}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
              title="Edit Driver"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => openDeleteModal(d)}
              className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition"
              title="Delete Driver"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      />

      {/* Add Driver Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Register Campus Driver">
        {modalError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium">
            {modalError}
          </div>
        )}
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          {colleges.length > 0 && (
            <div>
              <label className="block text-slate-300 font-medium mb-1">Associated College / Campus</label>
              <select
                value={formData.college_id}
                onChange={(e) => setFormData({ ...formData, college_id: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-emerald-500 focus:outline-none"
              >
                {colleges.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-slate-300 font-medium mb-1">Full Name</label>
            <input
              type="text"
              required
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-emerald-500"
              placeholder="e.g., Rajesh Kumar"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Email Address</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-emerald-500"
                placeholder="driver@college.edu"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">Phone Number</label>
              <input
                type="text"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-emerald-500"
                placeholder="+919876543210"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Driver Account Password</label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-emerald-500"
                placeholder="Set password (min 6 chars)"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">License Expiry Date</label>
              <input
                type="date"
                required
                value={formData.license_expiry}
                onChange={(e) => setFormData({ ...formData, license_expiry: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-emerald-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Commercial License #</label>
              <input
                type="text"
                required
                value={formData.license_number}
                onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono focus:border-emerald-500"
                placeholder="DL-04-2024-XXXXXXX"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">Experience (Years)</label>
              <input
                type="number"
                min="1"
                required
                value={formData.experience_years}
                onChange={(e) => setFormData({ ...formData, experience_years: parseInt(e.target.value) || 1 })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">Duty Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-emerald-500"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="ON_LEAVE">ON LEAVE</option>
                <option value="INACTIVE">INACTIVE</option>
                <option value="SUSPENDED">SUSPENDED</option>
              </select>
            </div>
          </div>
          <div className="pt-2">
            <button
              type="submit"
              disabled={actionLoading}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-lg shadow-emerald-600/20 transition disabled:opacity-50"
            >
              {actionLoading ? 'Saving...' : 'Save Driver Profile'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Driver Modal */}
      <Modal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} title="Update Driver Profile">
        {modalError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium">
            {modalError}
          </div>
        )}
        <form onSubmit={handleUpdate} className="space-y-4 text-xs">
          {colleges.length > 0 && (
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <label className="block text-emerald-400 font-bold mb-1.5 flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4" /> Reassign College / Campus
              </label>
              <select
                value={formData.college_id}
                onChange={(e) => setFormData({ ...formData, college_id: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:border-emerald-500 focus:outline-none"
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
              <label className="block text-slate-300 font-medium mb-1">Full Name</label>
              <input
                type="text"
                required
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">Phone Number</label>
              <input
                type="text"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Commercial License #</label>
              <input
                type="text"
                required
                value={formData.license_number}
                onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">License Expiry Date</label>
              <input
                type="date"
                required
                value={formData.license_expiry}
                onChange={(e) => setFormData({ ...formData, license_expiry: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">Experience (Years)</label>
              <input
                type="number"
                min="1"
                required
                value={formData.experience_years}
                onChange={(e) => setFormData({ ...formData, experience_years: parseInt(e.target.value) || 1 })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Duty & Account Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-emerald-500"
            >
              <option value="ACTIVE">ACTIVE (On Duty)</option>
              <option value="ON_LEAVE">ON LEAVE</option>
              <option value="INACTIVE">INACTIVE</option>
              <option value="SUSPENDED">SUSPENDED</option>
            </select>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={actionLoading}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-lg shadow-emerald-600/20 transition disabled:opacity-50"
            >
              {actionLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Driver Modal */}
      <ConfirmDialog
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Remove Driver Account"
        message={`Are you sure you want to permanently remove driver "${selectedDriver?.full_name}"? Deleting this driver will automatically unassign them from any active routes and scheduled trips.`}
        confirmText="Confirm Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={actionLoading}
      />
    </div>
  );
};
