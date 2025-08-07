import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { 
  ApiResponse, 
  Question, 
  AssessmentCategory, 
  Assessment, 
  AssessmentResults, 
  AssessmentFormData,
  User,
  UserProfile
} from '../types';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5001/api',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('authToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('authToken');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Assessment endpoints
  async getQuestions(): Promise<Question[]> {
    const response: AxiosResponse<ApiResponse<Question[]>> = await this.api.get('/questions');
    return response.data.data || [];
  }

  async getCategories(): Promise<AssessmentCategory[]> {
    const response: AxiosResponse<ApiResponse<AssessmentCategory[]>> = await this.api.get('/categories');
    return response.data.data || [];
  }

  async submitAssessment(data: AssessmentFormData): Promise<Assessment> {
    const response: AxiosResponse<ApiResponse<Assessment>> = await this.api.post('/assessments', data);
    return response.data.data!;
  }

  async getAssessmentResults(assessmentId: number): Promise<AssessmentResults> {
    const response: AxiosResponse<ApiResponse<AssessmentResults>> = await this.api.get(`/assessments/${assessmentId}/results`);
    return response.data.data!;
  }

  async saveProgress(assessmentId: number, responses: Record<number, number>): Promise<void> {
    await this.api.put(`/assessments/${assessmentId}/progress`, { responses });
  }

  async emailResults(assessmentId: number, email: string): Promise<void> {
    await this.api.post(`/assessments/${assessmentId}/email`, { email });
  }

  // Authentication endpoints
  async register(email: string, password: string, profile?: Partial<UserProfile>): Promise<{ user: User; token: string }> {
    const response: AxiosResponse<ApiResponse<{ user: User; token: string }>> = await this.api.post('/auth/register', {
      email,
      password,
      profile
    });
    return response.data.data!;
  }

  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    const response: AxiosResponse<ApiResponse<{ user: User; token: string }>> = await this.api.post('/auth/login', {
      email,
      password
    });
    return response.data.data!;
  }

  async logout(): Promise<void> {
    await this.api.post('/auth/logout');
    localStorage.removeItem('authToken');
  }

  async getCurrentUser(): Promise<User> {
    const response: AxiosResponse<ApiResponse<User>> = await this.api.get('/auth/me');
    return response.data.data!;
  }

  // User profile endpoints
  async getUserProfile(): Promise<UserProfile> {
    const response: AxiosResponse<ApiResponse<UserProfile>> = await this.api.get('/user/profile');
    return response.data.data!;
  }

  async updateUserProfile(profile: Partial<UserProfile>): Promise<UserProfile> {
    const response: AxiosResponse<ApiResponse<UserProfile>> = await this.api.put('/user/profile', profile);
    return response.data.data!;
  }

  async getUserAssessments(): Promise<Assessment[]> {
    const response: AxiosResponse<ApiResponse<Assessment[]>> = await this.api.get('/user/assessments');
    return response.data.data || [];
  }

  async getUserDashboard(): Promise<any> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.get('/user/dashboard');
    return response.data.data!;
  }

  // Admin endpoints
  async getAllQuestions(): Promise<Question[]> {
    const response: AxiosResponse<ApiResponse<Question[]>> = await this.api.get('/admin/questions');
    return response.data.data || [];
  }

  async createQuestion(question: Omit<Question, 'id'>): Promise<Question> {
    const response: AxiosResponse<ApiResponse<Question>> = await this.api.post('/admin/questions', question);
    return response.data.data!;
  }

  async updateQuestion(id: number, question: Partial<Question>): Promise<Question> {
    const response: AxiosResponse<ApiResponse<Question>> = await this.api.put(`/admin/questions/${id}`, question);
    return response.data.data!;
  }

  async deleteQuestion(id: number): Promise<void> {
    await this.api.delete(`/admin/questions/${id}`);
  }

  async getAllAssessments(): Promise<Assessment[]> {
    const response: AxiosResponse<ApiResponse<Assessment[]>> = await this.api.get('/admin/assessments');
    return response.data.data || [];
  }

  async createActionPlan(assessmentId: number, plan: any): Promise<any> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.post('/admin/action-plans', {
      assessmentId,
      plan
    });
    return response.data.data!;
  }

  async generateInvestorIntro(assessmentId: number, template: string): Promise<string> {
    const response: AxiosResponse<ApiResponse<{ intro: string }>> = await this.api.post('/admin/investor-intro', {
      assessmentId,
      template
    });
    return response.data.data!.intro;
  }

  // Analytics endpoints
  async getAnalytics(dateRange?: { start: string; end: string }): Promise<any> {
    const params = dateRange ? { start: dateRange.start, end: dateRange.end } : {};
    const response: AxiosResponse<ApiResponse<any>> = await this.api.get('/admin/analytics', { params });
    return response.data.data!;
  }

  async getBenchmarks(industry?: string, stage?: string): Promise<any> {
    const params: any = {};
    if (industry) params.industry = industry;
    if (stage) params.stage = stage;
    
    const response: AxiosResponse<ApiResponse<any>> = await this.api.get('/benchmarks', { params });
    return response.data.data!;
  }

  // Utility methods
  setAuthToken(token: string): void {
    localStorage.setItem('authToken', token);
  }

  clearAuthToken(): void {
    localStorage.removeItem('authToken');
  }

  getAuthToken(): string | null {
    return localStorage.getItem('authToken');
  }

  isAuthenticated(): boolean {
    return !!this.getAuthToken();
  }
}

export const apiService = new ApiService();
export default apiService;
