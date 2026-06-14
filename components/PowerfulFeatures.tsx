import React from 'react';

interface PowerfulFeaturesProps {
  onVoiceCommandClick?: () => void;
}

interface FeatureCardData {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick?: () => void;
  iconBgColor: string;
  iconColor: string;
}

export const PowerfulFeatures: React.FC<PowerfulFeaturesProps> = ({ onVoiceCommandClick }) => {
  const features: FeatureCardData[] = [
    {
      id: 'ai-translation',
      title: 'AI Translation',
      description: 'Convert natural language to optimized SQL queries instantly.',
      iconBgColor: 'bg-cyan-50 dark:bg-cyan-900/20',
      iconColor: 'text-cyan-500',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
    },
    {
      id: 'voice-commands',
      title: 'Voice Commands',
      description: 'Speak your queries naturally with integrated speech-to-text.',
      iconBgColor: 'bg-blue-50 dark:bg-blue-900/20',
      iconColor: 'text-blue-500',
      onClick: onVoiceCommandClick,
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
        </svg>
      ),
    },
    {
      id: 'visual-analytics',
      title: 'Visual Analytics',
      description: 'Automatic chart generation for immediate data insights.',
      iconBgColor: 'bg-indigo-50 dark:bg-indigo-900/20',
      iconColor: 'text-indigo-500',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="w-full mt-16">
      <div className="text-center mb-10">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
          Powerful Features
        </h2>
        <p className="text-slate-500 dark:text-slate-400">
          Everything you need to query your database naturally
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {features.map((feature) => (
          <div
            key={feature.id}
            onClick={feature.onClick}
            className={`bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all text-center group ${
              feature.onClick ? 'cursor-pointer' : ''
            }`}
          >
            <div
              className={`w-12 h-12 ${feature.iconBgColor} rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform ${feature.iconColor}`}
            >
              {feature.icon}
            </div>
            <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-2">
              {feature.title}
            </h4>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              {feature.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
