import React, { useEffect, useState } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { UploadCloud, RefreshCw } from 'lucide-react';
import { adminFetch } from '../adminApi';
import type { DatasetMeta, DatasetSchema, AnalyticsSummary } from '../types';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#f43f5e', '#22d3ee', '#a78bfa'];

function isDarkMode() {
  return document.documentElement.classList.contains('dark');
}

interface DatasetDetail {
  meta: DatasetMeta;
  schema: DatasetSchema;
  rows: Record<string, unknown>[];
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 flex flex-col gap-3">
      <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">{title}</h2>
      {children}
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-10 text-gray-400 dark:text-gray-500">
      <UploadCloud size={32} strokeWidth={1.5} />
      <p className="text-xs">No data available</p>
    </div>
  );
}

// Auto-detect the best numeric column and label column from a dataset
function detectAxes(schema: DatasetSchema): { labelKey: string; valueKey: string } | null {
  const cols = schema.columns;
  const numericCols = cols.filter(c => c.type === 'number').map(c => c.name);
  const labelCols = cols.filter(c => c.type === 'string').map(c => c.name);
  if (!numericCols.length || !labelCols.length) return null;
  return { labelKey: labelCols[0], valueKey: numericCols[0] };
}

// Aggregate rows by a label column, summing a value column
function aggregateData(
  rows: Record<string, unknown>[],
  labelKey: string,
  valueKey: string
): { label: string; value: number }[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const label = String(row[labelKey] ?? 'Unknown');
    const val = Number(row[valueKey] ?? 0);
    if (!isNaN(val)) map.set(label, (map.get(label) ?? 0) + val);
  }
  return Array.from(map.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 15);
}

