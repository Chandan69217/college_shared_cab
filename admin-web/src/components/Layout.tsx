import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  MapPin,
  Route,
  Car,
  ShieldCheck,
  GitFork,
  CreditCard,
  Layers,
  CalendarCheck,
  Navigation,
  DollarSign,
  MessageSquare,
  Calendar,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  Radio,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'Students', path: '/students', icon: Users },
    { label: 'Colleges', path: '/colleges', icon: GraduationCap },
    { label: 'Pickup Points', path: '/pickup-points', icon: MapPin },
    { label: 'Routes', path: '/routes', icon: Route },
    { label: 'Vehicles', path: '/vehicles', icon: Car },
    { label: 'Drivers', path: '/drivers', icon: ShieldCheck },
    { label: 'Assignments', path: '/assignments', icon: GitFork },
    { label: 'Plans', path: '/plans', icon: CreditCard },
    { label: 'Subscriptions', path: '/subscriptions', icon: Layers },
    { label: 'Bookings', path: '/bookings', icon: CalendarCheck },
    { label: 'Live Fleet Radar', path: '/live-tracking', icon: Radio },
    { label: 'Trips & GPS', path: '/trips', icon: Navigation },
    { label: 'Payments', path: '/payments', icon: DollarSign },
    { label: 'Complaints', path: '/complaints', icon: MessageSquare },
    { label: 'Holidays', path: '/holidays', icon: Calendar },
    { label: 'Reports', path: '/reports', icon: BarChart3 },
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Sidebar for Desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-slate-900 border-r border-slate-800">
        <div className="flex items-center gap-3 px-6 h-16 border-b border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center font-bold text-white shadow-lg shadow-emerald-500/30">
            CR
          </div>
          <div>
            <h1 className="font-bold text-base tracking-tight text-white leading-tight">CampusRide</h1>
            <p className="text-[10px] text-emerald-400 font-semibold tracking-wider uppercase">Admin Console</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* User profile & Logout */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/50">
          <div className="flex items-center justify-between">
            <Link
              to="/profile"
              className="flex items-center gap-2 overflow-hidden hover:opacity-80 transition group"
              title="View Profile & Settings"
            >
              <div className="w-8 h-8 rounded-full bg-emerald-600/30 border border-emerald-500/40 flex items-center justify-center font-semibold text-xs text-emerald-300 group-hover:scale-105 transition">
                {user?.full_name?.charAt(0) || 'A'}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-medium text-white truncate group-hover:text-emerald-400 transition">
                  {user?.full_name}
                </p>
                <p className="text-[10px] text-slate-400 truncate">Administrator Profile</p>
              </div>
            </Link>
            <button
              onClick={handleLogout}
              className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition shrink-0"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6 z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Campus Transport Network Online
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg relative">
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              </button>
            </div>
            <Link
              to="/profile"
              className="text-right hidden sm:block hover:opacity-80 transition group"
              title="View Profile & Security"
            >
              <p className="text-xs font-semibold text-white group-hover:text-emerald-400 transition">{user?.full_name}</p>
              <p className="text-[10px] text-slate-400">{user?.email}</p>
            </Link>
          </div>
        </header>

        {/* Dynamic page content */}
        <main className="flex-1 overflow-y-auto p-6 bg-slate-950">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
