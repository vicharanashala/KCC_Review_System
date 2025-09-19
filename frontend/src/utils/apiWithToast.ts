import axios from 'axios';
import type { AxiosResponse} from 'axios';

// Toast utility functions - these will be set by the app
let toastSuccess: ((message: string) => void) | null = null;
let toastError: ((message: string) => void) | null = null;

export const setToastFunctions = (success: (message: string) => void, error: (message: string) => void) => {
  toastSuccess = success;
  toastError = error;
};

interface ApiCallOptions {
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
  successMessage?: string;
  errorMessage?: string;
}

export const apiWithToast = {
  post: async <T = any>(
    url: string, 
    data?: any, 
    options: ApiCallOptions = {}
  ): Promise<T> => {
    const {
      showSuccessToast = true,
      showErrorToast = true,
      successMessage = 'Operation completed successfully!',
      errorMessage = 'Operation failed'
    } = options;

    try {
      const response: AxiosResponse<T> = await axios.post(url, data);
      
      if (showSuccessToast && toastSuccess) {
        toastSuccess(successMessage);
      }
      
      return response.data;
    } catch (error) {
      if (showErrorToast && toastError) {
        if (axios.isAxiosError(error) && error.response) {
          const apiError = error.response.data as any;
          toastError(apiError.detail || errorMessage);
        } else {
          toastError(errorMessage);
        }
      }
      throw error;
    }
  },

  put: async <T = any>(
    url: string, 
    data?: any, 
    options: ApiCallOptions = {}
  ): Promise<T> => {
    const {
      showSuccessToast = true,
      showErrorToast = true,
      successMessage = 'Update completed successfully!',
      errorMessage = 'Update failed'
    } = options;

    try {
      const response: AxiosResponse<T> = await axios.put(url, data);
      
      if (showSuccessToast && toastSuccess) {
        toastSuccess(successMessage);
      }
      
      return response.data;
    } catch (error) {
      if (showErrorToast && toastError) {
        if (axios.isAxiosError(error) && error.response) {
          const apiError = error.response.data as any;
          toastError(apiError.detail || errorMessage);
        } else {
          toastError(errorMessage);
        }
      }
      throw error;
    }
  },

  delete: async <T = any>(
    url: string, 
    options: ApiCallOptions = {}
  ): Promise<T> => {
    const {
      showSuccessToast = true,
      showErrorToast = true,
      successMessage = 'Item deleted successfully!',
      errorMessage = 'Delete failed'
    } = options;

    try {
      const response: AxiosResponse<T> = await axios.delete(url);
      
      if (showSuccessToast && toastSuccess) {
        toastSuccess(successMessage);
      }
      
      return response.data;
    } catch (error) {
      if (showErrorToast && toastError) {
        if (axios.isAxiosError(error) && error.response) {
          const apiError = error.response.data as any;
          toastError(apiError.detail || errorMessage);
        } else {
          toastError(errorMessage);
        }
      }
      throw error;
    }
  },

  patch: async <T = any>(
    url: string, 
    data?: any, 
    options: ApiCallOptions = {}
  ): Promise<T> => {
    const {
      showSuccessToast = true,
      showErrorToast = true,
      successMessage = 'Update completed successfully!',
      errorMessage = 'Update failed'
    } = options;

    try {
      const response: AxiosResponse<T> = await axios.patch(url, data);
      
      if (showSuccessToast && toastSuccess) {
        toastSuccess(successMessage);
      }
      
      return response.data;
    } catch (error) {
      if (showErrorToast && toastError) {
        if (axios.isAxiosError(error) && error.response) {
          const apiError = error.response.data as any;
          toastError(apiError.detail || errorMessage);
        } else {
          toastError(errorMessage);
        }
      }
      throw error;
    }
  }
};
