import React, { useEffect, useState } from 'react';
import { Layers, Calendar, CheckCircle } from 'lucide-react';
import { DataTable, Column } from '../components/DataTable';
import { api } from '../services/api';

export const SubscriptionsPage: React.FC = () => {
  const [subscriptions, setSubscriptions] = useState<any[]>([]);

  useEffect(() => {
    // In demo, fetch student demo subscriptions
    const fetchSub = async () => {
      try {
        const res = await api.get('/plans');
        // Synthesize active subscription manifest for demo view
        setSubscriptions([
          {
            id: 'sub-demo-1',
            student_name: 'Aarav Sharma',
            student_email: 'student1@college.edu',
            plan_name: 'Standard Daily Commuter Pass',
            rides_remaining: 38,
            rides_allocated: 44,
            start_date: '2026-09-01',
            end_date: '2026-09-30',
            status: 'ACTIVE',
          },
          {
            id: 'sub-demo-2',
            student_name: 'Rohan Gupta',
            student_email: 'rohan.g@college.edu',
            plan_name: 'Premium Unlimited Pass',
            rides_remaining: 56,
            rides_allocated: 60,
            start_date: '2026-09-05',
            end_date: '2026-10-04',
            status: 'ACTIVE',
          },
        ]);
      } catch (err) {
        console.error(err);
      }
    };
    fetchSub();
  }, []);

  const columns: Column<any>[] = [
    {
      header: 'Student Name & Email',
      accessor: (s) => (
        <div>
          <p className="font-semibold text-white">{s.student_name}</p>
          <p className="text-[11px] text-slate-400">{s.student_email}</p>
        </div>
      ),
    },
    {
      header: 'Subscribed Plan',
      accessor: (s) => (
        <span className="font-semibold text-emerald-400">{s.plan_name}</span>
      ),
    },
    {
      header: 'Ride Balance',
      accessor: (s) => (
        <div className="flex items-center gap-2">
          <div className="w-24 bg-slate-800 rounded-full h-2 overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full"
              style={{ width: `${(s.rides_remaining / s.rides_allocated) * 100}%` }}
            />
          </div>
          <span className="text-xs font-mono font-semibold text-white">
            {s.rides_remaining}/{s.rides_allocated}
          </span>
        </div>
      ),
    },
    {
      header: 'Validity Period',
      accessor: (s) => (
        <span className="text-slate-300 text-xs font-mono">
          {s.start_date} → {s.end_date}
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: (s) => (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
          <CheckCircle className="w-3 h-3" /> {s.status}
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

      <DataTable
        columns={columns}
        data={subscriptions}
        searchFilter={(s, q) => s.student_name.toLowerCase().includes(q) || s.student_email.toLowerCase().includes(q)}
      />
    </div>
  );
};
