import React, { useEffect, useState } from 'react';
import { Menu, Sun, Moon } from 'lucide-react';
import { useAdminAuth } from '../AdminAuthContext';

interface AdminNavbarProps {
  onMenuClick: () => void;
}

export function AdminNavbar({ onMenuClick }: AdminNavbarProps) {
  const { adminUser } = useAdminAuth();
  const displayName = adminUser?.email ?? 'Admin';

  const [isDark, setIsDark] = useState(() =>
    document.documentElement.classList.contains('dark'),
  );

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  return (
    <header className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm">
      {/* Left: hamburger (mobile only) */}
      <button
        onClick={onMenuClick}
        className="md:hidden p-2 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>

      {/* Spacer on desktop */}
      <div className="hidden md:block" />

      {/* Right: dark mode toggle + admin name */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setIsDark((d) => !d)}
          className="p-2 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="Toggle dark mode"
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {displayName}
        </span>
      </div>
    </header>
  );
}
