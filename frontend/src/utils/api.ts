/**
 * Centralized API client with automatic token refresh and retry logic
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
}

class ApiClient {
  private baseURL: string;
  private isRefreshing = false;
  private refreshPromise: Promise<string | null> | null = null;
  private csrfToken: string | null = null;
  private csrfPromise: Promise<void> | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    // Do not eagerly fetch CSRF token here; instead ensure it before
    // state-changing requests to avoid race conditions. We keep the
    // method available for early bootstrap if desired.
  }

  private async fetchCSRFToken(): Promise<void> {
    try {
      const response = await fetch(`${this.baseURL}/api/csrf-token`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        this.csrfToken = data.csrfToken;
      }
    } catch (err: unknown) {
      console.warn('Failed to fetch CSRF token:', err);
    }
  }

  /**
   * Ensure a CSRF token is available. Serializes concurrent fetches so
   * multiple requests don't trigger multiple token requests.
   */
  private async ensureCsrf(): Promise<void> {
    if (this.csrfToken) return;
    if (this.csrfPromise) return this.csrfPromise;
    this.csrfPromise = (async () => {
      await this.fetchCSRFToken();
      this.csrfPromise = null;
    })();
    return this.csrfPromise;
  }

  /**
   * Auth endpoints do not require CSRF protection. We also avoid
   * the extra round-trip to fetch a CSRF token for these.
   */
  private isAuthEndpoint(endpoint: string): boolean {
    const normalized = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return normalized.startsWith('/api/auth/');
  }

  private async refreshToken(): Promise<string | null> {
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }

    this.isRefreshing = true;
    this.refreshPromise = this.performRefresh();

    try {
      const newToken = await this.refreshPromise;
      return newToken;
    } finally {
      this.isRefreshing = false;
      this.refreshPromise = null;
    }
  }

  private async performRefresh(): Promise<string | null> {
    try {
      const response = await fetch(`${this.baseURL}/api/auth/refresh`, {
        method: 'POST',
        credentials: 'include', // Include cookies for refresh token
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        // Refresh failed, redirect to login
        this.clearAuth();
        return null;
      }

      const data = await response.json();
      
      // Update localStorage with new token
      if (data.token) {
        localStorage.setItem('token', data.token);
        return data.token;
      }

      return null;
    } catch (err: unknown) {
      console.error('Token refresh failed:', err);
      this.clearAuth();
      return null;
    }
  }

  private clearAuth(): void {
    localStorage.removeItem('token');
    // Dispatch logout event
    window.dispatchEvent(new Event('authStateChanged'));
  }

  private getAuthHeaders(endpoint: string): Record<string, string> {
    const token = localStorage.getItem('token');
    const headers: Record<string, string> = {};
    
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    // Only add CSRF token for non-auth endpoints
    if (this.csrfToken && !this.isAuthEndpoint(endpoint)) {
      headers['X-CSRF-Token'] = this.csrfToken;
    }
    
    return headers;
  }

  async request<T = unknown>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    // If this is a state-changing request, ensure we have a fresh CSRF token.
    const method = (options.method || 'GET').toUpperCase();
    const needsCsrf = method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS';
    // Skip CSRF for auth endpoints like /api/auth/login, /refresh, /logout, etc.
    if (needsCsrf && !this.isAuthEndpoint(endpoint)) {
      await this.ensureCsrf();
    }
    
    const defaultHeaders = {
      'Content-Type': 'application/json',
      ...this.getAuthHeaders(endpoint),
    };

    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
      credentials: 'include', // Include cookies for refresh token
    };

    try {
      let response = await fetch(url, config);

      // If 403 (possible CSRF failure) on a state-changing non-auth request, try
      // to refresh CSRF token once and retry.
      if (needsCsrf && !this.isAuthEndpoint(endpoint) && response.status === 403) {
        // Attempt to refresh CSRF token and retry once
        await this.fetchCSRFToken();
        // Update headers with new CSRF token
        config.headers = {
          ...config.headers,
          ...(this.csrfToken ? { 'X-CSRF-Token': this.csrfToken } : {}),
        };
        response = await fetch(url, config);
      }

      // If 401 and we have a token, try to refresh
      if (response.status === 401 && localStorage.getItem('token')) {
        const newToken = await this.refreshToken();
        
        if (newToken) {
          // Retry the original request with new token
          config.headers = {
            ...config.headers,
            Authorization: `Bearer ${newToken}`,
          };
          response = await fetch(url, config);
        }
      }

      const data = await response.json();

      if (!response.ok) {
        return {
          error: data.message || `HTTP ${response.status}`,
          message: data.message,
        };
      }

      return { data };
    } catch (err: unknown) {
      console.error('API request failed:', err);
      return {
        error: err instanceof Error ? err.message : 'Network error',
      };
    }
  }

  // Convenience methods
  async get<T = unknown>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T = unknown>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T = unknown>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T = unknown>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // Special method for file downloads
  async download(endpoint: string): Promise<Blob | null> {
    const url = `${this.baseURL}${endpoint}`;
    const token = localStorage.getItem('token');
    
    try {
      let response = await fetch(url, {
        method: 'GET',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: 'include',
      });

      // If 401, try refresh
      if (response.status === 401 && token) {
        const newToken = await this.refreshToken();
        if (newToken) {
          response = await fetch(url, {
            method: 'GET',
            headers: { Authorization: `Bearer ${newToken}` },
            credentials: 'include',
          });
        }
      }

      if (!response.ok) {
        throw new Error(`Download failed: ${response.status}`);
      }

      return await response.blob();
    } catch (error) {
      console.error('Download failed:', error);
      return null;
    }
  }
}

// Create and export the API client instance
export const api = new ApiClient(API_BASE_URL || '');

// Export types
export type { ApiResponse };
