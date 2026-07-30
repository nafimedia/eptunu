import { clearAuth } from '$stores/auth';
import type { ApiResponse } from '$types';

const API_BASE = '/api';

export async function apiFetch<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const method = (options.method || 'GET').toUpperCase();
  if (options.body) {
    headers['Content-Type'] = 'application/json';
  } else if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify({});
  }

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      clearAuth();
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }

    const data: ApiResponse<T> = await response.json();

    if (!response.ok) {
      const errorMsg = data?.error?.message || data?.message || 'Permintaan API gagal';
      throw new Error(errorMsg);
    }

    return {
      ...data,
      success: data.success ?? true,
      message: data.message,
      data: data.data,
      pagination: data.pagination || { page: 1, limit: 10, total: (data.data as any)?.length || 0, totalPages: 1 },
      error: data.error,
    };
  } catch (err: any) {
    throw new Error(err.message || 'Gagal terhubung ke server');
  }
}
