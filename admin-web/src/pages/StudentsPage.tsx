import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Shield,
  Eye,
  Plus,
  Trash2,
  Edit3,
  Users,
  CheckSquare,
  Square,
  UserCheck,
  UserX,
  Filter,
  GraduationCap,
} from 'lucide-react';
import { DataTable, Column } from '../components/DataTable';
import { Modal } from '../components/Modal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { api, getApiErrorMessage } from '../services/api';
import { useToast } from '../context/ToastContext';
import { User, College } from '../types';

export const StudentsPage: React.FC = () => {
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialStatus = (searchParams.get('status')?.toUpperCase() || 'ALL') as
    | 'ALL'
    | 'VERIFIED'
    | 'PENDING'
    | 'REJECTED'
    | 'SUSPENDED';

  const [students, setStudents] = useState<User[]>([]);
  const [colleges, setColleges] = useState<College[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'VERIFIED' | 'PENDING' | 'REJECTED' | 'SUSPENDED'>(
    ['ALL', 'VERIFIED', 'PENDING', 'REJECTED', 'SUSPENDED'].includes(initialStatus) ? initialStatus : 'ALL'
  );
  const [selectedCollegeFilter, setSelectedCollegeFilter] = useState<string>('ALL');

  // Bulk Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkLoading, setBulkLoading] = useState(false);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<User | null>(null);
  const [kycStudent, setKycStudent] = useState<User | null>(null);

  const [verificationNotes, setVerificationNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    college_id: '',
    full_name: '',
    email: '',
    phone: '',
    password: '',
    student_id_number: '',
    roll_number: '',
    course: 'Computer Science & Engineering',
    semester: 1,
    status: 'ACTIVE' as 'ACTIVE' | 'PENDING' | 'SUSPENDED' | 'DEACTIVATED',
    verification_status: 'PENDING' as 'PENDING' | 'VERIFIED' | 'REJECTED' | 'SUSPENDED',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [studentsRes, collegesRes] = await Promise.all([
        api.get('/admin/students'),
        api.get('/admin/colleges'),
      ]);

      if (studentsRes.data.success) {
        setStudents(studentsRes.data.data);
      }
      if (collegesRes.data.success) {
        setColleges(collegesRes.data.data);
      }
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const s = searchParams.get('status')?.toUpperCase();
    if (s && ['ALL', 'VERIFIED', 'PENDING', 'REJECTED', 'SUSPENDED'].includes(s)) {
      setStatusFilter(s as any);
    }
    const c = searchParams.get('college_id');
    if (c) {
      setSelectedCollegeFilter(c);
    }
  }, [searchParams]);

  const showSuccess = (msg: string) => {
    toast.showSuccess(msg);
  };

  const handleOpenAdd = () => {
    setFormData({
      college_id: colleges.length > 0 ? colleges[0].id : '',
      full_name: '',
      email: '',
      phone: '',
      password: '',
      student_id_number: '',
      roll_number: '',
      course: 'Computer Science & Engineering',
      semester: 1,
      status: 'ACTIVE',
      verification_status: 'PENDING',
    });
    setError(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (student: User) => {
    setSelectedStudent(student);
    setFormData({
      college_id: student.profile?.college_id || (colleges.length > 0 ? colleges[0].id : ''),
      full_name: student.full_name || '',
      email: student.email || '',
      phone: student.phone || '',
      password: '',
      student_id_number: student.profile?.student_id_number || '',
      roll_number: student.profile?.roll_number || '',
      course: student.profile?.course || 'Computer Science & Engineering',
      semester: student.profile?.semester || 1,
      status: student.status || 'ACTIVE',
      verification_status: student.profile?.verification_status || 'PENDING',
    });
    setError(null);
    setIsEditModalOpen(true);
  };

  const handleOpenDelete = (student: User) => {
    setSelectedStudent(student);
    setError(null);
    setIsDeleteModalOpen(true);
  };

  const handleOpenKyc = (student: User) => {
    setKycStudent(student);
    setVerificationNotes(student.profile?.verification_notes || '');
    setError(null);
  };

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setError(null);
    try {
      const res = await api.post('/admin/students', {
        college_id: formData.college_id,
        full_name: formData.full_name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        student_id_number: formData.student_id_number,
        roll_number: formData.roll_number,
        course: formData.course,
        semester: Number(formData.semester),
      });

      if (res.data.success) {
        toast.success(`Student "${formData.full_name}" enrolled successfully!`);
        setIsAddModalOpen(false);
        fetchData();
      }
    } catch (err) {
      toast.error(err);
      setError(getApiErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;
    setActionLoading(true);
    setError(null);
    try {
      const res = await api.put(`/admin/students/${selectedStudent.id}`, {
        college_id: formData.college_id,
        full_name: formData.full_name,
        phone: formData.phone,
        status: formData.status,
        verification_status: formData.verification_status,
        student_id_number: formData.student_id_number,
        roll_number: formData.roll_number,
        course: formData.course,
        semester: Number(formData.semester),
      });

      if (res.data.success) {
        toast.success(`Student "${formData.full_name}" updated successfully!`);
        setIsEditModalOpen(false);
        fetchData();
      }
    } catch (err) {
      toast.error(err);
      setError(getApiErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteStudent = async () => {
    if (!selectedStudent) return;
    setActionLoading(true);
    setError(null);
    try {
      const res = await api.delete(`/admin/students/${selectedStudent.id}`);
      if (res.data.success) {
        toast.success(`Student record removed successfully.`);
        setIsDeleteModalOpen(false);
        setSelectedIds(prev => prev.filter(id => id !== selectedStudent.id));
        fetchData();
      }
    } catch (err) {
      toast.error(err);
      setError(getApiErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateKycStatus = async (status: 'VERIFIED' | 'REJECTED' | 'SUSPENDED') => {
    if (!kycStudent) return;
    setActionLoading(true);
    setError(null);
    try {
      await api.patch(`/admin/students/${kycStudent.id}/verification`, {
        status,
        notes: verificationNotes,
      });
      toast.success(`Student KYC status updated to ${status}.`);
      setKycStudent(null);
      setVerificationNotes('');
      fetchData();
    } catch (err) {
      toast.error(err);
      setError(getApiErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  const handleBulkAction = async (action: 'VERIFY' | 'SUSPEND' | 'ACTIVATE') => {
    if (selectedIds.length === 0) return;
    setBulkLoading(true);
    setError(null);
    try {
      const updates: Record<string, any> = {};
      if (action === 'VERIFY') {
        updates.verification_status = 'VERIFIED';
      } else if (action === 'SUSPEND') {
        updates.verification_status = 'SUSPENDED';
        updates.user_status = 'SUSPENDED';
      } else if (action === 'ACTIVATE') {
        updates.user_status = 'ACTIVE';
      }

      const res = await api.patch('/admin/students/bulk', {
        userIds: selectedIds,
        updates,
      });

      if (res.data.success) {
        toast.success(`Bulk updated ${selectedIds.length} student(s) successfully!`);
        setSelectedIds([]);
        fetchData();
      }
    } catch (err) {
      toast.error(err);
      setError(getApiErrorMessage(err));
    } finally {
      setBulkLoading(false);
    }
  };

  const filteredStudents = students.filter((s) => {
    if (statusFilter !== 'ALL') {
      const vStatus = s.profile?.verification_status || 'PENDING';
      if (vStatus !== statusFilter) return false;
    }
    if (selectedCollegeFilter !== 'ALL') {
      const studentCollegeId = s.profile?.college_id || s.college?.id;
      if (studentCollegeId !== selectedCollegeFilter) return false;
    }
    return true;
  });

  const columns: Column<User>[] = [
    {
      header: '',
      className: 'w-10 text-center',
      accessor: (s) => (
        <input
          type="checkbox"
          checked={selectedIds.includes(s.id)}
          onChange={(e) => {
            if (e.target.checked) {
              setSelectedIds((prev) => [...prev, s.id]);
            } else {
              setSelectedIds((prev) => prev.filter((id) => id !== s.id));
            }
          }}
          className="rounded bg-slate-950 border-slate-700 text-emerald-500 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
        />
      ),
    },
    {
      header: 'Student Name & College',
      accessor: (s) => {
        const studentCollege = colleges.find((c) => c.id === s.profile?.college_id) || s.college || s.profile?.college;
        return (
          <div>
            <p className="font-semibold text-white">{s.full_name}</p>
            <p className="text-[11px] text-slate-400">{s.email}</p>
            {studentCollege && (
              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded mt-0.5 border border-emerald-500/20">
                <GraduationCap className="w-3 h-3" /> {studentCollege.name || studentCollege.code}
              </span>
            )}
          </div>
        );
      },
    },
    {
      header: 'Student ID / Roll',
      accessor: (s) => (
        <div>
          <p className="font-mono text-emerald-400 font-semibold">{s.profile?.student_id_number || 'N/A'}</p>
          <p className="text-[11px] text-slate-400">Roll: {s.profile?.roll_number || 'N/A'}</p>
        </div>
      ),
    },
    {
      header: 'Course & Semester',
      accessor: (s) => (
        <div>
          <p className="text-slate-300">{s.profile?.course || 'Undergraduate'}</p>
          <p className="text-[11px] text-slate-400">Semester {s.profile?.semester || 1}</p>
        </div>
      ),
    },
    {
      header: 'Phone',
      accessor: 'phone',
    },
    {
      header: 'Account Status',
      accessor: (s) => {
        const userStatus = s.status || 'ACTIVE';
        const color =
          userStatus === 'ACTIVE'
            ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
            : userStatus === 'SUSPENDED'
            ? 'text-rose-400 bg-rose-500/10 border-rose-500/20'
            : 'text-slate-400 bg-slate-800/40 border-slate-700';
        return (
          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${color}`}>
            {userStatus}
          </span>
        );
      },
    },
    {
      header: 'KYC Status',
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
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-500" />
            <span>Student Management & KYC Verification</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Enroll students, assign college campuses, review identity KYC documents, and manage transportation access
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-600/20 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Student</span>
        </button>
      </div>

      {/* Alert Notifications */}
      {error && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter and Bulk Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-3 rounded-xl">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <span className="text-xs text-slate-500 mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> KYC:
            </span>
            {(['ALL', 'VERIFIED', 'PENDING', 'REJECTED', 'SUSPENDED'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                  statusFilter === st
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {colleges.length > 1 && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <GraduationCap className="w-3.5 h-3.5" /> Campus:
              </span>
              <select
                value={selectedCollegeFilter}
                onChange={(e) => setSelectedCollegeFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white focus:border-emerald-500 focus:outline-none"
              >
                <option value="ALL">All Colleges</option>
                {colleges.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Bulk Action Controls */}
        {selectedIds.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
              {selectedIds.length} Selected
            </span>
            <button
              onClick={() => handleBulkAction('VERIFY')}
              disabled={bulkLoading}
              className="flex items-center gap-1 px-2.5 py-1 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-semibold transition disabled:opacity-50"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Verify All</span>
            </button>
            <button
              onClick={() => handleBulkAction('SUSPEND')}
              disabled={bulkLoading}
              className="flex items-center gap-1 px-2.5 py-1 bg-rose-700 hover:bg-rose-600 text-white rounded-lg text-xs font-semibold transition disabled:opacity-50"
            >
              <UserX className="w-3.5 h-3.5" />
              <span>Suspend All</span>
            </button>
            <button
              onClick={() => handleBulkAction('ACTIVATE')}
              disabled={bulkLoading}
              className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition disabled:opacity-50"
            >
              <span>Activate</span>
            </button>
            <button
              onClick={() => setSelectedIds([])}
              className="text-xs text-slate-500 hover:text-slate-300 px-1"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {/* Students Data Table */}
      <DataTable
        columns={columns}
        data={filteredStudents}
        searchPlaceholder="Search student by name, email, roll number, ID..."
        searchFilter={(s, q) =>
          s.full_name.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q) ||
          (s.profile?.student_id_number || '').toLowerCase().includes(q) ||
          (s.profile?.roll_number || '').toLowerCase().includes(q) ||
          (s.phone || '').toLowerCase().includes(q)
        }
        actions={(s) => (
          <div className="flex items-center justify-end gap-1.5">
            <button
              onClick={() => handleOpenKyc(s)}
              title="Review KYC Documents"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 text-xs font-medium border border-emerald-500/20 transition"
            >
              <Eye className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">KYC</span>
            </button>
            <button
              onClick={() => handleOpenEdit(s)}
              title="Edit Student Profile & College"
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleOpenDelete(s)}
              title="Delete Student"
              className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      />

      {/* ADD STUDENT MODAL */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Enroll New Student"
      >
        <form onSubmit={handleCreateStudent} className="space-y-4 text-xs">
          {error && (
            <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400 text-xs">
              {error}
            </div>
          )}

          {colleges.length > 0 && (
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Associated College / Campus *</label>
              <select
                value={formData.college_id}
                onChange={(e) => setFormData({ ...formData, college_id: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-emerald-500 focus:outline-none"
              >
                {colleges.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.code} • {c.address})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="e.g. John Doe"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Email Address *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="student@college.edu"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Phone Number *</label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 9876543210"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Account Password *</label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Student ID Number</label>
              <input
                type="text"
                value={formData.student_id_number}
                onChange={(e) => setFormData({ ...formData, student_id_number: e.target.value })}
                placeholder="e.g. STU-2026-089"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">College Roll Number</label>
              <input
                type="text"
                value={formData.roll_number}
                onChange={(e) => setFormData({ ...formData, roll_number: e.target.value })}
                placeholder="e.g. CS2026-012"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Enrolled Course</label>
              <input
                type="text"
                value={formData.course}
                onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                placeholder="e.g. B.Tech Computer Science"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Semester</label>
              <select
                value={formData.semester}
                onChange={(e) => setFormData({ ...formData, semester: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-emerald-500 focus:outline-none"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                  <option key={s} value={s}>
                    Semester {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition disabled:opacity-50"
            >
              {actionLoading ? 'Enrolling...' : 'Enroll Student'}
            </button>
          </div>
        </form>
      </Modal>

      {/* EDIT STUDENT & REASSIGN COLLEGE MODAL */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Student & Reassign College"
      >
        <form onSubmit={handleUpdateStudent} className="space-y-4 text-xs">
          {error && (
            <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400 text-xs">
              {error}
            </div>
          )}

          {colleges.length > 0 && (
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <label className="block text-emerald-400 font-bold mb-1.5 flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4" /> Reassign College / Campus
              </label>
              <select
                value={formData.college_id}
                onChange={(e) => setFormData({ ...formData, college_id: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:border-emerald-500 focus:outline-none"
              >
                {colleges.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.code} • {c.service_radius_km} km radius)
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-slate-500 mt-1">
                Changing college updates the student's campus association and available transit routes.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Full Name</label>
              <input
                type="text"
                required
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Phone</label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Account Status</label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value as any })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-emerald-500 focus:outline-none"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="PENDING">PENDING</option>
                <option value="SUSPENDED">SUSPENDED</option>
                <option value="DEACTIVATED">DEACTIVATED</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">KYC Verification Status</label>
              <select
                value={formData.verification_status}
                onChange={(e) =>
                  setFormData({ ...formData, verification_status: e.target.value as any })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-emerald-500 focus:outline-none"
              >
                <option value="PENDING">PENDING</option>
                <option value="VERIFIED">VERIFIED</option>
                <option value="REJECTED">REJECTED</option>
                <option value="SUSPENDED">SUSPENDED</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Student ID Number</label>
              <input
                type="text"
                value={formData.student_id_number}
                onChange={(e) => setFormData({ ...formData, student_id_number: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Roll Number</label>
              <input
                type="text"
                value={formData.roll_number}
                onChange={(e) => setFormData({ ...formData, roll_number: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Course</label>
              <input
                type="text"
                value={formData.course}
                onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Semester</label>
              <select
                value={formData.semester}
                onChange={(e) => setFormData({ ...formData, semester: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-emerald-500 focus:outline-none"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                  <option key={s} value={s}>
                    Semester {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition disabled:opacity-50"
            >
              {actionLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* DELETE CONFIRMATION MODAL */}
      <ConfirmDialog
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteStudent}
        title="Remove Student Record"
        message={`Are you sure you want to permanently delete student "${selectedStudent?.full_name}" (${selectedStudent?.profile?.student_id_number || selectedStudent?.email})? Physical deletion will be rejected if the student has active ride bookings or an active commuter pass.`}
        confirmText="Confirm Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={actionLoading}
      />

      {/* KYC REVIEW MODAL */}
      <Modal
        isOpen={!!kycStudent}
        onClose={() => setKycStudent(null)}
        title="Student KYC & Verification Review"
      >
        {kycStudent && (
          <div className="space-y-5 text-xs">
            {error && (
              <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400 text-xs">
                {error}
              </div>
            )}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Full Name:</span>
                <span className="font-semibold text-white">{kycStudent.full_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Email:</span>
                <span className="text-slate-200">{kycStudent.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Phone:</span>
                <span className="text-slate-200">{kycStudent.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Student ID #:</span>
                <span className="font-mono text-emerald-400 font-semibold">
                  {kycStudent.profile?.student_id_number || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Course & Semester:</span>
                <span className="text-slate-200">
                  {kycStudent.profile?.course || 'N/A'}{' '}
                  {kycStudent.profile?.semester ? `(Semester ${kycStudent.profile.semester})` : ''}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Current KYC Status:</span>
                <span className="font-bold text-amber-400">
                  {kycStudent.profile?.verification_status || 'PENDING'}
                </span>
              </div>
            </div>

            {/* Document Preview Card */}
            <div className="border border-slate-800 rounded-xl p-4 bg-slate-950/60 text-center">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Attached Student ID Card / Document
              </p>
              <div className="h-28 bg-slate-800/80 rounded-lg flex flex-col items-center justify-center text-slate-400 border border-dashed border-slate-700">
                <Shield className="w-8 h-8 text-emerald-500 mb-1" />
                <span className="font-mono text-[11px]">
                  {kycStudent.profile?.id_card_url ? 'ID_Card_Document.pdf' : 'Enrollment Record Active'}
                </span>
                <span className="text-[10px] text-slate-500">Identity Cryptographically Validated</span>
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
                onClick={() => handleUpdateKycStatus('VERIFIED')}
                disabled={actionLoading}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition shadow-lg shadow-emerald-600/20 disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Approve & Verify</span>
              </button>
              <button
                onClick={() => handleUpdateKycStatus('REJECTED')}
                disabled={actionLoading}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 font-semibold border border-rose-500/30 transition disabled:opacity-50"
              >
                <XCircle className="w-4 h-4" />
                <span>Reject</span>
              </button>
              <button
                onClick={() => handleUpdateKycStatus('SUSPENDED')}
                disabled={actionLoading}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition disabled:opacity-50"
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
