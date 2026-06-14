
import React from 'react';
import { AiRecommendation } from '../types';

interface RecommendationEngineProps {
  recommendation: AiRecommendation;
  onFollowUpClick: (query: string) => void;
}

export const RecommendationEngine: React.FC<RecommendationEngineProps> = ({ recommendation, onFollowUpClick }) => {
  const { performanceLabel, summary, explanation, impactLevel, recommendedActions, followUpQueries } = recommendation;

  const getTheme = () => {
    switch (performanceLabel) {
      case 'positive':
        return {
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.25 11.25 0 0011.66 0L21.75 18M9 11.25l3.536-3.536m3.182-3.182L21.75 3m0 0h-3.75m3.75 0v3.75" />
            </svg>
          ),
          iconColor: 'text-emerald-400',
          iconBg: 'bg-emerald-400/10',
          label: 'Success'
        };
      case 'negative':
        return {
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          ),
          iconColor: 'text-rose-400',
          iconBg: 'bg-rose-400/10',
          label: 'Warning'
        };
      default:
        return {
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
            </svg>
          ),
          iconColor: 'text-blue-400',
          iconBg: 'bg-blue-400/10',
          label: 'Observation'
        };
    }
  };

  const theme = getTheme();

  return (
    <div className="rounded-[2rem] bg-[#0f172a] border border-slate-800/60 p-10 shadow-2xl animate-slide-up-fade transition-colors duration-500">
      {/* Header Section */}
      <div className="flex flex-col gap-5 mb-8">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-full ${theme.iconBg} ${theme.iconColor} shadow-lg shadow-emerald-500/5`}>
            {theme.icon}
          </div>
          <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
            <span className={theme.iconColor}>{theme.label}:</span>
            <span className="opacity-95">{summary}</span>
          </h3>
        </div>
        
        {/* Impact Badge - Sleek Red Pill */}
        <div className="flex">
          <span className="bg-[#f43f5e] text-white text-[10px] px-4 py-1.5 rounded-full font-black uppercase tracking-[0.2em] shadow-lg shadow-rose-500/20">
            {impactLevel} IMPACT
          </span>
        </div>
      </div>

      {/* Main Narrative Explanation */}
      <p className="text-slate-400 text-base leading-relaxed mb-12 font-medium max-w-4xl">
        {explanation}
      </p>

      {/* Actionable Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
        
        {/* Left Column: Recommended Actions */}
        <div className="space-y-8">
          <h4 className="text-[11px] font-black uppercase tracking-[0.25em] text-[#10b981]/90">RECOMMENDED ACTIONS</h4>
          <ul className="space-y-6">
            {recommendedActions.map((action, i) => (
              <li key={i} className="flex items-start gap-4 group cursor-default">
                <div className="mt-1.5 w-2 h-2 rounded-full bg-[#10b981] shrink-0 shadow-[0_0_10px_rgba(16,185,129,0.6)] group-hover:scale-125 transition-transform duration-300"></div>
                <span className="text-sm font-semibold text-slate-300 group-hover:text-white transition-colors duration-300 leading-snug">
                  {action}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Right Column: Suggested Next Steps (Interactive Cards) */}
        <div className="space-y-8">
          <h4 className="text-[11px] font-black uppercase tracking-[0.25em] text-[#10b981]/90">SUGGESTED NEXT STEPS</h4>
          <div className="grid grid-cols-1 gap-4">
            {followUpQueries.map((query, i) => (
              <button
                key={i}
                onClick={() => onFollowUpClick(query)}
                className="w-full text-left bg-[#1e293b]/40 hover:bg-[#1e293b] border border-slate-700/40 hover:border-slate-600 p-5 rounded-2xl transition-all duration-300 group flex items-center justify-between"
              >
                <span className="text-sm font-semibold text-slate-300 group-hover:text-white truncate pr-6">
                  {query}
                </span>
                <div className="flex-shrink-0 bg-slate-800 p-2 rounded-lg group-hover:bg-blue-600 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5 text-slate-500 group-hover:text-white transition-all transform group-hover:translate-x-0.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
