import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Import your components
import LoginPage from './components/LoginPage'; 
import RegisterPage from './components/RegisterPage';
import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';
import UserProfile from './components/UserProfile';
import PetList from './components/PetList';
import AddPet from './components/AddPet';
import EditPet from './components/EditPet';
import HealthMetrics from './components/HealthMetrics';
import ThemeToggle from './components/ThemeToggle';
import PrivacyPage from './components/PrivacyPage';
import TermsPage from './components/TermsPage';
import CookiesPage from './components/CookiesPage';
import SupportPage from './components/SupportPage';

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
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        
        {/* Footer Link Routes */}
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/cookies" element={<CookiesPage />} />
        <Route path="/support" element={<SupportPage />} />
        
        {/* Protected Routes - FRS Feature 1: User Authentication */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<UserProfile />} />
        
        {/* Protected Routes - FRS Feature 2: Pet Health Tracking */}
        <Route path="/pets" element={<PetList />} />
        <Route path="/pets/add" element={<AddPet />} />
        <Route path="/pets/edit/:id" element={<EditPet />} />
        <Route path="/pets/:id/health" element={<HealthMetrics />} />
      </Routes>
      <ThemeToggle theme={theme} onToggle={toggleTheme} />
    </Router>
  );
}

export default App;