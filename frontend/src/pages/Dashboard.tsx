import React from 'react'
import { useQuery } from 'react-query'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { apiClient } from '@/lib/api'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import {
  ChartBarIcon,
  DocumentCheckIcon,
  ExclamationTriangleIcon,
  CloudArrowUpIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
} from '@heroicons/react/24/outline'

interface Stats {
  totalUploads: number
  totalAnalyses: number
  authenticVerifications: number
  suspiciousDetections: number
  usageThisMonth: number
  usageLimit: number
}

interface RecentAnalysis {
  id: string
  fileName: string
  fileType: string
  verdict: 'authentic' | 'suspicious' | 'fake' | 'pending'
  confidence: number
  createdAt: string
  thumbnail?: string
}

const Dashboard: React.FC = () => {
  const { user } = useAuthStore()

  // Fetch dashboard stats
  const { data: stats, isLoading: statsLoading } = useQuery<Stats>(
    'dashboard-stats',
    () => apiClient.analytics.stats().then(res => res.data),
    {
      refetchInterval: 30000, // Refresh every 30 seconds
    }
  )

  // Fetch recent analyses
  const { data: recentAnalyses, isLoading: analysesLoading } = useQuery<RecentAnalysis[]>(
    'recent-analyses',
    () => apiClient.analysis.list({ limit: 5, sort: '-createdAt' }).then(res => res.data.data),
    {
      refetchInterval: 60000, // Refresh every minute
    }
  )

  const getVerdictBadge = (verdict: string, confidence: number) => {
    switch (verdict) {
      case 'authentic':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircleIcon className="w-3 h-3 mr-1" />
            Authentic ({confidence}%)
          </span>
        )
      case 'suspicious':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <ExclamationTriangleIcon className="w-3 h-3 mr-1" />
            Suspicious ({confidence}%)
          </span>
        )
      case 'fake':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircleIcon className="w-3 h-3 mr-1" />
            Fake ({confidence}%)
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <ClockIcon className="w-3 h-3 mr-1" />
            Processing...
          </span>
        )
    }
  }

  const usagePercentage = stats ? (stats.usageThisMonth / stats.usageLimit) * 100 : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-600">
          Welcome back, {user?.firstName}! Here's what's happening with your content verification.
        </p>
      </div>

      {/* Email verification banner */}
      {user && !user.isEmailVerified && (
        <div className="rounded-md bg-yellow-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Email verification required
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  Please verify your email address to unlock all features.{' '}
                  <button className="font-medium underline hover:text-yellow-600">
                    Resend verification email
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      {statsLoading ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-gray-200 rounded animate-pulse" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <div className="h-4 bg-gray-200 rounded animate-pulse mb-2" />
                    <div className="h-6 bg-gray-200 rounded animate-pulse" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CloudArrowUpIcon className="h-8 w-8 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Uploads</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats?.totalUploads || 0}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <DocumentCheckIcon className="h-8 w-8 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Analyses Complete</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats?.totalAnalyses || 0}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CheckCircleIcon className="h-8 w-8 text-green-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Authentic Content</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats?.authenticVerifications || 0}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ExclamationTriangleIcon className="h-8 w-8 text-red-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Suspicious Detections</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats?.suspiciousDetections || 0}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Usage Progress */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Monthly Usage</h3>
          <div className="mt-2 max-w-xl text-sm text-gray-500">
            <p>You've used {stats?.usageThisMonth || 0} of {stats?.usageLimit || 0} analyses this month.</p>
          </div>
          <div className="mt-5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">{stats?.usageThisMonth || 0} used</span>
              <span className="text-gray-500">{stats?.usageLimit || 0} limit</span>
            </div>
            <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  usagePercentage > 90 ? 'bg-red-500' : usagePercentage > 70 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(usagePercentage, 100)}%` }}
              />
            </div>
            {usagePercentage > 90 && (
              <p className="mt-2 text-sm text-red-600">
                You're approaching your monthly limit.{' '}
                <Link to="/billing" className="font-medium underline hover:text-red-500">
                  Upgrade your plan
                </Link>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Analyses */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Analyses</h3>
            <Link
              to="/analysis"
              className="text-sm font-medium text-primary-600 hover:text-primary-500"
            >
              View all
            </Link>
          </div>
          
          {analysesLoading ? (
            <div className="mt-6 space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4 animate-pulse">
                  <div className="w-12 h-12 bg-gray-200 rounded" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : recentAnalyses && recentAnalyses.length > 0 ? (
            <div className="mt-6">
              <div className="flow-root">
                <ul className="-my-5 divide-y divide-gray-200">
                  {recentAnalyses.map((analysis) => (
                    <li key={analysis.id} className="py-4">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          {analysis.thumbnail ? (
                            <img
                              className="h-12 w-12 rounded object-cover"
                              src={analysis.thumbnail}
                              alt={analysis.fileName}
                            />
                          ) : (
                            <div className="h-12 w-12 rounded bg-gray-100 flex items-center justify-center">
                              <DocumentCheckIcon className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {analysis.fileName}
                          </p>
                          <p className="text-sm text-gray-500">
                            {analysis.fileType} • {new Date(analysis.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getVerdictBadge(analysis.verdict, analysis.confidence)}
                          <Link
                            to={`/analysis/${analysis.id}`}
                            className="inline-flex items-center p-1 border border-transparent rounded-full shadow-sm text-white bg-primary-600 hover:bg-primary-700"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </Link>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="mt-6 text-center">
              <DocumentCheckIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No analyses yet</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by uploading your first file for verification.
              </p>
              <div className="mt-6">
                <Link
                  to="/upload"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                >
                  <CloudArrowUpIcon className="-ml-1 mr-2 h-5 w-5" />
                  Upload File
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link
          to="/upload"
          className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-primary-500 rounded-lg shadow hover:shadow-md transition-shadow"
        >
          <div>
            <span className="rounded-lg inline-flex p-3 bg-primary-50 text-primary-700 ring-4 ring-white">
              <CloudArrowUpIcon className="h-6 w-6" />
            </span>
          </div>
          <div className="mt-8">
            <h3 className="text-lg font-medium text-gray-900">
              Upload New File
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              Upload images or videos to verify their authenticity using our AI-powered analysis.
            </p>
          </div>
          <span className="pointer-events-none absolute top-6 right-6 text-gray-300 group-hover:text-gray-400">
            <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20 4h1a1 1 0 00-1-1v1zm-1 12a1 1 0 102 0h-2zM8 3a1 1 0 000 2V3zM3.293 19.293a1 1 0 101.414 1.414l-1.414-1.414zM19 4v12h2V4h-2zm1-1H8v2h12V3zm-.707.293l-16 16 1.414 1.414 16-16-1.414-1.414z" />
            </svg>
          </span>
        </Link>

        <Link
          to="/analysis"
          className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-primary-500 rounded-lg shadow hover:shadow-md transition-shadow"
        >
          <div>
            <span className="rounded-lg inline-flex p-3 bg-green-50 text-green-700 ring-4 ring-white">
              <ChartBarIcon className="h-6 w-6" />
            </span>
          </div>
          <div className="mt-8">
            <h3 className="text-lg font-medium text-gray-900">
              View All Analyses
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              Browse and manage all your content verification analyses in one place.
            </p>
          </div>
          <span className="pointer-events-none absolute top-6 right-6 text-gray-300 group-hover:text-gray-400">
            <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20 4h1a1 1 0 00-1-1v1zm-1 12a1 1 0 102 0h-2zM8 3a1 1 0 000 2V3zM3.293 19.293a1 1 0 101.414 1.414l-1.414-1.414zM19 4v12h2V4h-2zm1-1H8v2h12V3zm-.707.293l-16 16 1.414 1.414 16-16-1.414-1.414z" />
            </svg>
          </span>
        </Link>
      </div>
    </div>
  )
}

export default Dashboard
