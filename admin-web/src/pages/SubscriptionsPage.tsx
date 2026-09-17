import React, { useEffect, useState } from 'react';
import { Layers, Calendar, CheckCircle, Clock, XCircle, AlertCircle, RefreshCw, Filter } from 'lucide-react';
import { DataTable, Column } from '../components/DataTable';
import { api, getApiErrorMessage } from '../services/api';
import { useToast } from '../context/ToastContext';

export const SubscriptionsPage: React.FC = () => {
  const toast = useToast();
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'PENDING_PAYMENT' | 'EXPIRED' | 'CANCELLED'>('ALL');

  const fetchSub = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/subscriptions');
      const list = res.data?.data || [];
      setSubscriptions(list);
    } catch (err: any) {
      console.error('Failed to fetch subscriptions:', err);
      toast.showError(getApiErrorMessage(err));
      setSubscriptions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSub();
  }, []);

  const filtered = subscriptions.filter((s) => {
    if (statusFilter === 'ALL') return true;
    return s.status === statusFilter;
  });

  const columns: Column<any>[] = [
    {
      header: 'Student Name & Contact',
      accessor: (s) => {
        const name = s.student?.full_name || s.student_name || s.student?.user?.full_name || 'N/A';
        const email = s.student?.email || s.student_email || s.student?.user?.email || 'N/A';
        const phone = s.student?.phone || s.student_phone || '';
        const roll = s.student?.profile?.student_id_number || s.student_id_number || '';
        return (
          <div>
            <p className="font-semibold text-white">{name}</p>
            <p className="text-[11px] text-slate-400">{email}</p>
            {(phone || roll) && (
              <p className="text-[10px] text-emerald-400 font-mono mt-0.5">
                {roll ? `ID: ${roll}` : ''} {phone ? `• ${phone}` : ''}
              </p>
            )}
          </div>
        );
      },
    },
    {
      header: 'Subscribed Plan',
      accessor: (s) => (
        <div>
          <span className="font-semibold text-emerald-400">{s.plan?.name || s.plan_name || 'Custom Pass'}</span>
          {s.plan?.price && (
            <p className="text-[11px] text-slate-400 font-mono">₹{s.plan.price}</p>
          )}
        </div>
      ),
    },
    {
      header: 'Ride Balance',
      accessor: (s) => {
        const allocated = s.total_rides_allocated || s.plan?.ride_count_total || s.rides_allocated || 1;
        const remaining = s.remaining_rides ?? s.rides_remaining ?? 0;
        const pct = Math.min(100, Math.max(0, (remaining / allocated) * 100));
        return (
          <div className="flex items-center gap-2">
            <div className="w-20 bg-slate-800 rounded-full h-2 overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-xs font-mono font-semibold text-white">
              {remaining}/{allocated}
            </span>
          </div>
        );
      },
    },
    {
      header: 'Validity Period',
      accessor: (s) => (
        <div>
          <span className="text-slate-300 text-xs font-mono">
            {s.start_date || 'N/A'} → {s.end_date || 'N/A'}
          </span>
          {s.auto_renew && (
            <p className="text-[10px] text-blue-400 flex items-center gap-1 mt-0.5">
              <RefreshCw className="w-2.5 h-2.5" /> Auto-Renew Enabled
            </p>
          )}
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: (s) => {
        const status = s.status || 'ACTIVE';
        const badges: Record<string, { color: string; icon: any }> = {
          ACTIVE: { color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: CheckCircle },
          PENDING_PAYMENT: { color: 'bg-amber-500/10 text-amber-400 border-amber-500/20', icon: Clock },
          EXPIRED: { color: 'bg-slate-800 text-slate-400 border-slate-700', icon: AlertCircle },
          CANCELLED: { color: 'bg-rose-500/10 text-rose-400 border-rose-500/20', icon: XCircle },
        };
        const badge = badges[status] || badges.ACTIVE;
        const Icon = badge.icon;
        return (
          <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${badge.color}`}>
            <Icon className="w-3 h-3" /> {status}
          </span>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Student Subscriptions Ledger</h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time tracking of active memberships, validity windows, and consumed ride allowances
          </p>
        </div>
        <button
          onClick={fetchSub}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-2 rounded-xl overflow-x-auto">
        <span className="text-xs text-slate-500 px-2 flex items-center gap-1">
          <Filter className="w-3.5 h-3.5" /> Status:
        </span>
        {(['ALL', 'ACTIVE', 'PENDING_PAYMENT', 'EXPIRED', 'CANCELLED'] as const).map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
              statusFilter === st
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {st.replace('_', ' ')}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400">Loading subscriptions...</div>
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          searchPlaceholder="Search by student name, email, plan, or phone..."
          searchFilter={(s, q) => {
            const name = s.student?.full_name || s.student_name || s.student?.user?.full_name || '';
            const email = s.student?.email || s.student_email || s.student?.user?.email || '';
            const planName = s.plan?.name || s.plan_name || '';
            const phone = s.student?.phone || s.student_phone || '';
            return (
              name.toLowerCase().includes(q) ||
              email.toLowerCase().includes(q) ||
              planName.toLowerCase().includes(q) ||
              phone.toLowerCase().includes(q)
            );
          }}
        />
      )}
    </div>
  );
};
