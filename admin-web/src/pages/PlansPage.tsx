import React, { useEffect, useState } from 'react';
import {
  CreditCard,
  Check,
  Sparkles,
  Plus,
  Edit2,
  Trash2,
  Shield,
  Search,
  Filter,
  Layers,
  Zap,
  Power,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  LayoutGrid,
  Table as TableIcon,
  Clock,
  RotateCcw,
  IndianRupee,
  Building,
  GraduationCap,
} from 'lucide-react';
import { Modal } from '../components/Modal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { api, getApiErrorMessage } from '../services/api';
import { useToast } from '../context/ToastContext';
import { SubscriptionPlan, College } from '../types';

export const PlansPage: React.FC = () => {
  const toast = useToast();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [colleges, setColleges] = useState<College[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Filters & View State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCollegeFilter, setSelectedCollegeFilter] = useState<string>('ALL');
  const [selectedTierFilter, setSelectedTierFilter] = useState<string>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'GRID' | 'TABLE'>('GRID');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);

  // Feedback State
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);

  // Form State
  const initialFormState = {
    college_id: '',
    tier: 'STANDARD' as 'BASIC' | 'STANDARD' | 'PREMIUM',
    name: '',
    description: '',
    price: 2499,
    validity_days: 30,
    ride_count_total: 44,
    is_unlimited_rides: false,
    priority_booking: false,
    one_way_allowed: true,
    round_trip_allowed: true,
    cancellation_hours_limit: 2,
    cancellation_fee_percentage: 10,
    additional_ride_charge: 50,
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE' | 'ARCHIVED',
  };

  const [formData, setFormData] = useState(initialFormState);

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const [plansRes, collegesRes] = await Promise.all([
        api.get('/plans'),
        api.get('/admin/colleges').catch(() => ({ data: { success: true, data: [] } })),
      ]);

      if (plansRes.data.success) {
        setPlans(plansRes.data.data);
      }
      if (collegesRes.data.success) {
        setColleges(collegesRes.data.data || []);
      }
    } catch (err) {
      setErrorMessage(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Modal Open Handlers
  const handleOpenAdd = () => {
    const defaultCollegeId = colleges.length > 0 ? colleges[0].id : '';
    setFormData({
      ...initialFormState,
      college_id: defaultCollegeId,
    });
    setModalError(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setFormData({
      college_id: plan.college_id || (colleges.length > 0 ? colleges[0].id : ''),
      tier: plan.tier || 'STANDARD',
      name: plan.name || '',
      description: plan.description || '',
      price: Number(plan.price) || 0,
      validity_days: Number(plan.validity_days) || 30,
      ride_count_total: Number(plan.ride_count_total) || 44,
      is_unlimited_rides: Boolean(plan.is_unlimited_rides),
      priority_booking: Boolean(plan.priority_booking),
      one_way_allowed: plan.one_way_allowed ?? true,
      round_trip_allowed: plan.round_trip_allowed ?? true,
      cancellation_hours_limit: Number(plan.cancellation_hours_limit) ?? 2,
      cancellation_fee_percentage: Number(plan.cancellation_fee_percentage) ?? 10,
      additional_ride_charge: Number(plan.additional_ride_charge) ?? 50,
      status: plan.status || 'ACTIVE',
    });
    setModalError(null);
    setIsEditModalOpen(true);
  };

  const handleOpenDelete = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setModalError(null);
    setIsDeleteModalOpen(true);
  };

  // Submit Create Plan
  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      setModalError(null);

      const payload = {
        ...formData,
        price: Number(formData.price),
        validity_days: Number(formData.validity_days),
        ride_count_total: formData.is_unlimited_rides ? 9999 : Number(formData.ride_count_total),
        cancellation_hours_limit: Number(formData.cancellation_hours_limit),
        cancellation_fee_percentage: Number(formData.cancellation_fee_percentage),
        additional_ride_charge: Number(formData.additional_ride_charge),
      };

      const res = await api.post('/plans', payload);
      if (res.data.success) {
        toast.success(`Subscription plan "${formData.name}" created successfully.`);
        setIsAddModalOpen(false);
        fetchData();
      }
    } catch (err) {
      toast.error(err);
      setModalError(getApiErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  // Submit Update Plan
  const handleUpdatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan) return;
    try {
      setActionLoading(true);
      setModalError(null);

      const payload = {
        ...formData,
        price: Number(formData.price),
        validity_days: Number(formData.validity_days),
        ride_count_total: formData.is_unlimited_rides ? 9999 : Number(formData.ride_count_total),
        cancellation_hours_limit: Number(formData.cancellation_hours_limit),
        cancellation_fee_percentage: Number(formData.cancellation_fee_percentage),
        additional_ride_charge: Number(formData.additional_ride_charge),
      };

      const res = await api.patch(`/plans/${selectedPlan.id}`, payload);
      if (res.data.success) {
        toast.success(`Plan "${formData.name}" updated successfully.`);
        setIsEditModalOpen(false);
        setSelectedPlan(null);
        fetchData();
      }
    } catch (err) {
      toast.error(err);
      setModalError(getApiErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  // Quick Toggle Status
  const handleToggleStatus = async (plan: SubscriptionPlan) => {
    try {
      const nextStatus = plan.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      await api.patch(`/plans/${plan.id}`, { status: nextStatus });
      toast.success(`Plan "${plan.name}" status changed to ${nextStatus}.`);
      fetchData();
    } catch (err) {
      toast.error(err);
    }
  };

  // Submit Delete Plan
  const handleDeletePlan = async () => {
    if (!selectedPlan) return;
    try {
      setActionLoading(true);
      setModalError(null);
      await api.delete(`/plans/${selectedPlan.id}`);
      toast.success(`Plan "${selectedPlan.name}" removed successfully.`);
      setIsDeleteModalOpen(false);
      setSelectedPlan(null);
      fetchData();
    } catch (err: any) {
      toast.error(err);
      const msg = getApiErrorMessage(err);
      setModalError(msg);
    } finally {
      setActionLoading(false);
    }
  };

  // Filtered List
  const filteredPlans = plans.filter((plan) => {
    const matchesSearch =
      plan.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (plan.description && plan.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      plan.tier.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCollege =
      selectedCollegeFilter === 'ALL' || plan.college_id === selectedCollegeFilter;

    const matchesTier =
      selectedTierFilter === 'ALL' || plan.tier === selectedTierFilter;

    const matchesStatus =
      selectedStatusFilter === 'ALL' || plan.status === selectedStatusFilter;

    return matchesSearch && matchesCollege && matchesTier && matchesStatus;
  });

  // Summary Metrics
  const totalPlans = plans.length;
  const activePlans = plans.filter((p) => p.status === 'ACTIVE').length;
  const avgPrice =
    totalPlans > 0
      ? Math.round(plans.reduce((acc, p) => acc + (Number(p.price) || 0), 0) / totalPlans)
      : 0;
  const premiumCount = plans.filter((p) => p.tier === 'PREMIUM').length;
  const standardCount = plans.filter((p) => p.tier === 'STANDARD').length;
  const basicCount = plans.filter((p) => p.tier === 'BASIC').length;

  return (
    <div className="space-y-6">
      {/* Notifications */}
      {successMessage && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3.5 flex items-center gap-3 text-emerald-400 text-xs shadow-lg animate-fadeIn">
          <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3.5 flex items-center gap-3 text-rose-400 text-xs shadow-lg">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <CreditCard className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">Subscription Plans</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Configure student transit membership tiers, pricing packages, ride allowances, and cancellation policies
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchData}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white transition"
            title="Refresh Plans"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
          </button>

          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-0.5">
            <button
              onClick={() => setViewMode('GRID')}
              className={`p-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                viewMode === 'GRID' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Card Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('TABLE')}
              className={`p-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                viewMode === 'TABLE' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Data Table View"
            >
              <TableIcon className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/25 transition active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Plan</span>
          </button>
        </div>
      </div>

      {/* Analytics & Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-400">Total Plans</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Layers className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">{totalPlans}</span>
            <span className="text-[10px] text-emerald-400 font-medium">({activePlans} Active)</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-400">Average Pass Price</span>
            <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400">
              <IndianRupee className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold text-white">₹{avgPrice}</span>
            <span className="text-[10px] text-slate-400">/ pass</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-400">VIP / Premium</span>
            <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-purple-400">{premiumCount}</span>
            <span className="text-[10px] text-slate-400">Tier Plans</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-400">Standard / Basic</span>
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
              <Shield className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">{standardCount + basicCount}</span>
            <span className="text-[10px] text-slate-400">({standardCount} Std · {basicCount} Basic)</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search plans by name, tier, or perks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/60"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {colleges.length > 0 && (
            <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5">
              <Building className="w-3 h-3 text-slate-400" />
              <select
                value={selectedCollegeFilter}
                onChange={(e) => setSelectedCollegeFilter(e.target.value)}
                className="bg-transparent text-xs text-slate-300 focus:outline-none cursor-pointer"
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

          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5">
            <Filter className="w-3 h-3 text-slate-400" />
            <select
              value={selectedTierFilter}
              onChange={(e) => setSelectedTierFilter(e.target.value)}
              className="bg-transparent text-xs text-slate-300 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Tiers</option>
              <option value="PREMIUM">Premium (VIP)</option>
              <option value="STANDARD">Standard</option>
              <option value="BASIC">Basic</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5">
            <Power className="w-3 h-3 text-slate-400" />
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="bg-transparent text-xs text-slate-300 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active Only</option>
              <option value="INACTIVE">Inactive Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Content Area: Grid or Table */}
      {loading ? (
        <div className="py-16 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
          <RefreshCw className="w-6 h-6 animate-spin text-emerald-500" />
          <p className="text-xs">Loading subscription plan catalog...</p>
        </div>
      ) : filteredPlans.length === 0 ? (
        <div className="py-16 text-center text-slate-400 border border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center gap-3 bg-slate-950/40">
          <div className="p-3 rounded-full bg-slate-900 border border-slate-800 text-slate-500">
            <CreditCard className="w-6 h-6" />
          </div>
          <p className="text-sm font-medium text-slate-300">No subscription plans found</p>
          <p className="text-xs text-slate-500 max-w-sm">
            Try adjusting your search query or college/tier filters, or create a brand new plan.
          </p>
          <button
            onClick={handleOpenAdd}
            className="mt-2 flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow transition"
          >
            <Plus className="w-3.5 h-3.5" />
            Create First Plan
          </button>
        </div>
      ) : viewMode === 'GRID' ? (
        /* Plan Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filteredPlans.map((plan) => {
            const isPremium = plan.tier === 'PREMIUM';
            const isStandard = plan.tier === 'STANDARD';
            const isActive = plan.status === 'ACTIVE';
            const college = colleges.find((c) => c.id === plan.college_id);

            return (
              <div
                key={plan.id}
                className={`rounded-2xl p-6 relative flex flex-col justify-between transition-all duration-200 ${
                  isPremium
                    ? 'bg-gradient-to-b from-purple-950/40 via-slate-900 to-slate-900 border-2 border-purple-500/40 shadow-xl shadow-purple-500/10'
                    : isStandard
                    ? 'bg-gradient-to-b from-emerald-950/40 via-slate-900 to-slate-900 border-2 border-emerald-500/40 shadow-xl shadow-emerald-500/10'
                    : 'bg-gradient-to-b from-blue-950/30 via-slate-900 to-slate-900 border-2 border-blue-500/30 shadow-xl shadow-blue-500/10'
                } ${!isActive ? 'opacity-70 grayscale-[30%]' : ''}`}
              >
                {/* Ribbon Tag */}
                {isStandard && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-bold text-[10px] tracking-wider uppercase shadow-md flex items-center gap-1">
                    <Zap className="w-3 h-3 fill-slate-950" /> Most Popular
                  </div>
                )}
                {isPremium && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-purple-500 text-white font-bold text-[10px] tracking-wider uppercase shadow-md flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> VIP Unlimited
                  </div>
                )}

                <div>
                  {/* Top Bar: Title & Action Controls */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-base text-white">{plan.name}</h3>
                        {!isActive && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30 uppercase">
                            Inactive
                          </span>
                        )}
                      </div>
                      {college && (
                        <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                          <GraduationCap className="w-3 h-3 text-slate-500" />
                          <span>{college.name} ({college.code})</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleToggleStatus(plan)}
                        className={`p-1.5 rounded-lg border transition ${
                          isActive
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-rose-500/10 hover:text-rose-400 hover:border-rose-500/30'
                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-emerald-500/10 hover:text-emerald-400 hover:border-emerald-500/30'
                        }`}
                        title={isActive ? 'Deactivate Plan' : 'Activate Plan'}
                      >
                        <Power className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleOpenEdit(plan)}
                        className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 transition"
                        title="Edit Plan"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleOpenDelete(plan)}
                        className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-rose-900/30 hover:text-rose-400 border border-slate-700 hover:border-rose-500/30 text-slate-400 transition"
                        title="Delete Plan"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-slate-400 mt-2.5 min-h-[36px] line-clamp-2">
                    {plan.description || 'Configured recurring campus commute pass.'}
                  </p>

                  {/* Price & Validity */}
                  <div className="mt-4 flex items-baseline gap-1.5">
                    <span className="text-3xl font-extrabold text-white tracking-tight">₹{plan.price}</span>
                    <span className="text-xs text-slate-400">/ {plan.validity_days} Days</span>
                  </div>

                  {/* Features List */}
                  <div className="mt-5 space-y-2.5 text-xs text-slate-300">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>
                        <strong>
                          {plan.is_unlimited_rides ? 'Unlimited Rides' : `${plan.ride_count_total} Rides Included`}
                        </strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{plan.round_trip_allowed ? 'Round-trip Commutes Allowed' : 'One-way Only'}</span>
                    </div>

                    {plan.priority_booking && (
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
                        <span className="text-purple-300">Priority Seat Booking Access</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>
                        Cancel up to <strong>{plan.cancellation_hours_limit}h</strong> prior (Fee:{' '}
                        <strong>{plan.cancellation_fee_percentage}%</strong>)
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <RotateCcw className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>Extra Rides: ₹{plan.additional_ride_charge}/ride</span>
                    </div>
                  </div>
                </div>

                {/* Footer Tag */}
                <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span
                    className={`font-semibold px-2.5 py-0.5 rounded-full border ${
                      isActive
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    Status: {plan.status}
                  </span>
                  <span className="text-slate-400 font-mono text-[11px] uppercase tracking-wider">
                    Tier: {plan.tier}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Data Table View */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[10px] font-semibold">
                <tr>
                  <th className="py-3 px-4">Plan Name & Details</th>
                  <th className="py-3 px-4">Tier</th>
                  <th className="py-3 px-4">Price</th>
                  <th className="py-3 px-4">Validity</th>
                  <th className="py-3 px-4">Rides Included</th>
                  <th className="py-3 px-4">Cancellation Rule</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {filteredPlans.map((plan) => {
                  const college = colleges.find((c) => c.id === plan.college_id);
                  const isActive = plan.status === 'ACTIVE';

                  return (
                    <tr key={plan.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white text-xs">{plan.name}</div>
                        <div className="text-[11px] text-slate-400">
                          {college ? `${college.name} (${college.code})` : 'General Pass'} ·{' '}
                          {plan.round_trip_allowed ? 'Round-trip' : 'One-way'}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            plan.tier === 'PREMIUM'
                              ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                              : plan.tier === 'STANDARD'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                          }`}
                        >
                          {plan.tier}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-white text-sm">₹{plan.price}</td>
                      <td className="py-3.5 px-4 text-slate-300">{plan.validity_days} Days</td>
                      <td className="py-3.5 px-4">
                        {plan.is_unlimited_rides ? (
                          <span className="text-purple-400 font-bold">Unlimited</span>
                        ) : (
                          `${plan.ride_count_total} rides`
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-[11px] text-slate-400">
                        {plan.cancellation_hours_limit}h cutoff ({plan.cancellation_fee_percentage}%)
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                            isActive
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}
                        >
                          {plan.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleToggleStatus(plan)}
                            className={`p-1.5 rounded-lg border transition ${
                              isActive
                                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-rose-500/10 hover:text-rose-400'
                                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-emerald-400'
                            }`}
                            title={isActive ? 'Deactivate' : 'Activate'}
                          >
                            <Power className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(plan)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                            title="Edit Plan"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenDelete(plan)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/40 text-slate-400 hover:text-rose-400 transition"
                            title="Delete Plan"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE NEW PLAN MODAL */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Create New Subscription Plan">
        <form onSubmit={handleCreatePlan} className="space-y-4 text-xs">
          {modalError && (
            <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 flex items-center gap-2.5 text-rose-400 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{modalError}</span>
            </div>
          )}

          {/* College Selection & Tier */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Target College *</label>
              <select
                required
                value={formData.college_id}
                onChange={(e) => setFormData({ ...formData, college_id: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-emerald-500"
              >
                {colleges.length === 0 ? (
                  <option value="">Default College</option>
                ) : (
                  colleges.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.code})
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Plan Tier *</label>
              <select
                required
                value={formData.tier}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    tier: e.target.value as 'BASIC' | 'STANDARD' | 'PREMIUM',
                  })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-emerald-500"
              >
                <option value="BASIC">BASIC (Standard Commuter)</option>
                <option value="STANDARD">STANDARD (Most Popular)</option>
                <option value="PREMIUM">PREMIUM (VIP Unlimited / Priority)</option>
              </select>
            </div>
          </div>

          {/* Plan Name */}
          <div>
            <label className="block text-slate-300 font-medium mb-1">Plan Display Name *</label>
            <input
              type="text"
              required
              placeholder="e.g., Monthly Express Pass, Semester VIP Pass"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-emerald-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-slate-300 font-medium mb-1">Plan Description / Highlights</label>
            <textarea
              rows={2}
              placeholder="Brief description of included benefits, commute schedules, and perks..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-emerald-500"
            />
          </div>

          {/* Price & Validity */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Price (₹ INR) *</label>
              <div className="relative">
                <IndianRupee className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="number"
                  required
                  min="0"
                  step="1"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-2.5 text-white focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Validity (Days) *</label>
              <input
                type="number"
                required
                min="1"
                value={formData.validity_days}
                onChange={(e) => setFormData({ ...formData, validity_days: parseInt(e.target.value) || 30 })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Included Rides & Unlimited Toggle */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Included Rides Quota</label>
              <input
                type="number"
                disabled={formData.is_unlimited_rides}
                required={!formData.is_unlimited_rides}
                min="1"
                value={formData.ride_count_total}
                onChange={(e) =>
                  setFormData({ ...formData, ride_count_total: parseInt(e.target.value) || 44 })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white disabled:opacity-40 focus:border-emerald-500"
              />
            </div>

            <div className="flex flex-col justify-center space-y-2 pt-2">
              <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={formData.is_unlimited_rides}
                  onChange={(e) => setFormData({ ...formData, is_unlimited_rides: e.target.checked })}
                  className="rounded border-slate-800 text-emerald-500 focus:ring-0 w-4 h-4 bg-slate-900"
                />
                <span>Unlimited Rides (VIP)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={formData.priority_booking}
                  onChange={(e) => setFormData({ ...formData, priority_booking: e.target.checked })}
                  className="rounded border-slate-800 text-emerald-500 focus:ring-0 w-4 h-4 bg-slate-900"
                />
                <span>Priority Booking Access</span>
              </label>
            </div>
          </div>

          {/* Commute Direction Controls */}
          <div className="grid grid-cols-2 gap-3">
            <label className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-950 border border-slate-800 cursor-pointer text-slate-300">
              <input
                type="checkbox"
                checked={formData.round_trip_allowed}
                onChange={(e) => setFormData({ ...formData, round_trip_allowed: e.target.checked })}
                className="rounded border-slate-800 text-emerald-500 focus:ring-0 w-4 h-4 bg-slate-900"
              />
              <span>Round-Trip Allowed</span>
            </label>

            <label className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-950 border border-slate-800 cursor-pointer text-slate-300">
              <input
                type="checkbox"
                checked={formData.one_way_allowed}
                onChange={(e) => setFormData({ ...formData, one_way_allowed: e.target.checked })}
                className="rounded border-slate-800 text-emerald-500 focus:ring-0 w-4 h-4 bg-slate-900"
              />
              <span>One-Way Allowed</span>
            </label>
          </div>

          {/* Cancellation Policy & Extra Charge */}
          <div className="grid grid-cols-3 gap-2.5">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Cancel Cutoff (Hrs)</label>
              <input
                type="number"
                min="0"
                value={formData.cancellation_hours_limit}
                onChange={(e) =>
                  setFormData({ ...formData, cancellation_hours_limit: parseInt(e.target.value) || 0 })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Cancel Fee (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.cancellation_fee_percentage}
                onChange={(e) =>
                  setFormData({ ...formData, cancellation_fee_percentage: parseFloat(e.target.value) || 0 })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Extra Ride (₹)</label>
              <input
                type="number"
                min="0"
                value={formData.additional_ride_charge}
                onChange={(e) =>
                  setFormData({ ...formData, additional_ride_charge: parseFloat(e.target.value) || 0 })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Status Selection */}
          <div>
            <label className="block text-slate-300 font-medium mb-1">Initial Status</label>
            <select
              value={formData.status}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  status: e.target.value as 'ACTIVE' | 'INACTIVE',
                })
              }
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-emerald-500"
            >
              <option value="ACTIVE">ACTIVE (Visible to students for purchase)</option>
              <option value="INACTIVE">INACTIVE (Hidden from checkout)</option>
            </select>
          </div>

          <div className="pt-3">
            <button
              type="submit"
              disabled={actionLoading}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-lg shadow-emerald-600/20 transition flex items-center justify-center gap-2"
            >
              {actionLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              <span>{actionLoading ? 'Creating Plan...' : 'Create Subscription Plan'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* EDIT PLAN MODAL */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Configure Subscription Plan">
        <form onSubmit={handleUpdatePlan} className="space-y-4 text-xs">
          {modalError && (
            <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 flex items-center gap-2.5 text-rose-400 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{modalError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Target College *</label>
              <select
                required
                value={formData.college_id}
                onChange={(e) => setFormData({ ...formData, college_id: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-emerald-500"
              >
                {colleges.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Plan Tier *</label>
              <select
                required
                value={formData.tier}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    tier: e.target.value as 'BASIC' | 'STANDARD' | 'PREMIUM',
                  })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-emerald-500"
              >
                <option value="BASIC">BASIC</option>
                <option value="STANDARD">STANDARD</option>
                <option value="PREMIUM">PREMIUM</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Plan Display Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Description</label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Price (₹ INR) *</label>
              <div className="relative">
                <IndianRupee className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-2.5 text-white focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Validity (Days) *</label>
              <input
                type="number"
                required
                min="1"
                value={formData.validity_days}
                onChange={(e) => setFormData({ ...formData, validity_days: parseInt(e.target.value) || 30 })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Included Rides</label>
              <input
                type="number"
                disabled={formData.is_unlimited_rides}
                required={!formData.is_unlimited_rides}
                min="1"
                value={formData.ride_count_total}
                onChange={(e) =>
                  setFormData({ ...formData, ride_count_total: parseInt(e.target.value) || 44 })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white disabled:opacity-40 focus:border-emerald-500"
              />
            </div>

            <div className="flex flex-col justify-center space-y-2 pt-2">
              <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={formData.is_unlimited_rides}
                  onChange={(e) => setFormData({ ...formData, is_unlimited_rides: e.target.checked })}
                  className="rounded border-slate-800 text-emerald-500 focus:ring-0 w-4 h-4 bg-slate-900"
                />
                <span>Unlimited Rides</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={formData.priority_booking}
                  onChange={(e) => setFormData({ ...formData, priority_booking: e.target.checked })}
                  className="rounded border-slate-800 text-emerald-500 focus:ring-0 w-4 h-4 bg-slate-900"
                />
                <span>Priority Booking Access</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-950 border border-slate-800 cursor-pointer text-slate-300">
              <input
                type="checkbox"
                checked={formData.round_trip_allowed}
                onChange={(e) => setFormData({ ...formData, round_trip_allowed: e.target.checked })}
                className="rounded border-slate-800 text-emerald-500 focus:ring-0 w-4 h-4 bg-slate-900"
              />
              <span>Round-Trip Allowed</span>
            </label>

            <label className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-950 border border-slate-800 cursor-pointer text-slate-300">
              <input
                type="checkbox"
                checked={formData.one_way_allowed}
                onChange={(e) => setFormData({ ...formData, one_way_allowed: e.target.checked })}
                className="rounded border-slate-800 text-emerald-500 focus:ring-0 w-4 h-4 bg-slate-900"
              />
              <span>One-Way Allowed</span>
            </label>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Cancel Cutoff (Hrs)</label>
              <input
                type="number"
                min="0"
                value={formData.cancellation_hours_limit}
                onChange={(e) =>
                  setFormData({ ...formData, cancellation_hours_limit: parseInt(e.target.value) || 0 })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Cancel Fee (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.cancellation_fee_percentage}
                onChange={(e) =>
                  setFormData({ ...formData, cancellation_fee_percentage: parseFloat(e.target.value) || 0 })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Extra Ride (₹)</label>
              <input
                type="number"
                min="0"
                value={formData.additional_ride_charge}
                onChange={(e) =>
                  setFormData({ ...formData, additional_ride_charge: parseFloat(e.target.value) || 0 })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Plan Status</label>
            <select
              value={formData.status}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  status: e.target.value as 'ACTIVE' | 'INACTIVE',
                })
              }
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-emerald-500"
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </div>

          <div className="pt-3">
            <button
              type="submit"
              disabled={actionLoading}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-lg shadow-emerald-600/20 transition flex items-center justify-center gap-2"
            >
              {actionLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Edit2 className="w-4 h-4" />}
              <span>{actionLoading ? 'Saving Changes...' : 'Save Plan Settings'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* DELETE CONFIRMATION MODAL */}
      <ConfirmDialog
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeletePlan}
        title="Remove Commuter Plan"
        message={`Are you sure you want to permanently delete plan "${selectedPlan?.name}" (₹${selectedPlan?.price})? If students have active or past subscriptions linked to this plan, it cannot be deleted and should be deactivated instead.`}
        confirmText="Confirm Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={actionLoading}
      />
    </div>
  );
};
