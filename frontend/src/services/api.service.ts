import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  AxiosError,
  type InternalAxiosRequestConfig
} from 'axios';
import type {
  AuthenticatedUser,
  LoginCredentials,
  LoginResponse,
  NewRouteParams,
  SavedRoute,
  UpdateRouteParams
} from '../types';

interface CustomRequestConfig extends AxiosRequestConfig {
  _retry?: boolean;
}

const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  timeout: 10000,
  withCredentials: true // Required for Sanctum + CORS credentials
});

// Request interceptor
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    const userJson = sessionStorage.getItem('user');
    if (userJson) {
      const user: AuthenticatedUser = JSON.parse(userJson);
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

// Response interceptor
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as CustomRequestConfig;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        sessionStorage.removeItem('user');
        window.location.href = '/login';
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }

    if (error.code === 'ERR_NETWORK' || error.message.includes('CORS')) {
      console.error('CORS error occurred:', error);
    }

    return Promise.reject(error);
  }
);

// API Service Methods
export const ApiService = {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>('/auth/login', credentials);
    return response.data;
  },

  async getRoutes(params?: {
    sort_key?: string;
    sort_order?: 'asc' | 'desc';
    secondary_sort_key?: string;
    secondary_sort_order?: 'asc' | 'desc';
  }): Promise<SavedRoute[]> {
    const query = new URLSearchParams();

    if (params?.sort_key) query.append('sort_key', params.sort_key);
    if (params?.sort_order) query.append('sort_order', params.sort_order);
    if (params?.secondary_sort_key) query.append('secondary_sort_key', params.secondary_sort_key);
    if (params?.secondary_sort_order) query.append('secondary_sort_order', params.secondary_sort_order);
    console.log('Fetching routes with params:', query.toString());
    const response = await api.get<SavedRoute[]>(`/routes?${query.toString()}`);
    return response.data;
  },

  async getRouteById(id: string): Promise<SavedRoute> {
    const response = await api.get<SavedRoute>(`/routes/${id}`);
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

  async deleteRoute(id: number): Promise<void> {
    await api.delete(`/routes/${id}`);
  },

  // Optional health check for CORS preflight
  async checkApiHealth(): Promise<boolean> {
    try {
      await api.options('/');
      return true;
    } catch (error) {
      console.error('API health check failed:', error);
      return false;
    }
  }
};

export { api };