export function AnalyticsPage() {
  const [datasets, setDatasets] = useState<DatasetMeta[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [detail, setDetail] = useState<DatasetDetail | null>(null);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dark, setDark] = useState(isDarkMode);

  useEffect(() => {
    const observer = new MutationObserver(() => setDark(isDarkMode()));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  // Load datasets list + summary on mount
  useEffect(() => {
    Promise.all([
      adminFetch<DatasetMeta[]>('/api/datasets'),
      adminFetch<AnalyticsSummary>('/api/analytics/summary').catch(() => null),
    ])
      .then(([ds, sum]) => {
        setDatasets(ds);
        setSummary(sum);
        if (ds.length > 0) setSelectedId(ds[0].id);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // Load dataset rows when selection changes
  useEffect(() => {
    if (!selectedId) { setDetail(null); return; }
    setDetailLoading(true);
    adminFetch<{ meta: DatasetMeta; schema: DatasetSchema }>(`/api/datasets/${selectedId}`)
      .then(async (d) => {
        // Fetch actual rows from dataset_rows via a dedicated endpoint
        const rowsRes = await adminFetch<{ rows: Record<string, unknown>[] }>(`/api/datasets/${selectedId}/rows`).catch(() => ({ rows: [] }));
        setDetail({ meta: d.meta, schema: d.schema, rows: rowsRes.rows });
      })
      .catch(() => setDetail(null))
      .finally(() => setDetailLoading(false));
  }, [selectedId]);

  const gridColor = dark ? '#374151' : '#e5e7eb';
  const textColor = dark ? '#9ca3af' : '#6b7280';
  const axisProps = {
    tick: { fill: textColor, fontSize: 11 },
    axisLine: { stroke: gridColor },
    tickLine: false as const,
  };
  const tooltipStyle = {
    backgroundColor: dark ? '#1f2937' : '#ffffff',
    border: `1px solid ${gridColor}`,
    borderRadius: 8,
    color: dark ? '#f9fafb' : '#111827',
    fontSize: 12,
  };

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <div key={i} className="h-64 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Analytics</h1>
        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 px-4 py-3 text-red-700 dark:text-red-400 text-sm">{error}</div>
      </div>
    );
  }

  const axes = detail ? detectAxes(detail.schema) : null;
  const chartData = axes && detail ? aggregateData(detail.rows, axes.labelKey, axes.valueKey) : [];

  // All numeric columns for multi-series
  const numericCols = detail?.schema.columns.filter(c => c.type === 'number').map(c => c.name) ?? [];
  const labelCol = detail?.schema.columns.find(c => c.type === 'string')?.name ?? '';

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Visual insights from your uploaded datasets</p>
        </div>

        {/* Dataset selector */}
        {datasets.length > 0 && (
          <select
            value={selectedId}
            onChange={e => setSelectedId(e.target.value)}
            className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {datasets.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        )}
      </div>

      {/* System metrics row */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Queries', value: summary.totalQueries },
            { label: 'Datasets', value: summary.totalDatasets },
            { label: 'Users', value: summary.totalUsers },
            { label: 'Success Rate', value: `${summary.querySuccessRate.toFixed(1)}%` },
          ].map(m => (
            <div key={m.label} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">{m.label}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{m.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* No datasets uploaded */}
      {datasets.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-gray-500 gap-3">
          <UploadCloud size={48} strokeWidth={1.5} />
          <p className="text-base font-medium">No datasets uploaded yet</p>
          <p className="text-sm">Go to Datasets and upload a CSV or JSON file to see charts here.</p>
        </div>
      )}

      {/* Charts */}
      {datasets.length > 0 && (
        detailLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => <div key={i} className="h-64 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />)}
          </div>
        ) : detail ? (
          <div className="space-y-6">
            {/* Dataset info */}
            <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
              <span className="font-medium text-gray-700 dark:text-gray-300">{detail.meta.name}</span>
              <span>•</span>
              <span>{detail.meta.rowCount.toLocaleString()} rows</span>
              <span>•</span>
              <span>{detail.meta.columnCount} columns</span>
              <span>•</span>
              <span className="uppercase text-xs font-bold">{detail.meta.format}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

              {/* Chart 1: Top values bar chart */}
              <ChartCard title={axes ? `${axes.valueKey} by ${axes.labelKey}` : 'Distribution'}>
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                      <XAxis dataKey="label" {...axisProps} tick={{ ...axisProps.tick, fontSize: 10 }} />
                      <YAxis {...axisProps} />
                      <Tooltip contentStyle={tooltipStyle} cursor={{ fill: dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' }} />
                      <Bar dataKey="value" fill={COLORS[0]} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <EmptyChart />}
              </ChartCard>

              {/* Chart 2: Pie chart of top values */}
              <ChartCard title={axes ? `${axes.labelKey} share` : 'Composition'}>
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={chartData.slice(0, 8)} dataKey="value" nameKey="label" cx="50%" cy="50%" outerRadius={80} label={({ name }: { name?: string }) => name ?? ''}>
                        {chartData.slice(0, 8).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <EmptyChart />}
              </ChartCard>

              {/* Chart 3: Multi-series line chart if multiple numeric columns */}
              <ChartCard title="Numeric Trends">
                {numericCols.length > 0 && labelCol && detail.rows.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={detail.rows.slice(0, 20)} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                      <XAxis dataKey={labelCol} {...axisProps} tick={{ ...axisProps.tick, fontSize: 10 }} />
                      <YAxis {...axisProps} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      {numericCols.slice(0, 3).map((col, i) => (
                        <Line key={col} type="monotone" dataKey={col} stroke={COLORS[i]} strokeWidth={2} dot={false} />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                ) : <EmptyChart />}
              </ChartCard>

            </div>

            {/* Column summary table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-700">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Column Summary</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-900/50">
                    <tr>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Column</th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Type</th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Sample Values</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {detail.schema.columns.map(col => {
                      const samples = detail.rows.slice(0, 3).map(r => String(r[col.name] ?? '')).filter(Boolean).join(', ');
                      return (
                        <tr key={col.name} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                          <td className="px-4 py-2.5 font-mono text-gray-800 dark:text-gray-200">{col.name}</td>
                          <td className="px-4 py-2.5">
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                              col.type === 'number' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' :
                              col.type === 'date' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300' :
                              col.type === 'boolean' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' :
                              'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                            }`}>{col.type}</span>
                          </td>
                          <td className="px-4 py-2.5 text-gray-500 dark:text-gray-400 text-xs truncate max-w-xs">{samples || '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-400 dark:text-gray-500 text-sm">
            <RefreshCw size={24} className="mx-auto mb-2 animate-spin" />
            Loading dataset...
          </div>
        )
      )}
    </div>
  );
}
