import React, { useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  fallback 
}) => {
  const { isAuthenticated, user, initialize } = useAuthStore();

  useEffect(() => {
    // Initialize auth state when component mounts
    initialize();
  }, [initialize]);

  if (!isAuthenticated || !user) {
    return fallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
};