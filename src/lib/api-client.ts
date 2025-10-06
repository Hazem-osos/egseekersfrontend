import axios, { AxiosInstance, AxiosError, AxiosRequestConfig, AxiosHeaders } from 'axios';
import { config } from '@/config/env';
import { ApiResponse, ErrorResponse } from '@/types/api';

class ApiError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface RequestOptions extends Omit<AxiosRequestConfig, 'baseURL' | 'url' | 'data' | 'headers'> {
  timeout?: number;
  headers?: Record<string, string>;
}

export class ApiClient {
  private static instance: ApiClient;
  private readonly axiosInstance: AxiosInstance;

  private constructor() {
    this.axiosInstance = axios.create({
      baseURL: config.apiUrl,
      timeout: 30000,
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
      }
    });

    // Request interceptor
    this.axiosInstance.interceptors.request.use(
      (config) => {
        console.log('Making request to:', config.url, 'with method:', config.method);
        // Get token from localStorage
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        
        // Add token to headers if it exists
        if (token) {
          config.headers = config.headers || {};
          config.headers.Authorization = `Bearer ${token}`;
        }
        
        return config;
      },
      (error) => {
        console.error('Request error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.axiosInstance.interceptors.response.use(
      (response) => {
        console.log('Received response from:', response.config.url, 'with status:', response.status);
        // Handle successful responses
        const data = response.data;
        
        // Ensure response has success property
        if (!('success' in data)) {
          data.success = true;
        }
        
        return data;
      },
      (error: AxiosError) => {
        // Check if it's actually an AxiosError
        if (error && typeof error === 'object') {
          console.error('Response error details:', {
            message: error.message || 'Unknown error',
            code: error.code || 'NO_CODE',
            status: error.response?.status || 'NO_STATUS',
            data: error.response?.data || 'NO_DATA',
            config: {
              url: error.config?.url || 'NO_URL',
              method: error.config?.method || 'NO_METHOD',
              baseURL: error.config?.baseURL || 'NO_BASE_URL',
              headers: error.config?.headers || 'NO_HEADERS'
            }
          });
        } else {
          console.error('Non-AxiosError received:', error);
        }
        
        // Handle 401 Unauthorized errors
        if (error.response?.status === 401) {
          if (typeof window !== 'undefined') {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
          }
        }
        
        // Format error response
        return Promise.reject({
          success: false,
          error: (error.response?.data as any)?.error || error.message || 'An unknown error occurred',
          status: error.response?.status || 500
        });
      }
    );
  }

  public static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient();
    }
    return ApiClient.instance;
  }

  private getHeaders(options?: RequestOptions): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options?.headers,
    };
    return headers;
  }

  public async request<T>(
    method: string,
    endpoint: string,
    data?: unknown,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await this.axiosInstance.request({
        method,
        url: endpoint,
        data,
        ...options,
        headers: this.getHeaders(options),
      });

      return response as unknown as ApiResponse<T>;
    } catch (error) {
      if (error instanceof Error) {
        throw new ApiError(error.message, 'REQUEST_ERROR');
      }
      throw error;
    }
  }

  public async get<T>(endpoint: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>('GET', endpoint, undefined, options);
  }

  public async post<T>(
    endpoint: string,
    data?: unknown,
    options?: RequestOptions
  ): Promise<ApiResponse<T>> {
    return this.request<T>('POST', endpoint, data, options);
  }

  public async put<T>(
    endpoint: string,
    data?: unknown,
    options?: RequestOptions
  ): Promise<ApiResponse<T>> {
    return this.request<T>('PUT', endpoint, data, options);
  }

  public async delete<T>(endpoint: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>('DELETE', endpoint, undefined, options);
  }

  public async patch<T>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>('PATCH', endpoint, data, options);
  }
}

export const apiClient = ApiClient.getInstance(); 