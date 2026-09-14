import React, { useEffect, useState } from 'react';
import { ShieldCheck, Phone, Plus, CheckCircle, Star } from 'lucide-react';
import { DataTable, Column } from '../components/DataTable';
import { Modal } from '../components/Modal';
import { api } from '../services/api';
import { User } from '../types';

export const DriversPage: React.FC = () => {
  const [drivers, setDrivers] = useState<User[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    college_id: '11111111-1111-1111-1111-111111111111',
    full_name: '',
    email: '',
    phone: '',
    password: 'password123',
    license_number: '',
    license_expiry: '2030-12-31',
    experience_years: 5,
  });

  const fetchDrivers = async () => {
    try {
      const res = await api.get('/admin/drivers');
      if (res.data.success) {
        setDrivers(res.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/admin/drivers', formData);
      setModalOpen(false);
      fetchDrivers();
    } catch (err) {
      console.error(err);
    }
  };

  const columns: Column<User>[] = [
    {
      header: 'Driver Name & Contact',
      accessor: (d) => (
        <div>
          <p className="font-semibold text-white">{d.full_name}</p>
          <p className="text-[11px] text-slate-400">{d.email}</p>
        </div>
      ),
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
      accessor: (d) => (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
          <CheckCircle className="w-3 h-3" /> {d.profile?.status || 'ACTIVE'}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Driver Fleet Directory</h2>
          <p className="text-xs text-slate-400 mt-1">
            Verified campus drivers, commercial licenses, ratings, and live duty status
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-emerald-600/20 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add Driver</span>
        </button>
      </div>

      <DataTable
        columns={columns}
        data={drivers}
        searchFilter={(d, q) => d.full_name.toLowerCase().includes(q) || d.phone.includes(q)}
      />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Register Campus Driver">
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-medium mb-1">Full Name</label>
            <input
              type="text"
              required
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-emerald-500"
              placeholder="e.g., Rajesh Kumar Yadav"
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
                placeholder="driver3@collegecab.com"
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
              <label className="block text-slate-300 font-medium mb-1">Commercial License #</label>
              <input
                type="text"
                required
                value={formData.license_number}
                onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono focus:border-emerald-500"
                placeholder="DL-04-2022-XXXXXXX"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">Experience (Years)</label>
              <input
                type="number"
                required
                value={formData.experience_years}
                onChange={(e) => setFormData({ ...formData, experience_years: parseInt(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-emerald-500"
              />
            </div>
          </div>
          <p className="text-[11px] text-slate-400">
            * Driver default password will be initialized to <code>password123</code>.
          </p>
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-lg shadow-emerald-600/20 transition"
            >
              Save Driver Profile
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
