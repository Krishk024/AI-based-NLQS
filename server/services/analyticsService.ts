import db from '../db/sqlite.js';
import type { AnalyticsSummary } from '../types.js';

const CACHE_KEY = 'analytics_summary';
const CACHE_TTL_MS = 300_000; // 5 minutes

export function getCached(): AnalyticsSummary | null {
  const row = db
    .prepare('SELECT value, computed_at FROM analytics_cache WHERE key = ?')
    .get(CACHE_KEY) as { value: string; computed_at: number } | undefined;

  if (!row) return null;
  if (Date.now() - row.computed_at > CACHE_TTL_MS) return null;

  try {
    return JSON.parse(row.value) as AnalyticsSummary;
  } catch {
    return null;
  }
}

export function computeSummary(
  totalQueries: number,
  successCount: number
): AnalyticsSummary {
  // Count datasets
  const datasetRow = db
    .prepare('SELECT COUNT(*) as count FROM datasets')
    .get() as { count: number };
  const totalDatasets = datasetRow.count;

  // Count users
  const userRow = db
    .prepare('SELECT COUNT(*) as count FROM users')
    .get() as { count: number };
  const totalUsers = userRow.count;

  // Query success rate
  const querySuccessRate =
    totalQueries > 0 ? (successCount / totalQueries) * 100 : 0;

  // salesByCity: rows that have 'city' and 'total' fields
  const cityRows = db
    .prepare('SELECT row_data FROM dataset_rows')
    .all() as Array<{ row_data: string }>;

  const cityMap = new Map<string, number>();
  const categoryMap = new Map<string, number>();
  const monthMap = new Map<string, number>();

  for (const { row_data } of cityRows) {
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(row_data);
    } catch {
      continue;
    }

    // salesByCity
    if ('city' in parsed && 'total' in parsed) {
      const city = String(parsed.city);
      const total = Number(parsed.total);
      if (!isNaN(total)) {
        cityMap.set(city, (cityMap.get(city) ?? 0) + total);
      }
    }

    // salesByCategory
    if ('category' in parsed && 'total' in parsed) {
      const category = String(parsed.category);
      const total = Number(parsed.total);
      if (!isNaN(total)) {
        categoryMap.set(category, (categoryMap.get(category) ?? 0) + total);
      }
    }

    // monthlyTrend
    if ('month' in parsed && 'value' in parsed) {
      const month = String(parsed.month);
      const value = Number(parsed.value);
      if (!isNaN(value)) {
        monthMap.set(month, (monthMap.get(month) ?? 0) + value);
      }
    }
  }

  const salesByCity = Array.from(cityMap.entries()).map(([city, total]) => ({
    city,
    total,
  }));
  const salesByCategory = Array.from(categoryMap.entries()).map(
    ([category, total]) => ({ category, total })
  );
  const monthlyTrend = Array.from(monthMap.entries()).map(([month, value]) => ({
    month,
    value,
  }));

  const summary: AnalyticsSummary = {
    totalQueries,
    totalDatasets,
    totalUsers,
    querySuccessRate,
    salesByCity,
    salesByCategory,
    monthlyTrend,
  };

  // Write to cache
  db.prepare(
    'INSERT OR REPLACE INTO analytics_cache (key, value, computed_at) VALUES (?, ?, ?)'
  ).run(CACHE_KEY, JSON.stringify(summary), Date.now());

  return summary;
}
