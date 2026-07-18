import type { ApiResponse, BulkValidationResponse, UsageResponse, User } from '@/types';

const API_BASE = '/api/v1';

function getApiKey(): string | null {
  return localStorage.getItem('bev_api_key');
}

async function request<T>(path: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const apiKey = getApiKey();
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(apiKey && { 'X-API-Key': apiKey }),
      ...options.headers,
    },
  });

  const data = await res.json();

  if (res.status === 401) {
    localStorage.removeItem('bev_api_key');
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  return data;
}

// Auth
export async function signup(name: string, email: string, password: string) {
  const res = await fetch(`${API_BASE}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  });
  return res.json();
}

export async function login(email: string, password: string) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return res.json();
}

export async function getMe(): Promise<ApiResponse<User>> {
  return request('/auth/me');
}

// Validation
export async function validateBulk(emails: string[]): Promise<ApiResponse<BulkValidationResponse>> {
  return request('/validate/bulk', {
    method: 'POST',
    body: JSON.stringify({ emails }),
  });
}

export async function validateSingle(email: string) {
  return request('/validate', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

// Usage
export async function getUsage(): Promise<ApiResponse<UsageResponse>> {
  return request('/usage');
}

// Health
export async function getHealth() {
  const res = await fetch(`${API_BASE}/health`);
  return res.json();
}
