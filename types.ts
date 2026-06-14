
export enum QueryStatus {
  IDLE = 'IDLE',
  PROCESSING = 'PROCESSING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export interface SqlResult {
  columns: string[];
  data: Record<string, any>[];
}

export interface AiRecommendation {
  performanceLabel: 'positive' | 'negative' | 'neutral';
  summary: string;
  explanation: string;
  impactLevel: 'High' | 'Medium' | 'Low' | string;
  recommendedActions: string[];
  followUpQueries: string[];
}

export interface QueryResponse {
  naturalLanguageSummary: string;
  generatedSql: string;
  data: any[]; 
  visualizationSuggestion: 'bar' | 'line' | 'pie' | 'area' | 'none';
  visualizationKeys: {
    xAxis: string;
    dataKeys: string[];
  };
  optimizationFeedback?: string;
  recommendation?: AiRecommendation;
  chartDescription?: string;
}

export interface HistoryItem {
  id: string;
  query: string;
  timestamp: number;
  response: QueryResponse;
}

export interface SchemaTable {
  tableName: string;
  columns: string[];
  description: string;
}
