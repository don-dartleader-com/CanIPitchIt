export interface QuestionOption {
  value: number;
  text: string;
  points: number;
}

export interface Question {
  id: number;
  category_id: number;
  text: string;
  description?: string;
  type: 'multiple_choice' | 'scale' | 'yes_no' | 'text';
  weight: number;
  options: QuestionOption[];
  order_index: number;
  is_active: boolean;
}

export interface AssessmentCategory {
  id: number;
  name: string;
  description?: string;
  weight: number;
  order_index: number;
  is_active: boolean;
}

export interface CategoryScore {
  score: number;
  maxScore: number;
  percentage: number;
  categoryName: string;
}

export interface AssessmentResults {
  totalScore: number;
  categoryScores: Record<number, CategoryScore>;
  percentileRank?: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}

export interface Assessment {
  id: number;
  user_id?: number;
  template_id: number;
  session_id?: string;
  responses: Record<number, number>;
  total_score?: number;
  category_scores?: Record<number, number>;
  is_completed: boolean;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface AssessmentResponse {
  [questionId: number]: number;
}

export interface User {
  id: number;
  email: string;
  role: 'user' | 'admin';
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: number;
  user_id: number;
  company_name?: string;
  founder_name?: string;
  industry?: string;
  stage?: string;
  website?: string;
  linkedin_url?: string;
  description?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface AssessmentFormData {
  responses: AssessmentResponse;
  userInfo?: {
    email?: string;
    company_name?: string;
    founder_name?: string;
  };
}

export interface ProgressState {
  currentQuestion: number;
  totalQuestions: number;
  currentCategory: string;
  completedCategories: string[];
  responses: AssessmentResponse;
}

export interface ScoreBreakdown {
  category: string;
  score: number;
  maxScore: number;
  percentage: number;
  color: string;
}

export interface RecommendationItem {
  category: string;
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  actionItems: string[];
}

export interface BenchmarkData {
  industry: string;
  stage: string;
  averageScore: number;
  percentiles: {
    '25th': number;
    '50th': number;
    '75th': number;
    '90th': number;
  };
  sampleSize: number;
}

export interface AssessmentState {
  questions: Question[];
  categories: AssessmentCategory[];
  currentQuestionIndex: number;
  responses: AssessmentResponse;
  isLoading: boolean;
  error: string | null;
  isCompleted: boolean;
  results?: AssessmentResults;
}

export interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface AdminState {
  questions: Question[];
  categories: AssessmentCategory[];
  assessments: Assessment[];
  selectedAssessment: Assessment | null;
  isLoading: boolean;
  error: string | null;
}

// Form validation types
export interface ValidationError {
  field: string;
  message: string;
}

export interface FormState<T> {
  data: T;
  errors: ValidationError[];
  isSubmitting: boolean;
  isValid: boolean;
}

// Chart data types for results visualization
export interface ChartDataPoint {
  name: string;
  value: number;
  color?: string;
}

export interface RadarChartData {
  category: string;
  score: number;
  maxScore: number;
  fullMark: number;
}

// Navigation and routing types
export interface RouteConfig {
  path: string;
  component: React.ComponentType;
  exact?: boolean;
  protected?: boolean;
  adminOnly?: boolean;
}

// Email and sharing types
export interface EmailResultsRequest {
  assessmentId: number;
  email: string;
  includeRecommendations?: boolean;
}

export interface ShareableLink {
  url: string;
  expiresAt: string;
  accessCount: number;
}

// Analytics types
export interface AnalyticsData {
  totalAssessments: number;
  averageScore: number;
  completionRate: number;
  categoryBreakdown: Record<string, number>;
  industryDistribution: Record<string, number>;
  stageDistribution: Record<string, number>;
  timeSeriesData: Array<{
    date: string;
    assessments: number;
    averageScore: number;
  }>;
}

// Export constants
export const INDUSTRIES = [
  'Technology',
  'Healthcare',
  'Fintech',
  'E-commerce',
  'SaaS',
  'Biotech',
  'CleanTech',
  'EdTech',
  'FoodTech',
  'PropTech',
  'Other'
] as const;

export const STAGES = [
  'Idea',
  'Pre-Seed',
  'Seed',
  'Series A',
  'Series B',
  'Series C+',
  'Growth'
] as const;

export const QUESTION_TYPES = [
  'multiple_choice',
  'scale',
  'yes_no',
  'text'
] as const;

export type Industry = typeof INDUSTRIES[number];
export type Stage = typeof STAGES[number];
export type QuestionType = typeof QUESTION_TYPES[number];
