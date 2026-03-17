import { backendFetch } from './backend';

export interface ChartPoint {
  x: string;
  y: number;
}

export interface Metric {
  id: string;
  label: string;
  type?: 'chart' | 'text';
  value?: string;
  changePercent: number;
  trendLabel: string;
  color?: string;
  chartData: ChartPoint[];
}

export interface DashboardSummary {
  catId: string;
  status: string;
  updatedAt: string;
  coverage: {
    totalDays: number;
    daysWithData: number;
  };
  metrics: Metric[];
  insights: string[];
  riskStatus?: {
    level: string;
    description: string;
  };
}

export interface WeeklyReport {
  id: string;
  rangeLabel: string;
  summary: string;
  score: number;
  status: string;
}

/**
 * 대시보드 요약 및 차트 데이터 조회
 */
export async function fetchDashboardSummary(catId: string): Promise<DashboardSummary | null> {
  try {
    const response = await backendFetch<any>(`/dashboard/${catId}/summary`, {
      method: 'GET',
    });

    if (!response) return null;

    // Handle wrapped response {success: true, data: {...}}
    if (response.success && response.data) {
      return response.data as DashboardSummary;
    }

    return response as DashboardSummary;
  } catch (error) {
    console.error('Failed to fetch dashboard summary:', error);
    return null;
  }
}

/**
 * 주간 리포트 목록 조회
 */
export async function fetchDashboardReports(catId: string): Promise<WeeklyReport[]> {
  try {
    const response = await backendFetch<any>(`/dashboard/${catId}/reports`, {
      method: 'GET',
    });

    if (!response) return [];

    // Handle wrapped response {success: true, data: {...}}
    if (response.success && response.data) {
      return response.data as WeeklyReport[];
    }

    if (Array.isArray(response)) {
      return response as WeeklyReport[];
    }

    return [];
  } catch (error) {
    console.error('Failed to fetch dashboard reports:', error);
    return [];
  }
}
