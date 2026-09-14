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
} from 'lucide-react';
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
    totalStudents: 1250,
    activeSubscriptions: 980,
    todaysTrips: 85,
    activeVehicles: 30,
    activeDrivers: 32,
    todayRevenue: 84500,
    totalRevenue: 1245000,
    averageOccupancy: 82,
    pendingVerifications: 14,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/admin/dashboard-stats');
        if (res.data.success) {
          setStats(res.data.data);
        }
      } catch (err) {
        console.error('Failed to fetch dashboard stats', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const weeklyData = [
    { day: 'Mon', rides: 82, revenue: 82000, occupancy: 86 },
    { day: 'Tue', rides: 88, revenue: 88000, occupancy: 88 },
    { day: 'Wed', rides: 84, revenue: 84000, occupancy: 84 },
    { day: 'Thu', rides: 91, revenue: 91000, occupancy: 91 },
    { day: 'Fri', rides: 89, revenue: 89000, occupancy: 89 },
    { day: 'Sat', rides: 42, revenue: 42000, occupancy: 65 },
    { day: 'Sun', rides: 0, revenue: 0, occupancy: 0 },
  ];

  const planDistribution = [
    { name: 'Basic Pass', value: 280, color: '#3b82f6' },
    { name: 'Standard Pass', value: 520, color: '#10b981' },
    { name: 'Premium Pass', value: 180, color: '#8b5cf6' },
  ];

  return (
    <div className="space-y-6">
      {/* Header banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight">
            Apex Institute Transport Command Center
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time fleet operations, subscription telemetry, and passenger manifest overview
          </p>
        </div>
        <div className="flex items-center gap-2">
          {stats.pendingVerifications > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium">
              <AlertCircle className="w-4 h-4" />
              <span>{stats.pendingVerifications} Pending Student Verifications</span>
            </div>
          )}
        </div>
      </div>

      {/* Primary KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Students"
          value={stats.totalStudents.toLocaleString()}
          subtitle="Enrolled students across batches"
          icon={Users}
          trend="+12% this month"
          color="blue"
        />
        <StatCard
          title="Active Subscriptions"
          value={stats.activeSubscriptions.toLocaleString()}
          subtitle="78.4% subscription coverage"
          icon={Layers}
          trend="+8% this term"
          color="emerald"
        />
        <StatCard
          title="Today's Trips"
          value={stats.todaysTrips}
          subtitle="44 Morning | 41 Evening"
          icon={Navigation}
          trend="100% on schedule"
          color="indigo"
        />
        <StatCard
          title="Today's Revenue"
          value={`₹${stats.todayRevenue.toLocaleString()}`}
          subtitle={`₹${(stats.totalRevenue / 100000).toFixed(1)}L total volume`}
          icon={DollarSign}
          trend="+15.2% vs avg"
          color="amber"
        />
      </div>

      {/* Secondary Operational Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Active Vehicles"
          value={`${stats.activeVehicles} Cabs & Shuttles`}
          subtitle="100% fleet fitness certified"
          icon={Car}
          color="purple"
        />
        <StatCard
          title="Active Drivers"
          value={`${stats.activeDrivers} On-Duty`}
          subtitle="Avg Rating: 4.89 / 5.0 ⭐"
          icon={ShieldCheck}
          color="emerald"
        />
        <StatCard
          title="Average Occupancy"
          value={`${stats.averageOccupancy}%`}
          subtitle="Optimal capacity utilization"
          icon={TrendingUp}
          trend="Target: >80%"
          color="blue"
        />
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
                <Bar dataKey="rides" fill="#10b981" radius={[4, 4, 0, 0]} name="Completed Trips" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Subscription Plan Distribution Pie Chart */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-sm text-white">Subscription Distribution</h3>
            <p className="text-xs text-slate-400">Active commuter passes by tier</p>
          </div>
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
                <span className="font-semibold text-white">{plan.value} students</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
