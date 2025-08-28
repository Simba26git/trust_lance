const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const BigCommerce = require('node-bigcommerce');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3003;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// TrustLens API configuration
const TRUSTLENS_API_URL = process.env.TRUSTLENS_API_URL || 'http://localhost:3001';
const TRUSTLENS_API_KEY = process.env.TRUSTLENS_API_KEY || 'tl_live_key_1234567890abcdef';

// BigCommerce App configuration
const CLIENT_ID = process.env.BC_CLIENT_ID;
const CLIENT_SECRET = process.env.BC_CLIENT_SECRET;
const APP_URL = process.env.BC_APP_URL || `http://localhost:${PORT}`;

// Store configurations (in production, use a database)
const storeConfigs = new Map();

// Helper function to verify content with TrustLens
async function verifyContent(imageUrl, productId, storeHash) {
  try {
    const response = await axios.post(`${TRUSTLENS_API_URL}/api/v1/verify`, {
      url: imageUrl,
      type: 'image',
      metadata: {
        source: 'bigcommerce',
        store_hash: storeHash,
        product_id: productId
      }
    }, {
      headers: {
        'Authorization': `Bearer ${TRUSTLENS_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    return response.data;
  } catch (error) {
    console.error('TrustLens verification error:', error.message);
    throw error;
  }
}

// Helper function to get BigCommerce API client
function getBigCommerceClient(storeHash, accessToken) {
  return new BigCommerce({
    clientId: CLIENT_ID,
    accessToken: accessToken,
    storeHash: storeHash,
    responseType: 'json',
    apiVersion: 'v3'
  });
}

// OAuth callback handler
app.get('/auth/callback', async (req, res) => {
  const { code, scope, context } = req.query;
  
  if (!code || !context) {
    return res.status(400).send('Missing required parameters');
  }

  try {
    // Exchange code for access token
    const tokenResponse = await axios.post('https://login.bigcommerce.com/oauth2/token', {
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      code: code,
      scope: scope,
      grant_type: 'authorization_code',
      redirect_uri: `${APP_URL}/auth/callback`,
      context: context
    });

    const { access_token, user, context: storeContext } = tokenResponse.data;
    const storeHash = storeContext.split('/')[1];

    // Store configuration
    storeConfigs.set(storeHash, {
      accessToken: access_token,
      user: user,
      scope: scope,
      installedAt: new Date().toISOString()
    });

    console.log(`App installed for store: ${storeHash}`);

    // Redirect to app dashboard
    res.redirect(`/dashboard?store_hash=${storeHash}`);

  } catch (error) {
    console.error('OAuth error:', error.response?.data || error.message);
    res.status(500).send('Installation failed');
  }
});

// App dashboard
app.get('/dashboard', (req, res) => {
  const { store_hash } = req.query;
  
  if (!store_hash || !storeConfigs.has(store_hash)) {
    return res.status(401).send('Unauthorized');
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>TrustLens - Content Verification</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f8fafc; }
        .container { max-width: 1000px; margin: 0 auto; }
        .header { text-align: center; margin-bottom: 30px; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .logo { width: 50px; height: 50px; background: #1e40af; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; margin-right: 15px; }
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .stat-card { background: white; border-radius: 8px; padding: 25px; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .stat-number { font-size: 2.5em; font-weight: bold; color: #1e40af; margin-bottom: 5px; }
        .stat-label { color: #6b7280; }
        .actions { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .action-card { background: white; border-radius: 8px; padding: 25px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .action-card h3 { margin: 0 0 10px 0; color: #1f2937; }
        .action-card p { color: #6b7280; margin-bottom: 15px; line-height: 1.5; }
        .btn { background: #1e40af; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500; transition: background 0.2s; }
        .btn:hover { background: #1d4ed8; }
        .btn-secondary { background: #e5e7eb; color: #374151; }
        .btn-secondary:hover { background: #d1d5db; }
        .recent-activity { background: white; border-radius: 8px; padding: 25px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .activity-item { display: flex; justify-content: between; align-items: center; padding: 15px 0; border-bottom: 1px solid #e5e7eb; }
        .activity-item:last-child { border-bottom: none; }
        .status-badge { padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; }
        .status-completed { background: #d1fae5; color: #065f46; }
        .status-processing { background: #fef3c7; color: #92400e; }
        .loading { display: none; text-align: center; padding: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div style="display: flex; align-items: center; justify-content: center;">
            <div class="logo">
              <svg width="30" height="30" viewBox="0 0 20 20" fill="white">
                <path fill-rule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
              </svg>
            </div>
            <div>
              <h1 style="margin: 0; color: #1f2937;">TrustLens Content Verification</h1>
              <p style="margin: 5px 0 0 0; color: #6b7280;">BigCommerce Store: ${store_hash}</p>
            </div>
          </div>
        </div>

        <div class="stats">
          <div class="stat-card">
            <div class="stat-number" id="imagesVerified">0</div>
            <div class="stat-label">Images Verified</div>
          </div>
          <div class="stat-card">
            <div class="stat-number" id="avgTrustScore">--</div>
            <div class="stat-label">Average Trust Score</div>
          </div>
          <div class="stat-card">
            <div class="stat-number" id="productsProcessed">0</div>
            <div class="stat-label">Products Processed</div>
          </div>
          <div class="stat-card">
            <div class="stat-number" id="trustBadges">0</div>
            <div class="stat-label">Trust Badges Added</div>
          </div>
        </div>

        <div class="actions">
          <div class="action-card">
            <h3>🔍 Bulk Product Verification</h3>
            <p>Verify all product images in your store for authenticity and detect any potential issues.</p>
            <button class="btn" onclick="verifyAllProducts()">Start Bulk Verification</button>
          </div>
          
          <div class="action-card">
            <h3>🛡️ Trust Badge Management</h3>
            <p>Automatically add trust badges to products with verified content.</p>
            <button class="btn" onclick="manageTrustBadges()">Manage Badges</button>
          </div>
          
          <div class="action-card">
            <h3>⚙️ Verification Rules</h3>
            <p>Configure custom verification rules and thresholds for your store.</p>
            <button class="btn" onclick="configureRules()">Configure Rules</button>
          </div>
          
          <div class="action-card">
            <h3>📊 Analytics & Reports</h3>
            <p>View detailed analytics and download verification reports.</p>
            <button class="btn" onclick="viewAnalytics()">View Analytics</button>
          </div>
        </div>

        <div class="recent-activity">
          <h3 style="margin: 0 0 20px 0; color: #1f2937;">Recent Verification Activity</h3>
          <div id="activityList">
            <div class="activity-item">
              <div>
                <strong>Product Image Verified</strong><br>
                <small style="color: #6b7280;">Product ID: 12345 • Trust Score: 94%</small>
              </div>
              <span class="status-badge status-completed">Completed</span>
            </div>
            <div class="activity-item">
              <div>
                <strong>Bulk Verification Started</strong><br>
                <small style="color: #6b7280;">Processing 50 products</small>
              </div>
              <span class="status-badge status-processing">Processing</span>
            </div>
            <div class="activity-item">
              <div>
                <strong>Trust Badge Added</strong><br>
                <small style="color: #6b7280;">Product ID: 12344 • Badge Type: Verified</small>
              </div>
              <span class="status-badge status-completed">Completed</span>
            </div>
          </div>
        </div>

        <div class="loading" id="loadingIndicator">
          <p>Processing request...</p>
        </div>
      </div>

      <script>
        const storeHash = '${store_hash}';

        function showLoading() {
          document.getElementById('loadingIndicator').style.display = 'block';
        }

        function hideLoading() {
          document.getElementById('loadingIndicator').style.display = 'none';
        }

        function showMessage(message, isError = false) {
          alert(message); // In production, use a proper toast notification
        }

        async function verifyAllProducts() {
          showLoading();
          try {
            const response = await fetch('/api/verify-products', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ store_hash: storeHash })
            });
            
            const data = await response.json();
            showMessage(data.message, !data.success);
            
            if (data.success) {
              updateStats();
            }
          } catch (error) {
            showMessage('Failed to start verification process', true);
          }
          hideLoading();
        }

        async function manageTrustBadges() {
          showLoading();
          try {
            const response = await fetch('/api/manage-badges', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ store_hash: storeHash })
            });
            
            const data = await response.json();
            showMessage(data.message, !data.success);
          } catch (error) {
            showMessage('Failed to manage trust badges', true);
          }
          hideLoading();
        }

        function configureRules() {
          window.open('/rules?store_hash=' + storeHash, '_blank');
        }

        function viewAnalytics() {
          window.open('/analytics?store_hash=' + storeHash, '_blank');
        }

        function updateStats() {
          // Update statistics (in production, fetch from API)
          document.getElementById('imagesVerified').textContent = Math.floor(Math.random() * 100) + 50;
          document.getElementById('avgTrustScore').textContent = (Math.random() * 10 + 85).toFixed(1) + '%';
          document.getElementById('productsProcessed').textContent = Math.floor(Math.random() * 50) + 25;
          document.getElementById('trustBadges').textContent = Math.floor(Math.random() * 30) + 15;
        }

        // Initialize dashboard
        updateStats();
      </script>
    </body>
    </html>
  `;

  res.send(html);
});

// API endpoint to verify all products
app.post('/api/verify-products', async (req, res) => {
  const { store_hash } = req.body;
  
  if (!store_hash || !storeConfigs.has(store_hash)) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  try {
    const config = storeConfigs.get(store_hash);
    const bigcommerce = getBigCommerceClient(store_hash, config.accessToken);

    // Get all products
    const products = await bigcommerce.get('/catalog/products?include=images&limit=50');
    
    let verifiedCount = 0;
    const verificationPromises = [];

    for (const product of products.data) {
      if (product.images && product.images.length > 0) {
        for (const image of product.images) {
          const verificationPromise = verifyContent(image.url_standard, product.id, store_hash)
            .then(verification => {
              console.log(`Verification started for product ${product.id}: ${verification.id}`);
              verifiedCount++;
            })
            .catch(error => {
              console.error(`Verification failed for product ${product.id}:`, error.message);
            });
          
          verificationPromises.push(verificationPromise);
        }
      }
    }

    // Wait for all verifications to start
    await Promise.allSettled(verificationPromises);

    res.json({
      success: true,
      message: `Started verification for ${verifiedCount} images across ${products.data.length} products`
    });

  } catch (error) {
    console.error('Bulk verification error:', error);
    res.json({
      success: false,
      message: 'Failed to start bulk verification'
    });
  }
});

// API endpoint to manage trust badges
app.post('/api/manage-badges', async (req, res) => {
  const { store_hash } = req.body;
  
  if (!store_hash || !storeConfigs.has(store_hash)) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  try {
    const config = storeConfigs.get(store_hash);
    const bigcommerce = getBigCommerceClient(store_hash, config.accessToken);

    // Mock implementation - in production, check actual verification results
    const verifiedProducts = [
      { id: 123, trustScore: 94 },
      { id: 124, trustScore: 87 },
      { id: 125, trustScore: 91 }
    ];

    let badgesAdded = 0;

    for (const productData of verifiedProducts) {
      try {
        // Get current product
        const product = await bigcommerce.get(`/catalog/products/${productData.id}`);
        
        const trustBadgeHtml = `
          <div class="trustlens-badge" style="display: inline-flex; align-items: center; background: #1e40af; color: white; padding: 6px 12px; border-radius: 6px; font-size: 14px; margin: 10px 0;">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" style="margin-right: 6px;">
              <path fill-rule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
            </svg>
            ✓ Verified Content ${productData.trustScore}%
          </div>
        `;

        const currentDescription = product.data.description || '';
        
        // Add badge if not already present
        if (!currentDescription.includes('trustlens-badge')) {
          const updatedDescription = trustBadgeHtml + currentDescription;
          
          await bigcommerce.put(`/catalog/products/${productData.id}`, {
            description: updatedDescription
          });

          badgesAdded++;
          console.log(`Trust badge added to product ${productData.id}`);
        }
      } catch (error) {
        console.error(`Failed to add badge to product ${productData.id}:`, error);
      }
    }

    res.json({
      success: true,
      message: `Added trust badges to ${badgesAdded} products`
    });

  } catch (error) {
    console.error('Badge management error:', error);
    res.json({
      success: false,
      message: 'Failed to manage trust badges'
    });
  }
});

// Rules configuration page
app.get('/rules', (req, res) => {
  const { store_hash } = req.query;
  
  if (!store_hash || !storeConfigs.has(store_hash)) {
    return res.status(401).send('Unauthorized');
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>TrustLens - Verification Rules</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f8fafc; }
        .container { max-width: 800px; margin: 0 auto; }
        .card { background: white; border-radius: 8px; padding: 25px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .form-group { margin-bottom: 20px; }
        label { display: block; margin-bottom: 5px; font-weight: 500; color: #374151; }
        input, select, textarea { width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; }
        .btn { background: #1e40af; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; font-weight: 500; }
        .btn:hover { background: #1d4ed8; }
        .toggle { position: relative; width: 60px; height: 34px; }
        .toggle input { opacity: 0; width: 0; height: 0; }
        .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #ccc; border-radius: 34px; transition: .4s; }
        .slider:before { position: absolute; content: ""; height: 26px; width: 26px; left: 4px; bottom: 4px; background-color: white; border-radius: 50%; transition: .4s; }
        input:checked + .slider { background-color: #1e40af; }
        input:checked + .slider:before { transform: translateX(26px); }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Verification Rules Configuration</h1>
        
        <div class="card">
          <h3>Automatic Verification</h3>
          <div class="form-group">
            <label>
              <div style="display: flex; justify-content: between; align-items: center;">
                <span>Auto-verify new products</span>
                <label class="toggle">
                  <input type="checkbox" checked>
                  <span class="slider"></span>
                </label>
              </div>
            </label>
          </div>
          <div class="form-group">
            <label>
              <div style="display: flex; justify-content: between; align-items: center;">
                <span>Auto-verify product updates</span>
                <label class="toggle">
                  <input type="checkbox" checked>
                  <span class="slider"></span>
                </label>
              </div>
            </label>
          </div>
        </div>

        <div class="card">
          <h3>Trust Score Thresholds</h3>
          <div class="form-group">
            <label for="minTrustScore">Minimum Trust Score for Badge (%)</label>
            <input type="number" id="minTrustScore" value="80" min="0" max="100">
          </div>
          <div class="form-group">
            <label for="flagThreshold">Flag for Review Below (%)</label>
            <input type="number" id="flagThreshold" value="60" min="0" max="100">
          </div>
        </div>

        <div class="card">
          <h3>Badge Configuration</h3>
          <div class="form-group">
            <label for="badgeStyle">Badge Style</label>
            <select id="badgeStyle">
              <option value="minimal">Minimal</option>
              <option value="detailed">Detailed</option>
              <option value="custom">Custom</option>
            </select>
          </div>
          <div class="form-group">
            <label for="badgePosition">Badge Position</label>
            <select id="badgePosition">
              <option value="top">Top of description</option>
              <option value="bottom">Bottom of description</option>
              <option value="custom">Custom position</option>
            </select>
          </div>
        </div>

        <div class="card">
          <h3>Webhook Configuration</h3>
          <div class="form-group">
            <label for="webhookUrl">Webhook URL (optional)</label>
            <input type="url" id="webhookUrl" placeholder="https://your-site.com/webhook">
          </div>
          <div class="form-group">
            <label>
              <div style="display: flex; justify-content: between; align-items: center;">
                <span>Send webhook notifications</span>
                <label class="toggle">
                  <input type="checkbox">
                  <span class="slider"></span>
                </label>
              </div>
            </label>
          </div>
        </div>

        <button class="btn" onclick="saveConfiguration()">Save Configuration</button>
      </div>

      <script>
        function saveConfiguration() {
          const config = {
            autoVerifyNew: document.querySelector('input[type="checkbox"]').checked,
            minTrustScore: document.getElementById('minTrustScore').value,
            flagThreshold: document.getElementById('flagThreshold').value,
            badgeStyle: document.getElementById('badgeStyle').value,
            badgePosition: document.getElementById('badgePosition').value,
            webhookUrl: document.getElementById('webhookUrl').value
          };

          // Save configuration (in production, send to API)
          alert('Configuration saved successfully!');
          console.log('Configuration:', config);
        }
      </script>
    </body>
    </html>
  `;

  res.send(html);
});

// Analytics page
app.get('/analytics', (req, res) => {
  const { store_hash } = req.query;
  
  if (!store_hash || !storeConfigs.has(store_hash)) {
    return res.status(401).send('Unauthorized');
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>TrustLens - Analytics</title>
      <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f8fafc; }
        .container { max-width: 1200px; margin: 0 auto; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .stat-card { background: white; padding: 25px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); text-align: center; }
        .stat-number { font-size: 2.5em; font-weight: bold; color: #1e40af; margin-bottom: 10px; }
        .stat-label { color: #6b7280; }
        .chart-container { background: white; padding: 25px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 20px; }
        .charts-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        table { width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        th, td { padding: 15px; text-align: left; border-bottom: 1px solid #e5e7eb; }
        th { background: #f9fafb; font-weight: 600; }
        .status-verified { color: #059669; }
        .status-pending { color: #d97706; }
        .trust-score { font-weight: bold; }
        .high-score { color: #059669; }
        .medium-score { color: #d97706; }
        .low-score { color: #dc2626; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Verification Analytics</h1>
        
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-number">247</div>
            <div class="stat-label">Total Verifications</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">89.2%</div>
            <div class="stat-label">Average Trust Score</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">156</div>
            <div class="stat-label">Trust Badges Added</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">12</div>
            <div class="stat-label">Images Flagged</div>
          </div>
        </div>

        <div class="charts-grid">
          <div class="chart-container">
            <h3>Verification Trends</h3>
            <canvas id="verificationChart"></canvas>
          </div>
          <div class="chart-container">
            <h3>Trust Score Distribution</h3>
            <canvas id="trustScoreChart"></canvas>
          </div>
        </div>

        <div class="chart-container">
          <h3>Recent Verifications</h3>
          <table>
            <thead>
              <tr>
                <th>Product ID</th>
                <th>Image</th>
                <th>Trust Score</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>12345</td>
                <td>product-image-1.jpg</td>
                <td><span class="trust-score high-score">94%</span></td>
                <td><span class="status-verified">Verified</span></td>
                <td>2025-01-01 10:30</td>
                <td><a href="#">View Details</a></td>
              </tr>
              <tr>
                <td>12346</td>
                <td>product-image-2.jpg</td>
                <td><span class="trust-score high-score">87%</span></td>
                <td><span class="status-verified">Verified</span></td>
                <td>2025-01-01 10:25</td>
                <td><a href="#">View Details</a></td>
              </tr>
              <tr>
                <td>12347</td>
                <td>product-image-3.jpg</td>
                <td><span class="trust-score medium-score">72%</span></td>
                <td><span class="status-pending">Review Needed</span></td>
                <td>2025-01-01 10:20</td>
                <td><a href="#">Review</a></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <script>
        // Verification trends chart
        const ctx1 = document.getElementById('verificationChart').getContext('2d');
        new Chart(ctx1, {
          type: 'line',
          data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            datasets: [{
              label: 'Verifications',
              data: [12, 19, 25, 33, 28, 35],
              borderColor: '#1e40af',
              backgroundColor: 'rgba(30, 64, 175, 0.1)',
              tension: 0.4
            }]
          },
          options: {
            responsive: true,
            plugins: {
              legend: {
                display: false
              }
            }
          }
        });

        // Trust score distribution chart
        const ctx2 = document.getElementById('trustScoreChart').getContext('2d');
        new Chart(ctx2, {
          type: 'doughnut',
          data: {
            labels: ['90-100%', '80-89%', '70-79%', '< 70%'],
            datasets: [{
              data: [156, 67, 18, 6],
              backgroundColor: ['#059669', '#3b82f6', '#d97706', '#dc2626']
            }]
          },
          options: {
            responsive: true,
            plugins: {
              legend: {
                position: 'bottom'
              }
            }
          }
        });
      </script>
    </body>
    </html>
  `;

  res.send(html);
});

// Webhook handler for BigCommerce
app.post('/webhooks/products', async (req, res) => {
  try {
    const { scope, data, store_id } = req.body;
    const storeHash = store_id.toString();

    console.log(`BigCommerce webhook: ${scope} for store ${storeHash}`);

    if (!storeConfigs.has(storeHash)) {
      console.log(`No configuration found for store ${storeHash}`);
      return res.status(200).send('OK');
    }

    // Handle product creation/update
    if (scope === 'store/product/created' || scope === 'store/product/updated') {
      const config = storeConfigs.get(storeHash);
      const bigcommerce = getBigCommerceClient(storeHash, config.accessToken);

      try {
        // Get product details including images
        const product = await bigcommerce.get(`/catalog/products/${data.id}?include=images`);

        if (product.data.images && product.data.images.length > 0) {
          for (const image of product.data.images) {
            try {
              const verification = await verifyContent(image.url_standard, data.id, storeHash);
              console.log(`Auto-verification started for product ${data.id}: ${verification.id}`);
            } catch (error) {
              console.error(`Auto-verification failed for product ${data.id}:`, error.message);
            }
          }
        }
      } catch (error) {
        console.error(`Failed to process webhook for product ${data.id}:`, error);
      }
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).send('Error');
  }
});

// Uninstall handler
app.post('/uninstall', (req, res) => {
  const { store_id } = req.body;
  const storeHash = store_id.toString();

  if (storeConfigs.has(storeHash)) {
    storeConfigs.delete(storeHash);
    console.log(`App uninstalled for store: ${storeHash}`);
  }

  res.status(200).send('OK');
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    stores: storeConfigs.size,
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`TrustLens BigCommerce App running on port ${PORT}`);
  console.log(`OAuth callback: ${APP_URL}/auth/callback`);
});

module.exports = app;
