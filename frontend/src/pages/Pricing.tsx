import React from 'react'

const Pricing: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
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
            <nav className="flex items-center space-x-6 text-sm font-medium">
              <a href="/docs" className="transition-colors hover:text-foreground/80 text-foreground/60">
                Documentation
              </a>
              <a href="/api" className="transition-colors hover:text-foreground/80 text-foreground/60">
                API
              </a>
              <a href="/dashboard" className="transition-colors hover:text-foreground/80 text-foreground/60">
                Dashboard
              </a>
              <a href="/pricing" className="transition-colors hover:text-foreground/80 text-foreground">
                Pricing
              </a>
            </nav>
          </div>
          <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
            <nav className="flex items-center">
              <a href="/login" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2">
                Sign In
              </a>
              <a href="/register" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-blue-800 text-primary-foreground shadow hover:bg-blue-900 h-9 px-4 py-2 ml-2">
                Get Started
              </a>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container py-8 md:py-10 lg:py-12">
        <div className="mx-auto flex max-w-[980px] flex-col items-center gap-4">
          <h1 className="text-center text-3xl font-bold leading-tight tracking-tighter md:text-5xl lg:text-6xl lg:leading-[1.1]">
            Simple, transparent pricing
          </h1>
          <p className="max-w-[750px] text-center text-lg text-muted-foreground sm:text-xl">
            Choose the plan that fits your content verification needs. All plans include our core AI-powered verification technology.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="container py-8 md:py-10 lg:py-12">
        <div className="grid w-full max-w-6xl mx-auto grid-cols-1 gap-8 md:grid-cols-3">
          
          {/* Starter Plan */}
          <div className="relative overflow-hidden rounded-lg border bg-background p-8 shadow-sm">
            <div className="flex h-60 flex-col justify-between">
              <div>
                <h3 className="text-2xl font-bold">Starter</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Perfect for small businesses and individual creators
                </p>
                <div className="mt-4">
                  <span className="text-4xl font-bold">$29</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
              </div>
              <a href="/register" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2 w-full">
                Get Started
              </a>
            </div>
            <div className="mt-8 space-y-4">
              <div className="flex items-center">
                <svg className="h-4 w-4 text-green-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-sm">1,000 verifications/month</span>
              </div>
              <div className="flex items-center">
                <svg className="h-4 w-4 text-green-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-sm">Basic AI analysis</span>
              </div>
              <div className="flex items-center">
                <svg className="h-4 w-4 text-green-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-sm">Trust badges</span>
              </div>
              <div className="flex items-center">
                <svg className="h-4 w-4 text-green-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-sm">Email support</span>
              </div>
              <div className="flex items-center">
                <svg className="h-4 w-4 text-green-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-sm">API access</span>
              </div>
            </div>
          </div>

          {/* Professional Plan - Popular */}
          <div className="relative overflow-hidden rounded-lg border bg-background p-8 shadow-sm border-blue-800">
            <div className="absolute top-0 right-0 bg-blue-800 text-white text-xs font-medium px-3 py-1 rounded-bl-lg">
              Popular
            </div>
            <div className="flex h-60 flex-col justify-between">
              <div>
                <h3 className="text-2xl font-bold">Professional</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Best for growing businesses and e-commerce stores
                </p>
                <div className="mt-4">
                  <span className="text-4xl font-bold">$99</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
              </div>
              <a href="/register" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-blue-800 text-primary-foreground shadow hover:bg-blue-900 h-9 px-4 py-2 w-full">
                Get Started
              </a>
            </div>
            <div className="mt-8 space-y-4">
              <div className="flex items-center">
                <svg className="h-4 w-4 text-green-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-sm">10,000 verifications/month</span>
              </div>
              <div className="flex items-center">
                <svg className="h-4 w-4 text-green-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-sm">Advanced AI analysis</span>
              </div>
              <div className="flex items-center">
                <svg className="h-4 w-4 text-green-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-sm">Shopify & BigCommerce plugins</span>
              </div>
              <div className="flex items-center">
                <svg className="h-4 w-4 text-green-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-sm">Custom trust badges</span>
              </div>
              <div className="flex items-center">
                <svg className="h-4 w-4 text-green-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-sm">Priority support</span>
              </div>
              <div className="flex items-center">
                <svg className="h-4 w-4 text-green-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-sm">Analytics dashboard</span>
              </div>
              <div className="flex items-center">
                <svg className="h-4 w-4 text-green-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-sm">Webhook integrations</span>
              </div>
            </div>
          </div>

          {/* Enterprise Plan */}
          <div className="relative overflow-hidden rounded-lg border bg-background p-8 shadow-sm">
            <div className="flex h-60 flex-col justify-between">
              <div>
                <h3 className="text-2xl font-bold">Enterprise</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  For large organizations with custom requirements
                </p>
                <div className="mt-4">
                  <span className="text-4xl font-bold">Custom</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
              </div>
              <a href="/contact" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2 w-full">
                Contact Sales
              </a>
            </div>
            <div className="mt-8 space-y-4">
              <div className="flex items-center">
                <svg className="h-4 w-4 text-green-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-sm">Unlimited verifications</span>
              </div>
              <div className="flex items-center">
                <svg className="h-4 w-4 text-green-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-sm">Custom AI models</span>
              </div>
              <div className="flex items-center">
                <svg className="h-4 w-4 text-green-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-sm">White-label solutions</span>
              </div>
              <div className="flex items-center">
                <svg className="h-4 w-4 text-green-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-sm">Dedicated support</span>
              </div>
              <div className="flex items-center">
                <svg className="h-4 w-4 text-green-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-sm">SLA guarantees</span>
              </div>
              <div className="flex items-center">
                <svg className="h-4 w-4 text-green-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-sm">Custom integrations</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="container py-8 md:py-10 lg:py-12 border-t border-border/40">
        <div className="mx-auto flex max-w-[980px] flex-col items-center gap-4">
          <h2 className="text-center text-3xl font-bold leading-tight tracking-tighter md:text-5xl lg:leading-[1.1]">
            Frequently Asked Questions
          </h2>
          <div className="w-full max-w-3xl space-y-6 mt-8">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">What counts as a verification?</h3>
              <p className="text-muted-foreground">
                Each image, video, or document you submit for analysis counts as one verification. This includes both API calls and manual uploads through our dashboard.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Can I change plans anytime?</h3>
              <p className="text-muted-foreground">
                Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll pro-rate your billing accordingly.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Is there a free trial?</h3>
              <p className="text-muted-foreground">
                We offer a 14-day free trial with 100 complimentary verifications to help you evaluate our service before committing to a paid plan.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">What payment methods do you accept?</h3>
              <p className="text-muted-foreground">
                We accept all major credit cards (Visa, Mastercard, American Express) and ACH bank transfers for enterprise accounts.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-6 md:py-0">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
          <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-800">
              <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
              Built with trust and transparency. © 2025 TrustLens. All rights reserved.
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <a href="/privacy" className="text-sm text-muted-foreground hover:text-foreground">
              Privacy
            </a>
            <a href="/terms" className="text-sm text-muted-foreground hover:text-foreground">
              Terms
            </a>
            <a href="/docs" className="text-sm text-muted-foreground hover:text-foreground">
              Docs
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Pricing
