const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const crypto = require('crypto');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176', 'https://trustlens.com'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.'
  }
});
app.use('/api/', limiter);

// API key validation middleware
const validateApiKey = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Missing or invalid authorization header',
      message: 'Please provide a valid API key in the Authorization header'
    });
  }

  const apiKey = authHeader.substring(7); // Remove 'Bearer ' prefix
  
  // Simple API key validation (in production, this would check against a database)
  const validApiKeys = [
    'tl_live_key_1234567890abcdef',
    'tl_test_key_abcdef1234567890',
    'tl_dev_key_dev123456789'
  ];

  if (!validApiKeys.includes(apiKey)) {
    return res.status(401).json({
      error: 'Invalid API key',
      message: 'The provided API key is not valid'
    });
  }

  req.apiKey = apiKey;
  next();
};

// File upload configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images and videos are allowed.'));
    }
  }
});

// In-memory storage for verification results (in production, use a database)
const verificationResults = new Map();

// Mock AI analysis function
function performAIAnalysis(fileInfo) {
  // Simulate AI analysis with random but realistic results
  const trustScore = Math.floor(Math.random() * 20) + 80; // 80-99
  const deepfakeProbability = Math.random() * 0.1; // 0-10%
  const c2paVerified = Math.random() > 0.3; // 70% chance of C2PA verification
  
  return {
    trust_score: trustScore,
    deepfake_probability: deepfakeProbability,
    c2pa_verified: c2paVerified,
    manipulation_detected: deepfakeProbability > 0.05,
    analysis_details: {
      resolution: '1920x1080',
      format: fileInfo.mimetype,
      size_kb: Math.floor(fileInfo.size / 1024),
      creation_date: new Date().toISOString(),
      metadata_intact: true,
      source_verification: c2paVerified ? 'Verified' : 'Unknown'
    },
    provenance_chain: c2paVerified ? [
      {
        step: 1,
        action: 'Created',
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        device: 'Canon EOS R5',
        location: 'New York, NY'
      },
      {
        step: 2,
        action: 'Edited',
        timestamp: new Date(Date.now() - 43200000).toISOString(),
        software: 'Adobe Photoshop',
        changes: 'Color correction, cropping'
      }
    ] : []
  };
}

// Routes

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Demo users database (in production, use a real database)
const demoUsers = [
  {
    id: 1,
    email: 'demo@trustlens.com',
    password: 'password123',
    firstName: 'Demo',
    lastName: 'User',
    name: 'Demo User',
    role: 'user',
    apiKey: 'tl_dev_key_dev123456789'
  },
  {
    id: 2,
    email: 'admin@trustlens.com', 
    password: 'admin123',
    firstName: 'Admin',
    lastName: 'User',
    name: 'Admin User',
    role: 'admin',
    apiKey: 'tl_live_key_1234567890abcdef'
  }
];

// Authentication routes
app.post('/api/v1/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({
      error: 'Missing credentials',
      message: 'Email and password are required'
    });
  }

  // Find user by email and password (in production, hash passwords!)
  const user = demoUsers.find(u => u.email === email && u.password === password);
  
  if (!user) {
    return res.status(401).json({
      error: 'Invalid credentials',
      message: 'Email or password is incorrect'
    });
  }

  // Create a simple token (in production, use JWT with proper signing)
  const token = `token_${user.id}_${Date.now()}`;
  
  res.json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      name: user.name,
      role: user.role,
      apiKey: user.apiKey
    },
    token: token
  });
});

app.post('/api/v1/auth/register', (req, res) => {
  const { email, password, name } = req.body;
  
  if (!email || !password || !name) {
    return res.status(400).json({
      error: 'Missing fields',
      message: 'Email, password, and name are required'
    });
  }

  // Check if user already exists
  const existingUser = demoUsers.find(u => u.email === email);
  if (existingUser) {
    return res.status(409).json({
      error: 'User exists',
      message: 'An account with this email already exists'
    });
  }

  // Create new user
  const newUser = {
    id: demoUsers.length + 1,
    email,
    password, // In production, hash this!
    name,
    role: 'user',
    apiKey: `tl_user_key_${Date.now()}`
  };
  
  demoUsers.push(newUser);
  
  res.status(201).json({
    success: true,
    user: {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
      apiKey: newUser.apiKey
    },
    message: 'Account created successfully'
  });
});

// API info
app.get('/api/v1', (req, res) => {
  res.json({
    name: 'TrustLens API',
    version: '1.0.0',
    description: 'Content verification and authenticity analysis API',
    endpoints: {
      login: 'POST /api/v1/auth/login',
      register: 'POST /api/v1/auth/register', 
      verify: 'POST /api/v1/verify',
      results: 'GET /api/v1/verify/:id',
      webhook_test: 'POST /api/v1/webhook-test'
    },
    documentation: 'https://trustlens.com/docs'
  });
});

