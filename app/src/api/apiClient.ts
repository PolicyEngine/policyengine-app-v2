import { BASE_URL } from '@/constants';

export interface ApiError {
  message: string;
  status?: number;
  details?: unknown;
}

export interface ApiResponse<T> {
  data?: T;
  error?: ApiError;
}

export interface PaginationParams {
  skip?: number;
  limit?: number;
}

export interface ApiRequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean>;
}

class ApiClient {
  private baseUrl: string;
  private defaultHeaders: HeadersInit;

  constructor(baseUrl: string = BASE_URL) {
    this.baseUrl = baseUrl;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
  }

  private buildUrl(endpoint: string, params?: Record<string, string | number | boolean>): string {
    const url = new URL(endpoint, this.baseUrl);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    return url.toString();
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorBody = await response.text();
      let errorDetail: unknown;

      try {
        errorDetail = JSON.parse(errorBody);
      } catch {
        errorDetail = errorBody;
      }

      throw {
        message: `API request failed: ${response.statusText}`,
        status: response.status,
        details: errorDetail,
      } as ApiError;
    }

    const text = await response.text();
    if (!text) {
      return {} as T;
    }

    try {
      return JSON.parse(text);
    } catch {
      throw {
        message: 'Failed to parse response as JSON',
        details: text,
      } as ApiError;
    }
  }

  async get<T>(endpoint: string, options?: ApiRequestOptions): Promise<T> {
    const { params, ...fetchOptions } = options || {};
    const url = this.buildUrl(endpoint, params);

    console.log('[API Client] GET request to:', url);

    const response = await fetch(url, {
      ...fetchOptions,
      method: 'GET',
      headers: {
        ...this.defaultHeaders,
        ...fetchOptions?.headers,
      },
    });

    console.log('[API Client] Response status:', response.status);
    return this.handleResponse<T>(response);
  }

  async post<T, D = unknown>(endpoint: string, data?: D, options?: ApiRequestOptions): Promise<T> {
    const { params, ...fetchOptions } = options || {};
    const url = this.buildUrl(endpoint, params);

    const response = await fetch(url, {
      ...fetchOptions,
      method: 'POST',
      headers: {
        ...this.defaultHeaders,
        ...fetchOptions?.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
    });

    return this.handleResponse<T>(response);
  }

  async patch<T, D = unknown>(endpoint: string, data?: D, options?: ApiRequestOptions): Promise<T> {
    const { params, ...fetchOptions } = options || {};
    const url = this.buildUrl(endpoint, params);

    const response = await fetch(url, {
      ...fetchOptions,
      method: 'PATCH',
      headers: {
        ...this.defaultHeaders,
        ...fetchOptions?.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
    });

    return this.handleResponse<T>(response);
  }

  async delete<T>(endpoint: string, options?: ApiRequestOptions): Promise<T> {
    const { params, ...fetchOptions } = options || {};
    const url = this.buildUrl(endpoint, params);

    const response = await fetch(url, {
      ...fetchOptions,
      method: 'DELETE',
      headers: {
        ...this.defaultHeaders,
        ...fetchOptions?.headers,
      },
    });

    return this.handleResponse<T>(response);
  }
}

// Create a singleton instance
export const apiClient = new ApiClient();

// Export the class for testing or custom instances
export default ApiClient;
