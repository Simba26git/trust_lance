import axios, { AxiosResponse, AxiosError } from 'axios'
import toast from 'react-hot-toast'

// API base configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'

// Create axios instance
const api = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add timestamp to prevent caching
    if (config.method === 'get') {
      config.params = {
        ...config.params,
        _t: Date.now(),
      }
    }

    // Log request in development
    if (import.meta.env.DEV) {
      console.log(`🚀 ${config.method?.toUpperCase()} ${config.url}`, {
        params: config.params,
        data: config.data,
      })
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response: AxiosResponse) => {
    // Log response in development
    if (import.meta.env.DEV) {
      console.log(`✅ ${response.config.method?.toUpperCase()} ${response.config.url}`, response.data)
    }

    return response
  },
  (error: AxiosError) => {
    // Log error in development
    if (import.meta.env.DEV) {
      console.error(`❌ ${error.config?.method?.toUpperCase()} ${error.config?.url}`, error.response?.data)
    }

    // Handle common errors
    if (error.response?.status === 401) {
      // Unauthorized - redirect to login
      const currentPath = window.location.pathname
      if (currentPath !== '/login' && currentPath !== '/register') {
        window.location.href = '/login'
      }
    } else if (error.response?.status === 403) {
      toast.error('Access denied')
    } else if (error.response?.status === 404) {
      toast.error('Resource not found')
    } else if (error.response?.status === 422) {
      const message = (error.response.data as any)?.message || 'Validation error'
      toast.error(message)
    } else if (error.response?.status === 429) {
      toast.error('Too many requests. Please slow down.')
    } else if (error.response && error.response.status >= 500) {
      toast.error('Server error. Please try again later.')
    } else if (error.code === 'NETWORK_ERROR' || !error.response) {
      toast.error('Network error. Please check your connection.')
    }

    return Promise.reject(error)
  }
)

// API methods
export const apiClient = {
  // Auth
  auth: {
    login: (email: string, password: string) =>
      api.post('/auth/login', { email, password }),
    register: (data: any) =>
      api.post('/auth/register', data),
    logout: () =>
      api.post('/auth/logout'),
    me: () =>
      api.get('/auth/me'),
    forgotPassword: (email: string) =>
      api.post('/auth/forgot-password', { email }),
    resetPassword: (token: string, password: string) =>
      api.post('/auth/reset-password', { token, password }),
    verifyEmail: (token: string) =>
      api.post('/auth/verify-email', { token }),
    resendVerification: () =>
      api.post('/auth/resend-verification'),
  },

  // Uploads
  uploads: {
    create: (formData: FormData) =>
      api.post('/uploads', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }),
    list: (params?: any) =>
      api.get('/uploads', { params }),
    get: (id: string) =>
      api.get(`/uploads/${id}`),
    delete: (id: string) =>
      api.delete(`/uploads/${id}`),
    reanalyze: (id: string) =>
      api.post(`/uploads/${id}/reanalyze`),
  },

  // Analysis
  analysis: {
    get: (id: string) =>
      api.get(`/analysis/${id}`),
    list: (params?: any) =>
      api.get('/analysis', { params }),
    downloadReport: (id: string) =>
      api.get(`/analysis/${id}/report`, { responseType: 'blob' }),
    updateVerdict: (id: string, verdict: string, notes?: string) =>
      api.put(`/analysis/${id}/verdict`, { verdict, notes }),
  },

  // Analytics
  analytics: {
    stats: (params?: any) =>
      api.get('/analytics/stats', { params }),
    usage: (params?: any) =>
      api.get('/analytics/usage', { params }),
  },

  // User profile
  user: {
    update: (data: any) =>
      api.put('/user/profile', data),
    changePassword: (currentPassword: string, newPassword: string) =>
      api.put('/user/password', { currentPassword, newPassword }),
    uploadAvatar: (file: File) => {
      const formData = new FormData()
      formData.append('avatar', file)
      return api.post('/user/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    },
    deleteAvatar: () =>
      api.delete('/user/avatar'),
  },

  // Billing
  billing: {
    plans: () =>
      api.get('/billing/plans'),
    subscribe: (planId: string) =>
      api.post('/billing/subscribe', { planId }),
    portal: () =>
      api.post('/billing/portal'),
    invoices: (params?: any) =>
      api.get('/billing/invoices', { params }),
    usage: () =>
      api.get('/billing/usage'),
  },

  // Admin
  admin: {
    users: {
      list: (params?: any) =>
        api.get('/admin/users', { params }),
      get: (id: string) =>
        api.get(`/admin/users/${id}`),
      update: (id: string, data: any) =>
        api.put(`/admin/users/${id}`, data),
      delete: (id: string) =>
        api.delete(`/admin/users/${id}`),
    },
    analysis: {
      list: (params?: any) =>
        api.get('/admin/analysis', { params }),
      get: (id: string) =>
        api.get(`/admin/analysis/${id}`),
      updateVerdict: (id: string, verdict: string, notes?: string) =>
        api.put(`/admin/analysis/${id}/verdict`, { verdict, notes }),
    },
    stats: () =>
      api.get('/admin/stats'),
  },
}

export default api
