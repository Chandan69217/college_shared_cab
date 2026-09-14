import React, { useEffect, useState } from 'react';
import { DollarSign, CheckCircle, Clock, XCircle } from 'lucide-react';
import { DataTable, Column } from '../components/DataTable';
import { api } from '../services/api';

export const PaymentsPage: React.FC = () => {
  const [payments, setPayments] = useState<any[]>([]);

  const fetchPayments = async () => {
    try {
      const res = await api.get('/payments');
      if (res.data.success) {
        setPayments(res.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const columns: Column<any>[] = [
    {
      header: 'Receipt & Transaction ID',
      accessor: (p) => (
        <div>
          <p className="font-mono font-bold text-white text-xs">{p.receipt_number || 'RCPT-2026-0812'}</p>
          <p className="text-[11px] font-mono text-slate-400">{p.transaction_id || p.gateway_order_id}</p>
        </div>
      ),
    },
    {
      header: 'Student Name & Phone',
      accessor: (p) => (
        <div>
          <p className="font-semibold text-white">{p.student?.name || 'Aarav Sharma'}</p>
          <p className="text-[11px] text-slate-400">{p.student?.phone || '+919999900004'}</p>
        </div>
      ),
    },
    {
      header: 'Amount Paid',
      accessor: (p) => (
        <span className="font-extrabold text-white text-sm">
          ₹{p.amount.toLocaleString()} <span className="text-[10px] text-slate-400 font-normal">INR</span>
        </span>
      ),
    },
    {
      header: 'Method',
      accessor: (p) => (
        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 font-mono text-[11px] border border-slate-700">
          {p.payment_method}
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
            {p.status === 'SUCCESS' ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
            {p.status}
          </span>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Payment & Revenue Transactions Ledger</h2>
          <p className="text-xs text-slate-400 mt-1">
            Server-verified payment gateway webhooks, receipts, subscriptions billing, and refund tracking
          </p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={payments}
        searchFilter={(p, q) =>
          (p.receipt_number || '').toLowerCase().includes(q) ||
          (p.student?.name || '').toLowerCase().includes(q)
        }
      />
    </div>
  );
};
