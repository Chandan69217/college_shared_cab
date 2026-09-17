import React, { useEffect, useState } from 'react';
import {
  GraduationCap,
  MapPin,
  Phone,
  Mail,
  CheckCircle,
  Plus,
  Edit3,
  Trash2,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { DataTable, Column } from '../components/DataTable';
import { Modal } from '../components/Modal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { LocationPickerMap } from '../components/LocationPickerMap';
import { api, getApiErrorMessage } from '../services/api';
import { useToast } from '../context/ToastContext';
import { College } from '../types';

export const CollegesPage: React.FC = () => {
  const toast = useToast();
  const [colleges, setColleges] = useState<College[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedCollege, setSelectedCollege] = useState<College | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    address: '',
    latitude: 28.5355,
    longitude: 77.391,
    service_radius_km: 10.0,
    contact_email: '',
    contact_phone: '',
    is_active: true,
  });

  const fetchColleges = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/admin/colleges');
      if (res.data.success) {
        setColleges(res.data.data);
      }
    } catch (err) {
      const msg = getApiErrorMessage(err);
      setError(msg);
      toast.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchColleges();
  }, []);

  const handleOpenAdd = () => {
    setFormData({
      name: '',
      code: '',
      address: '',
      latitude: 28.5355,
      longitude: 77.391,
      service_radius_km: 10.0,
      contact_email: '',
      contact_phone: '',
      is_active: true,
    });
    setError(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (c: College) => {
    setSelectedCollege(c);
    setFormData({
      name: c.name || '',
      code: c.code || '',
      address: c.address || '',
      latitude: c.latitude || 28.5355,
      longitude: c.longitude || 77.391,
      service_radius_km: c.service_radius_km || 10.0,
      contact_email: c.contact_email || '',
      contact_phone: c.contact_phone || '',
      is_active: c.is_active !== undefined ? c.is_active : true,
    });
    setError(null);
    setIsEditModalOpen(true);
  };

  const handleOpenDelete = (c: College) => {
    setSelectedCollege(c);
    setError(null);
    setIsDeleteModalOpen(true);
  };

  const handleCreateCollege = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setError(null);
    try {
      const res = await api.post('/admin/colleges', formData);
      if (res.data.success) {
        toast.success(`College "${formData.name}" registered successfully!`);
        setIsAddModalOpen(false);
        fetchColleges();
      }
    } catch (err) {
      toast.error(err);
      setError(getApiErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateCollege = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCollege) return;
    setActionLoading(true);
    setError(null);
    try {
      const res = await api.put(`/admin/colleges/${selectedCollege.id}`, formData);
      if (res.data.success) {
        toast.success(`College "${formData.name}" updated successfully!`);
        setIsEditModalOpen(false);
        fetchColleges();
      }
    } catch (err) {
      toast.error(err);
      setError(getApiErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteCollege = async () => {
    if (!selectedCollege) return;
    setActionLoading(true);
    setError(null);
    try {
      const res = await api.delete(`/admin/colleges/${selectedCollege.id}`);
      if (res.data.success) {
        toast.success(`College removed successfully.`);
        setIsDeleteModalOpen(false);
        fetchColleges();
      }
    } catch (err) {
      toast.error(err);
      setError(getApiErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  const columns: Column<College>[] = [
    {
      header: 'College Name & Code',
      accessor: (c) => (
        <div>
          <p className="font-semibold text-white">{c.name}</p>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-emerald-400 border border-slate-700">
            {c.code}
          </span>
        </div>
      ),
    },
    {
      header: 'Campus Address',
      accessor: 'address',
      className: 'max-w-xs truncate',
    },
    {
      header: 'Geofenced Radius',
      accessor: (c) => (
        <span className="font-semibold text-emerald-400">
          {c.service_radius_km} km Geofence
        </span>
      ),
    },
    {
      header: 'Contact Information',
      accessor: (c) => (
        <div className="space-y-0.5 text-[11px] text-slate-300">
          <p className="flex items-center gap-1">
            <Mail className="w-3 h-3 text-slate-500" /> {c.contact_email}
          </p>
          <p className="flex items-center gap-1">
            <Phone className="w-3 h-3 text-slate-500" /> {c.contact_phone}
          </p>
        </div>
      ),
    },
    {
      header: 'Operational Status',
      accessor: (c) =>
        c.is_active ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <CheckCircle className="w-3 h-3" /> Active Hub
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 px-2 py-0.5 rounded-full bg-slate-800/60 border border-slate-700">
            Inactive
          </span>
        ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-emerald-500" />
            <span>Registered Colleges & Partner Campuses</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Manage college hubs, campus geofences, and transport network service boundaries
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-emerald-600/20 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add College</span>
        </button>
      </div>

      {/* Alert Notifications */}
      {error && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Colleges Data Table */}
      <DataTable
        columns={columns}
        data={colleges}
        searchPlaceholder="Search college by name, code, address..."
        searchFilter={(c, q) =>
          c.name.toLowerCase().includes(q) ||
          c.code.toLowerCase().includes(q) ||
          c.address.toLowerCase().includes(q) ||
          c.contact_email.toLowerCase().includes(q)
        }
        actions={(c) => (
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => handleOpenEdit(c)}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              title="Edit College Details"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleOpenDelete(c)}
              className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition"
              title="Delete College"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      />

      {/* CREATE COLLEGE MODAL */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Register New College Hub"
      >
        <form onSubmit={handleCreateCollege} className="space-y-4 text-xs">
          {error && (
            <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400 text-xs">
              {error}
            </div>
          )}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">College Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
              placeholder="e.g. Apex Institute of Technology"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">College Code *</label>
              <input
                type="text"
                required
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none uppercase"
                placeholder="e.g. APEX-NCR"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Service Radius (km) *</label>
              <input
                type="number"
                step="0.5"
                min="1"
                required
                value={formData.service_radius_km}
                onChange={(e) =>
                  setFormData({ ...formData, service_radius_km: parseFloat(e.target.value) || 10.0 })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Campus Address *</label>
            <input
              type="text"
              required
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
              placeholder="e.g. Knowledge Park III, Greater Noida, UP"
            />
          </div>

          {/* Google Maps Campus Location Picker */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Select Campus Location & Geofence on Google Maps
            </label>
            <LocationPickerMap
              initialLat={formData.latitude}
              initialLng={formData.longitude}
              collegeName={formData.name || 'Campus Hub'}
              serviceRadiusKm={formData.service_radius_km || 10.0}
              onLocationChange={(lat, lng) => {
                setFormData((prev) => ({
                  ...prev,
                  latitude: lat,
                  longitude: lng,
                }));
              }}
              onAddressSelect={(addr, name) => {
                setFormData((prev) => ({
                  ...prev,
                  address: addr,
                  name: prev.name ? prev.name : (name || addr.split(',')[0]),
                }));
              }}
            />
          </div>


          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Contact Email *</label>
              <input
                type="email"
                required
                value={formData.contact_email}
                onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                placeholder="transport@college.edu"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Contact Phone *</label>
              <input
                type="tel"
                required
                value={formData.contact_phone}
                onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                placeholder="+91 9876543210"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition disabled:opacity-50"
            >
              {actionLoading ? 'Saving...' : 'Register College'}
            </button>
          </div>
        </form>
      </Modal>

      {/* EDIT COLLEGE MODAL */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit College Information"
      >
        <form onSubmit={handleUpdateCollege} className="space-y-4 text-xs">
          {error && (
            <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400 text-xs">
              {error}
            </div>
          )}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">College Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">College Code</label>
              <input
                type="text"
                required
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-emerald-500 focus:outline-none uppercase"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Service Radius (km)</label>
              <input
                type="number"
                step="0.5"
                min="1"
                required
                value={formData.service_radius_km}
                onChange={(e) =>
                  setFormData({ ...formData, service_radius_km: parseFloat(e.target.value) || 10.0 })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Campus Address</label>
            <input
              type="text"
              required
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {/* Google Maps Campus Location Picker */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Update Campus Location & Geofence on Google Maps
            </label>
            <LocationPickerMap
              initialLat={formData.latitude}
              initialLng={formData.longitude}
              collegeName={formData.name || 'Campus Hub'}
              serviceRadiusKm={formData.service_radius_km || 10.0}
              onLocationChange={(lat, lng) => {
                setFormData((prev) => ({
                  ...prev,
                  latitude: lat,
                  longitude: lng,
                }));
              }}
              onAddressSelect={(addr, name) => {
                setFormData((prev) => ({
                  ...prev,
                  address: addr,
                  name: prev.name ? prev.name : (name || addr.split(',')[0]),
                }));
              }}
            />
          </div>


          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Contact Email</label>
              <input
                type="email"
                required
                value={formData.contact_email}
                onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Contact Phone</label>
              <input
                type="tel"
                required
                value={formData.contact_phone}
                onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="college-active-checkbox"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="rounded bg-slate-950 border-slate-700 text-emerald-500 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
            />
            <label htmlFor="college-active-checkbox" className="text-slate-300 font-medium cursor-pointer">
              College hub is actively accepting transport operations
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition disabled:opacity-50"
            >
              {actionLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* DELETE CONFIRMATION MODAL */}
      <ConfirmDialog
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteCollege}
        title="Remove College Institution"
        message={`Are you sure you want to permanently remove "${selectedCollege?.name}" (${selectedCollege?.code})? This action cannot be undone if operational records are not attached.`}
        confirmText="Confirm Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={actionLoading}
      />
    </div>
  );
};
