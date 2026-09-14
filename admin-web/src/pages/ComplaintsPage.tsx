import React, { useEffect, useState } from 'react';
import { MessageSquare, CheckCircle, Clock, AlertTriangle, Send } from 'lucide-react';
import { DataTable, Column } from '../components/DataTable';
import { Modal } from '../components/Modal';
import { api } from '../services/api';
import { Complaint } from '../types';

export const ComplaintsPage: React.FC = () => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [adminResponse, setAdminResponse] = useState('');
  const [status, setStatus] = useState<'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'>('RESOLVED');
  const [submitting, setSubmitting] = useState(false);

  const fetchComplaints = async () => {
    try {
      const res = await api.get('/complaints');
      if (res.data.success) {
        setComplaints(res.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaint) return;
    setSubmitting(true);
    try {
      await api.patch(`/complaints/${selectedComplaint.id}/reply`, {
        admin_response: adminResponse,
        status,
      });
      setSelectedComplaint(null);
      setAdminResponse('');
      fetchComplaints();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const columns: Column<Complaint>[] = [
    {
      header: 'Ticket # & Category',
      accessor: (c) => (
        <div>
          <p className="font-mono font-bold text-white text-xs">{c.ticket_number}</p>
          <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
            {c.category}
          </span>
        </div>
      ),
    },
    {
      header: 'Subject & Description',
      accessor: (c) => (
        <div className="max-w-md">
          <p className="font-semibold text-white truncate">{c.subject}</p>
          <p className="text-[11px] text-slate-400 line-clamp-1">{c.description}</p>
        </div>
      ),
    },
    {
      header: 'Priority',
      accessor: (c) => {
        const priorities = {
          LOW: 'text-slate-400 bg-slate-800',
          MEDIUM: 'text-amber-400 bg-amber-500/10 border border-amber-500/20',
          HIGH: 'text-orange-400 bg-orange-500/10 border border-orange-500/20',
          URGENT: 'text-rose-400 bg-rose-500/10 border border-rose-500/20 font-bold',
        };
        return (
          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${priorities[c.priority] || priorities.MEDIUM}`}>
            {c.priority}
          </span>
        );
      },
    },
    {
      header: 'Status',
      accessor: (c) => {
        const statuses = {
          OPEN: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
          IN_PROGRESS: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
          RESOLVED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
          CLOSED: 'bg-slate-800 text-slate-400 border-slate-700',
        };
        return (
          <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${statuses[c.status] || statuses.OPEN}`}>
            {c.status}
          </span>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Student Support & Grievance Redressal</h2>
          <p className="text-xs text-slate-400 mt-1">
            Support tickets, driver/vehicle complaints, payment inquiries, and resolution dispatcher
          </p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={complaints}
        searchFilter={(c, q) =>
          c.ticket_number.toLowerCase().includes(q) ||
          c.subject.toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q)
        }
        actions={(c) => (
          <button
            onClick={() => {
              setSelectedComplaint(c);
              setAdminResponse(c.admin_response || '');
              setStatus(c.status as any);
            }}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition"
          >
            Reply / Resolve
          </button>
        )}
      />

      {/* Reply Modal */}
      <Modal
        isOpen={!!selectedComplaint}
        onClose={() => setSelectedComplaint(null)}
        title={`Resolve Ticket #${selectedComplaint?.ticket_number}`}
      >
        {selectedComplaint && (
          <form onSubmit={handleReply} className="space-y-4 text-xs">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1.5">
              <p className="text-slate-400 font-medium">Category: <span className="text-white font-semibold">{selectedComplaint.category}</span></p>
              <p className="text-slate-400 font-medium">Subject: <span className="text-white font-semibold">{selectedComplaint.subject}</span></p>
              <p className="text-slate-300 pt-2 border-t border-slate-800/80">{selectedComplaint.description}</p>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Ticket Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-emerald-500"
              >
                <option value="OPEN">OPEN</option>
                <option value="IN_PROGRESS">IN PROGRESS</option>
                <option value="RESOLVED">RESOLVED</option>
                <option value="CLOSED">CLOSED</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Official Administrative Response</label>
              <textarea
                required
                rows={3}
                value={adminResponse}
                onChange={(e) => setAdminResponse(e.target.value)}
                placeholder="Explain the resolution or corrective action taken..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white placeholder-slate-500 focus:border-emerald-500"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-lg shadow-emerald-600/20 transition flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>Submit Response & Update Student</span>
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
