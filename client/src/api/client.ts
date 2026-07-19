import type { ApiResponse, BulkValidationResponse, UsageResponse, User, AdminApiKey, AdminApiKeyList } from '@/types';

const API_BASE = '/api/v1';

function getApiKey(): string | null {
  return localStorage.getItem('bev_api_key');
}

function getAdminKey(): string | null {
  return localStorage.getItem('bev_admin_key');
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

  // Only redirect to login on 401 for non-auth endpoints
  // Auth endpoints handle their own error display
  if (res.status === 401 && !path.startsWith('/auth/')) {
    localStorage.removeItem('bev_api_key');
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  return data;
}

async function requestAdmin<T>(path: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const apiKey = getApiKey();
  const adminKey = getAdminKey();
  
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(apiKey && { 'X-API-Key': apiKey }),
      ...(adminKey && { 'X-API-Key': adminKey }),
      ...options.headers,
    },
  });

  const data = await res.json();

  if (res.status === 401 && !path.startsWith('/auth/')) {
    localStorage.removeItem('bev_api_key');
    localStorage.removeItem('bev_admin_key');
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

// Admin API Key Management
export async function createApiKey(name: string, tier: string = 'free'): Promise<ApiResponse<AdminApiKey>> {
  return requestAdmin('/admin/keys', {
    method: 'POST',
    body: JSON.stringify({ name, tier }),
  });
}

export async function listApiKeys(): Promise<ApiResponse<AdminApiKeyList[]>> {
  return requestAdmin('/admin/keys');
}

export async function deactivateApiKey(id: number): Promise<ApiResponse<{ success: boolean }>> {
  return requestAdmin(`/admin/keys/${id}/deactivate`, {
    method: 'POST',
  });
}

export async function reactivateApiKey(id: number): Promise<ApiResponse<{ success: boolean }>> {
  return requestAdmin(`/admin/keys/${id}/reactivate`, {
    method: 'POST',
  });
}

export async function updateKeyTier(id: number, tier: string): Promise<ApiResponse<{ success: boolean }>> {
  return requestAdmin(`/admin/keys/${id}/tier`, {
    method: 'PUT',
    body: JSON.stringify({ tier }),
  });
}

export async function deleteApiKey(id: number): Promise<ApiResponse<{ success: boolean }>> {
  return requestAdmin(`/admin/keys/${id}`, {
    method: 'DELETE',
  });
}

export async function setAdminKey(adminKey: string) {
  localStorage.setItem('bev_admin_key', adminKey);
}

export function getAdminKeyFromStorage(): string | null {
  return localStorage.getItem('bev_admin_key');
}

export function clearAdminKey() {
  localStorage.removeItem('bev_admin_key');
}

// API client wrapper for REST-like interface
export const api = {
  get: (path: string, options?: RequestInit) => requestAdmin(path, { ...options, method: 'GET' }),
  post: (path: string, data?: any, options?: RequestInit) => requestAdmin(path, { ...options, method: 'POST', body: JSON.stringify(data) }),
  put: (path: string, data?: any, options?: RequestInit) => requestAdmin(path, { ...options, method: 'PUT', body: JSON.stringify(data) }),
  delete: (path: string, options?: RequestInit) => requestAdmin(path, { ...options, method: 'DELETE' }),
  postWithoutAdmin: (path: string, data?: any, options?: RequestInit) => request(path, { ...options, method: 'POST', body: JSON.stringify(data) }),
};
