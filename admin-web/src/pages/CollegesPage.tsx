import React, { useEffect, useState } from 'react';
import { GraduationCap, MapPin, Phone, Mail, CheckCircle, Plus } from 'lucide-react';
import { DataTable, Column } from '../components/DataTable';
import { Modal } from '../components/Modal';
import { api } from '../services/api';
import { College } from '../types';

export const CollegesPage: React.FC = () => {
  const [colleges, setColleges] = useState<College[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    address: '',
    latitude: 28.5355,
    longitude: 77.391,
    service_radius_km: 10.0,
    contact_email: '',
    contact_phone: '',
  });

  const fetchColleges = async () => {
    try {
      const res = await api.get('/catalog/colleges');
      if (res.data.success) {
        setColleges(res.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchColleges();
  }, []);

  const handleCreateCollege = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/catalog/colleges', formData);
      setModalOpen(false);
      fetchColleges();
    } catch (err) {
      console.error(err);
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
      header: 'Service Radius',
      accessor: (c) => (
        <span className="font-semibold text-emerald-400">
          {c.service_radius_km} km Geofence
        </span>
      ),
    },
    {
      header: 'Contact Info',
      accessor: (c) => (
        <div className="space-y-0.5 text-[11px] text-slate-300">
          <p className="flex items-center gap-1"><Mail className="w-3 h-3 text-slate-500" /> {c.contact_email}</p>
          <p className="flex items-center gap-1"><Phone className="w-3 h-3 text-slate-500" /> {c.contact_phone}</p>
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: (c) => (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
          <CheckCircle className="w-3 h-3" /> Active
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Registered Colleges & Campuses</h2>
          <p className="text-xs text-slate-400 mt-1">
            Manage college partner hubs and configured operational service areas
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-emerald-600/20 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add College</span>
        </button>
      </div>

      <DataTable
        columns={columns}
        data={colleges}
        searchFilter={(c, q) => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)}
      />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Register New College / Campus">
        <form onSubmit={handleCreateCollege} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-medium mb-1">College Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-emerald-500"
              placeholder="Apex Institute of Technology"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">College Code</label>
              <input
                type="text"
                required
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-emerald-500"
                placeholder="APEX-NCR"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">Service Radius (km)</label>
              <input
                type="number"
                step="0.5"
                required
                value={formData.service_radius_km}
                onChange={(e) => setFormData({ ...formData, service_radius_km: parseFloat(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-emerald-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-slate-300 font-medium mb-1">Campus Address</label>
            <input
              type="text"
              required
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-emerald-500"
              placeholder="Sector 125, Noida, UP"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Contact Email</label>
              <input
                type="email"
                required
                value={formData.contact_email}
                onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">Contact Phone</label>
              <input
                type="text"
                required
                value={formData.contact_phone}
                onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-emerald-500"
              />
            </div>
          </div>
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-lg shadow-emerald-600/20 transition"
            >
              Save College
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
