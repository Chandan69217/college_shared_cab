import React, { useEffect, useState } from 'react';
import {
  MapPin,
  CheckCircle,
  AlertTriangle,
  Plus,
  Edit3,
  Trash2,
  CheckCircle2,
  Filter,
  GraduationCap,
} from 'lucide-react';
import { DataTable, Column } from '../components/DataTable';
import { Modal } from '../components/Modal';
import { LocationPickerMap } from '../components/LocationPickerMap';
import { api, getApiErrorMessage } from '../services/api';
import { PickupPoint, College } from '../types';

export const PickupPointsPage: React.FC = () => {
  const [points, setPoints] = useState<PickupPoint[]>([]);
  const [colleges, setColleges] = useState<College[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filter state
  const [approvalFilter, setApprovalFilter] = useState<'ALL' | 'APPROVED' | 'PENDING'>('ALL');
  const [selectedCollegeFilter, setSelectedCollegeFilter] = useState<string>('ALL');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState<PickupPoint | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    college_id: '',
    name: '',
    landmark: '',
    address: '',
    latitude: 28.5645,
    longitude: 77.3345,
    is_approved: true,
    is_active: true,
  });

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [pointsRes, collegesRes] = await Promise.all([
        api.get('/admin/pickup-points'),
        api.get('/admin/colleges'),
      ]);

      if (pointsRes.data.success) {
        setPoints(pointsRes.data.data);
      }
      if (collegesRes.data.success) {
        setColleges(collegesRes.data.data);
      }
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenAdd = () => {
    setFormData({
      college_id: colleges.length > 0 ? colleges[0].id : '',
      name: '',
      landmark: '',
      address: '',
      latitude: 28.5645,
      longitude: 77.3345,
      is_approved: true,
      is_active: true,
    });
    setError(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (p: PickupPoint) => {
    setSelectedPoint(p);
    setFormData({
      college_id: p.college_id || (colleges.length > 0 ? colleges[0].id : ''),
      name: p.name || '',
      landmark: p.landmark || '',
      address: p.address || '',
      latitude: p.latitude || 28.5645,
      longitude: p.longitude || 77.3345,
      is_approved: p.is_approved !== undefined ? p.is_approved : true,
      is_active: p.is_active !== undefined ? p.is_active : true,
    });
    setError(null);
    setIsEditModalOpen(true);
  };

  const handleOpenDelete = (p: PickupPoint) => {
    setSelectedPoint(p);
    setError(null);
    setIsDeleteModalOpen(true);
  };

  const handleCreatePoint = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setError(null);
    try {
      const res = await api.post('/admin/pickup-points', formData);
      if (res.data.success) {
        showSuccess(`Pickup point "${formData.name}" created successfully!`);
        setIsAddModalOpen(false);
        fetchData();
      }
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdatePoint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPoint) return;
    setActionLoading(true);
    setError(null);
    try {
      const res = await api.put(`/admin/pickup-points/${selectedPoint.id}`, formData);
      if (res.data.success) {
        showSuccess(`Pickup point "${formData.name}" updated successfully!`);
        setIsEditModalOpen(false);
        fetchData();
      }
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeletePoint = async () => {
    if (!selectedPoint) return;
    setActionLoading(true);
    setError(null);
    try {
      const res = await api.delete(`/admin/pickup-points/${selectedPoint.id}`);
      if (res.data.success) {
        showSuccess(`Pickup point removed successfully.`);
        setIsDeleteModalOpen(false);
        fetchData();
      }
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  const filteredPoints = points.filter((p) => {
    if (approvalFilter === 'APPROVED' && !p.is_approved) return false;
    if (approvalFilter === 'PENDING' && p.is_approved) return false;
    if (selectedCollegeFilter !== 'ALL' && p.college_id !== selectedCollegeFilter) return false;
    return true;
  });

  const columns: Column<PickupPoint>[] = [
    {
      header: 'Pickup Name & Landmark',
      accessor: (p) => {
        const college = p.college || colleges.find((c) => c.id === p.college_id);
        return (
          <div>
            <p className="font-semibold text-white">{p.name}</p>
            <p className="text-[11px] text-slate-400">{p.landmark || 'No landmark specified'}</p>
            {college && (
              <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 mt-0.5">
                <GraduationCap className="w-3 h-3 text-slate-400" />
                {college.name}
              </span>
            )}
          </div>
        );
      },
    },
    {
      header: 'Address',
      accessor: 'address',
      className: 'max-w-xs truncate',
    },
    {
      header: 'Distance to College',
      accessor: (p) => {
        const college = p.college || colleges.find((c) => c.id === p.college_id);
        const radius = college?.service_radius_km ?? 25.0;
        const dist = p.distance_to_college_km || 0;
        const isOutside = dist > radius;
        return (
          <div className="flex items-center gap-1.5">
            <span className={`font-semibold ${isOutside ? 'text-rose-400' : 'text-emerald-400'}`}>
              {dist.toFixed(1)} km
            </span>
            {isOutside ? (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
                &gt;{radius}km
              </span>
            ) : (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Inside (≤{radius}km)
              </span>
            )}
          </div>
        );
      },
    },

    {
      header: 'Status & Approval',
      accessor: (p) => (
        <div className="flex items-center gap-1.5">
          {p.is_approved ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <CheckCircle className="w-3 h-3" /> Approved
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-400 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20">
              <AlertTriangle className="w-3 h-3" /> Needs Review
            </span>
          )}
          {!p.is_active && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
              Inactive
            </span>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <MapPin className="w-6 h-6 text-emerald-500" />
            <span>Designated Pickup & Drop Stops</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Pre-defined pickup hubs within the college transport geofence with geospatial validation
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-emerald-600/20 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Pickup Point</span>
        </button>
      </div>

      {/* Alert Notifications */}
      {error && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-3 rounded-xl">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          <span className="text-xs text-slate-500 mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Approval:
          </span>
          {(['ALL', 'APPROVED', 'PENDING'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setApprovalFilter(st)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                approvalFilter === st
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {colleges.length > 1 && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <GraduationCap className="w-3.5 h-3.5" /> College:
            </span>
            <select
              value={selectedCollegeFilter}
              onChange={(e) => setSelectedCollegeFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white focus:border-emerald-500 focus:outline-none"
            >
              <option value="ALL">All Colleges</option>
              {colleges.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.code})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Pickup Points Data Table */}
      <DataTable
        columns={columns}
        data={filteredPoints}
        searchPlaceholder="Search stop by name, landmark, address..."
        searchFilter={(p, q) =>
          p.name.toLowerCase().includes(q) ||
          (p.landmark || '').toLowerCase().includes(q) ||
          p.address.toLowerCase().includes(q)
        }
        actions={(p) => (
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => handleOpenEdit(p)}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              title="Edit Pickup Point"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleOpenDelete(p)}
              className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition"
              title="Delete Pickup Point"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      />

      {/* CREATE PICKUP POINT MODAL */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Designated Pickup Stop"
      >
        <form onSubmit={handleCreatePoint} className="space-y-4 text-xs">
          {error && (
            <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400 text-xs">
              {error}
            </div>
          )}
          {colleges.length > 0 && (
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Associated College *</label>
              <select
                value={formData.college_id}
                onChange={(e) => setFormData({ ...formData, college_id: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-emerald-500 focus:outline-none"
              >
                {colleges.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.code} • {c.service_radius_km} km radius)
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Pickup Stop Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
              placeholder="e.g., Sector 18 Metro Station Gate 2"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Landmark / Boarding Point</label>
            <input
              type="text"
              value={formData.landmark}
              onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
              placeholder="e.g., Near Wave Mall & Auto Stand"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Full Address *</label>
            <input
              type="text"
              required
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
              placeholder="e.g., Captain Vijyant Thapar Marg, Sector 18, Noida"
            />
          </div>

          {/* Interactive Google Map Location Picker */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Select Stop Coordinates on Map (Google Maps)
            </label>
            {(() => {
              const activeCollege = colleges.find((c) => c.id === formData.college_id) || colleges[0];
              return (
                <LocationPickerMap
                  initialLat={formData.latitude}
                  initialLng={formData.longitude}
                  collegeLat={activeCollege?.latitude}
                  collegeLng={activeCollege?.longitude}
                  collegeName={activeCollege?.name}
                  serviceRadiusKm={activeCollege?.service_radius_km || 10.0}
                  onLocationChange={(lat, lng, dist, isWithin) => {
                    setFormData((prev) => ({
                      ...prev,
                      latitude: lat,
                      longitude: lng,
                      is_approved: isWithin ? prev.is_approved : false,
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
              );
            })()}
          </div>



          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="pickup-approved-checkbox"
              checked={formData.is_approved}
              onChange={(e) => setFormData({ ...formData, is_approved: e.target.checked })}
              className="rounded bg-slate-950 border-slate-700 text-emerald-500 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
            />
            <label htmlFor="pickup-approved-checkbox" className="text-slate-300 font-medium cursor-pointer">
              Mark stop as pre-approved for student bookings
            </label>
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
              {actionLoading ? 'Saving...' : 'Create Pickup Stop'}
            </button>
          </div>
        </form>
      </Modal>

      {/* EDIT PICKUP POINT MODAL */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Pickup Stop Information"
      >
        <form onSubmit={handleUpdatePoint} className="space-y-4 text-xs">
          {error && (
            <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400 text-xs">
              {error}
            </div>
          )}
          {colleges.length > 0 && (
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Associated College</label>
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
            <label className="block text-slate-300 font-semibold mb-1">Pickup Stop Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Landmark / Boarding Point</label>
            <input
              type="text"
              value={formData.landmark}
              onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Full Address</label>
            <input
              type="text"
              required
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {/* Interactive Google Map Location Picker */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Adjust Stop Coordinates on Map (Google Maps)
            </label>
            {(() => {
              const activeCollege = colleges.find((c) => c.id === formData.college_id) || colleges[0];
              return (
                <LocationPickerMap
                  initialLat={formData.latitude}
                  initialLng={formData.longitude}
                  collegeLat={activeCollege?.latitude}
                  collegeLng={activeCollege?.longitude}
                  collegeName={activeCollege?.name}
                  serviceRadiusKm={activeCollege?.service_radius_km || 10.0}
                  onLocationChange={(lat, lng, dist, isWithin) => {
                    setFormData((prev) => ({
                      ...prev,
                      latitude: lat,
                      longitude: lng,
                      is_approved: isWithin ? prev.is_approved : false,
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
              );
            })()}
          </div>



          <div className="space-y-2 pt-1">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="edit-pickup-approved-checkbox"
                checked={formData.is_approved}
                onChange={(e) => setFormData({ ...formData, is_approved: e.target.checked })}
                className="rounded bg-slate-950 border-slate-700 text-emerald-500 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
              />
              <label htmlFor="edit-pickup-approved-checkbox" className="text-slate-300 font-medium cursor-pointer">
                Stop is approved and geofence-validated
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="edit-pickup-active-checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="rounded bg-slate-950 border-slate-700 text-emerald-500 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
              />
              <label htmlFor="edit-pickup-active-checkbox" className="text-slate-300 font-medium cursor-pointer">
                Stop is actively available for transit routes
              </label>
            </div>
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
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Remove Pickup Stop"
      >
        <div className="space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
          <p className="text-slate-300">
            Are you sure you want to delete pickup stop{' '}
            <strong className="text-white">{selectedPoint?.name}</strong>?
          </p>
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-slate-400">
            <p className="text-[11px]">
              <strong>Safety Protection:</strong> Physical deletion is automatically blocked if this
              stop is currently used in active route stops or scheduled student bookings.
            </p>
          </div>
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleDeletePoint}
              disabled={actionLoading}
              className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold transition disabled:opacity-50"
            >
              {actionLoading ? 'Deleting...' : 'Confirm Delete'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
