import React, { useState, useEffect, useRef } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';
import { QueryResponse } from '../types';

interface DataVisualizerProps {
  result: QueryResponse;
  isDarkMode?: boolean;
}

// Updated Cool Blue/Cyan Spectrum
const COLORS = ['#2563eb', '#06b6d4', '#10b981', '#6366f1', '#3b82f6', '#0ea5e9'];
const DARK_COLORS = ['#3b82f6', '#22d3ee', '#34d399', '#818cf8', '#60a5fa', '#38bdf8'];

type ChartType = 'bar' | 'line' | 'area' | 'pie';

export const DataVisualizer: React.FC<DataVisualizerProps> = ({ result, isDarkMode = false }) => {
  const { visualizationSuggestion, visualizationKeys, data } = result;
  const [activeChartType, setActiveChartType] = useState<ChartType>('bar');
  const chartRef = useRef<HTMLDivElement>(null);

  // Initialize with the AI's suggestion, defaulting to 'bar' if 'none' or undefined
  useEffect(() => {
    if (visualizationSuggestion && visualizationSuggestion !== 'none') {
      setActiveChartType(visualizationSuggestion as ChartType);
    } else {
      setActiveChartType('bar');
    }
  }, [visualizationSuggestion, result]); // Reset when result changes
  
  if (!data || data.length === 0) {
    return null;
  }

  // Fallback Logic: Auto-detect numeric keys if AI didn't explicitly return them
  let xAxisKey = visualizationKeys?.xAxis;
  let dataKeys = visualizationKeys?.dataKeys;

  // 1. If keys are missing, try to auto-detect
  if (!xAxisKey || !dataKeys || dataKeys.length === 0) {
      const keys = Object.keys(data[0]);
      // Find likely X Axis (String/Date)
      xAxisKey = keys.find(k => typeof data[0][k] === 'string') || keys[0];
      // Find likely Data Keys (Numbers)
      dataKeys = keys.filter(k => typeof data[0][k] === 'number');
  }

  // 2. If still no valid numeric data, abort
  if (!dataKeys || dataKeys.length === 0) {
      return (
          <div className="bg-white dark:bg-slate-800 p-8 rounded-lg text-center text-slate-400 h-96 flex items-center justify-center">
              Unable to generate chart: No numerical data found in query results.
          </div>
      );
  }

  const chartColors = isDarkMode ? DARK_COLORS : COLORS;
  const gridColor = isDarkMode ? "#334155" : "#e2e8f0"; // slate-700 vs slate-200
  const axisColor = isDarkMode ? "#94a3b8" : "#64748b"; // slate-400 vs slate-500
  const tooltipStyle = {
    backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
    borderColor: isDarkMode ? '#334155' : '#ffffff',
    color: isDarkMode ? '#f8fafc' : '#1e293b',
    borderRadius: '8px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
  };

  const handleDownloadChart = () => {
    if (chartRef.current) {
        // Find the SVG element created by Recharts
        const svgElement = chartRef.current.querySelector('svg.recharts-surface');
        
        if (svgElement) {
            // Serialize SVG to string
            const serializer = new XMLSerializer();
            const svgString = serializer.serializeToString(svgElement);
            
            // Create a Canvas to draw the SVG
            const canvas = document.createElement('canvas');
            const rect = svgElement.getBoundingClientRect();
            canvas.width = rect.width;
            canvas.height = rect.height;
            const ctx = canvas.getContext('2d');
            
            if (ctx) {
                // Set background based on theme (SVGs are transparent by default)
                ctx.fillStyle = isDarkMode ? '#1e293b' : '#ffffff';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                const img = new Image();
                // Create a blob from the SVG string
                const blob = new Blob([svgString], {type: 'image/svg+xml;charset=utf-8'});
                const url = URL.createObjectURL(blob);
                
                img.onload = () => {
                    ctx.drawImage(img, 0, 0);
                    // Trigger download
                    const pngUrl = canvas.toDataURL('image/png');
                    const downloadLink = document.createElement('a');
                    downloadLink.href = pngUrl;
                    downloadLink.download = `chart_visualization_${new Date().toISOString().slice(0,19).replace(/[:T]/g, '-')}.png`;
                    document.body.appendChild(downloadLink);
                    downloadLink.click();
                    document.body.removeChild(downloadLink);
                    URL.revokeObjectURL(url);
                };
                
                img.src = url;
            }
        }
    }
  };

  const renderChart = () => {
    switch (activeChartType) {
      case 'bar':
        return (
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
            <XAxis dataKey={xAxisKey} stroke={axisColor} fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke={axisColor} fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: isDarkMode ? '#334155' : '#f1f5f9', opacity: 0.4 }} />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
            {dataKeys.map((key, index) => (
              <Bar key={key} dataKey={key} fill={chartColors[index % chartColors.length]} radius={[4, 4, 0, 0]} />
            ))}
          </BarChart>
        );
      case 'line':
        return (
          <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
            <XAxis dataKey={xAxisKey} stroke={axisColor} fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke={axisColor} fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
            {dataKeys.map((key, index) => (
              <Line 
                key={key} 
                type="monotone" 
                dataKey={key} 
                stroke={chartColors[index % chartColors.length]} 
                strokeWidth={3}
                dot={{ strokeWidth: 2, r: 4, fill: isDarkMode ? '#1e293b' : '#fff' }}
                activeDot={{ r: 6 }}
              />
            ))}
          </LineChart>
        );
      case 'area':
        return (
          <AreaChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
            <XAxis dataKey={xAxisKey} stroke={axisColor} fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke={axisColor} fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
            {dataKeys.map((key, index) => (
              <Area 
                key={key} 
                type="monotone" 
                dataKey={key} 
                fill={chartColors[index % chartColors.length]} 
                stroke={chartColors[index % chartColors.length]} 
                fillOpacity={0.2}
              />
            ))}
          </AreaChart>
        );
      case 'pie':
        const pieMetric = dataKeys[0];
        return (
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={5}
              dataKey={pieMetric}
              nameKey={xAxisKey}
              stroke={isDarkMode ? '#1e293b' : '#fff'}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} />
            <Legend layout="vertical" verticalAlign="middle" align="right" />
          </PieChart>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 h-[500px] flex flex-col transition-colors duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                Visualization
                {visualizationSuggestion !== 'none' && (
                    <span className="text-[10px] bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded uppercase tracking-wide font-bold">
                        AI Suggested: {visualizationSuggestion}
                    </span>
                )}
            </h3>
        </div>
        
        <div className="flex items-center gap-3">
            {/* Chart Type Selector */}
            <div className="flex bg-slate-100 dark:bg-slate-700/50 p-1 rounded-lg">
                {(['bar', 'line', 'area', 'pie'] as ChartType[]).map((type) => (
                    <button
                        key={type}
                        onClick={() => setActiveChartType(type)}
                        className={`px-3 py-1.5 text-xs font-bold uppercase rounded-md transition-all ${
                            activeChartType === type 
                                ? 'bg-white dark:bg-slate-600 text-blue-600 dark:text-blue-400 shadow-sm' 
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                        }`}
                    >
                        {type}
                    </button>
                ))}
            </div>

            {/* Download Chart Button */}
            <button 
                onClick={handleDownloadChart}
                className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                title="Download Chart as PNG"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
            </button>
        </div>
      </div>
      
      <div ref={chartRef} className="flex-grow min-h-0 w-full">
        <ResponsiveContainer width="100%" height="100%">
            {renderChart() || <div className="flex items-center justify-center h-full text-slate-400">Unable to render chart</div>}
        </ResponsiveContainer>
      </div>
    </div>
  );
};