import React, { useEffect, useState } from 'react';
import { Search, Database, Users, CheckCircle, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MetricCard } from '../components/MetricCard';
import { adminFetch } from '../adminApi';
import { AnalyticsSummary } from '../types';
import { historyDb } from '../../../services/historyDb';

function readUsersFromIndexedDB(): Promise<any[]> {
  return new Promise((resolve) => {
    const request = indexedDB.open('NaturalQuerySystemDB', 1);
    request.onerror = () => resolve([]);
    request.onsuccess = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('users')) { db.close(); resolve([]); return; }
      const tx = db.transaction(['users'], 'readonly');
      const getAllReq = tx.objectStore('users').getAll();
      getAllReq.onsuccess = () => { db.close(); resolve(getAllReq.result ?? []); };
      getAllReq.onerror = () => { db.close(); resolve([]); };
    };
  });
}

interface DashboardMetrics {
  totalQueries: number;
  totalDatasets: number;
  totalUsers: number;
  querySuccessRate: number;
}

export function DashboardPage() {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [serverUnreachable, setServerUnreachable] = useState(false);

  useEffect(() => {
    async function loadMetrics() {
      // 1. Read client-side data
      const history = historyDb.getAll();
      const users = await readUsersFromIndexedDB();

      const totalQueries = history.length;
      const successCount = history.length; // all stored = success
      const totalUsers = users.length;

      try {
        // 2. Fetch server-side analytics
        const summary = await adminFetch<AnalyticsSummary>(
          `/api/analytics/summary?totalQueries=${totalQueries}&successCount=${successCount}`
        );

        // 3. Merge: server provides totalDatasets + querySuccessRate, client provides totalQueries + totalUsers
        setMetrics({
          totalQueries,
          totalDatasets: summary.totalDatasets,
          totalUsers,
          querySuccessRate: summary.querySuccessRate,
        });
        setServerUnreachable(false);
      } catch {
        // Fallback: use 0 for server metrics
        setServerUnreachable(true);
        setMetrics({
          totalQueries,
          totalDatasets: 0,
          totalUsers,
          querySuccessRate: 0,
        });
      } finally {
        setLoading(false);
      }
    }

    loadMetrics();

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') loadMetrics();
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <div className="h-8 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="h-4 w-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mt-2" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 h-28 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Overview of your system activity and key metrics
        </p>
      </div>

      {/* Warning banner */}
      {serverUnreachable && (
        <div className="flex items-center gap-2 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 px-4 py-3 text-yellow-800 dark:text-yellow-300 text-sm">
          <AlertTriangle size={16} className="shrink-0" />
          <span>Using cached data — server unreachable</span>
        </div>
      )}

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div onClick={() => navigate('/admin/history')} className="cursor-pointer hover:scale-[1.02] transition-transform">
          <MetricCard
            label="Total Queries"
            value={metrics!.totalQueries}
            icon={<Search size={20} />}
          />
        </div>
        <div onClick={() => navigate('/admin/datasets')} className="cursor-pointer hover:scale-[1.02] transition-transform">
          <MetricCard
            label="Total Datasets"
            value={metrics!.totalDatasets}
            icon={<Database size={20} />}
          />
        </div>
        <div onClick={() => navigate('/admin/users')} className="cursor-pointer hover:scale-[1.02] transition-transform">
          <MetricCard
            label="Active Users"
            value={metrics!.totalUsers}
            icon={<Users size={20} />}
          />
        </div>
        <div onClick={() => navigate('/admin/history')} className="cursor-pointer hover:scale-[1.02] transition-transform">
          <MetricCard
            label="Success Rate"
            value={`${metrics!.querySuccessRate.toFixed(1)}%`}
            icon={<CheckCircle size={20} />}
          />
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => navigate('/admin/query')}
          className="flex items-center gap-3 p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors text-left"
        >
          <Search size={20} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">Run a Query</p>
            <p className="text-xs text-indigo-500 dark:text-indigo-400">Ask questions in plain English</p>
          </div>
        </button>
        <button
          onClick={() => navigate('/admin/datasets')}
          className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors text-left"
        >
          <Database size={20} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">Upload Dataset</p>
            <p className="text-xs text-emerald-500 dark:text-emerald-400">Add CSV or JSON files</p>
          </div>
        </button>
        <button
          onClick={() => navigate('/admin/insights')}
          className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors text-left"
        >
          <CheckCircle size={20} className="text-amber-600 dark:text-amber-400 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">AI Insights</p>
            <p className="text-xs text-amber-500 dark:text-amber-400">Auto-generate business insights</p>
          </div>
        </button>
      </div>
    </div>
  );
}
