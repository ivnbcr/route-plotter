import type { LoginResponse } from '../types';
import { api } from './api.service';

export const AuthService = {
  async login(credentials: { email: string; password: string }): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>('/api/login', credentials);
    return response.data;
  },

  async validateSession(): Promise<LoginResponse> {
    const response = await api.get<LoginResponse>('/api/validate-session');
    return response.data;
  },

  async register(userData: {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
  }): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>('/api/register', userData);
    return response.data;
  }
};