import React, { Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import Layout from '@/components/Layout'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

// Lazy load pages for better performance
const Dashboard = React.lazy(() => import('@/pages/Dashboard'))
const Upload = React.lazy(() => import('@/pages/Upload'))
const Analysis = React.lazy(() => import('@/pages/Analysis'))
const AnalysisDetail = React.lazy(() => import('@/pages/AnalysisDetail'))
const Profile = React.lazy(() => import('@/pages/Profile'))
const Settings = React.lazy(() => import('@/pages/Settings'))
const Billing = React.lazy(() => import('@/pages/Billing'))
const AdminDashboard = React.lazy(() => import('@/pages/admin/Dashboard'))
const AdminUsers = React.lazy(() => import('@/pages/admin/Users'))
const AdminAnalysis = React.lazy(() => import('@/pages/admin/Analysis'))
const Login = React.lazy(() => import('@/pages/auth/Login'))
const Register = React.lazy(() => import('@/pages/auth/Register'))
const ForgotPassword = React.lazy(() => import('@/pages/auth/ForgotPassword'))
const ResetPassword = React.lazy(() => import('@/pages/auth/ResetPassword'))
const Landing = React.lazy(() => import('@/pages/Landing'))
const Privacy = React.lazy(() => import('@/pages/Privacy'))
const Terms = React.lazy(() => import('@/pages/Terms'))
const Pricing = React.lazy(() => import('@/pages/Pricing'))
const Contact = React.lazy(() => import('@/pages/Contact'))
const ApiDocs = React.lazy(() => import('@/pages/ApiDocs'))
const Plugins = React.lazy(() => import('@/pages/Plugins'))
const NotFound = React.lazy(() => import('@/pages/NotFound'))

// Protected route wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode; adminOnly?: boolean }> = ({ 
  children, 
  adminOnly = false 
}) => {
  // Bypass authentication for dashboard preview
  return <>{children}</>
}

// Public route wrapper (redirect if authenticated)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore()

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}

// Loading component
const PageLoader: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center">
    <LoadingSpinner size="lg" />
  </div>
)

function App() {
  return (
    <div className="App">
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public routes */}
          <Route 
            path="/" 
            element={
              <PublicRoute>
                <Landing />
              </PublicRoute>
            } 
          />
          <Route 
            path="/login" 
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } 
          />
          <Route 
            path="/register" 
            element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            } 
          />
          <Route 
            path="/forgot-password" 
            element={
              <PublicRoute>
                <ForgotPassword />
              </PublicRoute>
            } 
          />
          <Route 
            path="/privacy" 
            element={<Privacy />} 
          />
          <Route 
            path="/terms" 
            element={<Terms />} 
          />
          <Route 
            path="/pricing" 
            element={<Pricing />} 
          />
          <Route 
            path="/contact" 
            element={<Contact />} 
          />
          <Route 
            path="/docs" 
            element={<ApiDocs />} 
          />
          <Route 
            path="/api" 
            element={<ApiDocs />} 
          />
          <Route 
            path="/plugins" 
            element={<Plugins />} 
          />
          <Route 
            path="/reset-password" 
            element={
              <PublicRoute>
                <ResetPassword />
              </PublicRoute>
            } 
          />

          {/* Protected routes */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/upload" 
            element={
              <ProtectedRoute>
                <Layout>
                  <Upload />
                </Layout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/analysis" 
            element={
              <ProtectedRoute>
                <Layout>
                  <Analysis />
                </Layout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/analysis/:id" 
            element={
              <ProtectedRoute>
                <Layout>
                  <AnalysisDetail />
                </Layout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <Layout>
                  <Profile />
                </Layout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/settings" 
            element={
              <ProtectedRoute>
                <Layout>
                  <Settings />
                </Layout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/billing" 
            element={
              <ProtectedRoute>
                <Layout>
                  <Billing />
                </Layout>
              </ProtectedRoute>
            } 
          />

          {/* Admin routes */}
          <Route 
            path="/admin/dashboard" 
            element={
              <ProtectedRoute adminOnly>
                <Layout>
                  <AdminDashboard />
                </Layout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/users" 
            element={
              <ProtectedRoute adminOnly>
                <Layout>
                  <AdminUsers />
                </Layout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/analysis" 
            element={
              <ProtectedRoute adminOnly>
                <Layout>
                  <AdminAnalysis />
                </Layout>
              </ProtectedRoute>
            } 
          />

          {/* Catch all - 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </div>
  )
}

export default App
