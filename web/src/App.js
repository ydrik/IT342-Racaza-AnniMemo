import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';

import LoginPage from './features/auth/pages/LoginPage';
import RegisterPage from './features/auth/pages/RegisterPage';

// Import components for routing
import LandingPage from './components/LandingPage';
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
import ThemeToggle from './components/ThemeToggle';
import AppointmentTrackerPage from './components/AppointmentTrackerPage';
import ExploreBreeds from './components/ExploreBreeds';

function App() {
  const [theme, setTheme] = useState(() => {
    const stored = localStorage.getItem('theme');
    if (stored) {
      return stored;
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'));
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        
        {/* Protected Routes */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<UserProfile />} />
        <Route path="/pets" element={<PetList />} />
        <Route path="/pets/add" element={<AddPet />} />
        <Route path="/pets/edit/:id" element={<EditPet />} />
        <Route path="/pets/:id/health" element={<HealthMetrics />} />
        <Route path="/appointments" element={<AppointmentTrackerPage />} />
        
        {/* Redirect Fallbacks for Unmapped Features */}
        <Route path="/health-trends" element={<Navigate to="/pets" replace />} />
        <Route path="/breeds" element={<ExploreBreeds />} />
        
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
      <ThemeToggle theme={theme} onToggle={toggleTheme} />
    </Router>
  );
}

export default App;