/**
 * API Client Utility
 * 
 * A centralized utility for making API requests with proper error handling,
 * type safety, and consistent response formatting.
 */

export interface ApiResponse<T = unknown> {
  success?: boolean;
  data?: T;
  error?: string;
  message?: string;
  redirectTo?: string;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class ApiClient {
  private static baseUrl = '';

  /**
   * Make a GET request
   */
  static async get<T = unknown>(endpoint: string, params?: Record<string, string>): Promise<T> {
    const url = new URL(endpoint, window.location.origin);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) url.searchParams.append(key, value);
      });
    }

    return this.request<T>(url.toString(), { method: 'GET' });
  }

  /**
   * Make a POST request
   */
  static async post<T = unknown>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  /**
   * Make a PUT request
   */
  static async put<T = unknown>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  /**
   * Make a DELETE request
   */
  static async delete<T = unknown>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  /**
   * Core request method with error handling
   */
  private static async request<T>(url: string, options: RequestInit): Promise<T> {
    try {
      const response = await fetch(url, options);
      const data = await response.json();

      if (!response.ok) {
        throw new ApiError(
          data.error || `Request failed with status ${response.status}`,
          response.status,
          data
        );
      }

      return data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      throw new ApiError(
        error instanceof Error ? error.message : 'An unexpected error occurred',
        500
      );
    }
  }
}

/**
 * Specific API endpoints
 */
export const authApi = {
  login: (email: string, password: string) =>
    ApiClient.post('/api/auth/login', { email, password }),
  
  signup: (data: { firstName: string; lastName: string; email: string; password: string; role: string }) =>
    ApiClient.post('/api/auth/signup', data),
  
  logout: () =>
    ApiClient.post('/api/auth/logout'),
  
  getCurrentUser: () =>
    ApiClient.get('/api/auth/me'),
  
  updateProfile: (data: Record<string, unknown>) =>
    ApiClient.put('/api/auth/profile', data),
  
  forgotPassword: (email: string) =>
    ApiClient.post('/api/auth/forgot-password', { email }),
  
  resetPassword: (password: string, confirmPassword: string) =>
    ApiClient.post('/api/auth/reset-password', { password, confirmPassword }),
};

export const schoolApi = {
  register: (data: Record<string, unknown>) =>
    ApiClient.post('/api/schools/register', data),
  
  getMySchool: () =>
    ApiClient.get('/api/schools/me'),
};

export const requestApi = {
  getAll: (filters?: Record<string, string>) =>
    ApiClient.get('/api/requests', filters),
  
  getById: (id: string) =>
    ApiClient.get(`/api/requests/${id}`),
  
  create: (data: Record<string, unknown>) =>
    ApiClient.post('/api/requests', data),
  
  updateStatus: (id: string, status: string) =>
    ApiClient.put(`/api/requests/${id}/status`, { status }),
  
  respond: (id: string, data: Record<string, unknown>) =>
    ApiClient.post(`/api/requests/${id}/respond`, data),
  
  delete: (id: string) =>
    ApiClient.delete(`/api/requests/${id}`),
};
