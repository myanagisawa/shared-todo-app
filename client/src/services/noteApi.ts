import axios from 'axios';
import { Note, CreateNoteData, UpdateNoteData, NotesListResponse, InviteUserData } from '../types/note';
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
      // Token is invalid, remove it
      localStorage.removeItem('auth_token');
      // Optionally redirect to login page
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const noteApi = {
  async getNotes(page = 1, limit = 10): Promise<ApiResponse<NotesListResponse>> {
    try {
      const response = await apiClient.get(`/notes?page=${page}&limit=${limit}`);
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

  async getNote(id: string): Promise<ApiResponse<Note>> {
    try {
      const response = await apiClient.get(`/notes/${id}`);
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

  async createNote(data: CreateNoteData): Promise<ApiResponse<Note>> {
    try {
      const response = await apiClient.post('/notes', data);
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

  async updateNote(id: string, data: UpdateNoteData): Promise<ApiResponse<Note>> {
    try {
      const response = await apiClient.put(`/notes/${id}`, data);
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

  async deleteNote(id: string): Promise<ApiResponse> {
    try {
      const response = await apiClient.delete(`/notes/${id}`);
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

  async inviteUser(noteId: string, data: InviteUserData): Promise<ApiResponse> {
    try {
      const response = await apiClient.post(`/notes/${noteId}/invite`, data);
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

  async removeUser(noteId: string, userId: string): Promise<ApiResponse> {
    try {
      const response = await apiClient.delete(`/notes/${noteId}/users/${userId}`);
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

  async updateUserRole(noteId: string, userId: string, role: 'viewer' | 'editor' | 'admin'): Promise<ApiResponse> {
    try {
      const response = await apiClient.put(`/notes/${noteId}/users/${userId}`, { role });
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