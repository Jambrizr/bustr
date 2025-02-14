import { useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/auth';

export function useSession() {
  const { logout } = useAuth();

  // Handle session expiration
  const handleSessionExpired = useCallback(async () => {
    await logout();
    window.location.href = '/login?expired=true';
  }, [logout]);

  useEffect(() => {
    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
        // Clear stored tokens on sign out or refresh
        localStorage.removeItem('sb-token');
        sessionStorage.removeItem('sb-token');
      }

      if (event === 'TOKEN_REFRESHED' && session) {
        // Update stored token
        if (localStorage.getItem('sb-token')) {
          localStorage.setItem('sb-token', session.access_token);
        } else {
          sessionStorage.setItem('sb-token', session.access_token);
        }
      }
    });

    // Set up session expiration check
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        handleSessionExpired();
      }
    };

    // Check session every minute
    const interval = setInterval(checkSession, 6000000);

    return () => {
      subscription.unsubscribe();
      clearInterval(interval);
    };
  }, [handleSessionExpired]);
}