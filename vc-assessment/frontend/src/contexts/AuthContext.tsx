import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { User, UserProfile, AuthState } from '../types';
import '../config/cognito'; // Initialize Cognito configuration
import toast from 'react-hot-toast';

// Conditional imports for AWS Amplify Auth
let signIn: any = null;
let signUp: any = null;
let signOut: any = null;
let getCurrentUser: any = null;
let fetchUserAttributes: any = null;
let updateUserAttributes: any = null;
let confirmSignUp: any = null;
let resendSignUpCode: any = null;

try {
  const authModule = require('@aws-amplify/auth');
  signIn = authModule.signIn;
  signUp = authModule.signUp;
  signOut = authModule.signOut;
  getCurrentUser = authModule.getCurrentUser;
  fetchUserAttributes = authModule.fetchUserAttributes;
  updateUserAttributes = authModule.updateUserAttributes;
  confirmSignUp = authModule.confirmSignUp;
  resendSignUpCode = authModule.resendSignUpCode;
} catch (error) {
  console.warn('⚠️ AWS Amplify Auth not available - using fallback authentication');
}

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
      // If AWS dependencies aren't available, just set loading to false
      if (!getCurrentUser || !fetchUserAttributes) {
        dispatch({ type: 'SET_LOADING', payload: false });
        return;
      }

      try {
        const cognitoUser = await getCurrentUser();
        const attributes = await fetchUserAttributes();
        
        // Convert Cognito user to our User type
        const user: User = {
          id: parseInt(cognitoUser.userId),
          email: attributes.email || '',
          role: attributes['custom:role'] || 'user', // Default to user role
          is_verified: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        // Convert attributes to UserProfile
        const profile: UserProfile = {
          id: parseInt(cognitoUser.userId),
          user_id: parseInt(cognitoUser.userId),
          company_name: attributes['custom:CompanyName'] || '',
          founder_name: `${attributes.given_name || ''} ${attributes.family_name || ''}`.trim(),
          industry: attributes['custom:Industry'] || '',
          stage: attributes['custom:Stage'] || '',
          website: '',
          linkedin_url: '',
          description: '',
        };

        dispatch({ type: 'SET_USER', payload: { user, profile } });
      } catch (error) {
        // User not authenticated
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    if (!signIn || !getCurrentUser || !fetchUserAttributes) {
      const message = 'Authentication not available. Please install AWS dependencies by running "npm install" on the server.';
      dispatch({ type: 'SET_ERROR', payload: message });
      toast.error(message);
      throw new Error(message);
    }

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });
      
      const { isSignedIn } = await signIn({ username: email, password });
      
      if (isSignedIn) {
        const cognitoUser = await getCurrentUser();
        const attributes = await fetchUserAttributes();
        
        // Convert Cognito user to our User type
        const user: User = {
          id: parseInt(cognitoUser.userId),
          email: attributes.email || '',
          role: attributes['custom:role'] || 'user',
          is_verified: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        // Convert attributes to UserProfile
        const profile: UserProfile = {
          id: parseInt(cognitoUser.userId),
          user_id: parseInt(cognitoUser.userId),
          company_name: attributes['custom:CompanyName'] || '',
          founder_name: `${attributes.given_name || ''} ${attributes.family_name || ''}`.trim(),
          industry: attributes['custom:Industry'] || '',
          stage: attributes['custom:Stage'] || '',
          website: '',
          linkedin_url: '',
          description: '',
        };
        
        dispatch({ type: 'SET_USER', payload: { user, profile } });
        toast.success('Successfully logged in!');
      }
    } catch (error: any) {
      const message = error.message || 'Login failed';
      dispatch({ type: 'SET_ERROR', payload: message });
      toast.error(message);
      throw error;
    }
  };

  const register = async (email: string, password: string, profile?: Partial<UserProfile>) => {
    if (!signUp) {
      const message = 'Registration not available. Please install AWS dependencies by running "npm install" on the server.';
      dispatch({ type: 'SET_ERROR', payload: message });
      toast.error(message);
      throw new Error(message);
    }

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });
      
      const userAttributes: Record<string, string> = {
        email,
        given_name: profile?.founder_name?.split(' ')[0] || '',
        family_name: profile?.founder_name?.split(' ').slice(1).join(' ') || '',
      };

      if (profile?.company_name) {
        userAttributes['custom:CompanyName'] = profile.company_name;
      }
      if (profile?.industry) {
        userAttributes['custom:Industry'] = profile.industry;
      }
      if (profile?.stage) {
        userAttributes['custom:Stage'] = profile.stage;
      }

      const { isSignUpComplete, nextStep } = await signUp({
        username: email,
        password,
        options: {
          userAttributes,
        },
      });

      if (isSignUpComplete) {
        // Auto-login after successful registration
        await login(email, password);
      } else {
        // Handle email verification if required
        toast.success('Registration successful! Please check your email for verification.');
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    } catch (error: any) {
      const message = error.message || 'Registration failed';
      dispatch({ type: 'SET_ERROR', payload: message });
      toast.error(message);
      throw error;
    }
  };

  const logout = async () => {
    if (!signOut) {
      // If AWS isn't available, just clear local state
      dispatch({ type: 'LOGOUT' });
      toast.success('Logged out successfully');
      return;
    }

    try {
      await signOut();
      dispatch({ type: 'LOGOUT' });
      toast.success('Logged out successfully');
    } catch (error: any) {
      console.error('Logout error:', error);
      // Force logout even if Cognito call fails
      dispatch({ type: 'LOGOUT' });
      toast.success('Logged out successfully');
    }
  };

  const updateProfile = async (profileData: Partial<UserProfile>) => {
    if (!updateUserAttributes) {
      const message = 'Profile updates not available. Please install AWS dependencies by running "npm install" on the server.';
      toast.error(message);
      throw new Error(message);
    }

    try {
      const attributesToUpdate: Record<string, string> = {};
      
      if (profileData.founder_name) {
        const nameParts = profileData.founder_name.split(' ');
        attributesToUpdate.given_name = nameParts[0] || '';
        attributesToUpdate.family_name = nameParts.slice(1).join(' ') || '';
      }
      
      if (profileData.company_name) {
        attributesToUpdate['custom:CompanyName'] = profileData.company_name;
      }
      
      if (profileData.industry) {
        attributesToUpdate['custom:Industry'] = profileData.industry;
      }
      
      if (profileData.stage) {
        attributesToUpdate['custom:Stage'] = profileData.stage;
      }

      await updateUserAttributes({
        userAttributes: attributesToUpdate,
      });

      // Update local state
      const updatedProfile = { ...state.profile, ...profileData };
      dispatch({ 
        type: 'SET_USER', 
        payload: { 
          user: state.user!, 
          profile: updatedProfile as UserProfile
        } 
      });
      toast.success('Profile updated successfully!');
    } catch (error: any) {
      const message = error.message || 'Profile update failed';
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
