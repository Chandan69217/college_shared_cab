import React, { useEffect, useState } from 'react';
import { Layers, Calendar, CheckCircle } from 'lucide-react';
import { DataTable, Column } from '../components/DataTable';
import { api } from '../services/api';

export const SubscriptionsPage: React.FC = () => {
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSub = async () => {
      try {
        const res = await api.get('/admin/subscriptions');
        const list = res.data?.data || [];
        setSubscriptions(list);
      } catch (err) {
        console.error('Failed to fetch subscriptions:', err);
        setSubscriptions([]);
      } finally {
        setLoading(false);
      }
    };
    fetchSub();
  }, []);

  const columns: Column<any>[] = [
    {
      header: 'Student Name & Email',
      accessor: (s) => {
        const name = s.student?.user?.full_name || s.student_name || 'N/A';
        const email = s.student?.user?.email || s.student_email || 'N/A';
        return (
          <div>
            <p className="font-semibold text-white">{name}</p>
            <p className="text-[11px] text-slate-400">{email}</p>
          </div>
        );
      },
    },
    {
      header: 'Subscribed Plan',
      accessor: (s) => (
        <span className="font-semibold text-emerald-400">{s.plan?.name || s.plan_name || 'Custom Plan'}</span>
      ),
    },
    {
      header: 'Ride Balance',
      accessor: (s) => {
        const allocated = s.rides_allocated || s.plan?.total_rides || s.rides_remaining || 1;
        const remaining = s.rides_remaining ?? 0;
        const pct = Math.min(100, Math.max(0, (remaining / allocated) * 100));
        return (
          <div className="flex items-center gap-2">
            <div className="w-24 bg-slate-800 rounded-full h-2 overflow-hidden">
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
        <span className="text-slate-300 text-xs font-mono">
          {s.start_date || 'N/A'} → {s.end_date || 'N/A'}
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: (s) => (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
          <CheckCircle className="w-3 h-3" /> {s.status || 'ACTIVE'}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Active Student Subscriptions</h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time tracking of active memberships, validity windows, and consumed ride allowances
          </p>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400">Loading subscriptions...</div>
      ) : (
        <DataTable
          columns={columns}
          data={subscriptions}
          searchFilter={(s, q) => {
            const name = s.student?.user?.full_name || s.student_name || '';
            const email = s.student?.user?.email || s.student_email || '';
            return name.toLowerCase().includes(q) || email.toLowerCase().includes(q);
          }}
        />
      )}
    </div>
  );
};
