import axios from 'axios';

const API_URL = import.meta.env.VITE_API_BASE_URL;

// Toast utility functions - these will be set by the app
let toastSuccess: ((message: string) => void) | null = null;
let toastError: ((message: string) => void) | null = null;

export const setToastFunctions = (success: (message: string) => void, error: (message: string) => void) => {
  toastSuccess = success;
  toastError = error;
};

interface PeerValidationHistory {
  _id: string;
  peer_validation_id: string;
  answer_id: {
    _id: string;
    answer_id: string;
    question_id: string;
    specialist_id: string;
    answer_text: string;
    sources: Array<{
      name: string;
      link: string;
      _id: string;
    }>;
    version: number;
    is_current: boolean;
    created_at: string;
    updated_at: string;
    __v: number;
  };
  reviewer_id: {
    _id: string;
    name: string;
    email: string;
    role: string;
    hashed_password: string;
    specialization: string[];
    is_active: boolean;
    is_available: boolean;
    workload_count: number;
    incentive_points: number;
    user_id: string;
    created_at: string;
    updated_at: string;
    __v: number;
  };
  status: 'approved' | 'rejected' | 'pending';
  comments: string;
  created_at: string;
  __v: number;
}

interface PeerValidationHistoryResponse {
  peer_validation_history: PeerValidationHistory[];
}

export const peerValidationApi = {
  getPeerValidationHistory: async (answerId: string): Promise<PeerValidationHistoryResponse> => {
    try {
      const response = await axios.get(`${API_URL}/peer-validate/${answerId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Accept': 'application/json, text/plain, */*'
        }
      });
      
      return response.data;
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response) {
        const apiError = error.response.data as any;
        throw new Error(apiError.detail || 'Failed to fetch peer validation history');
      }
      throw new Error('Network error. Please try again.');
    }
  },

  submitPeerValidation: async (data: {
    answer_id: string;
    status: 'approved' | 'revised';
    comments?: string;
    revised_answer_text?: string;
  }): Promise<any> => {
    try {
      const response = await axios.post(`${API_URL}/peer-validate`, data, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (toastSuccess) {
        toastSuccess(response.data.message || 'Validation submitted successfully!');
      }
      
      return response.data;
    } catch (error: any) {
      if (toastError) {
        if (axios.isAxiosError(error) && error.response) {
          const apiError = error.response.data as any;
          toastError(apiError.detail || 'Failed to submit validation');
        } else {
          toastError('Network error. Please try again.');
        }
      }
      
      if (axios.isAxiosError(error) && error.response) {
        const apiError = error.response.data as any;
        throw new Error(apiError.detail || 'Failed to submit validation');
      }
      throw new Error('Network error. Please try again.');
    }
  },

  submitModeratorValidation: async (data: {
    answer_id: string;
    validation_status: 'valid' | 'invalid';
    comments?: string;
  }): Promise<any> => {
    try {
      const response = await axios.post(`${API_URL}/validate`, data, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (toastSuccess) {
        toastSuccess(response.data.message || 'Validation submitted successfully!');
      }
      
      return response.data;
    } catch (error: any) {
      if (toastError) {
        if (axios.isAxiosError(error) && error.response) {
          const apiError = error.response.data as any;
          toastError(apiError.detail || 'Failed to submit validation');
        } else {
          toastError('Network error. Please try again.');
        }
      }
      
      if (axios.isAxiosError(error) && error.response) {
        const apiError = error.response.data as any;
        throw new Error(apiError.detail || 'Failed to submit validation');
      }
      throw new Error('Network error. Please try again.');
    }
  }
};

export type { PeerValidationHistory, PeerValidationHistoryResponse };
