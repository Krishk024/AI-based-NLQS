import React, { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Clock, Search, AlertCircle } from 'lucide-react';
import { historyDb } from '../../../services/historyDb';
import type { HistoryItem } from '../../../types';

function formatDate(ts: number) {
  return new Date(ts).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function truncateSql(sql: string, maxLen = 80) {
  return sql.length > maxLen ? sql.slice(0, maxLen) + '…' : sql;
}

type StatusFilter = 'all' | 'success' | 'error';

// All stored items are successes, but we keep the filter for future-proofing.
function getStatus(_item: HistoryItem): 'success' | 'error' {
  return 'success';
}

export function HistoryPage() {
  const [entries, setEntries] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  useEffect(() => {
    const all = historyDb.getAll();
    // Reverse chronological: newest first
    const sorted = [...all].sort((a, b) => b.timestamp - a.timestamp);
    setEntries(sorted);
    setLoading(false);
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const fromMs = dateFrom ? new Date(dateFrom).getTime() : null;
    // dateTo: include the full day
    const toMs = dateTo ? new Date(dateTo).getTime() + 86_400_000 - 1 : null;

    return entries.filter((item) => {
      // Text search
      if (q) {
        const inQuery = item.query.toLowerCase().includes(q);
        const inSql = item.response.generatedSql.toLowerCase().includes(q);
        if (!inQuery && !inSql) return false;
      }

      // Date range
      if (fromMs !== null && item.timestamp < fromMs) return false;
      if (toMs !== null && item.timestamp > toMs) return false;

      // Status
      if (statusFilter !== 'all' && getStatus(item) !== statusFilter) return false;

      return true;
    });
  }, [entries, search, dateFrom, dateTo, statusFilter]);

  function toggleExpand(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Query History</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Browse and filter past queries
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-wrap gap-3">
          {/* Text search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search query or SQL…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Date from */}
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Date to */}
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">To</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Status dropdown */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Statuses</option>
            <option value="success">Success</option>
            <option value="error">Error</option>
          </select>
        </div>
      </div>

      {/* Results */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-14 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div className="p-10 text-center">
            <Clock size={32} className="mx-auto mb-3 text-gray-300 dark:text-gray-600" />
            <p className="text-gray-500 dark:text-gray-400 text-sm">No query history yet.</p>
            <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
              Queries run in the Query Analyzer will appear here.
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center">
            <AlertCircle size={28} className="mx-auto mb-3 text-gray-300 dark:text-gray-600" />
            <p className="text-gray-500 dark:text-gray-400 text-sm">No entries match the current filters.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {filtered.map((item) => {
              const status = getStatus(item);
              const isExpanded = expandedId === item.id;
              const execTime = (item.response as any).executionTime as number | undefined;
              const rowCount = item.response.data?.length ?? 0;

              return (
                <div key={item.id}>
                  {/* Row */}
                  <button
                    onClick={() => toggleExpand(item.id)}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors flex items-start gap-3"
                  >
                    {/* Expand icon */}
                    <span className="mt-0.5 shrink-0 text-gray-400">
                      {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </span>

                    {/* Main content */}
                    <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto_auto_auto] gap-x-4 gap-y-1 items-center">
                      {/* NL query */}
                      <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {item.query}
                      </span>

                      {/* SQL preview */}
                      <span className="text-xs font-mono text-gray-500 dark:text-gray-400 truncate">
                        {truncateSql(item.response.generatedSql)}
                      </span>

                      {/* Execution time */}
                      <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap tabular-nums">
                        {execTime !== undefined ? `${execTime} ms` : '—'}
                      </span>

                      {/* Timestamp */}
                      <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
                        {formatDate(item.timestamp)}
                      </span>

                      {/* Status badge */}
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap
                          ${status === 'success'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                            : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                          }`}
                      >
                        {status === 'success' ? 'Success' : 'Error'}
                      </span>
                    </div>
                  </button>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-1 ml-7 space-y-3 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30">
                      <div>
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                          Full SQL
                        </p>
                        <pre className="text-xs font-mono text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap break-all">
                          {item.response.generatedSql}
                        </pre>
                      </div>

                      <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-300">
                        <span>
                          <span className="font-medium">Rows returned:</span>{' '}
                          {rowCount.toLocaleString()}
                        </span>
                        {execTime !== undefined && (
                          <span>
                            <span className="font-medium">Execution time:</span> {execTime} ms
                          </span>
                        )}
                        {item.response.naturalLanguageSummary && (
                          <span className="flex-1 text-gray-500 dark:text-gray-400 text-xs italic">
                            {item.response.naturalLanguageSummary}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Count */}
      {!loading && entries.length > 0 && (
        <p className="text-xs text-gray-400 dark:text-gray-500 text-right">
          Showing {filtered.length} of {entries.length} entries
        </p>
      )}
    </div>
  );
}
