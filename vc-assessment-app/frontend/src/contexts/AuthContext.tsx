import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { User, UserProfile, AuthState } from '../types';
import apiService from '../services/api';
import toast from 'react-hot-toast';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, profile?: Partial<UserProfile>) => Promise<void>;
  logout: () => void;
  updateProfile: (profile: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_USER'; payload: { user: User; profile?: UserProfile } }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'CLEAR_ERROR' }
  | { type: 'LOGOUT' };

const initialState: AuthState = {
  user: null,
  profile: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_USER':
      return {
        ...state,
        user: action.payload.user,
        profile: action.payload.profile || null,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    case 'LOGOUT':
      return {
        ...initialState,
        isLoading: false,
      };
    default:
      return state;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    const initializeAuth = async () => {
      const token = apiService.getAuthToken();
      if (token) {
        try {
          const user = await apiService.getCurrentUser();
          let profile: UserProfile | undefined;
          
          try {
            profile = await apiService.getUserProfile();
          } catch (error) {
            // Profile might not exist yet, that's okay
          }
          
          dispatch({ type: 'SET_USER', payload: { user, profile } });
        } catch (error) {
          apiService.clearAuthToken();
          dispatch({ type: 'LOGOUT' });
        }
      } else {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });
      
      const { user, token } = await apiService.login(email, password);
      apiService.setAuthToken(token);
      
      let profile: UserProfile | undefined;
      try {
        profile = await apiService.getUserProfile();
      } catch (error) {
        // Profile might not exist yet
      }
      
      dispatch({ type: 'SET_USER', payload: { user, profile } });
      toast.success('Successfully logged in!');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Login failed';
      dispatch({ type: 'SET_ERROR', payload: message });
      toast.error(message);
      throw error;
    }
  };

  const register = async (email: string, password: string, profile?: Partial<UserProfile>) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });
      
      const { user, token } = await apiService.register(email, password, profile);
      apiService.setAuthToken(token);
      
      let userProfile: UserProfile | undefined;
      if (profile) {
        try {
          userProfile = await apiService.getUserProfile();
        } catch (error) {
          // Profile creation might have failed, but user was created
        }
      }
      
      dispatch({ type: 'SET_USER', payload: { user, profile: userProfile } });
      toast.success('Account created successfully!');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Registration failed';
      dispatch({ type: 'SET_ERROR', payload: message });
      toast.error(message);
      throw error;
    }
  };

  const logout = () => {
    apiService.logout();
    dispatch({ type: 'LOGOUT' });
    toast.success('Logged out successfully');
  };

  const updateProfile = async (profileData: Partial<UserProfile>) => {
    try {
      const updatedProfile = await apiService.updateUserProfile(profileData);
      dispatch({ 
        type: 'SET_USER', 
        payload: { 
          user: state.user!, 
          profile: updatedProfile 
        } 
      });
      toast.success('Profile updated successfully!');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Profile update failed';
      toast.error(message);
      throw error;
    }
  };

  const value: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
