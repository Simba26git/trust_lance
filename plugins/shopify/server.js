const express = require('express');
const axios = require('axios');
const { shopifyApi, ApiVersion } = require('@shopify/shopify-api');
const { shopifyApp } = require('@shopify/shopify-app-express');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3002;

// Shopify API configuration
const shopify = shopifyApi({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET,
  scopes: ['read_products', 'write_products', 'read_content', 'write_content'],
  hostName: process.env.SHOPIFY_APP_URL,
  apiVersion: ApiVersion.October23,
  isEmbeddedApp: true,
});

// TrustLens API configuration
const TRUSTLENS_API_URL = process.env.TRUSTLENS_API_URL || 'http://localhost:3001';
const TRUSTLENS_API_KEY = process.env.TRUSTLENS_API_KEY || 'tl_live_key_1234567890abcdef';

// Shopify App setup
const shopifyAppMiddleware = shopifyApp({
  api: shopify,
  auth: {
    path: '/auth',
    callbackPath: '/auth/callback',
  },
  webhooks: {
    path: '/webhooks',
  },
});

app.use(shopifyAppMiddleware);

// Helper function to verify content with TrustLens
async function verifyContent(imageUrl, productId) {
  try {
    const response = await axios.post(`${TRUSTLENS_API_URL}/api/v1/verify`, {
      url: imageUrl,
      type: 'image',
      metadata: {
        source: 'shopify',
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

// Helper function to get verification results
async function getVerificationResults(verificationId) {
  try {
    const response = await axios.get(`${TRUSTLENS_API_URL}/api/v1/verify/${verificationId}`, {
      headers: {
        'Authorization': `Bearer ${TRUSTLENS_API_KEY}`
      }
    });

    return response.data;
  } catch (error) {
    console.error('Get verification results error:', error.message);
    throw error;
  }
}

// Helper function to add trust badge to product
async function addTrustBadge(session, productId, trustScore) {
  try {
    const client = new shopify.clients.Graphql({ session });
    
    const badgeHtml = `
      <div class="trustlens-badge" style="display: inline-flex; align-items: center; background: #1e40af; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; margin: 8px 0;">
        <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" style="margin-right: 4px;">
          <path fill-rule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
        </svg>
        Verified Content ${trustScore}%
      </div>
    `;

    const mutation = `
      mutation productUpdate($input: ProductInput!) {
        productUpdate(input: $input) {
          product {
            id
            descriptionHtml
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    // Get current product description
    const productQuery = `
      query getProduct($id: ID!) {
        product(id: $id) {
          id
          descriptionHtml
        }
      }
    `;

    const productResponse = await client.query({
      data: {
        query: productQuery,
        variables: {
          id: `gid://shopify/Product/${productId}`
        }
      }
    });

    const currentDescription = productResponse.body.data.product.descriptionHtml || '';
    
    // Add badge if not already present
    if (!currentDescription.includes('trustlens-badge')) {
      const updatedDescription = badgeHtml + currentDescription;

      await client.query({
        data: {
          query: mutation,
          variables: {
            input: {
              id: `gid://shopify/Product/${productId}`,
              descriptionHtml: updatedDescription
            }
          }
        }
      });

      console.log(`Trust badge added to product ${productId}`);
    }
  } catch (error) {
    console.error('Error adding trust badge:', error);
  }
}

// Main app dashboard
app.get('/', async (req, res) => {
  const session = res.locals.shopify.session;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>TrustLens - Content Verification</title>
      <script src="https://unpkg.com/@shopify/app-bridge@3"></script>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; }
        .container { max-width: 800px; margin: 0 auto; }
        .header { text-align: center; margin-bottom: 30px; }
        .logo { width: 40px; height: 40px; background: #1e40af; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; margin-right: 10px; }
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .stat-card { background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; text-align: center; }
        .stat-number { font-size: 2em; font-weight: bold; color: #1e40af; }
        .stat-label { color: #6b7280; margin-top: 5px; }
        .actions { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; }
        .action-card { background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; }
        .btn { background: #1e40af; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; width: 100%; margin-top: 10px; }
        .btn:hover { background: #1d4ed8; }
        .success { color: #059669; }
        .warning { color: #d97706; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div style="display: flex; align-items: center; justify-content: center;">
            <div class="logo">
              <svg width="24" height="24" viewBox="0 0 20 20" fill="white">
                <path fill-rule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
              </svg>
            </div>
            <h1>TrustLens Content Verification</h1>
          </div>
          <p>Verify the authenticity of your product images and build customer trust</p>
        </div>

        <div class="stats">
          <div class="stat-card">
            <div class="stat-number">0</div>
            <div class="stat-label">Images Verified</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">--</div>
            <div class="stat-label">Average Trust Score</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">0</div>
            <div class="stat-label">Trust Badges Added</div>
          </div>
        </div>

        <div class="actions">
          <div class="action-card">
            <h3>🔍 Verify Product Images</h3>
            <p>Automatically verify all product images in your store for authenticity.</p>
            <button class="btn" onclick="verifyAllProducts()">Start Verification</button>
          </div>
          
          <div class="action-card">
            <h3>🛡️ Add Trust Badges</h3>
            <p>Add verification badges to products with verified content.</p>
            <button class="btn" onclick="addTrustBadges()">Add Badges</button>
          </div>
          
          <div class="action-card">
            <h3>📊 View Reports</h3>
            <p>Access detailed verification reports and analytics.</p>
            <button class="btn" onclick="viewReports()">View Reports</button>
          </div>
          
          <div class="action-card">
            <h3>⚙️ Settings</h3>
            <p>Configure automatic verification and badge settings.</p>
            <button class="btn" onclick="openSettings()">Open Settings</button>
          </div>
        </div>
      </div>

      <script>
        const AppBridge = window['app-bridge'];
        const actions = AppBridge.actions;
        const TitleBar = actions.TitleBar;
        const Button = actions.Button;
        const Redirect = actions.Redirect;
        const Toast = actions.Toast;

        const app = AppBridge.createApp({
          apiKey: '${process.env.SHOPIFY_API_KEY}',
          host: '${Buffer.from(session.shop + '/admin').toString('base64')}',
        });

        function verifyAllProducts() {
          const toast = Toast.create(app, {message: 'Starting product verification...'});
          toast.dispatch(Toast.Action.SHOW);
          
          fetch('/verify-products', { method: 'POST' })
            .then(response => response.json())
            .then(data => {
              toast.set({message: data.message, isError: !data.success});
              toast.dispatch(Toast.Action.SHOW);
            });
        }

        function addTrustBadges() {
          const toast = Toast.create(app, {message: 'Adding trust badges...'});
          toast.dispatch(Toast.Action.SHOW);
          
          fetch('/add-badges', { method: 'POST' })
            .then(response => response.json())
            .then(data => {
              toast.set({message: data.message, isError: !data.success});
              toast.dispatch(Toast.Action.SHOW);
            });
        }

        function viewReports() {
          window.open('/reports', '_blank');
        }

        function openSettings() {
          const redirect = Redirect.create(app);
          redirect.dispatch(Redirect.Action.APP, '/settings');
        }
      </script>
    </body>
    </html>
  `;

  res.send(html);
});

// Verify all products endpoint
app.post('/verify-products', async (req, res) => {
  try {
    const session = res.locals.shopify.session;
    const client = new shopify.clients.Graphql({ session });

    // Get all products
    const productsQuery = `
      query getProducts($first: Int!) {
        products(first: $first) {
          edges {
            node {
              id
              title
              images(first: 10) {
                edges {
                  node {
                    id
                    url
                  }
                }
              }
            }
          }
        }
      }
    `;

    const response = await client.query({
      data: {
        query: productsQuery,
        variables: { first: 50 }
      }
    });

    const products = response.body.data.products.edges;
    let verifiedCount = 0;

    for (const productEdge of products) {
      const product = productEdge.node;
      const productId = product.id.split('/').pop();

      for (const imageEdge of product.images.edges) {
        const image = imageEdge.node;
        
        try {
          const verification = await verifyContent(image.url, productId);
          console.log(`Verification started for product ${productId}, verification ID: ${verification.id}`);
          verifiedCount++;
        } catch (error) {
          console.error(`Failed to verify image for product ${productId}:`, error.message);
        }
      }
    }

    res.json({
      success: true,
      message: `Started verification for ${verifiedCount} images across ${products.length} products`
    });

  } catch (error) {
    console.error('Verification error:', error);
    res.json({
      success: false,
      message: 'Failed to start verification process'
    });
  }
});

// Add trust badges endpoint
app.post('/add-badges', async (req, res) => {
  try {
    const session = res.locals.shopify.session;
    
    // In a real implementation, you'd check verification results and add badges accordingly
    // For demo purposes, we'll add badges to a few products
    
    const mockVerifiedProducts = [
      { id: '123', trustScore: 94 },
      { id: '124', trustScore: 87 },
      { id: '125', trustScore: 91 }
    ];

    let badgesAdded = 0;
    for (const product of mockVerifiedProducts) {
      try {
        await addTrustBadge(session, product.id, product.trustScore);
        badgesAdded++;
      } catch (error) {
        console.error(`Failed to add badge to product ${product.id}`);
      }
    }

    res.json({
      success: true,
      message: `Added trust badges to ${badgesAdded} products`
    });

  } catch (error) {
    console.error('Badge addition error:', error);
    res.json({
      success: false,
      message: 'Failed to add trust badges'
    });
  }
});

// Reports page
app.get('/reports', (req, res) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>TrustLens - Verification Reports</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; }
        .container { max-width: 1000px; margin: 0 auto; }
        table { width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
        th { background: #f9fafb; font-weight: 600; }
        .status-completed { color: #059669; }
        .status-processing { color: #d97706; }
        .trust-score { font-weight: bold; }
        .high-score { color: #059669; }
        .medium-score { color: #d97706; }
        .low-score { color: #dc2626; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Verification Reports</h1>
        <table>
          <thead>
            <tr>
              <th>Product ID</th>
              <th>Image URL</th>
              <th>Status</th>
              <th>Trust Score</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>12345</td>
              <td>product-image-1.jpg</td>
              <td><span class="status-completed">Completed</span></td>
              <td><span class="trust-score high-score">94%</span></td>
              <td>2025-01-01</td>
              <td><a href="#">View Report</a></td>
            </tr>
            <tr>
              <td>12346</td>
              <td>product-image-2.jpg</td>
              <td><span class="status-completed">Completed</span></td>
              <td><span class="trust-score high-score">87%</span></td>
              <td>2025-01-01</td>
              <td><a href="#">View Report</a></td>
            </tr>
            <tr>
              <td>12347</td>
              <td>product-image-3.jpg</td>
              <td><span class="status-processing">Processing</span></td>
              <td>--</td>
              <td>2025-01-01</td>
              <td>--</td>
            </tr>
          </tbody>
        </table>
      </div>
    </body>
    </html>
  `;
  
  res.send(html);
});

// Webhook handler for product updates
app.post('/webhooks/products/update', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const product = JSON.parse(req.body.toString());
    console.log('Product updated:', product.id);

    // Auto-verify new product images
    if (product.images && product.images.length > 0) {
      for (const image of product.images) {
        try {
          const verification = await verifyContent(image.src, product.id);
          console.log(`Auto-verification started for product ${product.id}: ${verification.id}`);
        } catch (error) {
          console.error(`Auto-verification failed for product ${product.id}:`, error.message);
        }
      }
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).send('Error');
  }
});

// Environment configuration
app.get('/config', (req, res) => {
  res.json({
    trustlens_api_url: TRUSTLENS_API_URL,
    shopify_api_key: process.env.SHOPIFY_API_KEY,
    app_url: process.env.SHOPIFY_APP_URL
  });
});

app.listen(PORT, () => {
  console.log(`TrustLens Shopify App running on port ${PORT}`);
  console.log(`App URL: http://localhost:${PORT}`);
});

module.exports = app;
