import { supabase } from './auth';

// API request configuration type
interface RequestConfig extends RequestInit {
  requiresAuth?: boolean;
}

// API response type
interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  status: number;
}

/**
 * Custom fetch wrapper with authentication and error handling
 */
export async function fetchApi<T>(
  endpoint: string,
  config: RequestConfig = {}
): Promise<ApiResponse<T>> {
  try {
    // Get the current session
    const { data: { session } } = await supabase.auth.getSession();
    
    // Check if authentication is required
    if (config.requiresAuth && !session) {
      throw new Error('Authentication required');
    }

    // Prepare headers
    const headers = new Headers(config.headers || {});
    
    // Add auth header if session exists
    if (session) {
      headers.set('Authorization', `Bearer ${session.access_token}`);
    }

    // Add default headers
    headers.set('Content-Type', 'application/json');

    // Make the request
    const response = await fetch(endpoint, {
      ...config,
      headers,
    });

    // Parse the response
    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    // Handle unauthorized responses
    if (response.status === 401) {
      // Clear stored tokens
      localStorage.removeItem('sb-token');
      sessionStorage.removeItem('sb-token');
      
      // Redirect to login
      window.location.href = '/login?expired=true';
      
      throw new Error('Session expired');
    }

    return {
      data,
      status: response.status,
      error: !response.ok ? data.error || response.statusText : undefined,
    };

  } catch (error) {
    return {
      status: error instanceof Error && error.message === 'Authentication required' ? 401 : 500,
      error: error instanceof Error ? error.message : 'An unknown error occurred',
    };
  }
}

/**
 * Helper function to get stored auth token
 */
export function getStoredToken(): string | null {
  return localStorage.getItem('sb-token') || sessionStorage.getItem('sb-token');
}

/**
 * Helper function to check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const { data: { session } } = await supabase.auth.getSession();
  return !!session;
}