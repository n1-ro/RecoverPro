import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface HeaderProps {
  onApplyClick?: () => void;
  userEmail?: string | null;
}

export function Header({ onApplyClick, userEmail }: HeaderProps) {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const handleApplyClick = () => {
    if (onApplyClick) {
      // Close mobile menu if open
      if (isMenuOpen) {
        setIsMenuOpen(false);
      }
      onApplyClick();
    } else if (!user) {
      // If no onApplyClick provided, navigate to home
      navigate('/');
    }
  };

  return (
    <header className="bg-gradient-to-r from-indigo-800 to-blue-700 text-white shadow-lg">
      <div className="max-w-6xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo and Company Name */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="relative w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center overflow-hidden transition-transform group-hover:scale-105">
              <svg
                width="48"
                height="48"
                viewBox="0 0 48 48"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="absolute inset-0"
              >
                <circle cx="24" cy="24" r="24" fill="url(#logo-gradient)" />
                <path
                  d="M24 12C17.373 12 12 17.373 12 24C12 30.627 17.373 36 24 36C30.627 36 36 30.627 36 24C36 17.373 30.627 12 24 12ZM24 14.4C29.302 14.4 33.6 18.698 33.6 24C33.6 29.302 29.302 33.6 24 33.6C18.698 33.6 14.4 29.302 14.4 24C14.4 18.698 18.698 14.4 24 14.4Z"
                  fill="white"
                  fillOpacity="0.9"
                />
                <path
                  d="M19.2 22.8C19.2 21.697 18.303 20.8 17.2 20.8C16.097 20.8 15.2 21.697 15.2 22.8V27.6C15.2 28.703 16.097 29.6 17.2 29.6C18.303 29.6 19.2 28.703 19.2 27.6V22.8Z"
                  fill="white"
                />
                <path
                  d="M32.8 27.6C32.8 28.703 31.903 29.6 30.8 29.6C29.697 29.6 28.8 28.703 28.8 27.6V22.8C28.8 21.697 29.697 20.8 30.8 20.8C31.903 20.8 32.8 21.697 32.8 22.8V27.6Z"
                  fill="white"
                />
                <path
                  d="M24 21.6C22.897 21.6 22 22.497 22 23.6V31.2C22 32.303 22.897 33.2 24 33.2C25.103 33.2 26 32.303 26 31.2V23.6C26 22.497 25.103 21.6 24 21.6Z"
                  fill="white"
                />
                <path
                  d="M24 20C25.103 20 26 19.103 26 18C26 16.897 25.103 16 24 16C22.897 16 22 16.897 22 18C22 19.103 22.897 20 24 20Z"
                  fill="white"
                />
                <path
                  d="M30.5 14L21.5 20.5M30.5 14L34 19.5M30.5 14L25.5 11.5"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <defs>
                  <linearGradient
                    id="logo-gradient"
                    x1="0"
                    y1="0"
                    x2="48"
                    y2="48"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop offset="0%" stopColor="#4338ca" />
                    <stop offset="100%" stopColor="#3b82f6" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-xl leading-tight tracking-tight">
                ProRecover
              </span>
              <span className="font-medium text-sm text-blue-100 leading-tight tracking-wide">STAFFING</span>
            </div>
          </Link>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button 
              onClick={toggleMenu}
              className="p-2 focus:outline-none focus:ring-2 focus:ring-white/20 rounded-md"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {user ? (
              <>
                <span className="text-gray-200">
                  {userEmail}
                </span>
                <Link 
                  to="/dashboard" 
                  className={`transition-colors hover:text-blue-100 ${
                    location.pathname === '/dashboard' ? 'font-medium' : ''
                  }`}
                >
                  Dashboard
                </Link>
                <button 
                  onClick={signOut} 
                  className="px-4 py-1.5 bg-white/10 hover:bg-white/20 rounded-md transition-colors"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <button 
                onClick={handleApplyClick}
                className="px-4 py-1.5 bg-white/10 hover:bg-white/20 rounded-md transition-colors"
              >
                Apply Now
              </button>
            )}
          </nav>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="mt-4 pt-4 border-t border-white/10 md:hidden pb-3 animate-fade-in">
            {user ? (
              <div className="flex flex-col space-y-3 text-gray-200">
                <span className="py-2">{userEmail}</span>
                <Link 
                  to="/dashboard" 
                  className="py-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <button 
                  onClick={() => {
                    signOut();
                    setIsMenuOpen(false);
                  }} 
                  className="text-left py-2"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button 
                onClick={handleApplyClick}
                className="block py-2 w-full text-left"
              >
                Apply Now
              </button>
            )}
          </nav>
        )}
      </div>
    </header>
  );
}