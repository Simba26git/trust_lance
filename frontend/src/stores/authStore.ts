import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '@/lib/api'
import toast from 'react-hot-toast'

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  avatar?: string
  phone?: string
  company?: string
  bio?: string
  role: 'user' | 'admin'
  plan: 'free' | 'pro' | 'enterprise'
  usageLimit: number
  usageCount: number
  isEmailVerified: boolean
  createdAt: string
  updatedAt: string
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  
  // Actions
  login: (email: string, password: string) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => void
  updateUser: (data: Partial<User>) => void
  refreshUser: () => Promise<void>
  forgotPassword: (email: string) => Promise<void>
  resetPassword: (token: string, password: string) => Promise<void>
  verifyEmail: (token: string) => Promise<void>
  resendVerification: () => Promise<void>
}

interface RegisterData {
  email: string
  password: string
  firstName: string
  lastName: string
  company?: string
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: {
        id: 'demo',
        email: 'demo@trustlens.com',
        firstName: 'Demo',
        lastName: 'User',
        role: 'user',
        plan: 'free',
        usageLimit: 100,
        usageCount: 0,
        isEmailVerified: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      token: 'dev-token',
      isAuthenticated: true,
      isLoading: false,

      login: async (email: string, password: string) => {
        // Skip login for development
        set({
          user: {
            id: 'demo',
            email: 'demo@trustlens.com',
            firstName: 'Demo',
            lastName: 'User',
            role: 'user',
            plan: 'free',
            usageLimit: 100,
            usageCount: 0,
            isEmailVerified: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          token: 'dev-token',
          isAuthenticated: true,
          isLoading: false,
        })
        toast.success('Login skipped for development!')
      },

      register: async (data: RegisterData) => {
        try {
          set({ isLoading: true })
          
          const response = await api.post('/auth/register', data)
          const { user, token } = response.data

          // Set token in axios headers
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`

          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
          })

          toast.success(`Welcome to TrustLens, ${user.firstName}!`)
        } catch (error: any) {
          set({ isLoading: false })
          const message = error.response?.data?.message || 'Registration failed'
          toast.error(message)
          throw error
        }
      },

      logout: () => {
        // Remove token from axios headers
        delete api.defaults.headers.common['Authorization']

        set({
          user: null,
          token: null,
          isAuthenticated: false,
        })

        toast.success('Logged out successfully')
      },

      updateUser: (data: Partial<User>) => {
        const { user } = get()
        if (user) {
          set({
            user: { ...user, ...data }
          })
        }
      },

      refreshUser: async () => {
        try {
          const response = await api.get('/auth/me')
          const user = response.data

          set({ user })
        } catch (error: any) {
          // If refresh fails, logout
          get().logout()
          throw error
        }
      },

      forgotPassword: async (email: string) => {
        try {
          await api.post('/auth/forgot-password', { email })
          toast.success('Password reset link sent to your email')
        } catch (error: any) {
          const message = error.response?.data?.message || 'Failed to send reset email'
          toast.error(message)
          throw error
        }
      },

      resetPassword: async (token: string, password: string) => {
        try {
          await api.post('/auth/reset-password', { token, password })
          toast.success('Password reset successfully')
        } catch (error: any) {
          const message = error.response?.data?.message || 'Failed to reset password'
          toast.error(message)
          throw error
        }
      },

      verifyEmail: async (token: string) => {
        try {
          await api.post('/auth/verify-email', { token })
          
          // Update user verification status
          const { user } = get()
          if (user) {
            set({
              user: { ...user, isEmailVerified: true }
            })
          }

          toast.success('Email verified successfully')
        } catch (error: any) {
          const message = error.response?.data?.message || 'Email verification failed'
          toast.error(message)
          throw error
        }
      },

      resendVerification: async () => {
        try {
          await api.post('/auth/resend-verification')
          toast.success('Verification email sent')
        } catch (error: any) {
          const message = error.response?.data?.message || 'Failed to send verification email'
          toast.error(message)
          throw error
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        // Set token in axios headers when hydrating from storage
        if (state?.token) {
          api.defaults.headers.common['Authorization'] = `Bearer ${state.token}`
        }
      },
    }
  )
)
