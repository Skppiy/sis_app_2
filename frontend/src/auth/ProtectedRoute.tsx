import React from 'react';
import { useAuth } from '@auth/AuthContext';

export const ProtectedRoute: React.FC<React.PropsWithChildren> = ({ children }) => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    window.location.href = '/login';
    return null;
  }
  return <>{children}</>;
};
