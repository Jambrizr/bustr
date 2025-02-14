import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

const PUBLIC_ROUTES = ['/login', '/signup', '/forgot-password', '/reset-password', '/verify-email'];

export function useAuthRedirect() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isLoading) return;

    const isPublicRoute = PUBLIC_ROUTES.includes(location.pathname);

    if (!user && !isPublicRoute) {
      // Redirect to login if not authenticated and trying to access protected route
      navigate('/login', { 
        replace: true, 
        state: { from: location.pathname } 
      });
    } else if (user && isPublicRoute) {
      // Redirect to dashboard if authenticated and trying to access public route
      navigate('/', { replace: true });
    }
  }, [user, isLoading, location.pathname, navigate]);
}