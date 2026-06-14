import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
} from 'recharts';
import { Send, Loader2, AlertCircle, Database, Mic } from 'lucide-react';
import { adminFetch } from '../adminApi';
import { DatasetMeta, DatasetSchema } from '../types';
import { processNaturalLanguageQuery } from '../../../services/geminiService';
import { historyDb } from '../../../services/historyDb';
import { QueryResponse } from '../../../types';

// Web Speech API type declarations
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface SpeechRecognitionInstance extends EventTarget {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  onstart: ((this: SpeechRecognitionInstance, ev: Event) => void) | null;
  onresult: ((this: SpeechRecognitionInstance, ev: SpeechRecognitionResultEvent) => void) | null;
  onerror: ((this: SpeechRecognitionInstance, ev: Event) => void) | null;
  onend: ((this: SpeechRecognitionInstance, ev: Event) => void) | null;
}

interface SpeechRecognitionResultEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

const CHART_COLORS = ['#6366f1', '#22d3ee', '#f59e0b', '#10b981', '#f43f5e', '#a78bfa'];

interface LocationState {
  query?: string;
}

export function QueryAnalyzerPage() {
  const location = useLocation();
  const routerState = location.state as LocationState | null;

  const [queryText, setQueryText] = useState(routerState?.query ?? '');
  const [selectedDatasetId, setSelectedDatasetId] = useState('');
  const [datasets, setDatasets] = useState<DatasetMeta[]>([]);
  const [datasetsLoading, setDatasetsLoading] = useState(false);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<QueryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Voice input state
  const speechRecognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const [voiceSupported] = useState(() =>
    typeof window !== 'undefined' &&
    !!(window.SpeechRecognition || window.webkitSpeechRecognition)
  );
  const [isListening, setIsListening] = useState(false);

  // Fetch dataset list on mount
  useEffect(() => {
    setDatasetsLoading(true);
    adminFetch<DatasetMeta[]>('/api/datasets')
      .then(setDatasets)
      .catch(() => setDatasets([]))
      .finally(() => setDatasetsLoading(false));
  }, []);

  function handleVoiceInput() {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) return;

    if (isListening) {
      speechRecognitionRef.current?.stop();
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);

    recognition.onresult = (event: SpeechRecognitionResultEvent) => {
      const transcript = event.results[0][0].transcript;
      setQueryText(transcript);
      setIsListening(false);
    };

    recognition.onerror = () => {
      setError('Voice recognition failed. Please try again.');
      setIsListening(false);
    };

    recognition.onend = () => setIsListening(false);

    speechRecognitionRef.current = recognition;
    recognition.start();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!queryText.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    const start = Date.now();

    try {
      let context: string | undefined;

      if (selectedDatasetId) {
        const schema = await adminFetch<DatasetSchema>(`/api/datasets/${selectedDatasetId}`);
        const meta = datasets.find((d) => d.id === selectedDatasetId);
        context = `Dataset schema: ${JSON.stringify(schema.columns)}. Dataset name: ${meta?.name ?? selectedDatasetId}`;
      }

      const response = await processNaturalLanguageQuery(queryText, context);
      const executionTime = Date.now() - start;

      setResult(response);

      historyDb.add({
        id: crypto.randomUUID(),
        query: queryText,
        timestamp: Date.now(),
        response: { ...response, executionTime } as any,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Query Analyzer</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Ask a question in plain English and get SQL, results, and a chart.
        </p>
      </div>

      {/* Input form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Dataset selector */}
        <div className="flex items-center gap-2">
          <Database size={16} className="text-gray-400 shrink-0" />
          <select
            value={selectedDatasetId}
            onChange={(e) => setSelectedDatasetId(e.target.value)}
            disabled={datasetsLoading}
            className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            <option value="">No dataset — use default schema</option>
            {datasets.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        {/* Query input + submit */}
        <div className="flex gap-2">
          <input
            type="text"
            value={queryText}
            onChange={(e) => setQueryText(e.target.value)}
            placeholder="e.g. Show me total sales by city for last month"
            className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {voiceSupported && (
            <button
              type="button"
              onClick={handleVoiceInput}
              title={isListening ? 'Stop listening' : 'Start voice input'}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
                isListening
                  ? 'border-red-400 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                  : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              {isListening ? (
                <>
                  <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span>Listening…</span>
                </>
              ) : (
                <Mic size={16} />
              )}
            </button>
          )}
          <button
            type="submit"
            disabled={loading || !queryText.trim()}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2.5 text-sm font-medium transition-colors"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            {loading ? 'Processing…' : 'Submit'}
          </button>
        </div>
      </form>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 px-4 py-3 text-red-800 dark:text-red-300 text-sm">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Results */}
      {result && <QueryResults result={result} />}
    </div>
  );
}

// ─── QueryResults sub-component ──────────────────────────────────────────────

function QueryResults({ result }: { result: QueryResponse }) {
  const columns = result.data.length > 0 ? Object.keys(result.data[0]) : [];
  const vizType = result.visualizationSuggestion;
  const keys = result.visualizationKeys;

  return (
    <div className="space-y-6">
      {/* Natural language summary */}
      {result.naturalLanguageSummary && (
        <p className="text-sm text-gray-600 dark:text-gray-300 italic">
          {result.naturalLanguageSummary}
        </p>
      )}

      {/* Generated SQL */}
      <section>
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
          Generated SQL
        </h2>
        <pre className="rounded-lg bg-gray-900 dark:bg-gray-950 text-green-400 text-sm p-4 overflow-x-auto whitespace-pre-wrap">
          <code>{result.generatedSql}</code>
        </pre>
      </section>

      {/* Optimization feedback */}
      {result.optimizationFeedback && (
        <section>
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
            Optimization Feedback
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-lg px-4 py-3 border border-gray-200 dark:border-gray-700">
            {result.optimizationFeedback}
          </p>
        </section>
      )}

      {/* Result table */}
      {columns.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
            Results ({result.data.length} rows)
          </h2>
          <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  {columns.map((col) => (
                    <th
                      key={col}
                      className="px-4 py-2.5 text-left font-medium text-gray-600 dark:text-gray-300 whitespace-nowrap"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700 bg-white dark:bg-gray-900">
                {result.data.map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    {columns.map((col) => (
                      <td
                        key={col}
                        className="px-4 py-2.5 text-gray-700 dark:text-gray-300 whitespace-nowrap"
                      >
                        {String(row[col] ?? '')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Chart */}
      {vizType !== 'none' && result.data.length > 0 && keys && (
        <section>
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
            Visualization
          </h2>
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
            <ResponsiveContainer width="100%" height={300}>
              {vizType === 'bar' ? (
                <BarChart data={result.data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                  <XAxis dataKey={keys.xAxis} tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  {keys.dataKeys.map((k, i) => (
                    <Bar key={k} dataKey={k} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </BarChart>
              ) : vizType === 'line' ? (
                <LineChart data={result.data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                  <XAxis dataKey={keys.xAxis} tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  {keys.dataKeys.map((k, i) => (
                    <Line
                      key={k}
                      type="monotone"
                      dataKey={k}
                      stroke={CHART_COLORS[i % CHART_COLORS.length]}
                      dot={false}
                    />
                  ))}
                </LineChart>
              ) : vizType === 'area' ? (
                <AreaChart data={result.data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                  <XAxis dataKey={keys.xAxis} tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  {keys.dataKeys.map((k, i) => (
                    <Area
                      key={k}
                      type="monotone"
                      dataKey={k}
                      stroke={CHART_COLORS[i % CHART_COLORS.length]}
                      fill={CHART_COLORS[i % CHART_COLORS.length]}
                      fillOpacity={0.2}
                    />
                  ))}
                </AreaChart>
              ) : (
                // pie
                <PieChart>
                  <Pie
                    data={result.data}
                    dataKey={keys.dataKeys[0]}
                    nameKey={keys.xAxis}
                    cx="50%"
                    cy="50%"
                    outerRadius={110}
                    label
                  >
                    {result.data.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              )}
            </ResponsiveContainer>
          </div>
          {result.chartDescription && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 italic">
              {result.chartDescription}
            </p>
          )}
        </section>
      )}
    </div>
  );
}
