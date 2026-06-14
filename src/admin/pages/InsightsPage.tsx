import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, RefreshCw, Loader2, AlertCircle, Database } from 'lucide-react';
import { adminFetch } from '../adminApi';
import { InsightCard } from '../components/InsightCard';
import type { DatasetMeta, DatasetSchema, InsightCard as InsightCardType } from '../types';
import { processNaturalLanguageQuery } from '../../../services/geminiService';

const INSIGHTS_PROMPT =
  'Generate business intelligence insights. Identify: ' +
  '1) Top performing products or categories, ' +
  '2) Sales trends and patterns, ' +
  '3) Anomalies or outliers in the data. ' +
  'Return insights as the recommendation field.';

function mapRecommendationToInsightCard(rec: any): InsightCardType {
  return {
    title: rec.summary ?? 'Insight',
    summary: rec.summary ?? '',
    explanation: rec.explanation ?? '',
    impactLevel: (['High', 'Medium', 'Low'].includes(rec.impactLevel) ? rec.impactLevel : 'Medium') as InsightCardType['impactLevel'],
    recommendedActions: Array.isArray(rec.recommendedActions) ? rec.recommendedActions : [],
    followUpQueries: Array.isArray(rec.followUpQueries) ? rec.followUpQueries : [],
  };
}

export function InsightsPage() {
  const navigate = useNavigate();

  const [datasets, setDatasets] = useState<DatasetMeta[]>([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState('');
  const [datasetsLoading, setDatasetsLoading] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [headerSummary, setHeaderSummary] = useState<string | null>(null);
  const [insights, setInsights] = useState<InsightCardType[]>([]);

  // Load dataset list on mount
  useEffect(() => {
    setDatasetsLoading(true);
    adminFetch<DatasetMeta[]>('/api/datasets')
      .then(setDatasets)
      .catch(() => setDatasets([]))
      .finally(() => setDatasetsLoading(false));
  }, []);

  const generateInsights = useCallback(async () => {
    setLoading(true);
    setError(null);
    setInsights([]);
    setHeaderSummary(null);

    try {
      let context: string | undefined;

      if (selectedDatasetId) {
        const data = await adminFetch<{ meta: DatasetMeta; schema: DatasetSchema }>(
          `/api/datasets/${selectedDatasetId}`
        );
        const meta = datasets.find((d) => d.id === selectedDatasetId);
        context =
          `Dataset name: ${meta?.name ?? selectedDatasetId}. ` +
          `Schema: ${JSON.stringify(data.schema.columns)}`;
      }

      const response = await processNaturalLanguageQuery(INSIGHTS_PROMPT, context);

      setHeaderSummary(response.naturalLanguageSummary ?? null);

      if (response.recommendation) {
        setInsights([mapRecommendationToInsightCard(response.recommendation)]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate insights. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [selectedDatasetId, datasets]);

  // Auto-generate on mount
  useEffect(() => {
    generateInsights();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleFollowUpClick(query: string) {
    navigate('/admin/query', { state: { query } });
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Sparkles size={22} className="text-indigo-500" />
            AI Insights
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Automatically generated business intelligence from your data.
          </p>
        </div>

        <button
          onClick={generateInsights}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2.5 text-sm font-medium transition-colors"
        >
          {loading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <RefreshCw size={16} />
          )}
          {loading ? 'Generating…' : 'Generate Insights'}
        </button>
      </div>

      {/* Dataset selector */}
      <div className="flex items-center gap-2">
        <Database size={16} className="text-gray-400 shrink-0" />
        <select
          value={selectedDatasetId}
          onChange={(e) => setSelectedDatasetId(e.target.value)}
          disabled={datasetsLoading || loading}
          className="flex-1 max-w-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          <option value="">No dataset — use default schema</option>
          {datasets.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-40 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse"
            />
          ))}
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <div className="flex flex-col items-start gap-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 px-5 py-4">
          <div className="flex items-start gap-3 text-red-800 dark:text-red-300 text-sm">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
          <button
            onClick={generateInsights}
            className="flex items-center gap-2 rounded-lg border border-red-300 dark:border-red-700 bg-white dark:bg-gray-800 text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/30 px-3 py-1.5 text-sm font-medium transition-colors"
          >
            <RefreshCw size={14} />
            Retry
          </button>
        </div>
      )}

      {/* Results */}
      {!loading && !error && insights.length > 0 && (
        <div className="space-y-4">
          {/* Header summary */}
          {headerSummary && (
            <div className="rounded-xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 px-5 py-4">
              <p className="text-sm font-medium text-indigo-800 dark:text-indigo-300 flex items-start gap-2">
                <Sparkles size={15} className="shrink-0 mt-0.5" />
                {headerSummary}
              </p>
            </div>
          )}

          {/* Insight cards */}
          {insights.map((insight, i) => (
            <InsightCard
              key={i}
              insight={insight}
              onFollowUpClick={handleFollowUpClick}
            />
          ))}
        </div>
      )}

      {/* Empty state (after load, no error, no insights) */}
      {!loading && !error && insights.length === 0 && (
        <div className="text-center py-16 text-gray-400 dark:text-gray-500 text-sm">
          No insights generated yet. Click "Generate Insights" to get started.
        </div>
      )}
    </div>
  );
}
