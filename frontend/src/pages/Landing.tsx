import React from 'react'
import CookieConsent from '../components/CookieConsent'

const Landing: React.FC = () => {
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
              <a href="/pricing" className="transition-colors hover:text-foreground/80 text-foreground/60">
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
      <section className="container relative">
        <div className="mx-auto flex max-w-[980px] flex-col items-center gap-2 py-8 md:py-12 md:pb-8 lg:py-16 lg:pb-12">
          <h1 className="text-center text-3xl font-bold leading-tight tracking-tighter md:text-6xl lg:leading-[1.1]">
            The Foundation for your{" "}
            <span className="bg-gradient-to-r from-blue-800 to-blue-900 bg-clip-text text-transparent">
              Content Verification
            </span>
          </h1>
          <p className="max-w-[750px] text-center text-lg text-muted-foreground sm:text-xl">
            Beautifully designed AI-powered tools to verify content authenticity.
            Detect deepfakes, validate provenance, and ensure media integrity with enterprise-grade security.
          </p>
          <div className="flex w-full items-center justify-center space-x-4 py-4 md:pb-6">
            <a href="/register" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-blue-800 text-primary-foreground shadow hover:bg-blue-900 h-11 px-8">
              Get Started
            </a>
            <a href="/docs" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-11 px-8">
              View Components
            </a>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container">
        <div className="mx-auto flex max-w-[980px] flex-col items-center gap-4 py-8 md:py-12 md:pb-8 lg:py-16 lg:pb-12">
          <h2 className="text-center text-3xl font-bold leading-tight tracking-tighter md:text-5xl lg:leading-[1.1]">
            Features
          </h2>
          <p className="max-w-[750px] text-center text-lg text-muted-foreground sm:text-xl">
            Everything you need to verify content authenticity and build trust with your audience.
          </p>
          <div className="grid w-full max-w-5xl grid-cols-1 gap-8 py-6 md:grid-cols-2 lg:grid-cols-3">
            
            {/* Feature 1 */}
            <div className="relative overflow-hidden rounded-lg border bg-background p-6 shadow-sm">
              <div className="flex h-[60px] w-[60px] items-center justify-center rounded-md bg-blue-800">
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="space-y-2 pt-4">
                <h3 className="font-bold">Real-time Detection</h3>
                <p className="text-sm text-muted-foreground">
                  Instantly detect deepfakes and manipulated content with cutting-edge AI algorithms.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="relative overflow-hidden rounded-lg border bg-background p-6 shadow-sm">
              <div className="flex h-[60px] w-[60px] items-center justify-center rounded-md bg-blue-800">
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div className="space-y-2 pt-4">
                <h3 className="font-bold">Enterprise Security</h3>
                <p className="text-sm text-muted-foreground">
                  Enterprise-grade security ensures your content remains private and protected during analysis.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="relative overflow-hidden rounded-lg border bg-background p-6 shadow-sm">
              <div className="flex h-[60px] w-[60px] items-center justify-center rounded-md bg-blue-800">
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="space-y-2 pt-4">
                <h3 className="font-bold">Lightning Fast</h3>
                <p className="text-sm text-muted-foreground">
                  Get verification results in under 2 seconds with our optimized processing pipeline.
                </p>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="relative overflow-hidden rounded-lg border bg-background p-6 shadow-sm">
              <div className="flex h-[60px] w-[60px] items-center justify-center rounded-md bg-blue-800">
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="space-y-2 pt-4">
                <h3 className="font-bold">Analytics Dashboard</h3>
                <p className="text-sm text-muted-foreground">
                  Comprehensive analytics and reporting for all your content verification activities.
                </p>
              </div>
            </div>

            {/* Feature 5 */}
            <div className="relative overflow-hidden rounded-lg border bg-background p-6 shadow-sm">
              <div className="flex h-[60px] w-[60px] items-center justify-center rounded-md bg-blue-800">
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="space-y-2 pt-4">
                <h3 className="font-bold">API Integration</h3>
                <p className="text-sm text-muted-foreground">
                  Easy-to-use REST API for seamless integration into your existing workflows.
                </p>
              </div>
            </div>

            {/* Feature 6 */}
            <div className="relative overflow-hidden rounded-lg border bg-background p-6 shadow-sm">
              <div className="flex h-[60px] w-[60px] items-center justify-center rounded-md bg-blue-800">
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <div className="space-y-2 pt-4">
                <h3 className="font-bold">Trust Badges</h3>
                <p className="text-sm text-muted-foreground">
                  Generate buyer-facing trust badges to increase confidence in your verified content.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container py-8 md:py-10 lg:py-12">
        <div className="mx-auto flex max-w-[980px] flex-col items-center gap-4">
          <h2 className="text-center text-3xl font-bold leading-tight tracking-tighter md:text-5xl lg:leading-[1.1]">
            Ready to get started?
          </h2>
          <p className="max-w-[750px] text-center text-lg text-muted-foreground sm:text-xl">
            Join thousands of businesses protecting their content with TrustLens.
          </p>
          <div className="flex w-full items-center justify-center space-x-4 py-4">
            <a href="/register" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-blue-800 text-primary-foreground shadow hover:bg-blue-900 h-11 px-8">
              Start Free Trial
            </a>
            <a href="/docs" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-11 px-8">
              View Documentation
            </a>
          </div>
        </div>
      </section>

      {/* Cookie Consent Banner */}
      <CookieConsent />
    </div>
  )
}

export default Landing
