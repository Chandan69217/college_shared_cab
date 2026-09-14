import React, { useEffect, useState } from 'react';
import { Calendar, Plus, CheckCircle, AlertTriangle } from 'lucide-react';
import { DataTable, Column } from '../components/DataTable';
import { Modal } from '../components/Modal';
import { api } from '../services/api';

export const HolidaysPage: React.FC = () => {
  const [holidays, setHolidays] = useState<any[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    college_id: '11111111-1111-1111-1111-111111111111',
    holiday_date: '',
    title: '',
    holiday_type: 'COLLEGE_HOLIDAY',
    is_service_disabled: true,
  });

  const fetchHolidays = async () => {
    try {
      const res = await api.get('/holidays');
      if (res.data.success) {
        setHolidays(res.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchHolidays();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/holidays', formData);
      setModalOpen(false);
      fetchHolidays();
    } catch (err) {
      console.error(err);
    }
  };

  const columns: Column<any>[] = [
    {
      header: 'Holiday Date',
      accessor: (h) => <span className="font-mono font-bold text-white text-xs">{h.holiday_date}</span>,
    },
    {
      header: 'Title / Occasion',
      accessor: (h) => <span className="font-semibold text-slate-200">{h.title}</span>,
    },
    {
      header: 'Category',
      accessor: (h) => (
        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[11px]">
          {h.holiday_type.replace('_', ' ')}
        </span>
      ),
    },
    {
      header: 'Cab Service Status',
      accessor: (h) =>
        h.is_service_disabled ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-400 px-2.5 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20">
            🚫 Cab Service Suspended
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            ✓ Normal Service
          </span>
        ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">College Holiday Calendar & Non-Service Dates</h2>
          <p className="text-xs text-slate-400 mt-1">
            Configure exam days, gazetted holidays, and non-operational days where booking is automatically disabled
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-emerald-600/20 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add Holiday</span>
        </button>
      </div>

      <DataTable columns={columns} data={holidays} />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Add College Holiday">
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-medium mb-1">Holiday Title / Occasion</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-emerald-500"
              placeholder="e.g., Gandhi Jayanti / Mid-Semester Break"
            />
          </div>
          <div>
            <label className="block text-slate-300 font-medium mb-1">Date</label>
            <input
              type="date"
              required
              value={formData.holiday_date}
              onChange={(e) => setFormData({ ...formData, holiday_date: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-slate-300 font-medium mb-1">Holiday Type</label>
            <select
              value={formData.holiday_type}
              onChange={(e) => setFormData({ ...formData, holiday_type: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-emerald-500"
            >
              <option value="COLLEGE_HOLIDAY">College Holiday</option>
              <option value="EXAM_HOLIDAY">Exam Prep Holiday</option>
              <option value="SUNDAY">Sunday Routine</option>
              <option value="SPECIAL">Special Event</option>
            </select>
          </div>
          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="service_disabled"
              checked={formData.is_service_disabled}
              onChange={(e) => setFormData({ ...formData, is_service_disabled: e.target.checked })}
              className="rounded bg-slate-950 border-slate-800 text-emerald-500 focus:ring-emerald-500"
            />
            <label htmlFor="service_disabled" className="text-slate-300 font-medium">
              Disable student ride bookings on this date
            </label>
          </div>
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-lg shadow-emerald-600/20 transition"
            >
              Save to Academic Calendar
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
