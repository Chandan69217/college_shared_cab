import React, { useEffect, useState } from 'react';
import { MapPin, CheckCircle, AlertTriangle, Plus } from 'lucide-react';
import { DataTable, Column } from '../components/DataTable';
import { Modal } from '../components/Modal';
import { api } from '../services/api';
import { PickupPoint } from '../types';

export const PickupPointsPage: React.FC = () => {
  const [points, setPoints] = useState<PickupPoint[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    college_id: '11111111-1111-1111-1111-111111111111',
    name: '',
    landmark: '',
    address: '',
    latitude: 28.5645,
    longitude: 77.3345,
  });

  const fetchPoints = async () => {
    try {
      const res = await api.get('/catalog/pickup-points');
      if (res.data.success) {
        setPoints(res.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchPoints();
  }, []);

  const handleCreatePoint = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/catalog/pickup-points', formData);
      setModalOpen(false);
      fetchPoints();
    } catch (err) {
      console.error(err);
    }
  };

  const columns: Column<PickupPoint>[] = [
    {
      header: 'Pickup Name & Landmark',
      accessor: (p) => (
        <div>
          <p className="font-semibold text-white">{p.name}</p>
          <p className="text-[11px] text-slate-400">{p.landmark || 'No landmark specified'}</p>
        </div>
      ),
    },
    {
      header: 'Address',
      accessor: 'address',
      className: 'max-w-xs truncate',
    },
    {
      header: 'Distance to College',
      accessor: (p) => {
        const isOutside = p.distance_to_college_km > 10.0;
        return (
          <div className="flex items-center gap-1.5">
            <span
              className={`font-semibold ${
                isOutside ? 'text-rose-400' : 'text-emerald-400'
              }`}
            >
              {p.distance_to_college_km} km
            </span>
            {isOutside ? (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
                &gt;10km Radius
              </span>
            ) : (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Inside Radius
              </span>
            )}
          </div>
        );
      },
    },
    {
      header: 'Geocoded Coordinates',
      accessor: (p) => (
        <span className="font-mono text-[11px] text-slate-400">
          {p.latitude.toFixed(4)}, {p.longitude.toFixed(4)}
        </span>
      ),
    },
    {
      header: 'Admin Approval Status',
      accessor: (p) =>
        p.is_approved ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <CheckCircle className="w-3 h-3" /> Approved Stop
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-400 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20">
            <AlertTriangle className="w-3 h-3" /> Needs Manual Approval
          </span>
        ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Designated Pickup & Drop Points</h2>
          <p className="text-xs text-slate-400 mt-1">
            Pre-defined pickup points within the 10 km college service radius (No door-to-door pickups)
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-emerald-600/20 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add Pickup Point</span>
        </button>
      </div>

      <DataTable
        columns={columns}
        data={points}
        searchFilter={(p, q) => p.name.toLowerCase().includes(q) || p.address.toLowerCase().includes(q)}
      />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Create New Pickup Point">
        <form onSubmit={handleCreatePoint} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-medium mb-1">Pickup Stop Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-emerald-500"
              placeholder="e.g., Sector 18 Metro Gate 2"
            />
          </div>
          <div>
            <label className="block text-slate-300 font-medium mb-1">Landmark / Boarding Reference</label>
            <input
              type="text"
              value={formData.landmark}
              onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-emerald-500"
              placeholder="e.g., Near Wave Mall & Auto Stand"
            />
          </div>
          <div>
            <label className="block text-slate-300 font-medium mb-1">Full Address</label>
            <input
              type="text"
              required
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-emerald-500"
              placeholder="Sector 18, Noida, Uttar Pradesh"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Latitude</label>
              <input
                type="number"
                step="0.0001"
                required
                value={formData.latitude}
                onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">Longitude</label>
              <input
                type="number"
                step="0.0001"
                required
                value={formData.longitude}
                onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-emerald-500"
              />
            </div>
          </div>
          <p className="text-[11px] text-slate-400">
            * The system calculates geospatial Haversine distance automatically against the college coordinates (10 km limit).
          </p>
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-lg shadow-emerald-600/20 transition"
            >
              Validate & Create Pickup Point
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
