import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Search,
  Database,
  History,
  BarChart2,
  Users,
  Lightbulb,
  X,
} from 'lucide-react';

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  { label: 'Dashboard', path: '/admin', icon: LayoutDashboard, exact: true },
  { label: 'Query Analyzer', path: '/admin/query', icon: Search },
  { label: 'Datasets', path: '/admin/datasets', icon: Database },
  { label: 'History', path: '/admin/history', icon: History },
  { label: 'Analytics', path: '/admin/analytics', icon: BarChart2 },
  { label: 'Users', path: '/admin/users', icon: Users },
  { label: 'AI Insights', path: '/admin/insights', icon: Lightbulb },
];

export function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const location = useLocation();

  const isActive = (path: string, exact?: boolean) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-gray-900 dark:bg-gray-950 w-64">
      {/* Logo / Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-gray-700 dark:border-gray-800">
        <span className="text-white font-bold text-lg tracking-wide">Admin Panel</span>
        {/* Close button — mobile only */}
        <button
          onClick={onClose}
          className="md:hidden text-gray-400 hover:text-white transition-colors"
          aria-label="Close sidebar"
        >
          <X size={20} />
        </button>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ label, path, icon: Icon, exact }) => {
          const active = isActive(path, exact);
          return (
            <NavLink
              key={path}
              to={path}
              end={exact}
              onClick={onClose}
              className={[
                'flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors',
                active
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white dark:hover:bg-gray-800',
              ].join(' ')}
            >
              <Icon size={18} />
              {label}
            </NavLink>
          );
        })}
      </nav>
    </div>
  );

  return (
    <>
      {/* Desktop: always-visible fixed sidebar */}
      <aside className="hidden md:flex flex-col w-64 flex-shrink-0 h-screen sticky top-0">
        {sidebarContent}
      </aside>

      {/* Mobile: drawer + overlay */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/50"
            onClick={onClose}
            aria-hidden="true"
          />
          {/* Drawer */}
          <aside className="relative z-50 flex flex-col w-64 h-full shadow-xl">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
