
import React from 'react';
import { historyDb } from '../services/historyDb';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: { name: string; email: string };
  onLogout: () => void;
  queryCount: number;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose, user, onLogout, queryCount }) => {
  if (!isOpen) return null;

  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // Calculate real statistics from query history
  const history = historyDb.getAll();
  const successfulQueries = history.filter(h => h.response && h.response.data && h.response.data.length > 0).length;
  const accuracyRate = queryCount > 0 ? Math.round((successfulQueries / queryCount) * 100) : 0;

  // Export usage report as CSV
  const handleExportReport = () => {
    const csvRows = [
      ['Query', 'Timestamp', 'SQL Generated', 'Results Count', 'Visualization Type'],
      ...history.map(h => [
        `"${h.query.replace(/"/g, '""')}"`,
        new Date(h.timestamp).toLocaleString(),
        `"${h.response?.generatedSql?.replace(/"/g, '""') || 'N/A'}"`,
        h.response?.data?.length || 0,
        h.response?.visualizationSuggestion || 'none'
      ])
    ];
    
    const csvContent = csvRows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `usage_report_${user.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden animate-scale-in border border-slate-200 dark:border-slate-800 transition-colors">
        
        {/* Profile Header Card */}
        <div className="relative h-48 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 p-8 flex flex-col justify-end">
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-3xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-3xl font-black text-white shadow-xl">
              {initials}
            </div>
            <div className="mb-2">
              <h2 className="text-3xl font-black text-white tracking-tight leading-none">{user.name}</h2>
              <div className="flex items-center gap-2 mt-2">
                <span className="bg-white/20 text-white text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded backdrop-blur-sm">
                  Professional Analyst
                </span>
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
              </div>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-10 space-y-10">
          
          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email Address</p>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">{user.email}</p>
            </div>
            <div className="space-y-1 text-right">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Platform Role</p>
              <p className="text-sm font-bold text-blue-600 dark:text-blue-400">Master Data Architect</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Account Status</p>
              <p className="text-sm font-bold text-emerald-500">Verified & Active</p>
            </div>
            <div className="space-y-1 text-right">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Member Since</p>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-200">October 2024</p>
            </div>
          </div>

          {/* Activity Section */}
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-3xl p-6 border border-slate-100 dark:border-slate-800">
             <div className="flex items-center justify-between mb-4">
                <h4 className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Platform Statistics</h4>
                <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600">
                   <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                     <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                   </svg>
                </div>
             </div>
             <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                   <p className="text-2xl font-black text-slate-800 dark:text-white leading-none mb-1">{queryCount}</p>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Total Queries</p>
                </div>
                <div className="text-center p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                   <p className="text-2xl font-black text-slate-800 dark:text-white leading-none mb-1">{accuracyRate}%</p>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Success Rate</p>
                </div>
             </div>
          </div>

          {/* Footer Actions */}
          <div className="flex flex-col gap-3">
             <button 
                onClick={handleExportReport}
                className="w-full py-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-2xl transition-all flex items-center justify-center gap-3 group"
             >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-slate-400 group-hover:text-blue-500 transition-colors">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9.75v6.75m0 0l-3-3m3 3l3-3m-8.25 6a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A4.501 4.501 0 0117.25 21h-11.25z" />
                </svg>
                Export Usage Report
             </button>
             <button 
                onClick={onLogout}
                className="w-full py-4 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-3 group"
             >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 transition-transform group-hover:translate-x-1">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                </svg>
                Sign Out Session
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};
