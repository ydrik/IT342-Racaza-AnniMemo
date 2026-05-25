import React from 'react';
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';

import LoginPage from './features/auth/pages/LoginPage';
import RegisterPage from './features/auth/pages/RegisterPage';

// Import components for routing
import Dashboard from './components/Dashboard';
import PetList from './components/PetList';
import AddPet from './components/AddPet';
import EditPet from './components/EditPet';
import HealthMetrics from './components/HealthMetrics';
import UserProfile from './components/UserProfile';
import SupportPage from './components/SupportPage';
import PrivacyPage from './components/PrivacyPage';
import TermsPage from './components/TermsPage';
import CookiesPage from './components/CookiesPage';
import RemindersPage from './components/RemindersPage';
import PetFactsPage from './components/PetFactsPage';
import SettingsPage from './components/SettingsPage';
import Footer from './components/Footer';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        
        {/* Protected Routes */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<UserProfile />} />
        <Route path="/pets" element={<PetList />} />
        <Route path="/pets/add" element={<AddPet />} />
        <Route path="/pets/edit/:id" element={<EditPet />} />
        <Route path="/pets/:id/health" element={<HealthMetrics />} />
        
        {/* Redirect Fallbacks for Unmapped Features */}
        <Route path="/appointments" element={<Navigate to="/reminders" replace />} />
        <Route path="/health-trends" element={<Navigate to="/pets" replace />} />
        <Route path="/breeds" element={<Navigate to="/facts" replace />} />
        
        {/* Footer Link Routes */}
        <Route path="/reminders" element={<RemindersPage />} />
        <Route path="/facts" element={<PetFactsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/support" element={<SupportPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/cookies" element={<CookiesPage />} />
        
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
      <Footer />
    </Router>
  );
}

export default App;