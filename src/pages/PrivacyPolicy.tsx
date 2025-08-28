import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export function PrivacyPolicy() {
  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="mb-8">
        <Link to="/" className="inline-flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Link>
      </div>
      
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Privacy Policy</h1>
      
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
        
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-4 mt-8">1. Introduction</h2>
        <p>
          RecoverPro™ Staffing ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our services. Please read this privacy policy carefully. If you do not agree with the terms of this privacy policy, please do not access the site.
        </p>
        
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-4 mt-8">2. Collection of Your Information</h2>
        <p>
          We may collect information about you in a variety of ways. The information we may collect includes:
        </p>
        <ul className="list-disc pl-6 mt-2 mb-4">
          <li><strong>Personal Data:</strong> Personally identifiable information, such as your name, email address, telephone number, and demographic information that you voluntarily give to us when you register with us or when you choose to participate in various activities related to our services.</li>
          <li><strong>Derivative Data:</strong> Information our servers automatically collect when you access our platform, such as your IP address, browser type, operating system, access times, and the pages you have viewed.</li>
          <li><strong>Financial Data:</strong> Information related to payment processing, such as payment method details. We store only limited financial information needed to process your payments.</li>
          <li><strong>Assessment Data:</strong> Information and content you provide when completing our job application assessments, including audio recordings and text responses.</li>
        </ul>
        
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-4 mt-8">3. Use of Your Information</h2>
        <p>
          Having accurate information about you permits us to provide you with a smooth, efficient, and customized experience. Specifically, we may use information collected about you via our platform to:
        </p>
        <ul className="list-disc pl-6 mt-2 mb-4">
          <li>Create and manage your account.</li>
          <li>Process your application for employment.</li>
          <li>Evaluate your suitability for positions with our company or our clients.</li>
          <li>Compile anonymous statistical data and analysis for use internally or with third parties.</li>
          <li>Deliver targeted advertising, newsletters, and other information regarding promotions and our platform to you.</li>
          <li>Increase the efficiency and operation of our platform.</li>
          <li>Monitor and analyze usage and trends to improve your experience with our platform.</li>
          <li>Notify you of updates to our platform.</li>
          <li>Resolve disputes and troubleshoot problems.</li>
          <li>Prevent fraudulent transactions, monitor against theft, and protect against criminal activity.</li>
          <li>Process payments and refunds.</li>
        </ul>
        
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-4 mt-8">4. Disclosure of Your Information</h2>
        <p>
          We may share information we have collected about you in certain situations. Your information may be disclosed as follows:
        </p>
        
        <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2 mt-4">4.1 Potential Employers</h3>
        <p>
          We may share your application information, including assessment results, with potential employers or clients seeking to fill positions for which you may be qualified.
        </p>
        
        <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2 mt-4">4.2 Third-Party Service Providers</h3>
        <p>
          We may share your information with third-party service providers to assist us in operating our platform, conducting our business, or serving you, so long as those parties agree to keep this information confidential.
        </p>
        
        <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2 mt-4">4.3 Legal Requirements</h3>
        <p>
          We may disclose your information if required to do so by law or in response to valid requests by public authorities (e.g., a court or a government agency).
        </p>
        
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-4 mt-8">5. Security of Your Information</h2>
        <p>
          We use administrative, technical, and physical security measures to help protect your personal information from unauthorized access, use, or disclosure. While we have taken reasonable steps to secure the personal information you provide to us, please be aware that despite our efforts, no security measures are perfect or impenetrable, and no method of data transmission can be guaranteed against any interception or other type of misuse.
        </p>
        
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-4 mt-8">6. Data Retention</h2>
        <p>
          We will retain your personal information only for as long as is necessary for the purposes set out in this Privacy Policy. We will retain and use your information to the extent necessary to comply with our legal obligations, resolve disputes, and enforce our policies.
        </p>
        
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-4 mt-8">7. Your Rights</h2>
        <p>
          Depending on your location, you may have certain rights regarding your personal information, including:
        </p>
        <ul className="list-disc pl-6 mt-2 mb-4">
          <li>The right to access personal information we hold about you</li>
          <li>The right to request that we correct any inaccurate or incomplete personal information</li>
          <li>The right to request that we delete your personal information</li>
          <li>The right to withdraw consent to processing where our processing is based on your consent</li>
          <li>The right to obtain a copy of your personal information in a structured, machine-readable format</li>
        </ul>
        <p>
          To exercise these rights, please contact us using the information provided in the "Contact Us" section below.
        </p>
        
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-4 mt-8">8. Cookies and Web Beacons</h2>
        <p>
          We may use cookies, web beacons, tracking pixels, and other tracking technologies to help customize our platform and improve your experience. Most browsers are set to accept cookies by default. You can remove or reject cookies, but be aware that such action could affect the availability and functionality of our platform.
        </p>
        
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-4 mt-8">9. Children's Privacy</h2>
        <p>
          Our platform is not intended for use by children under the age of 18, and we do not knowingly collect personal information from children under 18. If we learn we have collected or received personal information from a child under 18 without verification of parental consent, we will delete that information.
        </p>
        
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-4 mt-8">10. Changes to This Privacy Policy</h2>
        <p>
          We may update this privacy policy from time to time. The updated version will be indicated by an updated "Last updated" date and the updated version will be effective as soon as it is accessible. We encourage you to review this privacy policy frequently to be informed of how we are protecting your information.
        </p>
        
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-4 mt-8">11. Contact Us</h2>
        <p>
          If you have questions or comments about this privacy policy, please contact us at:
        </p>
        <p className="mt-2">
          RecoverPro™ Staffing<br/>
          Email: privacy@recoverprostaffing.com<br/>
          Phone: (555) 123-4567
        </p>
      </div>
    </div>
  );
}