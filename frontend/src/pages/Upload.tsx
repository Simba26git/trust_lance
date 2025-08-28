import React, { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { useMutation, useQueryClient } from 'react-query'
import { useNavigate } from 'react-router-dom'
import { apiClient } from '@/lib/api'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import toast from 'react-hot-toast'
import {
  CloudArrowUpIcon,
  PhotoIcon,
  VideoCameraIcon,
  DocumentIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'

interface UploadedFile {
  file: File
  preview: string
  type: 'image' | 'video' | 'document'
}

const Upload: React.FC = () => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // Upload mutation
  const uploadMutation = useMutation(
    async (files: File[]) => {
      const uploadPromises = files.map(async (file) => {
        const formData = new FormData()
        formData.append('file', file)
        
        const response = await apiClient.uploads.create(formData)
        return response.data
      })
      
      return Promise.all(uploadPromises)
    },
    {
      onSuccess: (results) => {
        toast.success(`Successfully uploaded ${results.length} file(s)`)
        queryClient.invalidateQueries('dashboard-stats')
        queryClient.invalidateQueries('recent-analyses')
        
        // Navigate to first analysis if single file
        if (results.length === 1) {
          navigate(`/analysis/${results[0].id}`)
        } else {
          navigate('/analysis')
        }
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Upload failed')
      },
      onSettled: () => {
        setIsUploading(false)
      },
    }
  )

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    // Handle rejected files
    rejectedFiles.forEach((file) => {
      file.errors.forEach((err: any) => {
        if (err.code === 'file-too-large') {
          toast.error(`File ${file.file.name} is too large. Maximum size is 50MB.`)
        } else if (err.code === 'file-invalid-type') {
          toast.error(`File ${file.file.name} has an invalid format.`)
        } else {
          toast.error(`Error with file ${file.file.name}: ${err.message}`)
        }
      })
    })

    // Process accepted files
    const newFiles = acceptedFiles.map((file) => {
      const type = file.type.startsWith('image/') 
        ? 'image' 
        : file.type.startsWith('video/') 
        ? 'video' 
        : 'document'
      
      return {
        file,
        preview: type === 'image' ? URL.createObjectURL(file) : '',
        type: type as 'image' | 'video' | 'document',
      }
    })

    setUploadedFiles((prev) => [...prev, ...newFiles])
  }, [])

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp', '.tiff'],
      'video/*': ['.mp4', '.mov', '.avi', '.webm', '.mkv'],
    },
    maxSize: 50 * 1024 * 1024, // 50MB
    multiple: true,
  })

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => {
      const newFiles = [...prev]
      // Revoke object URL to prevent memory leaks
      if (newFiles[index].preview) {
        URL.revokeObjectURL(newFiles[index].preview)
      }
      newFiles.splice(index, 1)
      return newFiles
    })
  }

  const handleUpload = () => {
    if (uploadedFiles.length === 0) {
      toast.error('Please select files to upload')
      return
    }

    setIsUploading(true)
    uploadMutation.mutate(uploadedFiles.map(f => f.file))
  }

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <PhotoIcon className="h-8 w-8 text-blue-500" />
      case 'video':
        return <VideoCameraIcon className="h-8 w-8 text-purple-500" />
      default:
        return <DocumentIcon className="h-8 w-8 text-gray-500" />
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Upload Files</h1>
        <p className="mt-1 text-sm text-gray-600">
          Upload images and videos for AI-powered authenticity verification.
        </p>
      </div>

      {/* Upload Instructions */}
      <div className="bg-blue-50 p-4 rounded-md">
        <div className="flex">
          <div className="flex-shrink-0">
            <CheckCircleIcon className="h-5 w-5 text-blue-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              Supported Formats
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>
                <strong>Images:</strong> PNG, JPG, JPEG, GIF, BMP, WebP, TIFF (max 50MB)
              </p>
              <p>
                <strong>Videos:</strong> MP4, MOV, AVI, WebM, MKV (max 50MB)
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Drop Zone */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div
            {...getRootProps()}
            className={`
              upload-zone relative border-2 border-dashed rounded-lg p-12 text-center hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500
              ${isDragActive ? 'border-primary-500 bg-primary-50' : 'border-gray-300'}
              ${isDragReject ? 'border-red-500 bg-red-50' : ''}
            `}
          >
            <input {...getInputProps()} />
            <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              {isDragActive
                ? isDragReject
                  ? 'Some files will be rejected'
                  : 'Drop files here'
                : 'Upload files'
              }
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {isDragActive
                ? 'Release to upload'
                : 'Drag and drop files here, or click to select'
              }
            </p>
            <p className="mt-2 text-xs text-gray-400">
              Maximum file size: 50MB
            </p>
          </div>
        </div>
      </div>

      {/* File List */}
      {uploadedFiles.length > 0 && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Selected Files ({uploadedFiles.length})
            </h3>
            <div className="space-y-3">
              {uploadedFiles.map((uploadedFile, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      {uploadedFile.type === 'image' && uploadedFile.preview ? (
                        <img
                          src={uploadedFile.preview}
                          alt={uploadedFile.file.name}
                          className="h-10 w-10 rounded object-cover"
                        />
                      ) : (
                        getFileIcon(uploadedFile.type)
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {uploadedFile.file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(uploadedFile.file.size)} • {uploadedFile.type}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFile(index)}
                    disabled={isUploading}
                    className="text-red-400 hover:text-red-600 disabled:opacity-50"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Analysis Options */}
      {uploadedFiles.length > 0 && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Analysis Options
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Analysis Depth
                </label>
                <select className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500">
                  <option value="standard">Standard Analysis (Recommended)</option>
                  <option value="quick">Quick Scan</option>
                  <option value="deep">Deep Analysis</option>
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  Standard analysis provides the best balance of speed and accuracy
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center">
                  <input
                    id="c2pa-verification"
                    type="checkbox"
                    defaultChecked
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="c2pa-verification" className="ml-3 text-sm text-gray-700">
                    C2PA Content Provenance Verification
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    id="deepfake-detection"
                    type="checkbox"
                    defaultChecked
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="deepfake-detection" className="ml-3 text-sm text-gray-700">
                    AI Deepfake Detection
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    id="reverse-search"
                    type="checkbox"
                    defaultChecked
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="reverse-search" className="ml-3 text-sm text-gray-700">
                    Reverse Image Search
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    id="metadata-analysis"
                    type="checkbox"
                    defaultChecked
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="metadata-analysis" className="ml-3 text-sm text-gray-700">
                    Advanced Metadata Analysis
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Button */}
      {uploadedFiles.length > 0 && (
        <div className="flex justify-end">
          <button
            onClick={handleUpload}
            disabled={isUploading}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? (
              <>
                <LoadingSpinner size="sm" color="white" className="mr-3" />
                Uploading & Analyzing...
              </>
            ) : (
              <>
                <CloudArrowUpIcon className="w-5 h-5 mr-2" />
                Start Analysis ({uploadedFiles.length} file{uploadedFiles.length !== 1 ? 's' : ''})
              </>
            )}
          </button>
        </div>
      )}

      {/* Tips */}
      <div className="bg-gray-50 p-4 rounded-md">
        <div className="flex">
          <div className="flex-shrink-0">
            <ExclamationTriangleIcon className="h-5 w-5 text-gray-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-gray-800">
              Tips for Best Results
            </h3>
            <div className="mt-2 text-sm text-gray-600">
              <ul className="list-disc list-inside space-y-1">
                <li>Upload original, unmodified files when possible</li>
                <li>Higher resolution images provide more accurate analysis</li>
                <li>Ensure good lighting and focus for video content</li>
                <li>Multiple angles of the same subject can improve detection</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Upload
