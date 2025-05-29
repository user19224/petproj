import {
  jsx as _jsx,
  Fragment as _Fragment,
  jsxs as _jsxs,
} from 'react/jsx-runtime'
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom'
import { AuthProvider, useAuth } from './lib/AuthContext'
import { UploadPreview } from './pages/UploadPreview'
import { LoginPage } from './pages/Login'
import { RegisterPage } from './pages/Register'
import { HistoryPage } from './pages/History'
import './styles/index.css'
const Navigation = () => {
  const { token, logout } = useAuth()
  return _jsxs('header', {
    className: 'header',
    children: [
      _jsx('div', {
        className: 'logo',
        children:
          'MCDM-\u041A\u0430\u043B\u044C\u043A\u0443\u043B\u044F\u0442\u043E\u0440',
      }),
      _jsx('nav', {
        children: token
          ? _jsxs(_Fragment, {
              children: [
                _jsx(Link, {
                  to: '/upload',
                  children:
                    '\u041A\u0430\u043B\u044C\u043A\u0443\u043B\u044F\u0442\u043E\u0440',
                }),
                _jsx(Link, {
                  to: '/history',
                  children: '\u0418\u0441\u0442\u043E\u0440\u0438\u044F',
                }),
                _jsx('button', {
                  className: 'nav-btn',
                  onClick: logout,
                  children: '\u0412\u044B\u0445\u043E\u0434',
                }),
              ],
            })
          : _jsxs(_Fragment, {
              children: [
                _jsx(Link, {
                  to: '/login',
                  children: '\u0412\u0445\u043E\u0434',
                }),
                _jsx(Link, {
                  to: '/register',
                  children:
                    '\u0420\u0435\u0433\u0438\u0441\u0442\u0440\u0430\u0446\u0438\u044F',
                }),
              ],
            }),
      }),
    ],
  })
}
const Protected = ({ children }) => {
  const { token } = useAuth()
  return token ? children : _jsx(Navigate, { to: '/login', replace: true })
}
const AppContent = () => {
  return _jsxs(_Fragment, {
    children: [
      _jsx(Navigation, {}),
      _jsx('div', {
        className: 'container',
        children: _jsxs(Routes, {
          children: [
            _jsx(Route, {
              path: '/',
              element: _jsx(Navigate, { to: '/login', replace: true }),
            }),
            _jsx(Route, { path: '/login', element: _jsx(LoginPage, {}) }),
            _jsx(Route, { path: '/register', element: _jsx(RegisterPage, {}) }),
            _jsx(Route, {
              path: '/upload',
              element: _jsx(Protected, { children: _jsx(UploadPreview, {}) }),
            }),
            _jsx(Route, {
              path: '/history',
              element: _jsx(Protected, { children: _jsx(HistoryPage, {}) }),
            }),
            _jsx(Route, {
              path: '*',
              element: _jsx(Navigate, { to: '/login', replace: true }),
            }),
          ],
        }),
      }),
      _jsxs('footer', {
        className: 'footer',
        children: [
          '\u00A9 2025 \u2022 ',
          _jsx('a', {
            href: 'https://github.com/user19224',
            target: '_blank',
            rel: 'noopener noreferrer',
            children: 'GitHub',
          }),
        ],
      }),
    ],
  })
}
export const App = () =>
  _jsx(AuthProvider, {
    children: _jsx(BrowserRouter, { children: _jsx(AppContent, {}) }),
  })
