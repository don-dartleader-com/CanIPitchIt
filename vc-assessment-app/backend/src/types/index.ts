export interface User {
  id: number;
  email: string;
  password_hash?: string;
  role: 'user' | 'admin';
  is_verified: boolean;
  created_at: Date;
  updated_at: Date;
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
  created_at: Date;
  updated_at: Date;
}

export interface AssessmentCategory {
  id: number;
  name: string;
  description?: string;
  weight: number;
  order_index: number;
  is_active: boolean;
  created_at: Date;
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
  created_at: Date;
  updated_at: Date;
}

export interface QuestionOption {
  value: number;
  text: string;
  points: number;
}

export interface AssessmentTemplate {
  id: number;
  name: string;
  version: string;
  description?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
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
  completed_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface AssessmentResponse {
  question_id: number;
  value: number;
  points: number;
}

export interface AssessmentResults {
  id: number;
  assessment_id: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  percentile_rank?: number;
  industry_comparison?: Record<string, any>;
  created_at: Date;
}

export interface ScoreResult {
  totalScore: number;
  categoryScores: Record<number, CategoryScore>;
  percentileRank?: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}

export interface CategoryScore {
  score: number;
  maxScore: number;
  percentage: number;
  categoryName: string;
}

export interface Benchmark {
  id: number;
  industry: string;
  stage: string;
  category_averages: Record<string, number>;
  percentiles: Record<string, number>;
  sample_size: number;
  updated_at: Date;
}

export interface ActionPlan {
  id: number;
  user_id: number;
  assessment_id: number;
  admin_id: number;
  title: string;
  plan_data: ActionPlanData;
  status: 'draft' | 'active' | 'completed';
  created_at: Date;
  updated_at: Date;
}

export interface ActionPlanData {
  objectives: ActionPlanObjective[];
  timeline: string;
  priority: 'low' | 'medium' | 'high';
  notes?: string;
}

export interface ActionPlanObjective {
  id: string;
  title: string;
  description: string;
  category: string;
  deadline?: Date;
  status: 'pending' | 'in_progress' | 'completed';
  resources?: string[];
}

export interface InvestorIntro {
  id: number;
  user_id: number;
  assessment_id: number;
  intro_text: string;
  investor_name?: string;
  status: 'draft' | 'sent' | 'responded';
  generated_at: Date;
  sent_at?: Date;
}

export interface InvestorIntroData {
  companyName: string;
  founderNames: string[];
  industry: string;
  problemStatement: string;
  solution: string;
  traction: {
    pilots?: string;
    pipeline?: string;
    revenue?: string;
  };
  fundraising: {
    amount: string;
    valuation: string;
    softCircled?: string;
    useOfFunds: string;
  };
  deckUrl?: string;
  websiteUrl?: string;
  articleUrl?: string;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Request Types
export interface CreateUserRequest {
  email: string;
  password: string;
  company_name?: string;
  founder_name?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SubmitAssessmentRequest {
  template_id: number;
  responses: Record<number, number>;
  user_info?: {
    email: string;
    company_name?: string;
    founder_name?: string;
  };
}

export interface CreateQuestionRequest {
  category_id: number;
  text: string;
  description?: string;
  type: 'multiple_choice' | 'scale' | 'yes_no' | 'text';
  weight: number;
  options: QuestionOption[];
  order_index: number;
}

export interface UpdateQuestionRequest extends Partial<CreateQuestionRequest> {
  id: number;
}

// JWT Payload
export interface JWTPayload {
  userId: number;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

// Database Query Options
export interface QueryOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  filters?: Record<string, any>;
}

// Email Types
export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface AssessmentCompletionEmailData {
  userName: string;
  companyName: string;
  totalScore: number;
  categoryScores: Record<string, CategoryScore>;
  resultsUrl: string;
}
