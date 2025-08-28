import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Home } from './pages/Home';
import { DashboardPage } from './pages/DashboardPage';
import { AdminPage } from './pages/AdminPage';
import { PrivacyPolicy } from './pages/PrivacyPolicy';
import { TermsOfService } from './pages/TermsOfService';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { Modal } from './components/Modal';
import { Auth } from './components/Auth';
import { useAuth } from './hooks/useAuth';

function App() {
  const { user } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = React.useState(false);

  const handleAdminClick = () => setIsAuthModalOpen(true);
  const handleApplyClick = () => setIsAuthModalOpen(true);
  const handleAuthSuccess = () => setIsAuthModalOpen(false);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <Header onApplyClick={handleApplyClick} userEmail={user?.email} />
      <div className="flex-grow max-w-6xl mx-auto px-4 py-12 w-full">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
        </Routes>
        <Footer onAdminClick={handleAdminClick} />
        <Modal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)}>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 text-center">
              Applicant Login
            </h2>
            <Auth onSuccess={handleAuthSuccess} />
          </div>
        </Modal>
      </div>
    </div>
  );
}

export default App;