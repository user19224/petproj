import React,{JSX} from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/AuthContext';
import { UploadPreview } from './pages/UploadPreview';
import { LoginPage } from './pages/Login';
import { RegisterPage } from './pages/Register';
import { HistoryPage } from './pages/History';

const Protected: React.FC<{ children: JSX.Element }> = ({ children }) => {
  const { token } = useAuth();
  return token ? children : <Navigate to="/login" replace />;
};

export const App: React.FC = () => (
  <AuthProvider>
    <BrowserRouter>
      <Routes>
        {/* Redirect root to login */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/upload" element={<Protected><UploadPreview /></Protected>} />
        <Route path="/history" element={<Protected><HistoryPage /></Protected>} />
        {/* Catch-all redirects to login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  </AuthProvider>
);
