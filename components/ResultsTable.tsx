import React from 'react';

interface ResultsTableProps {
  data: any[];
}

export const ResultsTable: React.FC<ResultsTableProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="p-12 text-center text-slate-400 italic">
        No data returned for this query.
      </div>
    );
  }

  const columns = Object.keys(data[0]);

  const downloadCSV = () => {
    if (!data || data.length === 0) return;
    
    // Create CSV content
    const headers = columns.join(',');
    const rows = data.map(row => 
      columns.map(col => {
        const val = row[col] === null || row[col] === undefined ? '' : row[col];
        // Escape quotes and wrap in quotes to handle commas within data
        return `"${String(val).replace(/"/g, '""')}"`;
      }).join(',')
    );
    
    const csvContent = [headers, ...rows].join('\n');
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `query_results_${new Date().toISOString().slice(0,10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full overflow-hidden rounded-b-xl bg-white dark:bg-slate-800 transition-colors duration-300">
      {/* Table Toolbar */}
      <div className="flex justify-end px-6 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700">
        <button 
          onClick={downloadCSV}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg transition-colors"
          title="Download as CSV"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          Export CSV
        </button>
      </div>

      <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700 scrollbar-track-transparent">
        <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-700">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-700/50">
              {columns.map((col) => (
                <th
                  key={col}
                  scope="col"
                  className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-300 uppercase tracking-wider whitespace-nowrap first:pl-8"
                >
                  {col.replace(/_/g, ' ')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-50 dark:divide-slate-700">
            {data.map((row, idx) => (
              <tr 
                key={idx} 
                className="hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors group opacity-0 animate-slide-up-fade"
                style={{ animationDelay: `${idx * 0.05}s`, animationFillMode: 'forwards' }}
              >
                {columns.map((col) => (
                  <td 
                    key={`${idx}-${col}`} 
                    className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white first:pl-8"
                  >
                    {typeof row[col] === 'number' 
                      ? row[col].toLocaleString(undefined, { maximumFractionDigits: 2 })
                      : String(row[col])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 text-xs text-slate-400 flex justify-between items-center rounded-b-xl">
        <span>Showing {data.length} result(s)</span>
        <span className="bg-white dark:bg-slate-700 px-2 py-1 rounded border border-slate-200 dark:border-slate-600 shadow-sm text-blue-600 dark:text-blue-400 font-medium">Simulated Environment</span>
      </div>
    </div>
  );
};