import type { InsightCard as InsightCardType } from '../types';

interface InsightCardProps {
  insight: InsightCardType;
  onFollowUpClick: (query: string) => void;
}

const impactConfig = {
  High: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
  Medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400',
  Low: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',
};

export function InsightCard({ insight, onFollowUpClick }: InsightCardProps) {
  const { title, summary, explanation, impactLevel, recommendedActions, followUpQueries } = insight;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white leading-snug">{title}</h3>
        <span className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${impactConfig[impactLevel]}`}>
          {impactLevel}
        </span>
      </div>

      {/* Summary */}
      <p className="text-sm text-gray-600 dark:text-gray-300">{summary}</p>

      {/* Explanation */}
      <p className="text-sm text-gray-500 dark:text-gray-400 italic">{explanation}</p>

      {/* Recommended actions */}
      {recommendedActions.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-2">
            Recommended Actions
          </p>
          <ul className="space-y-1">
            {recommendedActions.map((action, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                {action}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Follow-up query chips */}
      {followUpQueries.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-2">
            Follow-up Queries
          </p>
          <div className="flex flex-wrap gap-2">
            {followUpQueries.map((query, i) => (
              <button
                key={i}
                onClick={() => onFollowUpClick(query)}
                className="text-xs px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 transition-colors border border-blue-200 dark:border-blue-800"
              >
                {query}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
