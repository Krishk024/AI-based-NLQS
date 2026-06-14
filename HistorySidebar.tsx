
import React from 'react';
import { HistoryItem } from '../types';

interface HistorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  history: HistoryItem[];
  onSelect: (item: HistoryItem) => void;
  onClear: () => void;
  onNewQuery?: () => void;
  onViewSchema?: () => void;
}

export const HistorySidebar: React.FC<HistorySidebarProps> = ({ 
  isOpen, 
  onClose, 
  history, 
  onSelect,
  onClear,
  onNewQuery,
  onViewSchema
}) => {
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <>
      {/* Mobile Overlay */}
      <div 
        className={`fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Sidebar Panel */}
      <div 
        className={`fixed lg:static inset-y-0 left-0 h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-50 flex flex-col transition-[width] duration-300 ease-in-out shadow-2xl lg:shadow-none overflow-hidden ${
          isOpen ? 'translate-x-0 w-72' : '-translate-x-full lg:translate-x-0 lg:w-0 lg:border-none'
        }`}
      >
        {/* Fixed Width Inner Container to prevent content squishing during collapse */}
        <div className="w-72 flex flex-col h-full min-w-[18rem]">
            
            {/* Header Section */}
            <div className="p-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="bg-blue-600 rounded-lg p-1 shadow-lg shadow-blue-200 dark:shadow-none flex items-center justify-center">
                        <svg width="24" height="24" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <ellipse cx="32" cy="20" rx="16" ry="8" fill="white" />
                          <path d="M16 20V28C16 32.4183 23.1634 36 32 36C40.8366 36 48 32.4183 48 28V20" fill="white" />
                          <ellipse cx="32" cy="28" rx="16" ry="8" fill="white" opacity="0.4" />
                          <path d="M16 32V40C16 44.4183 23.1634 48 32 48C40.8366 48 48 44.4183 48 40V32" fill="white" />
                        </svg>
                    </div>
                    <span className="text-xl font-bold text-slate-900 dark:text-white tracking-tight whitespace-nowrap">AI NQS</span>
                </div>
                {/* Desktop Collapse Button */}
                <button 
                    onClick={onClose}
                    className="hidden lg:block p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 transition-colors"
                    title="Collapse Sidebar"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M18.75 19.5l-7.5-7.5 7.5-7.5m-6 15L5.25 12l7.5-7.5" />
                    </svg>
                </button>
            </div>

            {/* New Query Action */}
            <div className="px-6 pb-2">
                <button 
                    onClick={onNewQuery}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl shadow-md shadow-blue-200 dark:shadow-none transition-all flex items-center justify-center gap-2 group whitespace-nowrap"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 group-hover:rotate-90 transition-transform">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    New Query
                </button>
            </div>

            {/* History List with styled scrollbar */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700 scrollbar-track-transparent">
            <p className="px-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Recent</p>
            {history.length === 0 ? (
                <div className="text-center py-8 text-slate-400 dark:text-slate-500">
                <p className="text-xs">No queries yet</p>
                </div>
            ) : (
                history.map((item, index) => (
                <button
                    key={item.id}
                    onClick={() => onSelect(item)}
                    className="w-full text-left p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group relative overflow-hidden animate-slide-up-fade"
                    style={{ animationDelay: `${index * 0.05}s`, animationFillMode: 'forwards' }}
                >
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300 line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                    {item.query}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1">{formatTime(item.timestamp)}</p>
                </button>
                ))
            )}
            </div>

            {/* Bottom Actions */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
                <button 
                    onClick={onViewSchema}
                    className="w-full flex items-center gap-3 px-3 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
                    </svg>
                    View Schema
                </button>
                
                {history.length > 0 && (
                    <button 
                        onClick={onClear}
                        className="w-full flex items-center gap-3 px-3 py-2 text-slate-600 dark:text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                        </svg>
                        Clear History
                    </button>
                )}
            </div>
        </div>
      </div>
    </>
  );
};