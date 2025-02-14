import { createClient } from '@supabase/supabase-js';
import { config } from './config';

// Initialize Supabase client
export const supabase = createClient(config.supabase.url, config.supabase.anonKey);

// User registration interface
export interface UserRegistrationData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  company?: string;
  role?: string;
  birthday?: string;
}

// Registration response interface
export interface RegistrationResponse {
  success: boolean;
  message: string;
  token?: string;
  error?: string;
}

// Login interface
export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

// Login response interface
export interface LoginResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
  error?: string;
}

/**
 * Register a new user with Supabase Auth and create their profile
 */
export async function registerUser(userData: UserRegistrationData): Promise<RegistrationResponse> {
  try {
    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: {
          first_name: userData.first_name,
          last_name: userData.last_name,
          company: userData.company,
          role: userData.role,
          birthday: userData.birthday,
        },
        // Enable email verification
        emailRedirectTo: 'https://app.bustr.io/verifyemail',
      },
    });

    if (authError) {
      throw authError;
    }

    if (!authData.user) {
      throw new Error('User creation failed');
    }

    // Return success response
    return {
      success: true,
      message: 'Registration successful. Please check your email to verify your account.',
      token: authData.session?.access_token,
    };

  } catch (error) {
    console.error('Registration error:', error);
    return {
      success: false,
      message: 'Registration failed',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Check if a user's email is verified
 */
export async function isEmailVerified(userId: string): Promise<boolean> {
  try {
    const { data: { user }, error } = await supabase.auth.admin.getUserById(userId);
    
    if (error) {
      throw error;
    }

    return user?.email_confirmed_at != null;
  } catch (error) {
    console.error('Error checking email verification:', error);
    return false;
  }
}

/**
 * Sign in a user with email and password
 * Handles email verification check and error messages
 */
export async function signInWithEmail({ 
  email, 
  password,
  rememberMe = false 
}: LoginCredentials): Promise<LoginResponse> {
  try {
    // Sign in with Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
      options: {
        // Set session duration based on remember me preference
        // 2 hours if not remembered, 3 days if remembered
        expiresIn: rememberMe ? 259200 : 7200,
      },
    });

    // Handle authentication errors
    if (error) {
      // Map Supabase error messages to user-friendly messages
      let errorMessage = 'Invalid email or password';
      
      if (error.message.includes('Email not confirmed')) {
        errorMessage = 'Please verify your email before signing in';
      } else if (error.message.includes('Invalid login credentials')) {
        errorMessage = 'Invalid email or password';
      } else if (error.message.includes('Too many requests')) {
        errorMessage = 'Too many login attempts. Please try again later';
      }

      return {
        success: false,
        message: errorMessage,
        error: error.message,
      };
    }

    if (!data.user || !data.session) {
      return {
        success: false,
        message: 'Login failed',
        error: 'No user data returned',
      };
    }

    // Check email verification
    if (!data.user.email_confirmed_at) {
      return {
        success: false,
        message: 'Please verify your email before signing in',
        error: 'Email not verified',
      };
    }

    // Store session token in localStorage if rememberMe is true
    if (rememberMe) {
      localStorage.setItem('sb-token', data.session.access_token);
    } else {
      // Use sessionStorage for non-persistent storage
      sessionStorage.setItem('sb-token', data.session.access_token);
    }

    // Update last login timestamp
    await supabase
      .from('user_profiles')
      .update({
        last_login: new Date().toISOString(),
        remember_me: rememberMe,
      })
      .eq('id', data.user.id);

    // Return success response with user data
    return {
      success: true,
      message: 'Login successful',
      token: data.session.access_token,
      user: {
        id: data.user.id,
        email: data.user.email!,
        firstName: data.user.user_metadata.first_name,
        lastName: data.user.user_metadata.last_name,
      },
    };

  } catch (error) {
    console.error('Login error:', error);
    return {
      success: false,
      message: 'An error occurred during login',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Sign out the current user and clear stored tokens
 */
export async function signOut(): Promise<void> {
  try {
    await supabase.auth.signOut();
    localStorage.removeItem('sb-token');
    sessionStorage.removeItem('sb-token');
  } catch (error) {
    console.error('Sign out error:', error);
    throw error;
  }
}

/**
 * Resend verification email
 */
export async function resendVerificationEmail(email: string): Promise<RegistrationResponse> {
  try {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/verify-email`,
      },
    });

    if (error) {
      throw error;
    }

    return {
      success: true,
      message: 'Verification email sent successfully.',
    };

  } catch (error) {
    console.error('Error resending verification email:', error);
    return {
      success: false,
      message: 'Failed to resend verification email',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Initialize auth state from stored token
 */
export async function initializeAuth(): Promise<LoginResponse | null> {
  try {
    // Check for stored token in localStorage or sessionStorage
    const token = localStorage.getItem('sb-token') || sessionStorage.getItem('sb-token');
    
    if (!token) {
      return null;
    }

    // Get current session
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error || !session) {
      // Clear invalid tokens
      localStorage.removeItem('sb-token');
      sessionStorage.removeItem('sb-token');
      return null;
    }

    // Return user data
    return {
      success: true,
      message: 'Session restored',
      token: session.access_token,
      user: {
        id: session.user.id,
        email: session.user.email!,
        firstName: session.user.user_metadata.first_name,
        lastName: session.user.user_metadata.last_name,
      },
    };

  } catch (error) {
    console.error('Auth initialization error:', error);
    return null;
  }
}