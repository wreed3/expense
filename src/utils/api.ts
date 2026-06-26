import axios, { AxiosError, AxiosRequestConfig } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<{ error: string; code?: string }>) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    // Handle token expiration
    if (error.response?.status === 401 && error.response?.data?.code === 'TOKEN_EXPIRED') {
      if (!originalRequest._retry) {
        // Clear token and redirect to login
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }

    // Handle network errors
    if (!error.response) {
      return Promise.reject({
        message: 'Network error. Please check your connection.',
        code: 'NETWORK_ERROR',
      });
    }

    // Return formatted error
    return Promise.reject({
      message: error.response.data?.error || 'An error occurred',
      code: error.response.data?.code || 'API_ERROR',
      status: error.response.status,
    });
  }
);

export interface ApiError {
  message: string;
  code: string;
  status?: number;
}

export default apiClient;

// Helper function for file uploads
export async function uploadFile(file: File, endpoint: string): Promise<any> {
  const formData = new FormData();
  formData.append('file', file);

  const token = localStorage.getItem('token');
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw {
      message: error.error || 'Upload failed',
      code: error.code || 'UPLOAD_ERROR',
      status: response.status,
    };
  }

  return response.json();
}