import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'TrustLens API',
      version: '1.0.0',
      description: 'AI-powered authenticity verification platform for e-commerce',
      contact: {
        name: 'TrustLens Support',
        email: 'support@trustlens.com',
        url: 'https://trustlens.com/support',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: process.env.API_BASE_URL || 'http://localhost:3000',
        description: 'Development server',
      },
      {
        url: 'https://api.trustlens.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key',
          description: 'API key for merchant/enterprise access',
        },
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token for authenticated users',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          required: ['error', 'message', 'code'],
          properties: {
            error: {
              type: 'string',
              description: 'Error type',
              example: 'Validation Error',
            },
            message: {
              type: 'string',
              description: 'Human-readable error message',
              example: 'The uploaded file is not a valid image format',
            },
            code: {
              type: 'string',
              description: 'Machine-readable error code',
              example: 'INVALID_FILE_FORMAT',
            },
            details: {
              type: 'object',
              description: 'Additional error details',
              additionalProperties: true,
            },
          },
        },
        UploadResponse: {
          type: 'object',
          required: ['upload_id', 'status', 'analysis_url'],
          properties: {
            upload_id: {
              type: 'string',
              description: 'Unique identifier for the upload',
              example: 'clh5x8k2p0000qh8v4g8v4g8v',
            },
            status: {
              type: 'string',
              enum: ['pending', 'processing', 'completed', 'failed'],
              description: 'Current status of the upload',
              example: 'pending',
            },
            analysis_url: {
              type: 'string',
              format: 'uri',
              description: 'URL to retrieve analysis results',
              example: 'https://api.trustlens.com/v1/analysis/clh5x8k2p0000qh8v4g8v4g8v',
            },
            estimated_completion: {
              type: 'string',
              format: 'date-time',
              description: 'Estimated completion time',
              example: '2024-08-12T12:25:00Z',
            },
          },
        },
        AnalysisResult: {
          type: 'object',
          required: ['upload_id', 'aggregated_score', 'verdict', 'evidence', 'analysis_version', 'completed_at'],
          properties: {
            upload_id: {
              type: 'string',
              description: 'Upload identifier',
              example: 'clh5x8k2p0000qh8v4g8v4g8v',
            },
            merchant_id: {
              type: 'string',
              description: 'Merchant identifier',
              example: 'shopify-merchant-123',
            },
            aggregated_score: {
              type: 'integer',
              minimum: 0,
              maximum: 100,
              description: 'Overall authenticity score (0-100)',
              example: 87,
            },
            verdict: {
              type: 'string',
              enum: ['safe', 'caution', 'suspect'],
              description: 'Final verdict based on score thresholds',
              example: 'safe',
            },
            evidence: {
              type: 'array',
              description: 'Array of evidence objects from different checks',
              items: {
                type: 'object',
                properties: {
                  source: {
                    type: 'string',
                    description: 'Evidence source',
                    example: 'c2pa',
                  },
                  result: {
                    type: 'object',
                    description: 'Source-specific results',
                    additionalProperties: true,
                  },
                  confidence: {
                    type: 'number',
                    minimum: 0,
                    maximum: 1,
                    description: 'Confidence score for this evidence',
                    example: 0.95,
                  },
                },
              },
            },
            report_pdf_url: {
              type: 'string',
              format: 'uri',
              description: 'URL to download detailed PDF report',
              example: 'https://s3.trustlens.com/reports/clh5x8k2p0000qh8v4g8v4g8v.pdf',
            },
            analysis_version: {
              type: 'string',
              description: 'Version of the analysis pipeline used',
              example: 'v1.0.0',
            },
            analysis_partial: {
              type: 'boolean',
              description: 'Whether analysis was completed with all checks',
              example: false,
            },
            processing_time_ms: {
              type: 'integer',
              description: 'Total processing time in milliseconds',
              example: 4250,
            },
            completed_at: {
              type: 'string',
              format: 'date-time',
              description: 'When analysis was completed',
              example: '2024-08-12T12:23:45Z',
            },
          },
        },
        AuthResponse: {
          type: 'object',
          required: ['access_token', 'token_type', 'expires_in'],
          properties: {
            access_token: {
              type: 'string',
              description: 'JWT access token',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            },
            token_type: {
              type: 'string',
              description: 'Token type',
              example: 'Bearer',
            },
            expires_in: {
              type: 'integer',
              description: 'Token expiration time in seconds',
              example: 3600,
            },
            refresh_token: {
              type: 'string',
              description: 'Refresh token for obtaining new access tokens',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            },
            user: {
              type: 'object',
              properties: {
                id: {
                  type: 'string',
                  example: 'clh5x8k2p0000qh8v4g8v4g8v',
                },
                email: {
                  type: 'string',
                  format: 'email',
                  example: 'user@example.com',
                },
                role: {
                  type: 'string',
                  enum: ['admin', 'merchant', 'reviewer', 'support'],
                  example: 'merchant',
                },
                organisation: {
                  type: 'object',
                  properties: {
                    id: {
                      type: 'string',
                      example: 'org-123',
                    },
                    name: {
                      type: 'string',
                      example: 'Test Fashion Store',
                    },
                    plan_id: {
                      type: 'string',
                      example: 'starter',
                    },
                  },
                },
              },
            },
          },
        },
        TrustBadge: {
          type: 'object',
          required: ['badge_type', 'score', 'verification_url'],
          properties: {
            badge_type: {
              type: 'string',
              enum: ['verified', 'caution', 'suspect', 'unverified'],
              description: 'Visual badge type to display',
              example: 'verified',
            },
            score: {
              type: 'integer',
              minimum: 0,
              maximum: 100,
              description: 'Authenticity score',
              example: 87,
            },
            verification_url: {
              type: 'string',
              format: 'uri',
              description: 'URL to verification details',
              example: 'https://verify.trustlens.com/clh5x8k2p0000qh8v4g8v4g8v',
            },
            last_verified: {
              type: 'string',
              format: 'date-time',
              description: 'When the item was last verified',
              example: '2024-08-12T12:23:45Z',
            },
            merchant_verified: {
              type: 'boolean',
              description: 'Whether the merchant is verified',
              example: true,
            },
          },
        },
      },
    },
    security: [
      {
        ApiKeyAuth: [],
      },
      {
        BearerAuth: [],
      },
    ],
  },
  apis: [
    './src/routes/*.ts',
    './src/controllers/*.ts',
  ],
};

const specs = swaggerJsdoc(options);
export default specs;
