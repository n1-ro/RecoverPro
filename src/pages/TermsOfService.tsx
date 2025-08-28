import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export function TermsOfService() {
  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="mb-8">
        <Link to="/" className="inline-flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Link>
      </div>
      
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Terms of Service</h1>
      
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
        
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-4 mt-8">1. Agreement to Terms</h2>
        <p>
          These Terms of Service constitute a legally binding agreement made between you, whether personally or on behalf of an entity ("you") and RecoverPro™ Staffing ("we," "us" or "our"), concerning your access to and use of our website as well as any other media form, media channel, mobile website or mobile application related, linked, or otherwise connected thereto (collectively, the "Site").
        </p>
        <p className="mt-2">
          You agree that by accessing the Site, you have read, understood, and agree to be bound by all of these Terms of Service. If you do not agree with all of these Terms of Service, then you are expressly prohibited from using the Site and you must discontinue use immediately.
        </p>
        
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-4 mt-8">2. Eligibility</h2>
        <p>
          The Site is intended for users who are at least 18 years old. By using the Site, you represent and warrant that:
        </p>
        <ul className="list-disc pl-6 mt-2 mb-4">
          <li>You are at least 18 years of age;</li>
          <li>You have the legal capacity to enter into a binding agreement with us; and</li>
          <li>You are not prohibited from using the Site under applicable law.</li>
        </ul>
        <p>
          If you do not meet all of these requirements, you must not access or use the Site.
        </p>
        
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-4 mt-8">3. User Registration and Account</h2>
        <p>
          You may be required to register with the Site to access certain features. You agree to keep your password confidential and will be responsible for all use of your account and password. We reserve the right to remove, reclaim, or change a username you select if we determine, in our sole discretion, that such username is inappropriate, obscene, or otherwise objectionable.
        </p>
        
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-4 mt-8">4. Application Process</h2>
        <p>
          As part of the application process, you may be required to:
        </p>
        <ul className="list-disc pl-6 mt-2 mb-4">
          <li>Submit personal information for employment consideration;</li>
          <li>Complete assessments, which may include recording audio responses to scenarios or providing written responses;</li>
          <li>Provide accurate, truthful, and complete information.</li>
        </ul>
        <p>
          You understand that any information or content you provide may be reviewed by our team or potential employers. Submission of an application does not guarantee employment.
        </p>
        
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-4 mt-8">5. User Representations</h2>
        <p>
          By using the Site, you represent and warrant that:
        </p>
        <ul className="list-disc pl-6 mt-2 mb-4">
          <li>All registration information you submit will be true, accurate, current, and complete;</li>
          <li>You will maintain the accuracy of such information and promptly update such registration information as necessary;</li>
          <li>You have the legal capacity and you agree to comply with these Terms of Service;</li>
          <li>You will not use the Site for any illegal or unauthorized purpose;</li>
          <li>Your use of the Site will not violate any applicable law or regulation.</li>
        </ul>
        
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-4 mt-8">6. Prohibited Activities</h2>
        <p>
          You may not access or use the Site for any purpose other than that for which we make the Site available. The Site may not be used in connection with any commercial endeavors except those that are specifically endorsed or approved by us.
        </p>
        <p className="mt-2">
          As a user of the Site, you agree not to:
        </p>
        <ul className="list-disc pl-6 mt-2 mb-4">
          <li>Systematically retrieve data or other content from the Site to create or compile, directly or indirectly, a collection, compilation, database, or directory;</li>
          <li>Make any unauthorized use of the Site, including collecting usernames and/or email addresses of users by electronic or other means;</li>
          <li>Use a buying agent or purchasing agent to make purchases on the Site;</li>
          <li>Circumvent, disable, or otherwise interfere with security-related features of the Site;</li>
          <li>Trick, defraud, or mislead us and other users, especially in any attempt to learn sensitive account information such as user passwords;</li>
          <li>Make improper use of our support services or submit false reports of abuse or misconduct;</li>
          <li>Engage in any automated use of the system, such as using scripts to send comments or messages;</li>
          <li>Interfere with, disrupt, or create an undue burden on the Site or the networks or services connected to the Site;</li>
          <li>Attempt to impersonate another user or person or use the username of another user;</li>
          <li>Upload or transmit (or attempt to upload or to transmit) any material that acts as a passive or active information collection or transmission mechanism;</li>
          <li>Use the Site in a manner inconsistent with any applicable laws or regulations;</li>
          <li>Disparage, tarnish, or otherwise harm, in our opinion, us and/or the Site;</li>
          <li>Except as may be the result of standard search engine or Internet browser usage, use, launch, develop, or distribute any automated system that accesses the Site.</li>
        </ul>
        
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-4 mt-8">7. Intellectual Property Rights</h2>
        <p>
          Unless otherwise indicated, the Site is our proprietary property and all source code, databases, functionality, software, website designs, audio, video, text, photographs, and graphics on the Site (collectively, the "Content") and the trademarks, service marks, and logos contained therein (the "Marks") are owned or controlled by us or licensed to us, and are protected by copyright and trademark laws and various other intellectual property rights.
        </p>
        <p className="mt-2">
          You are granted a limited license to access and use the Site and to download or print a copy of any portion of the Content to which you have properly gained access solely for your personal, non-commercial use. We reserve all rights not expressly granted to you in and to the Site, the Content and the Marks.
        </p>
        
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-4 mt-8">8. User Content</h2>
        <p>
          "User Content" refers to all information and content that a user submits to, or uses with, the Site (e.g., audio recordings, text responses, photos, profile information). You are solely responsible for your User Content. You assume all risks associated with the use of your User Content, including reliance on its accuracy, completeness or usefulness by others, or any disclosure that makes you or any third party personally identifiable.
        </p>
        <p className="mt-2">
          You hereby grant us an irrevocable, nonexclusive, royalty-free and fully paid, worldwide license to reproduce, distribute, publicly display and perform, prepare derivative works of, incorporate into other works, and otherwise use and exploit your User Content, and to grant sublicenses of the foregoing rights, solely for the purposes of including your User Content in the Site and evaluating your application.
        </p>
        <p className="mt-2">
          We do not assert any ownership over your User Content. You retain full ownership of all of your User Content and any intellectual property rights or other proprietary rights associated with your User Content.
        </p>
        
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-4 mt-8">9. Third-Party Websites and Content</h2>
        <p>
          The Site may contain (or you may be sent via the Site) links to other websites ("Third-Party Websites") as well as articles, photographs, text, graphics, pictures, designs, music, sound, video, information, applications, software, and other content or items belonging to or originating from third parties ("Third-Party Content").
        </p>
        <p className="mt-2">
          We are not responsible for any Third-Party Websites accessed through the Site or any Third-Party Content posted on, available through, or installed from the Site, including the content, accuracy, offensiveness, opinions, reliability, privacy practices, or other policies of or contained in the Third-Party Websites or the Third-Party Content.
        </p>
        
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-4 mt-8">10. Site Management</h2>
        <p>
          We reserve the right, but not the obligation, to:
        </p>
        <ul className="list-disc pl-6 mt-2 mb-4">
          <li>Monitor the Site for violations of these Terms of Service;</li>
          <li>Take appropriate legal action against anyone who, in our sole discretion, violates the law or these Terms of Service;</li>
          <li>In our sole discretion and without limitation, refuse, restrict access to, limit the availability of, or disable (to the extent technologically feasible) any of your Contributions or any portion thereof;</li>
          <li>In our sole discretion and without limitation, notice, or liability, to remove from the Site or otherwise disable all files and content that are excessive in size or are in any way burdensome to our systems;</li>
          <li>Otherwise manage the Site in a manner designed to protect our rights and property and to facilitate the proper functioning of the Site.</li>
        </ul>
        
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-4 mt-8">11. Term and Termination</h2>
        <p>
          These Terms of Service shall remain in full force and effect while you use the Site. Without limiting any other provision of these terms, we reserve the right to, in our sole discretion and without notice or liability, deny access to and use of the site (including blocking certain IP addresses), to any person for any reason or for no reason, including without limitation for breach of any representation, warranty, or covenant contained in these Terms of Service or of any applicable law or regulation.
        </p>
        <p className="mt-2">
          We may terminate your use or participation in the site or delete your account and any content or information that you posted at any time, without warning, in our sole discretion.
        </p>
        
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-4 mt-8">12. Modifications and Interruptions</h2>
        <p>
          We reserve the right to change, modify, or remove the contents of the Site at any time or for any reason at our sole discretion without notice. However, we have no obligation to update any information on our Site. We also reserve the right to modify or discontinue all or part of the Site without notice at any time.
        </p>
        <p className="mt-2">
          We will not be liable to you or any third party for any modification, suspension, or discontinuance of the Site.
        </p>
        <p className="mt-2">
          We cannot guarantee the Site will be available at all times. We may experience hardware, software, or other problems or need to perform maintenance related to the Site, resulting in interruptions, delays, or errors. We reserve the right to change, revise, update, suspend, discontinue, or otherwise modify the Site at any time or for any reason without notice to you.
        </p>
        
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-4 mt-8">13. Governing Law</h2>
        <p>
          These Terms of Service and your use of the Site are governed by and construed in accordance with the laws of the United States of America applicable to agreements made and to be entirely performed within the United States of America, without regard to its conflict of law principles.
        </p>
        
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-4 mt-8">14. Dispute Resolution</h2>
        <p>
          Any legal action of whatever nature brought by either you or us (collectively, the "Parties" and individually, a "Party") shall be commenced or prosecuted in the state and federal courts located in the United States, and the Parties hereby consent to, and waive all defenses of lack of personal jurisdiction and forum non conveniens with respect to venue and jurisdiction in such state and federal courts.
        </p>
        
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-4 mt-8">15. Corrections</h2>
        <p>
          There may be information on the Site that contains typographical errors, inaccuracies, or omissions, including descriptions, pricing, availability, and various other information. We reserve the right to correct any errors, inaccuracies, or omissions and to change or update the information on the Site at any time, without prior notice.
        </p>
        
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-4 mt-8">16. Disclaimer</h2>
        <p>
          The site is provided on an as-is and as-available basis. You agree that your use of the site and our services will be at your sole risk. To the fullest extent permitted by law, we disclaim all warranties, express or implied, in connection with the site and your use thereof, including, without limitation, the implied warranties of merchantability, fitness for a particular purpose, and non-infringement.
        </p>
        
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-4 mt-8">17. Limitations of Liability</h2>
        <p>
          In no event will we or our directors, employees, or agents be liable to you or any third party for any direct, indirect, consequential, exemplary, incidental, special, or punitive damages, including lost profit, lost revenue, loss of data, or other damages arising from your use of the site, even if we have been advised of the possibility of such damages.
        </p>
        
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-4 mt-8">18. Contact Us</h2>
        <p>
          If you have any questions about these Terms of Service, please contact us at:
        </p>
        <p className="mt-2">
          RecoverPro™ Staffing<br/>
          Email: terms@recoverprostaffing.com<br/>
          Phone: (555) 123-4567
        </p>
      </div>
    </div>
  );
}