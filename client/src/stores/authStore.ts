import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthStore, LoginCredentials, RegisterData, User } from '../types/auth';
import { authApi } from '../services/authApi';

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (credentials: LoginCredentials) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await authApi.login(credentials);
          
          if (response.success && response.data) {
            const { user, token } = response.data;
            
            // Store token in localStorage
            localStorage.setItem('auth_token', token);
            
            set({
              user,
              token,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
          } else {
            throw new Error(response.error?.message || 'Login failed');
          }
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Login failed',
          });
          throw error;
        }
      },

      register: async (data: RegisterData) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await authApi.register(data);
          
          if (response.success && response.data) {
            const { user, token } = response.data;
            
            // Store token in localStorage
            localStorage.setItem('auth_token', token);
            
            set({
              user,
              token,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
          } else {
            throw new Error(response.error?.message || 'Registration failed');
          }
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Registration failed',
          });
          throw error;
        }
      },

      logout: () => {
        // Remove token from localStorage
        localStorage.removeItem('auth_token');
        
        // Call logout API
        authApi.logout().catch(console.error);
        
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
        });
      },

      clearError: () => {
        set({ error: null });
      },

      initialize: () => {
        const token = localStorage.getItem('auth_token');
        
        if (token) {
          // Verify token is still valid by making a request
          authApi.getCurrentUser()
            .then(response => {
              if (response.success && response.data) {
                set({
                  user: response.data,
                  token,
                  isAuthenticated: true,
                });
              } else {
                // Token is invalid, clear it
                localStorage.removeItem('auth_token');
                set({
                  user: null,
                  token: null,
                  isAuthenticated: false,
                });
              }
            })
            .catch(() => {
              // Token is invalid, clear it
              localStorage.removeItem('auth_token');
              set({
                user: null,
                token: null,
                isAuthenticated: false,
              });
            });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);