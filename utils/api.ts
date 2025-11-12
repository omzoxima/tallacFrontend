/**
 * API utility with global error handling for 401/403 responses
 * Automatically redirects to login page on authentication errors
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface ApiOptions extends RequestInit {
  requireAuth?: boolean; // Whether this request requires authentication
}

/**
 * Enhanced fetch function with automatic error handling for 401/403
 */
export async function apiFetch(
  endpoint: string,
  options: ApiOptions = {}
): Promise<Response> {
  const { requireAuth = true, headers = {}, ...fetchOptions } = options;

  // Get token from localStorage
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  // Prepare headers as a record
  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(headers as Record<string, string>),
  };

  // Add authorization header if token exists and auth is required
  if (requireAuth && token) {
    requestHeaders['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...fetchOptions,
      headers: requestHeaders as HeadersInit,
    });

    // Handle 401 Unauthorized or 403 Forbidden
    if (response.status === 401 || response.status === 403) {
      // Clear token and redirect to login
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        // Only redirect if we're not already on login page
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
      
      // Throw error so caller can handle it
      throw new Error('Unauthorized: Please login again');
    }

    return response;
  } catch (error) {
    // Re-throw the error so caller can handle it
    throw error;
  }
}

/**
 * Helper function for GET requests
 */
export async function apiGet<T = any>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  const response = await apiFetch(endpoint, {
    ...options,
    method: 'GET',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

/**
 * Helper function for POST requests
 */
export async function apiPost<T = any>(
  endpoint: string,
  data?: any,
  options: ApiOptions = {}
): Promise<T> {
  const response = await apiFetch(endpoint, {
    ...options,
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

/**
 * Helper function for PUT requests
 */
export async function apiPut<T = any>(
  endpoint: string,
  data?: any,
  options: ApiOptions = {}
): Promise<T> {
  const response = await apiFetch(endpoint, {
    ...options,
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

/**
 * Helper function for DELETE requests
 */
export async function apiDelete<T = any>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  const response = await apiFetch(endpoint, {
    ...options,
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

