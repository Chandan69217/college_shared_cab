import React, { useEffect, useState } from 'react';
import { Car, ShieldCheck, Plus, CheckCircle, AlertCircle } from 'lucide-react';
import { DataTable, Column } from '../components/DataTable';
import { Modal } from '../components/Modal';
import { api } from '../services/api';
import { Vehicle } from '../types';

export const VehiclesPage: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    college_id: '11111111-1111-1111-1111-111111111111',
    vehicle_number: '',
    model: '',
    type: 'CAB_6',
    seating_capacity: 6,
    registration_number: '',
    insurance_validity: '2028-12-31',
    fitness_validity: '2028-12-31',
  });

  const fetchVehicles = async () => {
    try {
      const res = await api.get('/catalog/vehicles');
      if (res.data.success) {
        setVehicles(res.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/catalog/vehicles', formData);
      setModalOpen(false);
      fetchVehicles();
    } catch (err) {
      console.error(err);
    }
  };

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
      accessor: (v) => (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
          <CheckCircle className="w-3 h-3" /> {v.status}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Vehicle Fleet Inventory</h2>
          <p className="text-xs text-slate-400 mt-1">
            Registered 4-seater cabs, 6-seater MPVs, and 12-seater executive shuttles
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-emerald-600/20 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Register Vehicle</span>
        </button>
      </div>

      <DataTable
        columns={columns}
        data={vehicles}
        searchFilter={(v, q) => v.vehicle_number.toLowerCase().includes(q) || v.model.toLowerCase().includes(q)}
      />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Register Fleet Vehicle">
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
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
                  setFormData({ ...formData, type: val, seating_capacity: cap });
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
                value={formData.seating_capacity}
                onChange={(e) => setFormData({ ...formData, seating_capacity: parseInt(e.target.value) })}
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
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-emerald-500"
              placeholder="DL-VA-2024-XXXX"
            />
          </div>
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-lg shadow-emerald-600/20 transition"
            >
              Add to Active Fleet
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
