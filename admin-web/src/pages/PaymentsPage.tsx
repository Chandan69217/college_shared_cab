import React, { useEffect, useState } from 'react';
import { DollarSign, CheckCircle, Clock, XCircle, RefreshCw } from 'lucide-react';
import { DataTable, Column } from '../components/DataTable';
import { api, getApiErrorMessage } from '../services/api';
import { useToast } from '../context/ToastContext';

export const PaymentsPage: React.FC = () => {
  const toast = useToast();
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const res = await api.get('/payments');
      if (res.data.success) {
        setPayments(res.data.data);
      }
    } catch (err: any) {
      console.error(err);
      toast.showError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const filteredPayments = statusFilter === 'ALL'
    ? payments
    : payments.filter((p) => p.status === statusFilter);

  const columns: Column<any>[] = [
    {
      header: 'Receipt & Transaction ID',
      accessor: (p) => (
        <div>
          <p className="font-mono font-bold text-white text-xs">
            {p.receipt_number || `RCPT-${p.id.slice(0, 8).toUpperCase()}`}
          </p>
          <p className="text-[11px] font-mono text-slate-400">
            {p.transaction_id || p.gateway_payment_id || p.gateway_order_id || p.id}
          </p>
        </div>
      ),
    },
    {
      header: 'Student Name & Phone',
      accessor: (p) => (
        <div>
          <p className="font-semibold text-white">{p.student?.full_name || p.student_name || 'Student Commuter'}</p>
          <p className="text-[11px] text-slate-400">{p.student?.phone || p.student_phone || p.student?.email || 'N/A'}</p>
        </div>
      ),
    },
    {
      header: 'Plan Subscribed',
      accessor: (p) => (
        <span className="font-medium text-slate-300 text-xs">
          {p.subscription?.plan?.name || p.plan_name || 'Monthly Commute Plan'}
        </span>
      ),
    },
    {
      header: 'Amount Paid',
      accessor: (p) => (
        <span className="font-extrabold text-emerald-400 text-sm">
          ₹{(p.amount || 0).toLocaleString()} <span className="text-[10px] text-slate-400 font-normal">INR</span>
        </span>
      ),
    },
    {
      header: 'Method',
      accessor: (p) => (
        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 font-mono text-[11px] border border-slate-700">
          {p.payment_method || 'UPI'}
        </span>
      ),
    },
    {
      header: 'Payment Status',
      accessor: (p) => {
        const badges = {
          SUCCESS: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
          PENDING: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
          FAILED: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
          REFUNDED: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        };
        return (
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
              badges[p.status as keyof typeof badges] || badges.SUCCESS
            }`}
          >
            {p.status === 'SUCCESS' ? (
              <CheckCircle className="w-3 h-3" />
            ) : p.status === 'FAILED' ? (
              <XCircle className="w-3 h-3" />
            ) : (
              <Clock className="w-3 h-3" />
            )}
            {p.status}
          </span>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Payment & Revenue Transactions Ledger</h2>
          <p className="text-xs text-slate-400 mt-1">
            Server-verified payment gateway webhooks, receipts, subscriptions billing, and refund tracking
          </p>
        </div>
        <button
          onClick={fetchPayments}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition border border-slate-700"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {['ALL', 'SUCCESS', 'PENDING', 'FAILED', 'REFUNDED'].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              statusFilter === st
                ? 'bg-emerald-500 text-white'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            {st} ({st === 'ALL' ? payments.length : payments.filter((p) => p.status === st).length})
          </button>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={filteredPayments}
        searchFilter={(p, q) =>
          (p.receipt_number || '').toLowerCase().includes(q) ||
          (p.transaction_id || '').toLowerCase().includes(q) ||
          (p.student?.full_name || p.student_name || '').toLowerCase().includes(q) ||
          (p.student?.phone || '').includes(q)
        }
      />
    </div>
  );
};
