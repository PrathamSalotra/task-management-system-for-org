import { apiRequest } from './client';
import { User } from './types';

export interface LoginResponse {
  accessToken: string;
}

export async function loginApi(email: string, password: string): Promise<LoginResponse> {
  return apiRequest<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function registerApi(
  name: string,
  email: string,
  password: string
): Promise<User> {
  return apiRequest<User>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  });
}

export async function refreshApi(): Promise<LoginResponse> {
  return apiRequest<LoginResponse>('/auth/refresh', {
    method: 'POST',
  });
}

export async function logoutApi(): Promise<{ message?: string }> {
  return apiRequest<{ message?: string }>('/auth/logout', {
    method: 'POST',
  });
}

export async function getMeApi(): Promise<User> {
  return apiRequest<User>('/users/me', {
    method: 'GET',
  });
}
