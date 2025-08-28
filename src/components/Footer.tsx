import React from 'react';
import { Building2 } from 'lucide-react';
import { Link } from 'react-router-dom';

interface FooterProps {
  onAdminClick?: () => void;
}

export function Footer({ onAdminClick }: FooterProps) {
  return (
    <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              About Us
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Leading the industry in remote debt collection solutions with professionalism and compliance.
            </p>
          </div>
          
          <div className="flex flex-col items-center text-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Resources
            </h3>
            <ul className="space-y-2">
              <li>
                <Link to="/privacy-policy" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms-of-service" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">
                  Terms of Service
                </Link>
              </li>
              <li>
                <button
                  onClick={onAdminClick}
                  className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                >
                  Admin Portal
                </button>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Compliance
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              We adhere to all FDCPA guidelines and maintain the highest standards of professional conduct.
            </p>
            <div className="flex items-center text-gray-600 dark:text-gray-300 mt-4">
              <Building2 className="w-5 h-5 mr-2" />
              ProRecover Staffing
            </div>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
          <p className="text-center text-gray-600 dark:text-gray-300">
            © {new Date().getFullYear()} ProRecover Staffing. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}