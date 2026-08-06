import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { isAuthenticated } from './services/auth';
import { ThemeProvider } from './context/ThemeContext';

// Pages
import OnboardingScreen from './pages/Onboarding';
import LoginScreen from './pages/Login';
import SignupScreen from './pages/Signup';
import DashboardScreen from './pages/Dashboard';
import SidebarLayout from './components/SidebarLayout';
import UploadScreen from './pages/Upload';
import ScanningScreen from './pages/Scanning';
import SummaryScreen from './pages/Summary';
import VerdictScreen from './pages/Verdict';
import DetailsScreen from './pages/Details';
import HistoryScreen from './pages/History';
import TemplatesScreen from './pages/Templates';
import ChatScreen from './pages/Chat';
import LegalTranslatorScreen from './pages/LegalTranslator';
import SettingsScreen from './pages/Settings';

function ProtectedRoute({ children }) {
  const [isAuth, setIsAuth] = useState(null);

  useEffect(() => {
    const checkAuth = () => {
      setIsAuth(isAuthenticated());
    };
    checkAuth();
  }, []);

  if (isAuth === null) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading...</div>;
  if (!isAuth) return <Navigate to="/onboarding" />;
  
  return children;
}

function InitialRoute() {
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    const check = () => {
      const authed = isAuthenticated();
      if (authed) {
        setStatus('dashboard');
      } else {
        setStatus('onboarding');
      }
    };
    check();
  }, []);

  if (status === 'loading') {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: 'var(--color-bg)' }}>Loading...</div>;
  }

  if (status === 'dashboard') {
    return <Navigate to="/dashboard" />;
  } else {
    return <Navigate to="/onboarding" />;
  }
}

function App() {
  return (
    <ThemeProvider>
      <Router>
        <Routes>
          <Route path="/" element={<InitialRoute />} />
          <Route path="/onboarding" element={<OnboardingScreen />} />
          <Route path="/login" element={<LoginScreen />} />
          <Route path="/signup" element={<SignupScreen />} />
          
          <Route path="/upload" element={
            <ProtectedRoute>
              <UploadScreen />
            </ProtectedRoute>
          } />
          
          <Route path="/scanning" element={
            <ProtectedRoute>
              <ScanningScreen />
            </ProtectedRoute>
          } />

          <Route path="/summary/:id" element={
            <ProtectedRoute>
              <SummaryScreen />
            </ProtectedRoute>
          } />

          <Route path="/verdict/:id" element={
            <ProtectedRoute>
              <VerdictScreen />
            </ProtectedRoute>
          } />

          <Route path="/details/:id" element={
            <ProtectedRoute>
              <DetailsScreen />
            </ProtectedRoute>
          } />
          
          <Route element={
            <ProtectedRoute>
              <SidebarLayout />
            </ProtectedRoute>
          }>
            <Route path="/dashboard" element={<DashboardScreen />} />
            <Route path="/history" element={<HistoryScreen />} />
            <Route path="/templates" element={<TemplatesScreen />} />
            <Route path="/chat" element={<ChatScreen />} />
            <Route path="/translator" element={<LegalTranslatorScreen />} />
            <Route path="/settings" element={<SettingsScreen />} />
          </Route>
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
