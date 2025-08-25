import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
// Use your env configuration
import { env } from '@/config/env';

const API_BASE_URL = env.apiBase;

// Types
interface User {
  id: string;
  email: string;
  role: 'admin' | 'teacher' | 'student';
  school_id: string;
  first_name?: string;
  last_name?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  token: string | null;
}

// Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider Props
interface AuthProviderProps {
  children: ReactNode;
}

// Provider Component
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing token on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    if (savedToken) {
      setToken(savedToken);
      // Validate token with backend
      fetchUserProfile(savedToken);
    } else {
      setIsLoading(false);
    }
  }, []);

  // Fetch user profile with token
  const fetchUserProfile = async (authToken: string) => {
    try {
      // Use /auth/context instead of /auth/me to get full context including school info
      const response = await fetch(`${API_BASE_URL}/auth/context`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        // Backend returns { user: { ... }, roles: [...], schools: [...] }
        
        // Extract school_id from roles (use first active role's school_id)
        let schoolId = '';
        if (result.roles && result.roles.length > 0) {
          const activeRole = result.roles.find((r: any) => r.is_active) || result.roles[0];
          schoolId = activeRole.school_id;
        }

        // Extract role from roles array (use first active role)
        let userRole: 'admin' | 'teacher' | 'student' = 'student';
        if (result.roles && result.roles.length > 0) {
          const activeRole = result.roles.find((r: any) => r.is_active) || result.roles[0];
          // Map backend role to frontend role
          if (activeRole.role.toLowerCase().includes('admin') || 
              activeRole.role.toLowerCase().includes('principal') ||
              activeRole.role.toLowerCase().includes('staff')) {
            userRole = 'admin';
          } else if (activeRole.role.toLowerCase().includes('teacher')) {
            userRole = 'teacher';
          }
        }

        // Create user object with school_id
        const userWithSchool: User = {
          id: result.user.id,
          email: result.user.email,
          first_name: result.user.first_name,
          last_name: result.user.last_name,
          role: userRole,
          school_id: schoolId
        };

        setUser(userWithSchool);
      } else {
        // Token invalid, clear it
        localStorage.removeItem('token');
        setToken(null);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      localStorage.removeItem('token');
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Login function - FIXED for form data
  const login = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    try {
      // Create form data as expected by OAuth2PasswordRequestForm
      const formData = new FormData();
      formData.append('username', email); // OAuth2 expects 'username' not 'email'
      formData.append('password', password);

      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        body: formData, // Send as form data, not JSON
        // Don't set Content-Type header - let browser set it for FormData
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.detail || 'Login failed');
      }

      const data = await response.json();
      const authToken = data.access_token;
      
      if (!authToken) {
        throw new Error('No token received from server');
      }

      // Save token
      localStorage.setItem('token', authToken);
      setToken(authToken);
      
      // Fetch user profile after successful login
      await fetchUserProfile(authToken);
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    window.location.href = '/login';
  };

  const isAuthenticated = !!token && !!user;

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    token,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook to use auth context
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Export types for use in other files
export type { User, AuthContextType };