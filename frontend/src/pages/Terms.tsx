import React from 'react'

const Terms: React.FC = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4 sm:py-6">
            <div className="flex items-center">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-sky-400 to-sky-600 rounded-lg mr-2 sm:mr-3"></div>
              <h1 className="text-lg sm:text-2xl font-bold text-gray-900">TrustLens</h1>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <a href="/" className="text-gray-600 hover:text-sky-600 transition-colors duration-200 text-sm sm:text-base">
                Home
              </a>
              <a href="/login" className="text-gray-600 hover:text-sky-600 transition-colors duration-200 text-sm sm:text-base">
                Sign in
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-gray-50 rounded-2xl border border-gray-200 shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">TrustLens Terms of Service</h1>
          
          <div className="prose prose-gray max-w-none">
            <p className="text-gray-700 mb-6">
              <strong>Effective Date:</strong> August 12, 2025<br/>
              <strong>Website:</strong> trustlens.com
            </p>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Acceptance of Terms</h2>
              <p className="text-gray-700 mb-4">
                These Terms of Service ("ToS") govern your use of trustlens.com and all associated services 
                (collectively, "Services"). By registering, accessing, or using the Services, you agree to be 
                bound by these ToS.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Eligibility</h2>
              <p className="text-gray-700 mb-4">
                You must be at least the minimum legal age in your jurisdiction and able to form a binding contract. 
                These Services are for businesses, organizations, and authorized individuals—no minors or unauthorized users.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">3. Description of Services</h2>
              <p className="text-gray-700 mb-4">
                TrustLens offers AI-powered authenticity and content-verification Services, including:
              </p>
              <ul className="list-disc list-inside ml-4 space-y-2 text-gray-700">
                <li>Image/video scanning</li>
                <li>Reverse-image and fake-detection checks</li>
                <li>Shopify/WooCommerce apps and buyer-facing badges</li>
                <li>API integration, dashboards, reporting, and compliance tools</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Accounts and Security</h2>
              <ul className="list-disc list-inside ml-4 space-y-2 text-gray-700">
                <li>You agree to provide accurate and current information.</li>
                <li>Protect your login credentials and API keys—that's your responsibility.</li>
                <li>Notify us immediately of any unauthorized access.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Plans, Billing & Payments</h2>
              <ul className="list-disc list-inside ml-4 space-y-2 text-gray-700">
                <li>Services are billed monthly based on your selected plan (Free, Starter, Pro, Enterprise).</li>
                <li>Overage charges apply per plan details (e.g., per-upload pricing).</li>
                <li>Payments are processed via Stripe; by subscribing, you authorize recurring billing.</li>
                <li>Plan upgrades/downgrades take effect immediately or at the next billing cycle, per plan terms.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Cancellation & Termination</h2>
              <ul className="list-disc list-inside ml-4 space-y-2 text-gray-700">
                <li>Cancel anytime via account settings—Services continue through the paid period, then terminate.</li>
                <li>TrustLens may suspend or terminate accounts for nonpayment or violation, after notice.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Acceptable Use</h2>
              <p className="text-gray-700 mb-4">You must not:</p>
              <ul className="list-disc list-inside ml-4 space-y-2 text-gray-700">
                <li>Use the Services for unlawful or harmful content</li>
                <li>Reverse-engineer or misuse the Services</li>
                <li>Overwhelm the system with excessive or abusive requests</li>
                <li>Share API keys publicly</li>
                <li>Breach any applicable laws or third-party rights</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">8. Intellectual Property</h2>
              <ul className="list-disc list-inside ml-4 space-y-2 text-gray-700">
                <li>TrustLens retains all rights to its Services, software, and branding.</li>
                <li>You retain rights to your data and content.</li>
                <li>By submitting data, you grant TrustLens a license to use it to deliver Services (storage, analysis, display, reporting).</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">9. No Warranty</h2>
              <p className="text-gray-700 mb-4">
                Services are provided "as is." TrustLens does not warrant uninterrupted or error-free operation. 
                Reliance on outputs is at your own risk.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">10. Limitation of Liability</h2>
              <p className="text-gray-700 mb-4">
                TrustLens and its affiliates are not liable for indirect, incidental, consequential, or punitive damages. 
                Total liability is capped at the fees you have paid in the preceding 12 months.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">11. Indemnity</h2>
              <p className="text-gray-700 mb-4">
                You agree to defend and hold TrustLens harmless from any claims arising from your misuse of the 
                Services or violation of these ToS.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">12. Dispute Resolution</h2>
              <ul className="list-disc list-inside ml-4 space-y-2 text-gray-700">
                <li>These ToS are governed by the laws of the jurisdiction where TrustLens is incorporated.</li>
                <li>Disputes shall be resolved via binding arbitration (or court, as specified).</li>
                <li>Venue will be in the jurisdiction indicated in your incorporation documents (please update as needed).</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">13. Modifications</h2>
              <p className="text-gray-700 mb-4">
                We may update these ToS; material changes will be communicated (e.g., via email or dashboard). 
                Continued use after notice implies acceptance.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">14. General Provisions</h2>
              <ul className="list-disc list-inside ml-4 space-y-2 text-gray-700">
                <li>These ToS constitute the entire agreement between you and TrustLens.</li>
                <li>Invalid provisions do not invalidate the rest.</li>
                <li>No waiver is effective unless in writing and signed by both parties.</li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Terms