// Content verification endpoint
app.post('/api/v1/verify', validateApiKey, upload.single('file'), async (req, res) => {
  try {
    const verificationId = 'ver_' + crypto.randomBytes(16).toString('hex');
    const timestamp = new Date().toISOString();

    let fileInfo = null;
    let contentUrl = null;

    // Handle file upload or URL
    if (req.file) {
      fileInfo = req.file;
      contentUrl = `http://localhost:${PORT}/uploads/${req.file.filename}`;
    } else if (req.body.url) {
      contentUrl = req.body.url;
      // In a real implementation, you'd download and analyze the file from the URL
      fileInfo = {
        mimetype: 'image/jpeg',
        size: 1024000,
        originalname: 'remote_image.jpg'
      };
    } else {
      return res.status(400).json({
        error: 'Missing content',
        message: 'Please provide either a file upload or a URL'
      });
    }

    // Create initial verification record
    const verification = {
      id: verificationId,
      status: 'processing',
      created_at: timestamp,
      estimated_completion: new Date(Date.now() + 5000).toISOString(), // 5 seconds
      content_url: contentUrl,
      content_type: req.body.type || 'image',
      webhook_url: req.body.webhook_url || null,
      api_key: req.apiKey
    };

    verificationResults.set(verificationId, verification);

    // Simulate async processing
    setTimeout(async () => {
      try {
        const analysis = performAIAnalysis(fileInfo);
        
        verification.status = 'completed';
        verification.completed_at = new Date().toISOString();
        verification.analysis = analysis;
        verification.report_url = `http://localhost:${PORT}/api/v1/reports/${verificationId}.pdf`;

        verificationResults.set(verificationId, verification);

        // Send webhook if provided
        if (verification.webhook_url) {
          try {
            const webhookPayload = {
              event: 'verification.completed',
              verification_id: verificationId,
              trust_score: analysis.trust_score,
              status: 'completed',
              timestamp: verification.completed_at
            };

            // In production, actually send the webhook
            console.log('Webhook would be sent to:', verification.webhook_url, webhookPayload);
          } catch (webhookError) {
            console.error('Webhook error:', webhookError);
          }
        }
      } catch (error) {
        verification.status = 'failed';
        verification.error = error.message;
        verification.completed_at = new Date().toISOString();
        verificationResults.set(verificationId, verification);
      }
    }, 2000); // 2 second processing time

    res.status(202).json({
      id: verificationId,
      status: 'processing',
      created_at: timestamp,
      estimated_completion: verification.estimated_completion
    });

  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'An error occurred while processing your request'
    });
  }
});

// Get verification results
app.get('/api/v1/verify/:id', validateApiKey, (req, res) => {
  const verificationId = req.params.id;
  const verification = verificationResults.get(verificationId);

  if (!verification) {
    return res.status(404).json({
      error: 'Verification not found',
      message: 'The specified verification ID does not exist'
    });
  }

  // Remove sensitive data
  const response = { ...verification };
  delete response.api_key;

  res.json(response);
});

// Get all verifications for an API key
app.get('/api/v1/verifications', validateApiKey, (req, res) => {
  const userVerifications = Array.from(verificationResults.values())
    .filter(v => v.api_key === req.apiKey)
    .map(v => {
      const cleaned = { ...v };
      delete cleaned.api_key;
      return cleaned;
    })
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  res.json({
    verifications: userVerifications,
    total: userVerifications.length
  });
});

// Webhook test endpoint
app.post('/api/v1/webhook-test', validateApiKey, (req, res) => {
  const testPayload = {
    event: 'verification.completed',
    verification_id: 'ver_test_webhook_123',
    trust_score: 95,
    status: 'completed',
    timestamp: new Date().toISOString()
  };

  res.json({
    message: 'Webhook test payload',
    payload: testPayload,
    note: 'This is what your webhook endpoint should expect to receive'
  });
});

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Generate mock PDF report
app.get('/api/v1/reports/:id', (req, res) => {
  const verificationId = req.params.id.replace('.pdf', '');
  const verification = verificationResults.get(verificationId);

  if (!verification) {
    return res.status(404).json({ error: 'Report not found' });
  }

  // In production, generate actual PDF
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${verificationId}.pdf"`);
  res.send(`Mock PDF Report for ${verificationId}\nTrust Score: ${verification.analysis?.trust_score || 'N/A'}`);
});

// Plugin integration endpoints

// Shopify webhook endpoint
app.post('/api/v1/shopify/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  // Verify Shopify webhook signature in production
  const data = JSON.parse(req.body);
  
  console.log('Shopify webhook received:', data.topic);
  
  // Handle different webhook topics
  switch (data.topic) {
    case 'products/create':
    case 'products/update':
      // Auto-verify product images
      console.log('Auto-verifying product images for:', data.id);
      break;
  }

  res.status(200).send('OK');
});

// BigCommerce webhook endpoint
app.post('/api/v1/bigcommerce/webhook', (req, res) => {
  const { scope, data } = req.body;
  
  console.log('BigCommerce webhook received:', scope);
  
  // Handle different webhook scopes
  switch (scope) {
    case 'store/product/created':
    case 'store/product/updated':
      // Auto-verify product images
      console.log('Auto-verifying product images for:', data.id);
      break;
  }

  res.status(200).send('OK');
});

// Error handling
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'File too large',
        message: 'File size must be less than 10MB'
      });
    }
  }
  
  console.error('Unhandled error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: 'An unexpected error occurred'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: 'The requested endpoint does not exist'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`TrustLens API server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`API Info: http://localhost:${PORT}/api/v1`);
});

module.exports = app;
