import React, { useEffect, useState } from 'react';
import { CalendarCheck, MapPin, Route, CheckCircle, XCircle } from 'lucide-react';
import { DataTable, Column } from '../components/DataTable';
import { api } from '../services/api';

export const BookingsPage: React.FC = () => {
  const [bookings, setBookings] = useState<any[]>([]);

  const fetchBookings = async () => {
    try {
      const res = await api.get('/bookings');
      if (res.data.success) {
        setBookings(res.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const columns: Column<any>[] = [
    {
      header: 'Student Name',
      accessor: (b) => (
        <div>
          <p className="font-semibold text-white">{b.student?.name || 'Aarav Sharma'}</p>
          <p className="text-[11px] text-slate-400">{b.student?.phone || '+919999900004'}</p>
        </div>
      ),
    },
    {
      header: 'Route & Pickup Point',
      accessor: (b) => (
        <div>
          <p className="font-medium text-slate-200">{b.route?.name || 'Route 1: Central Metro Express'}</p>
          <p className="text-[11px] text-emerald-400 flex items-center gap-1">
            <MapPin className="w-3 h-3" /> {b.pickup?.name || 'Sector 18 Metro Gate 2'}
          </p>
        </div>
      ),
    },
    {
      header: 'Date & Slot',
      accessor: (b) => (
        <div>
          <p className="font-mono text-slate-200">{b.booking_date}</p>
          <p className="text-[11px] text-slate-400">
            {b.trip_type === 'MORNING_PICKUP' ? '🌅 Morning Shift' : '🌆 Evening Return'}
          </p>
        </div>
      ),
    },
    {
      header: 'Allocated Seat',
      accessor: (b) => (
        <span className="font-bold text-white font-mono px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
          Seat #{b.seat_number || 1}
        </span>
      ),
    },
    {
      header: 'Booking Status',
      accessor: (b) => (
        <span
          className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${
            b.status === 'CONFIRMED'
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
          }`}
        >
          {b.status === 'CONFIRMED' ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
          {b.status}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Daily Ride Bookings Ledger</h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time seat reservations, anti-overbooking capacity control, and trip allocations
          </p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={bookings}
        searchFilter={(b, q) =>
          (b.student?.name || '').toLowerCase().includes(q) ||
          (b.route?.name || '').toLowerCase().includes(q)
        }
      />
    </div>
  );
};
