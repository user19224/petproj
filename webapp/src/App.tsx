import React from 'react'
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom'
import { AuthProvider, useAuth } from './lib/AuthContext'
import { UploadPreview } from './pages/UploadPreview'
import { LoginPage } from './pages/Login'
import { RegisterPage } from './pages/Register'
import { HistoryPage } from './pages/History'
import { JSX } from 'react/jsx-runtime'
import './styles/index.css'

// Навигация
const Navigation: React.FC = () => {
  const { token, logout } = useAuth()
  return (
    <header className="header">
      <div className="logo">MCDM-Калькулятор</div>
      <nav>
        {token ? (
          <>
            <Link to="/upload">Калькулятор</Link>
            <Link to="/history">История</Link>
            <button className = "nav-btn" onClick={logout}>Выход</button>
          </>
        ) : (
          <>
            <Link to="/login">Вход</Link>
            <Link to="/register">Регистрация</Link>
          </>
        )}
      </nav>
    </header>
  )
}

// Защищённый маршрут
const Protected: React.FC<{ children: JSX.Element }> = ({ children }) => {
  const { token } = useAuth()
  return token ? children : <Navigate to="/login" replace />
}

// Основное содержимое
const AppContent: React.FC = () => {
  return (
    <>
      <Navigation />

      {/* Контейнер */}
      <div className="container">
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/upload"
            element={
              <Protected>
                <UploadPreview />
              </Protected>
            }
          />
          <Route
            path="/history"
            element={
              <Protected>
                <HistoryPage />
              </Protected>
            }
          />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>

      {/* Подвал */}
      <footer className="footer">
        © 2025 • <a href="https://github.com/user19224" target="_blank" rel="noopener noreferrer">GitHub</a>
      </footer>
    </>
  )
}

// Корень приложения
export const App: React.FC = () => (
  <AuthProvider>
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  </AuthProvider>
)

