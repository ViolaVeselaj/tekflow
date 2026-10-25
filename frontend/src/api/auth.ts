import apiClient from './client';
import type { ChangePasswordRequest, CurrentUser, LoginRequest, LoginResponse, ResetPasswordRequest } from '../types';

export async function login(credentials: LoginRequest): Promise<LoginResponse> {
  const response = await apiClient.post<LoginResponse>('/auth/login', credentials);
  return response.data;
}

export async function getCurrentUser(): Promise<CurrentUser> {
  const response = await apiClient.get<CurrentUser>('/auth/me');
  return response.data;
}

export async function forgotPassword(email: string): Promise<{ message: string }> {
  const response = await apiClient.post<{ message: string }>('/auth/forgot-password', { email });
  return response.data;
}

export async function resetPassword(payload: ResetPasswordRequest): Promise<void> {
  await apiClient.post('/auth/reset-password', payload);
}

export async function changePassword(payload: ChangePasswordRequest): Promise<void> {
  await apiClient.post('/auth/change-password', payload);
}
