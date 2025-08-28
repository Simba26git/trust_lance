import React from 'react'

const ApiDocs: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 max-w-screen-2xl items-center">
          <div className="mr-4 hidden md:flex">
            <a href="/" className="mr-6 flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-800">
                <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="hidden font-bold sm:inline-block">TrustLens</span>
            </a>
          </div>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            <a href="/" className="transition-colors hover:text-foreground/80 text-foreground/60">
              Home
            </a>
            <a href="/docs" className="transition-colors hover:text-foreground/80 text-foreground">
              Documentation
            </a>
            <a href="/api" className="transition-colors hover:text-foreground/80 text-foreground">
              API
            </a>
            <a href="/dashboard" className="transition-colors hover:text-foreground/80 text-foreground/60">
              Dashboard
            </a>
            <a href="/pricing" className="transition-colors hover:text-foreground/80 text-foreground/60">
              Pricing
            </a>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <div className="container py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <nav className="space-y-2">
                <div className="font-semibold text-foreground mb-4">API Documentation</div>
                <a href="#getting-started" className="block text-sm text-muted-foreground hover:text-foreground">Getting Started</a>
                <a href="#authentication" className="block text-sm text-muted-foreground hover:text-foreground">Authentication</a>
                <a href="#endpoints" className="block text-sm text-muted-foreground hover:text-foreground">Endpoints</a>
                <a href="#verify-content" className="block text-sm text-muted-foreground hover:text-foreground ml-4">Verify Content</a>
                <a href="#get-results" className="block text-sm text-muted-foreground hover:text-foreground ml-4">Get Results</a>
                <a href="#webhooks" className="block text-sm text-muted-foreground hover:text-foreground">Webhooks</a>
                <a href="#errors" className="block text-sm text-muted-foreground hover:text-foreground">Error Codes</a>
                <a href="#rate-limits" className="block text-sm text-muted-foreground hover:text-foreground">Rate Limits</a>
                <a href="#sdks" className="block text-sm text-muted-foreground hover:text-foreground">SDKs</a>
              </nav>
            </div>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            <div className="prose prose-slate max-w-none">
              <h1 className="text-3xl font-bold text-foreground">TrustLens API</h1>
              <p className="text-lg text-muted-foreground">
                Integrate content verification into your applications with our powerful REST API.
              </p>

              <section id="getting-started" className="mt-12">
                <h2 className="text-2xl font-bold text-foreground">Getting Started</h2>
                <p className="text-muted-foreground">
                  The TrustLens API allows you to verify content authenticity, detect deepfakes, and validate media provenance programmatically.
                </p>
                
                <div className="bg-muted rounded-lg p-4 mt-4">
                  <h3 className="font-semibold text-foreground">Base URL</h3>
                  <code className="text-sm bg-background px-2 py-1 rounded">https://api.trustlens.com/v1</code>
                </div>
              </section>

              <section id="authentication" className="mt-12">
                <h2 className="text-2xl font-bold text-foreground">Authentication</h2>
                <p className="text-muted-foreground">
                  All API requests require authentication using your API key in the Authorization header.
                </p>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                  <h4 className="font-semibold text-blue-900 mb-2">Demo Credentials</h4>
                  <p className="text-sm text-blue-800 mb-2">Use these API keys for testing:</p>
                  <div className="bg-slate-900 text-green-400 rounded p-2 text-sm font-mono">
                    <div>Development: <span className="text-yellow-400">tl_dev_key_dev123456789</span></div>
                    <div>Testing: <span className="text-yellow-400">tl_test_key_abcdef1234567890</span></div>
                    <div>Live: <span className="text-yellow-400">tl_live_key_1234567890abcdef</span></div>
                  </div>
                </div>
                
                <div className="bg-slate-900 text-green-400 rounded-lg p-4 mt-4 overflow-x-auto">
                  <pre><code>{`curl -H "Authorization: Bearer tl_dev_key_dev123456789" \\
     -H "Content-Type: application/json" \\
     http://localhost:3000/api/v1/verify`}</code></pre>
                </div>
              </section>

              <section id="endpoints" className="mt-12">
                <h2 className="text-2xl font-bold text-foreground">Endpoints</h2>

                <div id="verify-content" className="mt-8">
                  <h3 className="text-xl font-semibold text-foreground">POST /api/v1/verify</h3>
                  <p className="text-muted-foreground">Submit content for verification analysis.</p>
                  
                  <div className="bg-slate-900 text-green-400 rounded-lg p-4 mt-4 overflow-x-auto">
                    <pre><code>{`{
  "url": "https://example.com/image.jpg",
  "type": "image",
  "webhook_url": "https://yoursite.com/webhook"
}`}</code></pre>
                  </div>

                  <div className="mt-4">
                    <h4 className="font-semibold text-foreground">Response</h4>
                    <div className="bg-slate-900 text-green-400 rounded-lg p-4 mt-2 overflow-x-auto">
                      <pre><code>{`{
  "id": "ver_1234567890",
  "status": "processing",
  "created_at": "2025-01-01T12:00:00Z",
  "estimated_completion": "2025-01-01T12:00:05Z"
}`}</code></pre>
                    </div>
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-6">
                    <h4 className="font-semibold text-green-900 mb-2">✅ Working Example</h4>
                    <p className="text-sm text-green-800 mb-3">Try this example with curl (API server must be running on port 3000):</p>
                    <div className="bg-slate-900 text-green-400 rounded p-3 text-sm font-mono overflow-x-auto">
                      <pre><code>{`curl -X POST http://localhost:3000/api/v1/verify \\
  -H "Authorization: Bearer tl_dev_key_dev123456789" \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://picsum.photos/400/300",
    "type": "image"
  }'`}</code></pre>
                    </div>
                  </div>
                </div>

                <div id="get-results" className="mt-8">
                  <h3 className="text-xl font-semibold text-foreground">GET /api/v1/verify/:id</h3>
                  <p className="text-muted-foreground">Retrieve verification results.</p>
                  
                  <div className="bg-slate-900 text-green-400 rounded-lg p-4 mt-4 overflow-x-auto">
                    <pre><code>{`{
  "id": "ver_1234567890",
  "status": "completed",
  "trust_score": 94,
  "analysis": {
    "deepfake_probability": 0.02,
    "c2pa_verified": true,
    "provenance_chain": [...],
    "manipulation_detected": false
  },
  "report_url": "https://reports.trustlens.com/ver_1234567890.pdf"
}`}</code></pre>
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-6">
                    <h4 className="font-semibold text-green-900 mb-2">✅ Working Example</h4>
                    <p className="text-sm text-green-800 mb-3">Test with a real verification ID (first run the POST example above):</p>
                    <div className="bg-slate-900 text-green-400 rounded p-3 text-sm font-mono overflow-x-auto">
                      <pre><code>{`curl -X GET http://localhost:3000/api/v1/verify/ver_188bddc09fb74c82e60843db0765f789 \\
  -H "Authorization: Bearer tl_dev_key_dev123456789"`}</code></pre>
                    </div>
                  </div>
                </div>
              </section>

              <section id="webhooks" className="mt-12">
                <h2 className="text-2xl font-bold text-foreground">Webhooks</h2>
                <p className="text-muted-foreground">
                  Receive real-time notifications when verification is complete.
                </p>
                
                <div className="bg-slate-900 text-green-400 rounded-lg p-4 mt-4 overflow-x-auto">
                  <pre><code>{`{
  "event": "verification.completed",
  "verification_id": "ver_1234567890",
  "trust_score": 94,
  "timestamp": "2025-01-01T12:00:05Z"
}`}</code></pre>
                </div>
              </section>

              <section id="errors" className="mt-12">
                <h2 className="text-2xl font-bold text-foreground">Error Codes</h2>
                <div className="space-y-4">
                  <div className="border rounded-lg p-4">
                    <code className="font-semibold">400 Bad Request</code>
                    <p className="text-sm text-muted-foreground mt-1">Invalid request format or missing required fields</p>
                  </div>
                  <div className="border rounded-lg p-4">
                    <code className="font-semibold">401 Unauthorized</code>
                    <p className="text-sm text-muted-foreground mt-1">Invalid or missing API key</p>
                  </div>
                  <div className="border rounded-lg p-4">
                    <code className="font-semibold">429 Too Many Requests</code>
                    <p className="text-sm text-muted-foreground mt-1">Rate limit exceeded</p>
                  </div>
                </div>
              </section>

              <section id="rate-limits" className="mt-12">
                <h2 className="text-2xl font-bold text-foreground">Rate Limits</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div className="border rounded-lg p-4 text-center">
                    <div className="font-semibold text-foreground">Free Tier</div>
                    <div className="text-2xl font-bold text-blue-800 mt-2">10</div>
                    <div className="text-sm text-muted-foreground">requests/month</div>
                  </div>
                  <div className="border rounded-lg p-4 text-center">
                    <div className="font-semibold text-foreground">Pro Plan</div>
                    <div className="text-2xl font-bold text-blue-800 mt-2">1,000</div>
                    <div className="text-sm text-muted-foreground">requests/month</div>
                  </div>
                  <div className="border rounded-lg p-4 text-center">
                    <div className="font-semibold text-foreground">Enterprise</div>
                    <div className="text-2xl font-bold text-blue-800 mt-2">Unlimited</div>
                    <div className="text-sm text-muted-foreground">Custom rates</div>
                  </div>
                </div>
              </section>

              <section id="sdks" className="mt-12">
                <h2 className="text-2xl font-bold text-foreground">SDKs & Libraries</h2>
                <p className="text-muted-foreground">
                  Official SDKs to make integration easier in your preferred language.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold text-foreground">Node.js</h3>
                    <code className="text-sm bg-muted px-2 py-1 rounded mt-2 block">npm install trustlens</code>
                  </div>
                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold text-foreground">Python</h3>
                    <code className="text-sm bg-muted px-2 py-1 rounded mt-2 block">pip install trustlens</code>
                  </div>
                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold text-foreground">PHP</h3>
                    <code className="text-sm bg-muted px-2 py-1 rounded mt-2 block">composer require trustlens/api</code>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ApiDocs
