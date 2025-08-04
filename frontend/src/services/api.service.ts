import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  AxiosError,
  type InternalAxiosRequestConfig
} from 'axios';
import type { AuthenticatedUser, LoginCredentials, LoginResponse, NewRouteParams, SavedRoute, UpdateRouteParams } from '../types';

interface CustomRequestConfig extends AxiosRequestConfig {
  _retry?: boolean;
}

const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  timeout: 10000
});

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    const userJson = sessionStorage.getItem('user');
    if (userJson) {
      const user: AuthenticatedUser = JSON.parse(userJson); // Use AuthenticatedUser type here
      if (user.token) {
        config.headers.Authorization = `Bearer ${user.token}`;
      }
    }
    return config;
  },
  (error: AxiosError): Promise<AxiosError> => {
    return Promise.reject(error);
  }
);

// Response interceptor with TypeScript typing
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as CustomRequestConfig;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Add token refresh logic here if needed
        sessionStorage.removeItem('user');
        window.location.href = '/login';
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// Typed API methods
export const ApiService = {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    console.log('API Base URL:', import.meta.env.VITE_API_BASE_URL);
    const response = await api.post<LoginResponse>('/login', credentials);
    return response.data;
  },

  async getRoutes(): Promise<SavedRoute[]> {
    const response = await api.get<SavedRoute[]>('/routes');
    return response.data;
  },

  async createRoute(route: NewRouteParams): Promise<SavedRoute> {
    const response = await api.post<SavedRoute>('/routes', route);
    return response.data;
  },

  async updateRoute(id: string, updates: UpdateRouteParams): Promise<SavedRoute> {
    const response = await api.put<SavedRoute>(`/routes/${id}`, updates);
    return response.data;
  },

  async deleteRoute(id: string): Promise<void> {
    await api.delete(`/routes/${id}`);
  }
};

export { api };