import axios from 'axios';

const API_URL = import.meta.env.VITE_API_BASE_URL;

// Toast utility functions - these will be set by the app
let toastSuccess: ((message: string) => void) | null = null;
let toastError: ((message: string) => void) | null = null;

export const setToastFunctions = (success: (message: string) => void, error: (message: string) => void) => {
  toastSuccess = success;
  toastError = error;
};

// Configure axios defaults
axios.defaults.withCredentials = true;
axios.defaults.headers.common['Content-Type'] = 'application/json';

// Configure axios defaults
axios.defaults.withCredentials = true;

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterCredentials {
  email: string;
  password: string;
  name: string;
  role?: string;
}

interface AuthResponse {
  access: string;
  refresh: string;
}

interface ApiError {
  detail: string;
  [key: string]: any;
}

export const authApi = {
login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    try {
        const loginData = {
        username: credentials.email,
        password: credentials.password
        };
        
        const response = await axios.post(`${API_URL}/auth/login`, loginData);

        if (response?.data) {
          localStorage.setItem('access_token', response.data.access_token || '');
          localStorage.setItem('refresh_token', response.data.refresh_token || '');
          localStorage.setItem('user_role', response.data.user_role || '');
          localStorage.setItem('user_email', credentials.email);
          
          if (response.data.user) {
            localStorage.setItem('user_id', response.data.user.id || '');
            localStorage.setItem('user_name', response.data.user.name || '');
          }
        }
        
        // Show success toast
        if (toastSuccess) {
          toastSuccess('Login successful!');
        } else {
          console.log('Toast success function not available');
        }
        
        return response.data;
    } catch (error: any) {
        // Show error toast
        if (toastError) {
          if (axios.isAxiosError(error) && error.response) {
            const apiError = error.response.data as ApiError;
            toastError(apiError.detail || 'Login failed');
          } else {
            toastError('Network error. Please try again.');
          }
        } else {
          console.log('Toast error function not available');
        }
        
        if (axios.isAxiosError(error) && error.response) {
        const apiError = error.response.data as ApiError;
        throw new Error(apiError.detail || 'Login failed');
        }
        throw new Error('Network error. Please try again.');
    }
    },

    logout: async (): Promise<void> => {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user_role');
      localStorage.removeItem('user_email');
      localStorage.removeItem('user_name');
      localStorage.removeItem('user_id');
      
      // Show success toast
      if (toastSuccess) {
        toastSuccess('Logged out successfully!');
      }
      
    },

    register: async (credentials: RegisterCredentials): Promise<any> => {
      try {
        const registerData = {
          email: credentials.email,
          password: credentials.password,
          name: credentials.name,
          role: credentials.role || 'agri_specialist'
        };
        
        const response = await axios.post(`${API_URL}/auth/register`, registerData);
        
        // Show success toast
        if (toastSuccess) {
          toastSuccess('Registration successful! Please login to continue.');
        }
        
        return response.data;
      } catch (error: any) {
        // Show error toast
        if (toastError) {
          if (axios.isAxiosError(error) && error.response) {
            const apiError = error.response.data as ApiError;
            toastError(apiError.detail || 'Registration failed');
          } else {
            toastError('Network error. Please try again.');
          }
        }
        
        if (axios.isAxiosError(error) && error.response) {
          const apiError = error.response.data as ApiError;
          throw new Error(apiError.detail || 'Registration failed');
        }
        throw new Error('Network error. Please try again.');
      }
    },

  getProfile: async (): Promise<any> => {
    try {
      const response = await axios.get(`${API_URL}/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      if (response.data.role && !localStorage.getItem('user_role')) {
        localStorage.setItem('user_role', response.data.role);
      } else if (response.data.user?.role && !localStorage.getItem('user_role')) {
        localStorage.setItem('user_role', response.data.user.role);
      }
      
      return response.data;
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        throw new Error('Session expired. Please log in again.');
      }
      throw error;
    }
  },
};
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);
