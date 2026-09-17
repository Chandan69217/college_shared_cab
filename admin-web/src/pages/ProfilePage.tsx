import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User as UserIcon,
  Mail,
  Phone,
  Shield,
  Key,
  Calendar,
  Building,
  Edit3,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Eye,
  EyeOff,
  Save,
  X,
} from 'lucide-react';
import { api, getApiErrorMessage } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Modal } from '../components/Modal';

export const ProfilePage: React.FC = () => {
  const { user: authUser, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState<any>(null);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Edit Profile Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    full_name: '',
    phone: '',
    email: '',
    department: '',
    profile_photo_url: '',
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  // Change Password State
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  // Delete Account Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/profile');
      if (res.data?.success) {
        setProfileData(res.data.data);
        const u = res.data.data.user;
        const p = res.data.data.profile;
        setEditFormData({
          full_name: u.full_name || '',
          phone: u.phone || '',
          email: u.email || '',
          department: p?.department || 'Operations',
          profile_photo_url: u.avatar_url || '',
        });
      }
    } catch (err: any) {
      const msg = getApiErrorMessage(err);
      setError(msg);
      toast.showError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditLoading(true);
    setEditError('');

    try {
      const res = await api.put('/profile', editFormData);
      if (res.data?.success) {
        setProfileData(res.data.data);
        setIsEditModalOpen(false);
        const successText = 'Your profile information has been updated successfully.';
        setSuccessMessage(successText);
        toast.showSuccess(successText);
        setTimeout(() => setSuccessMessage(''), 4000);
      }
    } catch (err: any) {
      const msg = getApiErrorMessage(err);
      setEditError(msg);
      toast.showError(msg);
    } finally {
      setEditLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      const errText = 'New password and confirm password do not match.';
      setPasswordError(errText);
      toast.showError(errText);
      return;
    }
    if (passwordData.newPassword.length < 8) {
      const errText = 'New password must be at least 8 characters long.';
      setPasswordError(errText);
      toast.showError(errText);
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await api.post('/auth/change-password', passwordData);
      if (res.data?.success) {
        const successText = 'Password changed successfully.';
        setPasswordSuccess(successText);
        toast.showSuccess(successText);
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setTimeout(() => setPasswordSuccess(''), 4000);
      }
    } catch (err: any) {
      const msg = getApiErrorMessage(err);
      setPasswordError(msg);
      toast.showError(msg);
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE PERMANENTLY') {
      const errText = 'Please type "DELETE PERMANENTLY" exactly to confirm.';
      setDeleteError(errText);
      toast.showError(errText);
      return;
    }

    setDeleteLoading(true);
    setDeleteError('');
    try {
      const res = await api.delete('/profile');
      if (res.data?.success) {
        toast.showSuccess('Administrator account deleted successfully.');
        logout();
        navigate('/login');
      }
    } catch (err: any) {
      const msg = getApiErrorMessage(err);
      setDeleteError(msg);
      toast.showError(msg);
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-slate-400 text-xs flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          Loading Profile Information...
        </div>
      </div>
    );
  }

  const user = profileData?.user || authUser;
  const profile = profileData?.profile;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Administrator Profile & Security</h2>
          <p className="text-xs text-slate-400 mt-1">
            Manage your account credentials, department affiliation, and security configurations
          </p>
        </div>
        <button
          onClick={() => setIsEditModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-600/20 transition self-start sm:self-auto"
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>Edit Profile</span>
        </button>
      </div>

      {error && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Grid: Profile Overview & Change Password */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center flex flex-col items-center">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white text-3xl font-extrabold shadow-xl shadow-emerald-500/20 mb-4 border border-emerald-400/30">
            {user?.full_name?.charAt(0) || 'A'}
          </div>
          <h3 className="text-base font-bold text-white">{user?.full_name}</h3>
          <p className="text-xs text-emerald-400 font-medium mt-0.5">{profile?.department || 'Operations Management'}</p>

          <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950 border border-slate-800 text-[11px] text-slate-300">
            <Shield className="w-3 h-3 text-emerald-400" />
            <span className="font-semibold uppercase tracking-wider">{user?.role}</span>
          </div>

          <div className="w-full mt-6 pt-6 border-t border-slate-800 space-y-3 text-left text-xs">
            <div className="flex items-center gap-2.5 text-slate-400">
              <Mail className="w-4 h-4 text-slate-500 shrink-0" />
              <span className="truncate text-slate-200">{user?.email}</span>
            </div>
            <div className="flex items-center gap-2.5 text-slate-400">
              <Phone className="w-4 h-4 text-slate-500 shrink-0" />
              <span className="text-slate-200">{user?.phone || 'No phone set'}</span>
            </div>
            <div className="flex items-center gap-2.5 text-slate-400">
              <Building className="w-4 h-4 text-slate-500 shrink-0" />
              <span className="text-slate-200">{profile?.department || 'Operations'}</span>
            </div>
            <div className="flex items-center gap-2.5 text-slate-400">
              <Calendar className="w-4 h-4 text-slate-500 shrink-0" />
              <span className="text-slate-200">
                Joined: {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Change Password & Security Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Change Password Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-1">
              <Key className="w-4 h-4 text-emerald-400" />
              <span>Change Password</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Update your password regularly to keep your administrative account secure
            </p>

            {passwordError && (
              <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs">
                {passwordError}
              </div>
            )}

            {passwordSuccess && (
              <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>{passwordSuccess}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Current Password *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showCurrentPass ? 'text' : 'password'}
                    required
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    placeholder="Enter your current password"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-10 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">New Password *</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showNewPass ? 'text' : 'password'}
                      required
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      placeholder="Min. 8 characters"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-10 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPass(!showNewPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                    >
                      {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Confirm New Password *</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      placeholder="Re-enter new password"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
                <p className="font-semibold text-slate-300">Password Requirements:</p>
                <p>• At least 8 characters</p>
                <p>• Must include uppercase, lowercase, numbers, and special characters</p>
                <p>• Cannot be the same as your current password</p>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-lg shadow-emerald-600/20 transition disabled:opacity-50 flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{passwordLoading ? 'Updating Password...' : 'Change Password'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Danger Zone: Account Deletion */}
          <div className="bg-slate-900 border border-rose-500/20 rounded-2xl p-6">
            <h3 className="text-sm font-bold text-rose-400 flex items-center gap-2 mb-1">
              <AlertTriangle className="w-4 h-4" />
              <span>Danger Zone</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Permanent account deletion will invalidate all active sessions and purge administrator profile access.
            </p>
            <button
              type="button"
              onClick={() => {
                setDeleteConfirmText('');
                setDeleteError('');
                setIsDeleteModalOpen(true);
              }}
              className="px-4 py-2 bg-rose-600/10 hover:bg-rose-600 border border-rose-500/30 hover:border-transparent text-rose-400 hover:text-white rounded-xl text-xs font-semibold transition flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Administrator Account</span>
            </button>
          </div>
        </div>
      </div>

      {/* EDIT PROFILE MODAL */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Administrator Profile"
      >
        <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs">
          {editError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs">
              {editError}
            </div>
          )}

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Full Name *</label>
            <input
              type="text"
              required
              value={editFormData.full_name}
              onChange={(e) => setEditFormData({ ...editFormData, full_name: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Email Address *</label>
              <input
                type="email"
                required
                value={editFormData.email}
                onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Mobile Phone Number *</label>
              <input
                type="tel"
                required
                value={editFormData.phone}
                onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Department</label>
            <input
              type="text"
              value={editFormData.department}
              onChange={(e) => setEditFormData({ ...editFormData, department: e.target.value })}
              placeholder="e.g. Operations, Transit Logistics"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={editLoading}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition disabled:opacity-50"
            >
              {editLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* DELETE ACCOUNT CONFIRMATION MODAL */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Permanent Account Deletion"
      >
        <div className="space-y-4 text-xs">
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 space-y-2">
            <p className="font-bold flex items-center gap-1.5 text-rose-400">
              <AlertTriangle className="w-4 h-4" /> Warning: This action is permanent!
            </p>
            <p>
              Deleting your account will permanently revoke your administrator access, invalidate your active sessions,
              and purge profile records.
            </p>
          </div>

          {deleteError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs">
              {deleteError}
            </div>
          )}

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Type <span className="font-mono text-rose-400 select-all font-bold">DELETE PERMANENTLY</span> to confirm:
            </label>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="DELETE PERMANENTLY"
              className="w-full bg-slate-950 border border-rose-500/30 rounded-xl p-2.5 text-white focus:outline-none focus:border-rose-500 font-mono text-xs"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsDeleteModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={deleteLoading || deleteConfirmText !== 'DELETE PERMANENTLY'}
              onClick={handleDeleteAccount}
              className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold transition disabled:opacity-40"
            >
              {deleteLoading ? 'Deleting Account...' : 'Permanently Delete'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
