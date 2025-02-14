import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  signInWithEmail,
  signOut,
  initializeAuth,
  registerUser,
  // Make sure these types exist in your project
  type LoginResponse,
  type LoginCredentials,
  type RegistrationResponse,
  type UserRegistrationData
} from '@/lib/auth';
import { useToast } from '@/components/ui/toast';

// Make sure these interfaces/types exist in your project:
interface UserRegistrationData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  // ...anything else your backend requires
}

interface RegistrationResponse {
  success: boolean;
  message: string;
  user?: any; // or your actual user type
}

interface AuthContextType {
  user: LoginResponse['user'] | null;
  isLoading: boolean;
  signIn: (credentials: LoginCredentials) => Promise<LoginResponse>;
  logout: () => Promise<void>;
  registerUser: (data: UserRegistrationData) => Promise<RegistrationResponse>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<LoginResponse['user'] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Initialize auth state from stored token
  useEffect(() => {
    const initialize = async () => {
      try {
        const authData = await initializeAuth();
        if (authData?.success && authData.user) {
          setUser(authData.user);
        }
      } finally {
        setIsLoading(false);
      }
    };

    initialize();
  }, []);

  // ----------------------
  // Handle Sign In
  // ----------------------
  const handleSignIn = async (credentials: LoginCredentials): Promise<LoginResponse> => {
    const response = await signInWithEmail(credentials);

    if (response.success && response.user) {
      setUser(response.user);
      toast({
        title: 'Welcome back!',
        description: response.message,
      });
    } else {
      toast({
        title: 'Login failed',
        description: response.message,
        variant: 'destructive',
      });
    }

    return response;
  };

  // ----------------------
  // Handle Registration
  // ----------------------
  const handleRegister = async (userData: UserRegistrationData): Promise<RegistrationResponse> => {
    try {
      // You need a registerUser function in '@/lib/auth' or somewhere
      // that actually makes a backend call.
      // This snippet assumes you already have it available.
      const response = await registerUser(userData);

      if (response.success) {
        toast({
          title: 'Registration successful',
          description: response.message,
        });
      } else {
        toast({
          title: 'Registration failed',
          description: response.message,
          variant: 'destructive',
        });
      }

      return response;
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An error occurred during registration.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  // ----------------------
  // Handle Logout
  // ----------------------
  const handleLogout = async () => {
    try {
      await signOut();
      setUser(null);
      toast({
        title: 'Signed out',
        description: 'You have been successfully logged out.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to sign out. Please try again.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  // Provide context to children
  const value: AuthContextType = {
    user,
    isLoading,
    signIn: handleSignIn,
    logout: handleLogout,
    registerUser: handleRegister,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// ----------------------
// useAuth Hook
// ----------------------
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
