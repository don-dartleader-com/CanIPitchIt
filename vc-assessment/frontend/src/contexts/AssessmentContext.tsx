import React, { createContext, useContext, useReducer, useCallback, ReactNode } from 'react';
import { Question, AssessmentCategory, AssessmentState, AssessmentResults, AssessmentResponse } from '../types';
import apiService from '../services/api';
import toast from 'react-hot-toast';

interface AssessmentContextType extends AssessmentState {
  loadQuestions: () => Promise<void>;
  answerQuestion: (questionId: number, answer: number) => void;
  goToQuestion: (index: number) => void;
  nextQuestion: () => void;
  previousQuestion: () => void;
  submitAssessment: (userInfo?: { email?: string; company_name?: string; founder_name?: string }) => Promise<number>;
  resetAssessment: () => void;
}

const AssessmentContext = createContext<AssessmentContextType | undefined>(undefined);

type AssessmentAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_QUESTIONS'; payload: { questions: Question[]; categories: AssessmentCategory[] } }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'CLEAR_ERROR' }
  | { type: 'ANSWER_QUESTION'; payload: { questionId: number; answer: number } }
  | { type: 'SET_CURRENT_QUESTION'; payload: number }
  | { type: 'SET_COMPLETED'; payload: { results: AssessmentResults } }
  | { type: 'RESET' };

const initialState: AssessmentState = {
  questions: [],
  categories: [],
  currentQuestionIndex: 0,
  responses: {},
  isLoading: false,
  error: null,
  isCompleted: false,
  results: undefined,
};

function assessmentReducer(state: AssessmentState, action: AssessmentAction): AssessmentState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_QUESTIONS':
      return {
        ...state,
        questions: action.payload.questions,
        categories: action.payload.categories,
        isLoading: false,
        error: null,
      };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    case 'ANSWER_QUESTION':
      return {
        ...state,
        responses: {
          ...state.responses,
          [action.payload.questionId]: action.payload.answer,
        },
      };
    case 'SET_CURRENT_QUESTION':
      return { ...state, currentQuestionIndex: action.payload };
    case 'SET_COMPLETED':
      return {
        ...state,
        isCompleted: true,
        results: action.payload.results,
        isLoading: false,
      };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

export function AssessmentProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(assessmentReducer, initialState);

  const loadQuestions = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });
      
      const [questions, categories] = await Promise.all([
        apiService.getQuestions(),
        apiService.getCategories(),
      ]);
      
      // Sort questions by category and order
      const sortedQuestions = questions.sort((a, b) => {
        const categoryA = categories.find(c => c.id === a.category_id);
        const categoryB = categories.find(c => c.id === b.category_id);
        
        if (categoryA && categoryB) {
          if (categoryA.order_index !== categoryB.order_index) {
            return categoryA.order_index - categoryB.order_index;
          }
        }
        
        return a.order_index - b.order_index;
      });
      
      dispatch({ 
        type: 'SET_QUESTIONS', 
        payload: { 
          questions: sortedQuestions, 
          categories: categories.sort((a, b) => a.order_index - b.order_index)
        } 
      });
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to load questions';
      dispatch({ type: 'SET_ERROR', payload: message });
      toast.error(message);
    }
  }, []);

  const answerQuestion = (questionId: number, answer: number) => {
    dispatch({ type: 'ANSWER_QUESTION', payload: { questionId, answer } });
  };

  const goToQuestion = (index: number) => {
    if (index >= 0 && index < state.questions.length) {
      dispatch({ type: 'SET_CURRENT_QUESTION', payload: index });
    }
  };

  const nextQuestion = () => {
    if (state.currentQuestionIndex < state.questions.length - 1) {
      dispatch({ type: 'SET_CURRENT_QUESTION', payload: state.currentQuestionIndex + 1 });
    }
  };

  const previousQuestion = () => {
    if (state.currentQuestionIndex > 0) {
      dispatch({ type: 'SET_CURRENT_QUESTION', payload: state.currentQuestionIndex - 1 });
    }
  };

  const submitAssessment = async (userInfo?: { email?: string; company_name?: string; founder_name?: string }): Promise<number> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });
      
      const assessment = await apiService.submitAssessment({
        responses: state.responses,
        userInfo,
      });
      
      const results = await apiService.getAssessmentResults(assessment.id);
      
      dispatch({ type: 'SET_COMPLETED', payload: { results } });
      toast.success('Assessment completed successfully!');
      
      return assessment.id;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to submit assessment';
      dispatch({ type: 'SET_ERROR', payload: message });
      toast.error(message);
      throw error;
    }
  };

  const resetAssessment = () => {
    dispatch({ type: 'RESET' });
  };

  // Helper functions
  const getCurrentQuestion = () => {
    return state.questions[state.currentQuestionIndex];
  };

  const getCurrentCategory = () => {
    const currentQuestion = getCurrentQuestion();
    if (!currentQuestion) return null;
    return state.categories.find(c => c.id === currentQuestion.category_id) || null;
  };

  const getProgress = () => {
    const totalQuestions = state.questions.length;
    const answeredQuestions = Object.keys(state.responses).length;
    return {
      current: state.currentQuestionIndex + 1,
      total: totalQuestions,
      answered: answeredQuestions,
      percentage: totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0,
    };
  };

  const isQuestionAnswered = (questionId: number) => {
    return state.responses.hasOwnProperty(questionId);
  };

  const canSubmit = () => {
    return state.questions.length > 0 && Object.keys(state.responses).length === state.questions.length;
  };

  const value: AssessmentContextType = {
    ...state,
    loadQuestions,
    answerQuestion,
    goToQuestion,
    nextQuestion,
    previousQuestion,
    submitAssessment,
    resetAssessment,
  };

  return (
    <AssessmentContext.Provider value={value}>
      {children}
    </AssessmentContext.Provider>
  );
}

export function useAssessment() {
  const context = useContext(AssessmentContext);
  if (context === undefined) {
    throw new Error('useAssessment must be used within an AssessmentProvider');
  }
  return context;
}

// Custom hook for assessment helpers
export function useAssessmentHelpers() {
  const context = useAssessment();
  
  const getCurrentQuestion = () => {
    return context.questions[context.currentQuestionIndex];
  };

  const getCurrentCategory = () => {
    const currentQuestion = getCurrentQuestion();
    if (!currentQuestion) return null;
    return context.categories.find(c => c.id === currentQuestion.category_id) || null;
  };

  const getProgress = () => {
    const totalQuestions = context.questions.length;
    const answeredQuestions = Object.keys(context.responses).length;
    return {
      current: context.currentQuestionIndex + 1,
      total: totalQuestions,
      answered: answeredQuestions,
      percentage: totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0,
    };
  };

  const isQuestionAnswered = (questionId: number) => {
    return context.responses.hasOwnProperty(questionId);
  };

  const canSubmit = () => {
    return context.questions.length > 0 && Object.keys(context.responses).length === context.questions.length;
  };

  const getCategoryProgress = () => {
    const categoryProgress: Record<number, { answered: number; total: number }> = {};
    
    context.categories.forEach(category => {
      categoryProgress[category.id] = { answered: 0, total: 0 };
    });
    
    context.questions.forEach(question => {
      categoryProgress[question.category_id].total++;
      if (isQuestionAnswered(question.id)) {
        categoryProgress[question.category_id].answered++;
      }
    });
    
    return categoryProgress;
  };

  return {
    getCurrentQuestion,
    getCurrentCategory,
    getProgress,
    isQuestionAnswered,
    canSubmit,
    getCategoryProgress,
  };
}
