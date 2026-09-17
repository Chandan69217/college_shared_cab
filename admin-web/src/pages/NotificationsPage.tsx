import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Bell,
  Send,
  Radio,
  Users,
  ShieldCheck,
  Building2,
  Route,
  AlertTriangle,
  CheckCircle2,
  CheckCheck,
  Clock,
  Filter,
  RefreshCw,
  Plus,
  Search,
  Check,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { api, getApiErrorMessage } from '../services/api';
import { useToast } from '../context/ToastContext';
import { Modal } from '../components/Modal';

interface NotificationDelivery {
  id: string;
  user_id: string;
  recipient_role: string;
  title: string;
  message: string;
  type: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';
  is_read: boolean;
  read_at: string | null;
  created_at: string;
  user?: {
    id: string;
    full_name: string;
    email: string;
    role: string;
  };
}

export const NotificationsPage: React.FC = () => {
  const toast = useToast();
  const [notifications, setNotifications] = useState<NotificationDelivery[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<NotificationDelivery | null>(null);
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  
  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'UNREAD' | 'READ'>('ALL');
  const [stats, setStats] = useState({
    total: 0,
    unreadCount: 0,
    readCount: 0,
    criticalCount: 0,
  });

  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Form State for Broadcast Announcement
  const [broadcastForm, setBroadcastForm] = useState({
    title: '',
    message: '',
    type: 'SYSTEM_ANNOUNCEMENT',
    scope: 'ALL' as 'ALL' | 'STUDENTS' | 'DRIVERS' | 'COLLEGE' | 'ROUTE' | 'SPECIFIC_USER',
    targetId: '',
    priority: 'NORMAL' as 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL',
  });

  // Reference data for dropdowns
  const [colleges, setColleges] = useState<Array<{ id: string; name: string; code: string }>>([]);
  const [routes, setRoutes] = useState<Array<{ id: string; name: string }>>([]);

  const fetchReferenceData = async () => {
    try {
      const [collegesRes, routesRes] = await Promise.all([
        api.get('/colleges').catch(() => null),
        api.get('/routes').catch(() => null),
      ]);
      if (collegesRes?.data?.data) {
        setColleges(collegesRes.data.data);
      }
      if (routesRes?.data?.data) {
        setRoutes(routesRes.data.data);
      }
    } catch (_) {}
  };

  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const params: Record<string, any> = {
        page,
        limit,
      };
      if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
      if (roleFilter !== 'ALL') params.role = roleFilter;
      if (priorityFilter !== 'ALL') params.priority = priorityFilter;
      if (statusFilter === 'UNREAD') params.isRead = false;
      if (statusFilter === 'READ') params.isRead = true;

      const res = await api.get('/admin/notifications', { params });
      if (res.data?.success && res.data?.data) {
        setNotifications(res.data.data.notifications || []);
        const pagination = res.data.data.pagination;
        setTotalCount(pagination?.total ?? res.data.data.total ?? 0);
        setTotalPages(pagination?.totalPages || 1);
        if (res.data.data.stats) {
          setStats(res.data.data.stats);
        }
      }
    } catch (err: any) {
      const msg = getApiErrorMessage(err);
      setErrorMessage(msg);
      toast.showError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, debouncedSearch, roleFilter, priorityFilter, statusFilter, toast]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    fetchReferenceData();
  }, []);

  const handleMarkAllAsRead = async () => {
    if (isMarkingAll) return;
    setIsMarkingAll(true);
    try {
      const res = await api.post('/notifications/read-all');
      if (res.data?.success) {
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
        );
        setStats((prev) => ({
          ...prev,
          unreadCount: 0,
          readCount: prev.total,
        }));
        toast.showSuccess('All notifications marked as read.');
      }
    } catch (err: any) {
      toast.showError(getApiErrorMessage(err));
    } finally {
      setIsMarkingAll(false);
    }
  };

  const handleMarkSingleAsRead = async (notification: NotificationDelivery, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (notification.is_read) return;

    // Optimistic UI update
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === notification.id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n
      )
    );
    setStats((prev) => ({
      ...prev,
      unreadCount: Math.max(0, prev.unreadCount - 1),
      readCount: prev.readCount + 1,
    }));

    try {
      await api.post(`/notifications/${notification.id}/read`);
    } catch (err: any) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const handleRowClick = (notification: NotificationDelivery) => {
    if (!notification.is_read) {
      handleMarkSingleAsRead(notification);
    }
    setSelectedNotification(notification);
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastForm.title.trim() || !broadcastForm.message.trim()) {
      const errText = 'Please provide both an announcement title and message content.';
      setErrorMessage(errText);
      toast.showError(errText);
      return;
    }

    if (
      (broadcastForm.scope === 'COLLEGE' || broadcastForm.scope === 'ROUTE' || broadcastForm.scope === 'SPECIFIC_USER') &&
      !broadcastForm.targetId.trim()
    ) {
      const errText = `Please select or specify a target ID for scope: ${broadcastForm.scope}.`;
      setErrorMessage(errText);
      toast.showError(errText);
      return;
    }

    setIsSending(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const payload: any = {
        title: broadcastForm.title.trim(),
        message: broadcastForm.message.trim(),
        type: broadcastForm.type,
        scope: broadcastForm.scope,
        priority: broadcastForm.priority,
      };

      if (broadcastForm.targetId.trim()) {
        payload.targetId = broadcastForm.targetId.trim();
      }

      const res = await api.post('/admin/notifications', payload);
      if (res.data?.success) {
        const count = res.data.data?.notificationsSent || res.data.data?.recipientsCount || 0;
        const successText = `Broadcast sent successfully to ${count} recipient(s).`;
        setSuccessMessage(successText);
        toast.showSuccess(successText);
        setShowBroadcastModal(false);
        setBroadcastForm({
          title: '',
          message: '',
          type: 'SYSTEM_ANNOUNCEMENT',
          scope: 'ALL',
          targetId: '',
          priority: 'NORMAL',
        });
        setPage(1);
        fetchNotifications();
      }
    } catch (err: any) {
      const msg = getApiErrorMessage(err);
      setErrorMessage(msg);
      toast.showError(msg);
    } finally {
      setIsSending(false);
    }
  };

  const getPriorityBadgeClass = (priority: string) => {
    switch (priority) {
      case 'CRITICAL':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'HIGH':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'LOW':
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
      default:
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    }
  };

  // Generate pagination pill array with smart windowing
  const getPaginationItems = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (page <= 4) {
      return [1, 2, 3, 4, 5, '...', totalPages];
    }
    if (page >= totalPages - 3) {
      return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }
    return [1, '...', page - 1, page, page + 1, '...', totalPages];
  };

  return (
    <div className="space-y-6">
      {/* Page Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Bell className="w-6 h-6 text-emerald-400" />
            Notification Center & Broadcasts
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Dispatch urgent system announcements and monitor real-time message delivery across students, drivers, and campus staff.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={fetchNotifications}
            className="px-3 py-2 bg-slate-900 border border-slate-800 text-slate-300 rounded-lg hover:bg-slate-800 transition flex items-center gap-2 text-xs font-medium"
            title="Refresh feed"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
            Refresh
          </button>
          <button
            onClick={handleMarkAllAsRead}
            disabled={isMarkingAll || stats.unreadCount === 0}
            className="px-3.5 py-2 bg-slate-900 border border-slate-800 hover:border-emerald-500/40 text-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition flex items-center gap-2 text-xs font-semibold"
            title="Mark all notifications as read"
          >
            {isMarkingAll ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <CheckCheck className="w-4 h-4" />
            )}
            <span>Mark All Read</span>
          </button>
          <button
            onClick={() => {
              setErrorMessage(null);
              setSuccessMessage(null);
              setShowBroadcastModal(true);
            }}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition flex items-center gap-2 text-xs font-semibold shadow-lg shadow-emerald-600/20"
          >
            <Send className="w-3.5 h-3.5" />
            Send Broadcast Announcement
          </button>
        </div>
      </div>

      {/* Alerts */}
      {successMessage && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center gap-3 text-emerald-400 text-xs">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMessage}</span>
          <button onClick={() => setSuccessMessage(null)} className="ml-auto text-emerald-400 hover:text-white">
            ×
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3 text-red-400 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
          <button onClick={() => setErrorMessage(null)} className="ml-auto text-red-400 hover:text-white">
            ×
          </button>
        </div>
      )}

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400">Total Notifications</p>
            <p className="text-xl font-bold text-white mt-1">{stats.total}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Radio className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400">Unread Receipts</p>
            <p className="text-xl font-bold text-amber-400 mt-1">{stats.unreadCount}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400">Read / Confirmed</p>
            <p className="text-xl font-bold text-emerald-400 mt-1">{stats.readCount}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Check className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400">High / Critical Priority</p>
            <p className="text-xl font-bold text-red-400 mt-1">{stats.criticalCount}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col lg:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
          <input
            type="text"
            placeholder="Search notifications by title or message..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setPage(1);
              }}
              className="absolute right-3 top-2.5 text-xs text-slate-500 hover:text-white"
            >
              ×
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 w-full lg:w-auto flex-wrap">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5">
            <span className="text-xs text-slate-400">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as any);
                setPage(1);
              }}
              className="bg-transparent text-xs text-white focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-slate-900">All Statuses</option>
              <option value="UNREAD" className="bg-slate-900">Unread Only</option>
              <option value="READ" className="bg-slate-900">Read / Confirmed</option>
            </select>
          </div>

          {/* Role Filter */}
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs text-slate-400">Role:</span>
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
              className="bg-transparent text-xs text-white focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-slate-900">All Roles</option>
              <option value="STUDENT" className="bg-slate-900">Students</option>
              <option value="DRIVER" className="bg-slate-900">Drivers</option>
              <option value="ADMIN" className="bg-slate-900">Admins</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5">
            <span className="text-xs text-slate-400">Priority:</span>
            <select
              value={priorityFilter}
              onChange={(e) => {
                setPriorityFilter(e.target.value);
                setPage(1);
              }}
              className="bg-transparent text-xs text-white focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-slate-900">All Priorities</option>
              <option value="LOW" className="bg-slate-900">Low</option>
              <option value="NORMAL" className="bg-slate-900">Normal</option>
              <option value="HIGH" className="bg-slate-900">High</option>
              <option value="CRITICAL" className="bg-slate-900">Critical</option>
            </select>
          </div>
        </div>
      </div>

      {/* Notifications Table Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/50 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Event Type</th>
                <th className="py-3 px-4">Recipient</th>
                <th className="py-3 px-4">Title & Details</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Delivered At</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                      Loading notifications...
                    </div>
                  </td>
                </tr>
              ) : notifications.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    No notification records found matching your query or filter criteria.
                  </td>
                </tr>
              ) : (
                notifications.map((n) => (
                  <tr
                    key={n.id}
                    onClick={() => handleRowClick(n)}
                    className={`cursor-pointer transition group ${
                      !n.is_read
                        ? 'bg-emerald-950/10 hover:bg-emerald-900/20'
                        : 'hover:bg-slate-800/40'
                    }`}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {!n.is_read && (
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                        )}
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                          {n.type}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-semibold text-white group-hover:text-emerald-300 transition">
                          {n.user?.full_name || 'System Broadcast'}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {n.recipient_role} {n.user?.email ? `• ${n.user.email}` : ''}
                        </p>
                      </div>
                    </td>
                    <td className="py-3 px-4 max-w-md">
                      <div>
                        <p className={`font-medium ${!n.is_read ? 'text-white font-semibold' : 'text-slate-200'}`}>
                          {n.title}
                        </p>
                        <p className="text-slate-400 text-[11px] line-clamp-2 mt-0.5 leading-relaxed">
                          {n.message}
                        </p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getPriorityBadgeClass(n.priority)}`}>
                        {n.priority}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {n.is_read ? (
                        <span className="flex items-center gap-1.5 text-emerald-400 text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Read
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-amber-400 text-[11px] font-medium">
                          <Clock className="w-3.5 h-3.5" />
                          Unread
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-[11px] whitespace-nowrap">
                      {new Date(n.created_at).toLocaleString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {!n.is_read ? (
                        <button
                          onClick={(e) => handleMarkSingleAsRead(n, e)}
                          className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded text-[11px] font-medium transition inline-flex items-center gap-1"
                          title="Mark as read"
                        >
                          <Check className="w-3 h-3" />
                          <span>Mark Read</span>
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-500">Viewed</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Toolbar */}
        <div className="px-4 py-3 border-t border-slate-800 bg-slate-950/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-3">
            <span>
              {totalCount === 0
                ? 'No entries found'
                : `Showing ${(page - 1) * limit + 1} - ${Math.min(page * limit, totalCount)} of ${totalCount} records`}
            </span>
            <div className="flex items-center gap-1.5 border-l border-slate-800 pl-3">
              <span className="text-[11px] text-slate-500">Per page:</span>
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
                className="bg-slate-900 border border-slate-800 rounded px-2 py-0.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(1)}
              disabled={page <= 1 || isLoading}
              className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition"
              title="First Page"
            >
              <ChevronsLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || isLoading}
              className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition"
              title="Previous Page"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            {/* Page Number Pills */}
            <div className="flex items-center gap-1 mx-1">
              {getPaginationItems().map((item, idx) =>
                typeof item === 'number' ? (
                  <button
                    key={idx}
                    onClick={() => setPage(item)}
                    disabled={isLoading}
                    className={`min-w-[28px] h-7 px-2 rounded-lg text-xs font-semibold transition ${
                      page === item
                        ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                        : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {item}
                  </button>
                ) : (
                  <span key={idx} className="px-1 text-slate-600 font-bold select-none">
                    ...
                  </span>
                )
              )}
            </div>

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || isLoading}
              className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition"
              title="Next Page"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setPage(totalPages)}
              disabled={page >= totalPages || isLoading}
              className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition"
              title="Last Page"
            >
              <ChevronsRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Selected Notification Detail Modal */}
      {selectedNotification && (
        <Modal
          isOpen={!!selectedNotification}
          onClose={() => setSelectedNotification(null)}
          title="Notification Dispatch Details"
          maxWidth="lg"
        >
          <div className="space-y-4">
            {/* Badges & Meta */}
            <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                  {selectedNotification.type}
                </span>
                <span className={`px-2.5 py-1 rounded text-xs font-bold border ${getPriorityBadgeClass(selectedNotification.priority)}`}>
                  {selectedNotification.priority} PRIORITY
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs">
                {selectedNotification.is_read ? (
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Read
                    {selectedNotification.read_at
                      ? ` (${new Date(selectedNotification.read_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`
                      : ''}
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Unread
                  </span>
                )}
              </div>
            </div>

            {/* Recipient Information Card */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-2 text-xs">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Recipient Details</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-300">
                <div>
                  <span className="text-slate-500">Name / Target: </span>
                  <span className="font-semibold text-white">
                    {selectedNotification.user?.full_name || 'System / All Target Users'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">Target Role: </span>
                  <span className="font-semibold text-emerald-400">{selectedNotification.recipient_role}</span>
                </div>
                {selectedNotification.user?.email && (
                  <div>
                    <span className="text-slate-500">Email: </span>
                    <span className="text-slate-300">{selectedNotification.user.email}</span>
                  </div>
                )}
                <div>
                  <span className="text-slate-500">Delivered: </span>
                  <span className="text-slate-300">
                    {new Date(selectedNotification.created_at).toLocaleString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            </div>

            {/* Title & Message Content */}
            <div className="space-y-2">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Message Content</p>
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                <h4 className="text-sm font-bold text-white mb-2">{selectedNotification.title}</h4>
                <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap select-all">
                  {selectedNotification.message}
                </p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <div>
                {!selectedNotification.is_read ? (
                  <button
                    onClick={() => {
                      handleMarkSingleAsRead(selectedNotification);
                      setSelectedNotification({
                        ...selectedNotification,
                        is_read: true,
                        read_at: new Date().toISOString(),
                      });
                    }}
                    className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-semibold transition flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Mark as Read
                  </button>
                ) : (
                  <span className="text-xs text-slate-500">Notification marked as read</span>
                )}
              </div>
              <button
                onClick={() => setSelectedNotification(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Broadcast Modal */}
      {showBroadcastModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
              <div className="flex items-center gap-2.5">
                <Send className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-white text-base">New System Broadcast</h3>
              </div>
              <button
                onClick={() => setShowBroadcastModal(false)}
                className="text-slate-400 hover:text-white text-lg font-semibold"
              >
                ×
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSendBroadcast} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Announcement Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Campus Route #3 Schedule Shift Today"
                  value={broadcastForm.title}
                  onChange={(e) => setBroadcastForm({ ...broadcastForm, title: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Message Content <span className="text-red-400">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Enter the complete notification message to be dispatched to app users..."
                  value={broadcastForm.message}
                  onChange={(e) => setBroadcastForm({ ...broadcastForm, message: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Target Audience Scope
                  </label>
                  <select
                    value={broadcastForm.scope}
                    onChange={(e: any) =>
                      setBroadcastForm({
                        ...broadcastForm,
                        scope: e.target.value,
                        targetId: '',
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="ALL">All Users (Students & Drivers)</option>
                    <option value="STUDENTS">All Registered Students</option>
                    <option value="DRIVERS">All Active Drivers</option>
                    <option value="COLLEGE">Specific College Campus</option>
                    <option value="ROUTE">Specific Shuttle Route</option>
                    <option value="SPECIFIC_USER">Specific Individual User ID</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Priority Level
                  </label>
                  <select
                    value={broadcastForm.priority}
                    onChange={(e: any) => setBroadcastForm({ ...broadcastForm, priority: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="LOW">Low (Informational)</option>
                    <option value="NORMAL">Normal (Standard Update)</option>
                    <option value="HIGH">High (Important Alert)</option>
                    <option value="CRITICAL">Critical (Urgent / Emergency)</option>
                  </select>
                </div>
              </div>

              {/* Dynamic Scope Target Selector */}
              {broadcastForm.scope === 'COLLEGE' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Select Target College <span className="text-red-400">*</span>
                  </label>
                  <select
                    required
                    value={broadcastForm.targetId}
                    onChange={(e) => setBroadcastForm({ ...broadcastForm, targetId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">-- Choose College Campus --</option>
                    {colleges.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.code})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {broadcastForm.scope === 'ROUTE' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Select Target Route <span className="text-red-400">*</span>
                  </label>
                  <select
                    required
                    value={broadcastForm.targetId}
                    onChange={(e) => setBroadcastForm({ ...broadcastForm, targetId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">-- Choose Shuttle Route --</option>
                    {routes.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {broadcastForm.scope === 'SPECIFIC_USER' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Target User UUID <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter valid user UUID (e.g. 123e4567-e89b-12d3-a456-426614174000)"
                    value={broadcastForm.targetId}
                    onChange={(e) => setBroadcastForm({ ...broadcastForm, targetId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowBroadcastModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSending}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition flex items-center gap-2 shadow-lg shadow-emerald-600/20"
                >
                  {isSending ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Transmitting Broadcast...
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      Dispatch Broadcast
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
