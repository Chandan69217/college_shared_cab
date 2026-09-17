import React, { useEffect, useState } from 'react';
import {
  Users,
  Layers,
  Navigation,
  Car,
  ShieldCheck,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Loader2,
  GitFork,
  ArrowRight,
  ShieldAlert,
  Calendar,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { StatCard } from '../components/StatCard';
import { api } from '../services/api';
import { DashboardStats } from '../types';

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    activeStudents: 0,
    verifiedStudents: 0,
    pendingVerifications: 0,
    totalDrivers: 0,
    activeDrivers: 0,
    onLeaveDrivers: 0,
    totalVehicles: 0,
    activeVehicles: 0,
    maintenanceVehicles: 0,
    totalRoutes: 0,
    activeRoutes: 0,
    assignedVehiclesCount: 0,
    assignedDriversCount: 0,
    todaysTrips: 0,
    activeTrips: 0,
    todayRevenue: 0,
    totalRevenue: 0,
    averageOccupancy: 0,
    activeSubscriptions: 0,
  });
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [planDistribution, setPlanDistribution] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/admin/dashboard-stats');
        if (res.data.success) {
          const data = res.data.data;
          setStats({
            totalStudents: data.totalStudents || 0,
            activeStudents: data.activeStudents || 0,
            verifiedStudents: data.verifiedStudents || 0,
            pendingVerifications: data.pendingVerifications || 0,
            totalDrivers: data.totalDrivers || 0,
            activeDrivers: data.activeDrivers || 0,
            onLeaveDrivers: data.onLeaveDrivers || 0,
            totalVehicles: data.totalVehicles || 0,
            activeVehicles: data.activeVehicles || 0,
            maintenanceVehicles: data.maintenanceVehicles || 0,
            totalRoutes: data.totalRoutes || 0,
            activeRoutes: data.activeRoutes || 0,
            assignedVehiclesCount: data.assignedVehiclesCount || 0,
            assignedDriversCount: data.assignedDriversCount || 0,
            todaysTrips: data.todaysTrips || 0,
            activeTrips: data.activeTrips || 0,
            todayRevenue: data.todayRevenue || 0,
            totalRevenue: data.totalRevenue || 0,
            averageOccupancy: data.averageOccupancy || 0,
            activeSubscriptions: data.activeSubscriptions || 0,
          });
          setWeeklyData(data.weeklyData || []);
          setPlanDistribution(data.planDistribution || []);
        }
      } catch (err) {
        console.error('Failed to fetch dashboard stats', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-400 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
        <p className="text-sm font-medium">Loading live transport operations from database...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight">
            Apex Institute Transport Command Center
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Live fleet operations, route assignments, subscription telemetry, and passenger manifest
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {stats.pendingVerifications > 0 ? (
            <Link
              to="/students?status=PENDING"
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-semibold hover:bg-amber-500/25 transition shadow-sm animate-pulse"
              title="Click to review pending student KYC applications"
            >
              <AlertCircle className="w-4 h-4" />
              <span>{stats.pendingVerifications} Pending KYC Reviews</span>
              <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
            </Link>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
              <ShieldCheck className="w-4 h-4" />
              <span>All Student KYCs Verified</span>
            </div>
          )}
          {stats.maintenanceVehicles && stats.maintenanceVehicles > 0 ? (
            <Link
              to="/vehicles"
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium hover:bg-rose-500/20 transition"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>{stats.maintenanceVehicles} In Maintenance</span>
            </Link>
          ) : null}
        </div>
      </div>

      {/* Primary KPI Grid: Live Operations */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Students Directory"
          value={stats.totalStudents.toLocaleString()}
          subtitle={
            stats.pendingVerifications > 0
              ? `${stats.pendingVerifications} pending KYC • ${stats.verifiedStudents ?? stats.activeStudents ?? 0} verified`
              : `${stats.verifiedStudents ?? stats.activeStudents ?? 0} verified accounts`
          }
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Fleet Operations"
          value={`${stats.totalVehicles ?? stats.activeVehicles} Vehicles`}
          subtitle={`${stats.activeVehicles} active • ${stats.maintenanceVehicles ?? 0} in service`}
          icon={Car}
          color="purple"
        />
        <StatCard
          title="Driver Corps"
          value={`${stats.totalDrivers ?? stats.activeDrivers} Drivers`}
          subtitle={`${stats.activeDrivers} on duty • ${stats.onLeaveDrivers ?? 0} on leave`}
          icon={ShieldCheck}
          color="emerald"
        />
        <StatCard
          title="Transit Routes"
          value={`${stats.totalRoutes ?? stats.activeRoutes ?? 0} Routes`}
          subtitle={`${stats.assignedVehiclesCount ?? 0} cabs & shuttles assigned`}
          icon={Navigation}
          color="indigo"
        />
      </div>

      {/* Secondary Metrics: Ride & Financial Telemetry */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Today's Trips"
          value={stats.todaysTrips}
          subtitle={`${stats.activeTrips ?? 0} in-progress transit`}
          icon={Calendar}
          color="indigo"
        />
        <StatCard
          title="Active Subscriptions"
          value={stats.activeSubscriptions.toLocaleString()}
          subtitle="Valid student transit passes"
          icon={Layers}
          color="emerald"
        />
        <StatCard
          title="Capacity Occupancy"
          value={`${stats.averageOccupancy}%`}
          subtitle="Average vehicle seating load"
          icon={TrendingUp}
          color="blue"
        />
        <StatCard
          title="Today's Revenue"
          value={`₹${stats.todayRevenue.toLocaleString()}`}
          subtitle={`₹${(stats.totalRevenue / 100000).toFixed(1)}L total collection`}
          icon={DollarSign}
          color="amber"
        />
      </div>

      {/* Quick Navigation / Management Hub Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Operational Management Shortcuts
          </h3>
          <span className="text-[11px] text-slate-500">Live Database CRUD Modules</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <Link
            to="/vehicles"
            className="flex items-center justify-between p-3 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-800/50 transition group text-xs"
          >
            <div className="flex items-center gap-2">
              <Car className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
              <span className="font-semibold text-slate-200">Vehicles</span>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
          </Link>

          <Link
            to="/routes"
            className="flex items-center justify-between p-3 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-800/50 transition group text-xs"
          >
            <div className="flex items-center gap-2">
              <Navigation className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
              <span className="font-semibold text-slate-200">Routes</span>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
          </Link>

          <Link
            to="/drivers"
            className="flex items-center justify-between p-3 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-800/50 transition group text-xs"
          >
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
              <span className="font-semibold text-slate-200">Drivers</span>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
          </Link>

          <Link
            to={stats.pendingVerifications > 0 ? "/students?status=PENDING" : "/students"}
            className="flex items-center justify-between p-3 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-800/50 transition group text-xs"
          >
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
              <span className="font-semibold text-slate-200">Students & KYC</span>
            </div>
            <div className="flex items-center gap-1.5">
              {stats.pendingVerifications > 0 && (
                <span className="px-1.5 py-0.5 rounded-md bg-amber-500/20 border border-amber-500/30 text-amber-300 font-bold text-[10px]">
                  {stats.pendingVerifications} Pending
                </span>
              )}
              <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
            </div>
          </Link>

          <Link
            to="/assignments"
            className="flex items-center justify-between p-3 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-800/50 transition group text-xs col-span-2 sm:col-span-1"
          >
            <div className="flex items-center gap-2">
              <GitFork className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
              <span className="font-semibold text-slate-200">Assignments</span>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
          </Link>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Commute Volume Bar Chart */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-sm text-white">Daily Trip Volume & Occupancy</h3>
              <p className="text-xs text-slate-400">Weekly completed rides and capacity load</p>
            </div>
            <span className="text-xs font-semibold px-2 py-1 rounded bg-slate-800 text-slate-300">
              Last 7 Days
            </span>
          </div>
          {weeklyData.length > 0 ? (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="day" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="rides" fill="#10b981" radius={[4, 4, 0, 0]} name="Scheduled Trips" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-xs text-slate-500">
              No trip data recorded in the last 7 days.
            </div>
          )}
        </div>

        {/* Subscription Plan Distribution Pie Chart */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-sm text-white">Subscription Distribution</h3>
            <p className="text-xs text-slate-400">Active commuter passes by tier</p>
          </div>
          {planDistribution.length > 0 ? (
            <>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={planDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {planDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2 pt-2 border-t border-slate-800">
                {planDistribution.map((plan) => (
                  <div key={plan.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: plan.color }} />
                      <span className="text-slate-300">{plan.name}</span>
                    </div>
                    <span className="font-semibold text-white">{plan.value} subscribers</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-48 flex items-center justify-center text-xs text-slate-500">
              No active subscriptions found in database.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
