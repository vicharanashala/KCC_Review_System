import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { authApi } from '../api/auth';
import { useNavigate } from 'react-router-dom';
import { useToast } from './ToastContext';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  // Add other user properties as needed
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<User | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { showError } = useToast();

  const loadUser = useCallback(async (): Promise<User | null> => {
    setLoading(true);
    setError(null);
    
    const token = localStorage.getItem('access_token');
    const role = localStorage.getItem('user_role');
    
    if (!token || !role) {
      setLoading(false);
      return null;
    }
    
    try {
      // Create user data from localStorage
      const userData: User = {
        id: localStorage.getItem('user_id') || 'temp-id',
        email: localStorage.getItem('user_email') || '',
        name: localStorage.getItem('user_name') || 'User',
        role: role
      };
      
      setUser(userData);
      return userData;
    } catch (error: any) {
      console.error('Failed to load user', error);
      setError(error.message || 'Failed to load user');
      showError('Session expired. Please log in again.');
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user_role');
      setUser(null);
      navigate('/login');
      return null;
    } finally {
      setLoading(false);
    }
  }, [navigate, showError]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    
    try {
      // 1. Perform login (this will store data in localStorage)
      await authApi.login({ email, password });
      
      // 2. Get user data from localStorage
      const role = localStorage.getItem('user_role') || '';
      const userData: User = {
        id: localStorage.getItem('user_id') || '',
        email: localStorage.getItem('user_email') || email,
        name: localStorage.getItem('user_name') || '',
        role: role
      };
      
      setUser(userData);
      
      // 3. Redirect based on role (case-insensitive check)
      const normalizedRole = role.toLowerCase().trim();
      
      // 4. Redirect based on role
      let redirectPath = '/';
      switch (normalizedRole) {
        case 'agri_specialist':
          redirectPath = '/agri-specialist/dashboard';
          break;
        case 'moderator':
          redirectPath = '/moderator/dashboard';
          break;
        case 'admin':
          redirectPath = '/admin';
          break;
      }
      
      navigate(redirectPath, { replace: true });
    } catch (error: any) {
      console.error('Login error:', error);
      setError(error.message || 'Login failed. Please try again.');
      // Clear any partial auth state
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user_role');
      setUser(null);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear all auth related data
      setUser(null);
      setError(null);
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user_role');
      localStorage.removeItem('user_email');
      localStorage.removeItem('user_name');
      localStorage.removeItem('user_id');
      
      // Redirect to login page
      navigate('/login', { replace: true });
    }
  };

  const value = {
    isAuthenticated: !!user,
    user,
    loading,
    error,
    login,
    logout,
    loadUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
