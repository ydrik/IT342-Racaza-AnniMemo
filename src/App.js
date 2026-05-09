import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
// Add '/components/' to the path
import LoginPage from './components/LoginPage'; 
import RegisterPage from './components/RegisterPage';
import Dashboard from './components/LandingPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </Router>
  );
}

export default App;