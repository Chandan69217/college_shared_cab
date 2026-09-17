import React, { useEffect, useState } from 'react';
import { CalendarCheck, MapPin, Route, CheckCircle, XCircle, RefreshCw, Filter } from 'lucide-react';
import { DataTable, Column } from '../components/DataTable';
import { api, getApiErrorMessage } from '../services/api';
import { useToast } from '../context/ToastContext';

export const BookingsPage: React.FC = () => {
  const toast = useToast();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED'>('ALL');

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/bookings');
      if (res.data.success) {
        setBookings(res.data.data || []);
      }
    } catch (err: any) {
      console.error('Failed to fetch bookings:', err);
      toast.showError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const filtered = bookings.filter((b) => {
    if (statusFilter === 'ALL') return true;
    return b.status === statusFilter;
  });

  const columns: Column<any>[] = [
    {
      header: 'Student Name & Contact',
      accessor: (b) => {
        const student = b.student || {};
        const profile = student.profile || {};
        const name = student.full_name || b.student_name || 'Student';
        const email = student.email || b.student_email || '';
        const phone = student.phone || b.student_phone || '';
        const roll = profile.student_id_number || profile.roll_number || b.student_id_number || '';
        return (
          <div>
            <p className="font-semibold text-white">{name}</p>
            <p className="text-[11px] text-slate-400">{email || phone}</p>
            {roll && (
              <span className="inline-block text-[10px] text-emerald-400 font-mono mt-0.5">
                ID: {roll}
              </span>
            )}
          </div>
        );
      },
    },
    {
      header: 'Route & Pickup Point',
      accessor: (b) => {
        const routeName = b.route?.name || b.route_name || 'Assigned Route';
        const pickupName = b.pickup_point?.name || b.pickup?.name || b.pickup_name || 'Designated Stop';
        const pickupAddr = b.pickup_point?.address || '';
        return (
          <div>
            <p className="font-medium text-slate-200">{routeName}</p>
            <p className="text-[11px] text-emerald-400 flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3 shrink-0" /> {pickupName}
            </p>
            {pickupAddr && <p className="text-[10px] text-slate-500">{pickupAddr}</p>}
          </div>
        );
      },
    },
    {
      header: 'Date & Slot',
      accessor: (b) => (
        <div>
          <p className="font-mono text-slate-200">{b.booking_date || 'N/A'}</p>
          <p className="text-[11px] text-slate-400">
            {b.trip_type === 'MORNING_PICKUP' ? '🌅 Morning Shift' : '🌆 Evening Return'}
          </p>
        </div>
      ),
    },
    {
      header: 'Allocated Seat',
      accessor: (b) => (
        <span className="font-bold text-white font-mono px-2.5 py-1 rounded bg-slate-800 border border-slate-700">
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
              : b.status === 'CANCELLED'
              ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
              : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Daily Ride Bookings Ledger</h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time seat reservations, anti-overbooking capacity control, and trip allocations
          </p>
        </div>
        <button
          onClick={fetchBookings}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-2 rounded-xl overflow-x-auto">
        <span className="text-xs text-slate-500 px-2 flex items-center gap-1">
          <Filter className="w-3.5 h-3.5" /> Filter:
        </span>
        {(['ALL', 'CONFIRMED', 'CANCELLED', 'COMPLETED'] as const).map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
              statusFilter === st
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400">Loading bookings ledger...</div>
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          searchPlaceholder="Search booking by student name, email, route, or stop..."
          searchFilter={(b, q) => {
            const studentName = b.student?.full_name || b.student_name || '';
            const studentEmail = b.student?.email || b.student_email || '';
            const routeName = b.route?.name || b.route_name || '';
            const pickupName = b.pickup_point?.name || b.pickup_name || '';
            return (
              studentName.toLowerCase().includes(q) ||
              studentEmail.toLowerCase().includes(q) ||
              routeName.toLowerCase().includes(q) ||
              pickupName.toLowerCase().includes(q)
            );
          }}
        />
      )}
    </div>
  );
};
