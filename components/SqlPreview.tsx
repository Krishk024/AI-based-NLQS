import React, { useState } from 'react';

interface SqlPreviewProps {
  sql: string;
}

export const SqlPreview: React.FC<SqlPreviewProps> = ({ sql }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-[#1e293b] rounded-xl overflow-hidden shadow-none flex flex-col h-full border border-slate-700">
      <div className="flex items-center justify-between px-4 py-3 bg-[#0f172a] border-b border-slate-700/50">
        <div className="flex space-x-2">
           <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
           <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
           <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
        </div>
        <button 
          onClick={handleCopy}
          className="text-xs font-medium text-slate-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-3 py-1 rounded-md border border-white/5"
        >
          {copied ? 'Copied!' : 'Copy SQL'}
        </button>
      </div>
      <div className="p-6 overflow-x-auto flex-grow scrollbar-thin scrollbar-thumb-slate-700">
        <pre className="font-mono text-sm leading-relaxed text-emerald-400 whitespace-pre-wrap">
          {sql}
        </pre>
      </div>
    </div>
  );
};