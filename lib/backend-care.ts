import { backendFetch } from './backend';
import type { Question } from './types';

export interface QuestionsData {
  onboarding: Record<string, Question>;
  followUp: Record<string, Question[]>;
}

/**
 * 백엔드에서 질문 데이터 가져오기 (인증 필요)
 */
export async function fetchQuestions(): Promise<QuestionsData> {
  const response = await backendFetch<any>('/care/questions', {
    method: 'GET',
  });

  console.log('Fetched questions response:', response);

  if (!response) {
    throw new Error('Failed to fetch questions');
  }

  // Handle wrapped response {success: true, data: {...}}
  if (response.success && response.data) {
    return response.data as QuestionsData;
  }

  // Handle direct response
  return response as QuestionsData;
}

/**
 * petId별 맞춤 질문 데이터 가져오기 (DynamoDB question_bank 포함)
 */
export async function fetchQuestionsForPet(petId: string): Promise<QuestionsData> {
  const response = await backendFetch<any>(`/care/${petId}/questions`, {
    method: 'GET',
  });

  console.log('Fetched questions for pet response:', response);

  if (!response) {
    throw new Error('Failed to fetch questions for pet');
  }

  // Handle wrapped response {success: true, data: {...}}
  if (response.success && response.data) {
    return response.data as QuestionsData;
  }

  // Handle direct response
  return response as QuestionsData;
}

/**
 * 체크인 기록 저장 (questions + answers)
 */
export async function submitCheckIn(
  petId: string,
  questions: Question[],
  answers: Record<string, string>
): Promise<void> {
  const response = await backendFetch(`/care/${petId}/check-in`, {
    method: 'POST',
    body: JSON.stringify({
      questions,
      answers,
    }),
  });

  if (!response) {
    throw new Error('Failed to submit check-in');
  }
}

/**
 * 진단 기록 저장 (diagQuestions + diagAnswers)
 */
export async function submitDiag(
  petId: string,
  diagQuestions: Question[],
  diagAnswers: Record<string, string>
): Promise<void> {
  const response = await backendFetch(`/care/${petId}/diag`, {
    method: 'POST',
    body: JSON.stringify({
      diagQuestions,
      diagAnswers,
    }),
  });

  if (!response) {
    throw new Error('Failed to submit diagnosis');
  }
}

/**
 * 월간 케어 기록 조회
 */
export async function fetchMonthlyCare(
  petId: string,
  year: number,
  month: number
): Promise<{ completedDays: string[] }> {
  const response = await backendFetch<any>(
    `/care/${petId}/monthly?year=${year}&month=${month}`,
    {
      method: 'GET',
    }
  );

  if (!response) {
    return { completedDays: [] };
  }

  // Handle wrapped response {success: true, data: {...}}
  if (response.success && response.data) {
    return {
      completedDays: response.data.completedDays || []
    };
  }

  // Handle direct response
  return {
    completedDays: response.completedDays || []
  };
}

export interface CareLog {
  id: string;
  petId: string;
  date: string;
  type: string;
  questions?: any;
  answers?: Record<string, string>;
  diagQuestions?: any;
  diagAnswers?: Record<string, string>;
  reports?: any;
  createdAt: string;
}

/**
 * 특정 날짜의 케어 로그 조회
 */
export async function fetchCareLogByDate(
  petId: string,
  date: string
): Promise<CareLog | null> {
  const response = await backendFetch<any>(
    `/care/${petId}/log/${date}`,
    {
      method: 'GET',
    }
  );

  if (!response) {
    return null;
  }

  // Handle wrapped response {success: true, data: {...}}
  if (response.success && response.data) {
    return response.data as CareLog;
  }

  // Handle direct response
  return response as CareLog;
}

export interface DiagQuestion {
  id: string;
  text: string;
  type: string;
  options: {
    label: string;
    value: string;
    relatedSymptom: string;
    signal: string;
  }[];
}

/**
 * 진단 질문 가져오기 (DynamoDB DiagnosticTable에서)
 */
export async function fetchDiagQuestions(petId: string): Promise<DiagQuestion[]> {
  const response = await backendFetch<any>(
    `/care/${petId}/diag-questions`,
    {
      method: 'GET',
    }
  );

  if (!response) {
    return [];
  }

  // Handle wrapped response {success: true, data: [...]}
  if (response.success && response.data) {
    return response.data as DiagQuestion[];
  }

  // Handle direct response (array)
  if (Array.isArray(response)) {
    return response as DiagQuestion[];
  }

  return [];
}

export interface MonthlyStats {
  totalDays: number;
  food: { normal: number; less: number; more: number; none: number };
  water: { normal: number; less: number; more: number; none: number };
  stool: { normal: number; less: number; more: number; none: number; diarrhea: number };
  urine: { normal: number; less: number; more: number; none: number };
  latestWeight: number | null;
  weightChange: number | null;
  avgWeight: number | null;
  dailyData: {
    date: string;
    day: number;
    food: number;
    water: number;
    stool: number;
    urine: number;
    weight: number | null;
  }[];
}

/**
 * 월간 케어 통계 조회 (핵심 지표)
 */
export async function fetchMonthlyStats(
  petId: string,
  year: number,
  month: number
): Promise<MonthlyStats | null> {
  const response = await backendFetch<any>(
    `/care/${petId}/monthly-stats?year=${year}&month=${month}`,
    {
      method: 'GET',
    }
  );

  if (!response) {
    return null;
  }

  // Handle wrapped response {success: true, data: {...}}
  if (response.success && response.data) {
    return response.data as MonthlyStats;
  }

  // Handle direct response
  return response as MonthlyStats;
}

export interface DailyReport {
  id: string;
  date: string;
  dateLabel: string;
  status: 'normal' | 'caution' | 'check';
  summary: string;
  fullReport: string;
  createdAt: string;
}

/**
 * 일일 리포트 조회 (DynamoDB DiagnosticTable final_report)
 */
export async function fetchDailyReports(petId: string): Promise<DailyReport[]> {
  const response = await backendFetch<any>(
    `/care/${petId}/daily-reports`,
    {
      method: 'GET',
    }
  );

  if (!response) {
    return [];
  }

  // Handle wrapped response {success: true, data: [...]}
  if (response.success && response.data) {
    return response.data as DailyReport[];
  }

  // Handle direct response (array)
  if (Array.isArray(response)) {
    return response as DailyReport[];
  }

  return [];
}
