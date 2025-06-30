import axios from 'axios';
import { ApiResponse } from '../types/auth';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle auth errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export interface Invitation {
  id: string;
  token: string;
  noteId: string;
  invitedEmail: string;
  role: 'viewer' | 'editor' | 'admin';
  status: 'pending' | 'accepted' | 'expired';
  expiresAt: string;
  createdAt: string;
  note: {
    id: string;
    title: string;
    author: {
      id: string;
      name: string;
      email: string;
    };
  };
  invitedBy: {
    id: string;
    name: string;
    email: string;
  };
}

export const invitationApi = {
  async getInvitation(token: string): Promise<ApiResponse<Invitation>> {
    try {
      const response = await apiClient.get(`/invitations/${token}`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return error.response.data;
      }
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Network error occurred',
        },
      };
    }
  },

  async acceptInvitation(token: string): Promise<ApiResponse> {
    try {
      const response = await apiClient.post(`/invitations/${token}/accept`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return error.response.data;
      }
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Network error occurred',
        },
      };
    }
  },

  async declineInvitation(token: string): Promise<ApiResponse> {
    try {
      const response = await apiClient.post(`/invitations/${token}/decline`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return error.response.data;
      }
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Network error occurred',
        },
      };
    }
  },
};