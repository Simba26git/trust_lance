import React from 'react'

const Plugins: React.FC = () => {
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
            <a href="/docs" className="transition-colors hover:text-foreground/80 text-foreground/60">
              Documentation
            </a>
            <a href="/api" className="transition-colors hover:text-foreground/80 text-foreground/60">
              API
            </a>
            <a href="/dashboard" className="transition-colors hover:text-foreground/80 text-foreground/60">
              Dashboard
            </a>
            <a href="/plugins" className="transition-colors hover:text-foreground/80 text-foreground">
              Plugins
            </a>
            <a href="/pricing" className="transition-colors hover:text-foreground/80 text-foreground/60">
              Pricing
            </a>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container py-8 md:py-12">
        <div className="text-center">
          <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
            E-commerce Plugins
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Seamlessly integrate TrustLens content verification into your e-commerce platform with our official plugins.
          </p>
        </div>
      </section>

      {/* Plugins Grid */}
      <section className="container pb-8 md:pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          
          {/* Shopify Plugin */}
          <div className="border rounded-lg p-6 bg-card hover:shadow-lg transition-shadow">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mr-4">
                <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M15.337 1.517c-0.109-0.007-0.217-0.007-0.33-0.007-1.969 0-3.812 0.516-5.432 1.42l0.087-0.045c-0.31 0.172-0.622 0.368-0.93 0.583-0.172 0.12-0.328 0.257-0.467 0.412l-0.002 0.002c-0.133 0.148-0.242 0.322-0.317 0.512l-0.003 0.009c-0.025 0.063-0.069 0.114-0.127 0.144l-0.002 0.001c-0.207 0.105-0.387 0.253-0.527 0.433l-0.002 0.003c-0.148 0.19-0.237 0.431-0.237 0.692 0 0.080 0.008 0.158 0.024 0.234l-0.001-0.009c0.077 0.355 0.267 0.651 0.532 0.842l0.007 0.005c0.133 0.097 0.297 0.155 0.475 0.155 0.016 0 0.033-0 0.049-0.001l-0.002 0c0.117-0.005 0.225-0.033 0.322-0.079l-0.006 0.003c0.148-0.070 0.272-0.175 0.363-0.304l0.002-0.003c0.070-0.1 0.127-0.216 0.167-0.34l0.002-0.008c0.025-0.077 0.040-0.165 0.040-0.257 0-0.080-0.010-0.158-0.029-0.232l0.001 0.007c-0.037-0.142-0.12-0.262-0.233-0.348l-0.002-0.001c-0.055-0.042-0.126-0.067-0.203-0.067-0.047 0-0.092 0.010-0.132 0.027l0.003-0.001c-0.032 0.013-0.060 0.033-0.082 0.058l-0 0c-0.017 0.019-0.027 0.044-0.027 0.072 0 0.005 0 0.010 0.001 0.015l-0-0.001c0.002 0.018 0.009 0.034 0.020 0.047l0 0c0.022 0.025 0.054 0.041 0.089 0.041 0.012 0 0.024-0.002 0.035-0.005l-0.001 0c0.013-0.003 0.025-0.008 0.035-0.015l0-0c0.007-0.005 0.012-0.012 0.015-0.020l0-0c0.002-0.005 0.003-0.011 0.003-0.017 0-0.003-0-0.007-0.001-0.010l0 0c-0.001-0.012-0.006-0.023-0.014-0.031l-0-0c-0.015-0.015-0.036-0.024-0.059-0.024-0.008 0-0.016 0.001-0.023 0.003l0.001-0z"/>
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground">Shopify Plugin</h3>
                <p className="text-sm text-muted-foreground">Official TrustLens app for Shopify stores</p>
              </div>
            </div>
            
            <p className="text-muted-foreground mb-6">
              Automatically verify product images, customer reviews, and user-generated content on your Shopify store. 
              Build customer trust with verified content badges.
            </p>

            <div className="space-y-4 mb-6">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-sm">Automatic product image verification</span>
              </div>
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-sm">Trust badges on product pages</span>
              </div>
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-sm">Review content verification</span>
              </div>
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-sm">Dashboard analytics</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <a href="https://apps.shopify.com/trustlens" target="_blank" rel="noopener noreferrer" 
                 className="inline-flex items-center justify-center px-4 py-2 bg-blue-800 text-white rounded-md hover:bg-blue-900 transition-colors">
                Install on Shopify
              </a>
              <a href="/docs/shopify" 
                 className="inline-flex items-center justify-center px-4 py-2 border border-input bg-background rounded-md hover:bg-accent transition-colors">
                View Docs
              </a>
            </div>
          </div>

          {/* BigCommerce Plugin */}
          <div className="border rounded-lg p-6 bg-card hover:shadow-lg transition-shadow">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mr-4">
                <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground">BigCommerce Plugin</h3>
                <p className="text-sm text-muted-foreground">Official TrustLens app for BigCommerce stores</p>
              </div>
            </div>
            
            <p className="text-muted-foreground mb-6">
              Enhance your BigCommerce store with automated content verification. Protect your brand and 
              increase customer confidence with authenticated product media.
            </p>

            <div className="space-y-4 mb-6">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-sm">Bulk product verification</span>
              </div>
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-sm">API-first integration</span>
              </div>
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-sm">Custom verification rules</span>
              </div>
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-sm">Advanced reporting</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <a href="https://www.bigcommerce.com/apps/trustlens/" target="_blank" rel="noopener noreferrer" 
                 className="inline-flex items-center justify-center px-4 py-2 bg-blue-800 text-white rounded-md hover:bg-blue-900 transition-colors">
                Install on BigCommerce
              </a>
              <a href="/docs/bigcommerce" 
                 className="inline-flex items-center justify-center px-4 py-2 border border-input bg-background rounded-md hover:bg-accent transition-colors">
                View Docs
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="border-t border-border/40 bg-muted/40">
        <div className="container py-8 md:py-12">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              Plugin Features
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Both plugins offer comprehensive content verification capabilities designed specifically for e-commerce.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="text-center p-6">
              <div className="w-12 h-12 bg-blue-800 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-foreground mb-2">Real-time Verification</h3>
              <p className="text-sm text-muted-foreground">
                Automatically verify content as it's uploaded to your store
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-12 h-12 bg-blue-800 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-foreground mb-2">Trust Badges</h3>
              <p className="text-sm text-muted-foreground">
                Display verification badges to build customer confidence
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-12 h-12 bg-blue-800 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="font-semibold text-foreground mb-2">Analytics Dashboard</h3>
              <p className="text-sm text-muted-foreground">
                Track verification metrics and content performance
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container py-8 md:py-12">
        <div className="text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
            Need a Custom Integration?
          </h2>
          <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
            Building on a different platform? Our API allows you to integrate TrustLens into any e-commerce solution.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/docs" className="inline-flex items-center justify-center px-6 py-3 bg-blue-800 text-white rounded-md hover:bg-blue-900 transition-colors">
              View API Documentation
            </a>
            <a href="mailto:developers@trustlens.com" className="inline-flex items-center justify-center px-6 py-3 border border-input bg-background rounded-md hover:bg-accent transition-colors">
              Contact Our Team
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Plugins
