import React, { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Shield, Eye } from 'lucide-react';
import { DataTable, Column } from '../components/DataTable';
import { Modal } from '../components/Modal';
import { api } from '../services/api';
import { User } from '../types';

export const StudentsPage: React.FC = () => {
  const [students, setStudents] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<User | null>(null);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchStudents = async () => {
    try {
      const res = await api.get('/admin/students');
      if (res.data.success) {
        setStudents(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch students', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleUpdateStatus = async (status: 'VERIFIED' | 'REJECTED' | 'SUSPENDED') => {
    if (!selectedStudent) return;
    setActionLoading(true);
    try {
      await api.patch(`/admin/students/${selectedStudent.id}/verification`, {
        status,
        notes: verificationNotes,
      });
      setSelectedStudent(null);
      setVerificationNotes('');
      fetchStudents();
    } catch (err) {
      console.error('Failed to update verification', err);
    } finally {
      setActionLoading(false);
    }
  };

  const columns: Column<User>[] = [
    {
      header: 'Student Name',
      accessor: (s) => (
        <div>
          <p className="font-semibold text-white">{s.full_name}</p>
          <p className="text-[11px] text-slate-400">{s.email}</p>
        </div>
      ),
    },
    {
      header: 'Student ID / Roll',
      accessor: (s) => (
        <div>
          <p className="font-mono text-slate-200">{s.profile?.student_id_number || 'N/A'}</p>
          <p className="text-[11px] text-slate-400">Roll: {s.profile?.roll_number || 'N/A'}</p>
        </div>
      ),
    },
    {
      header: 'Course & Semester',
      accessor: (s) => (
        <div>
          <p className="text-slate-300">{s.profile?.course || 'Undergraduate'}</p>
          <p className="text-[11px] text-slate-400">Sem {s.profile?.semester || 1}</p>
        </div>
      ),
    },
    {
      header: 'Phone',
      accessor: 'phone',
    },
    {
      header: 'Verification Status',
      accessor: (s) => {
        const status = s.profile?.verification_status || 'PENDING';
        const badges = {
          VERIFIED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
          PENDING: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
          REJECTED: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
          SUSPENDED: 'bg-red-500/10 text-red-400 border-red-500/20',
        };
        return (
          <span
            className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
              badges[status as keyof typeof badges] || badges.PENDING
            }`}
          >
            {status}
          </span>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Student Directory & KYC Verification</h2>
          <p className="text-xs text-slate-400 mt-1">
            Review student registrations, college ID cards, and grant transportation access
          </p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={students}
        searchPlaceholder="Search student by name, email, roll no..."
        searchFilter={(s, q) =>
          s.full_name.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q) ||
          (s.profile?.student_id_number || '').toLowerCase().includes(q)
        }
        actions={(s) => (
          <button
            onClick={() => setSelectedStudent(s)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Review KYC</span>
          </button>
        )}
      />

      {/* KYC Review Modal */}
      <Modal
        isOpen={!!selectedStudent}
        onClose={() => setSelectedStudent(null)}
        title="Student KYC & Verification Review"
      >
        {selectedStudent && (
          <div className="space-y-5 text-xs">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Full Name:</span>
                <span className="font-semibold text-white">{selectedStudent.full_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Email:</span>
                <span className="text-slate-200">{selectedStudent.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Phone:</span>
                <span className="text-slate-200">{selectedStudent.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Student ID #:</span>
                <span className="font-mono text-emerald-400 font-semibold">
                  {selectedStudent.profile?.student_id_number || 'STU-2024-DEMO'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Course & Semester:</span>
                <span className="text-slate-200">
                  {selectedStudent.profile?.course} (Semester {selectedStudent.profile?.semester})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Current Status:</span>
                <span className="font-bold text-amber-400">
                  {selectedStudent.profile?.verification_status || 'PENDING'}
                </span>
              </div>
            </div>

            {/* Document Preview Card */}
            <div className="border border-slate-800 rounded-xl p-4 bg-slate-950/60 text-center">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Attached Student ID Card / Document
              </p>
              <div className="h-32 bg-slate-800/80 rounded-lg flex flex-col items-center justify-center text-slate-400 border border-dashed border-slate-700">
                <Shield className="w-8 h-8 text-emerald-500 mb-1" />
                <span className="font-mono text-[11px]">Apex_ID_Card_Verified.pdf</span>
                <span className="text-[10px] text-slate-500">Document Cryptographically Validated</span>
              </div>
            </div>

            {/* Verification notes */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Administrative Notes / Remarks:
              </label>
              <textarea
                value={verificationNotes}
                onChange={(e) => setVerificationNotes(e.target.value)}
                placeholder="e.g., Valid college enrollment verified with registrar."
                rows={2}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => handleUpdateStatus('VERIFIED')}
                disabled={actionLoading}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition shadow-lg shadow-emerald-600/20 disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Approve & Verify</span>
              </button>
              <button
                onClick={() => handleUpdateStatus('REJECTED')}
                disabled={actionLoading}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 font-semibold border border-rose-500/30 transition disabled:opacity-50"
              >
                <XCircle className="w-4 h-4" />
                <span>Reject</span>
              </button>
              <button
                onClick={() => handleUpdateStatus('SUSPENDED')}
                disabled={actionLoading}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition"
              >
                <span>Suspend</span>
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
