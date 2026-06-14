// Shared admin types — mirrored in server/types.ts

export interface AdminTokenPayload {
  sub: 'admin';
  iat: number;
  exp: number;
}

export interface DatasetMeta {
  id: string; // UUID
  name: string;
  format: 'csv' | 'json';
  rowCount: number;
  columnCount: number;
  uploadedAt: number; // Unix ms
}

export interface DatasetSchema {
  datasetId: string;
  columns: Array<{ name: string; type: 'string' | 'number' | 'boolean' | 'date' }>;
}

export interface AnalyticsSummary {
  totalQueries: number;
  totalDatasets: number;
  totalUsers: number;
  querySuccessRate: number; // 0–100
  salesByCity: Array<{ city: string; total: number }>;
  salesByCategory: Array<{ category: string; total: number }>;
  monthlyTrend: Array<{ month: string; value: number }>;
}

export interface UserRecord {
  id: number;
  name: string;
  email: string;
  createdAt: number;
  lastLogin: number;
  isActive: boolean;
}

export interface InsightCard {
  title: string;
  summary: string;
  explanation: string;
  impactLevel: 'High' | 'Medium' | 'Low';
  recommendedActions: string[];
  followUpQueries: string[];
}
