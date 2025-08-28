import React from 'react'

const Privacy: React.FC = () => {
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
          <h1 className="text-3xl font-bold text-gray-900 mb-8">TrustLens Privacy Policy</h1>
          
          <div className="prose prose-gray max-w-none">
            <p className="text-gray-600 mb-6">
              <strong>Effective Date:</strong> August 12, 2025<br/>
              <strong>Website:</strong> trustlens.com
            </p>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Introduction</h2>
              <p className="text-gray-700 mb-4">
                TrustLens ("we", "us") values your privacy and is committed to protecting your information. 
                This Privacy Policy outlines how we collect, use, and safeguard your data while you use our Services.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Data We Collect</h2>
              <ul className="list-disc list-inside ml-4 space-y-2 text-gray-700">
                <li><strong>Account Information:</strong> name, email, company, billing address, credentials, plan, API keys, and storefront IDs.</li>
                <li><strong>Uploaded Content:</strong> images, videos, metadata, EXIF data.</li>
                <li><strong>Usage Data:</strong> API requests, processing logs, badge impressions, review actions.</li>
                <li><strong>Billing Information:</strong> Stripe customer ID, invoices, payment status.</li>
                <li><strong>Technical Data:</strong> IP addresses, device and browser details, login timestamps.</li>
                <li><strong>Third-party Analysis Data:</strong> results from Sensity, TruePic, TinEye, OpenAI, etc.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">3. How We Collect Data</h2>
              <ul className="list-disc list-inside ml-4 space-y-2 text-gray-700">
                <li>You provide account information, uploads, preferences.</li>
                <li>Automatically collected: usage data and system logs.</li>
                <li>From partners: when performing authenticity checks through third-party APIs.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Use of Data</h2>
              <p className="text-gray-700 mb-4">We use data to:</p>
              <ul className="list-disc list-inside ml-4 space-y-2 text-gray-700">
                <li>Provide, maintain, and enhance core functionality.</li>
                <li>Conduct analysis and generate authenticity reports.</li>
                <li>Enable billing and subscription services.</li>
                <li>Enforce security and detect abuse.</li>
                <li>Comply with legal and regulatory obligations.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Legal Bases</h2>
              <ul className="list-disc list-inside ml-4 space-y-2 text-gray-700">
                <li>Processing is necessary for the contract with you.</li>
                <li>We have a legitimate interest in securing our platform and improving our services.</li>
                <li>We obtain explicit consent for optional features (e.g., badges, browser extensions).</li>
                <li>Compliance with legal obligations when required by law.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Data Sharing</h2>
              <p className="text-gray-700 mb-4">We may share data with:</p>
              <ul className="list-disc list-inside ml-4 space-y-2 text-gray-700">
                <li><strong>Service providers:</strong> AWS, Stripe, Twilio, Sensity, TruePic, etc., under confidentiality agreements.</li>
                <li><strong>Regulators or law enforcement</strong> when legally required.</li>
              </ul>
              <p className="text-gray-700 mt-4">
                We never sell or rent your personal data to third parties for marketing purposes.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">7. International Transfers</h2>
              <p className="text-gray-700 mb-4">
                Data may be stored or processed outside your country. We implement appropriate safeguards 
                (e.g., standard contractual clauses) to protect such transfers.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">8. Data Retention</h2>
              <ul className="list-disc list-inside ml-4 space-y-2 text-gray-700">
                <li><strong>Raw uploads and logs:</strong> 90 days default (merchant options: 30, 90, 365 days).</li>
                <li><strong>Billing and audit logs:</strong> 7 years or as legally required.</li>
                <li><strong>Deletion:</strong> Upon request, data will be erased in line with retention policies and relevant privacy laws.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">9. Your Rights</h2>
              <p className="text-gray-700 mb-4">Depending on your jurisdiction, you may:</p>
              <ul className="list-disc list-inside ml-4 space-y-2 text-gray-700">
                <li>Access your personal data.</li>
                <li>Correct inaccuracies.</li>
                <li>Request deletion.</li>
                <li>Object to processing.</li>
                <li>Request portability.</li>
                <li>Withdraw consent.</li>
              </ul>
              <p className="text-gray-700 mt-4">
                Submit requests via privacy@trustlens.com or through your dashboard.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">10. Security Measures</h2>
              <ul className="list-disc list-inside ml-4 space-y-2 text-gray-700">
                <li>TLS for all transmissions.</li>
                <li>AES-256 encryption at rest.</li>
                <li>Secure hashing for passwords.</li>
                <li>RBAC and least-privilege access.</li>
                <li>Secret storage via a secure vault (e.g., AWS Secrets Manager).</li>
                <li>Error tracking (Sentry) and monitoring (Prometheus), with security audits in place.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">11. Children's Data</h2>
              <p className="text-gray-700 mb-4">
                Our Services are not for children. If we learn any data belongs to a minor, it will be promptly deleted.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">12. Updates to Policy</h2>
              <p className="text-gray-700 mb-4">
                We may update this policy. Significant changes will be posted with an updated date and notified to users. 
                Continued use implies acceptance.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">13. Contact</h2>
              <p className="text-gray-700">
                For questions or data requests:<br/>
                <strong>Email:</strong> <a href="mailto:privacy@trustlens.com" className="text-sky-600 hover:text-sky-500">privacy@trustlens.com</a><br/>
                <strong>Address:</strong> [Your legal company address]
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Privacy
