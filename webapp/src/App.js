import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/AuthContext';
import { UploadPreview } from './pages/UploadPreview';
import { LoginPage } from './pages/Login';
import { RegisterPage } from './pages/Register';
import { HistoryPage } from './pages/History';
const Protected = ({ children }) => {
    const { token } = useAuth();
    return token ? children : _jsx(Navigate, { to: "/login", replace: true });
};
export const App = () => (_jsx(AuthProvider, { children: _jsx(BrowserRouter, { children: _jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(Navigate, { to: "/login", replace: true }) }), _jsx(Route, { path: "/login", element: _jsx(LoginPage, {}) }), _jsx(Route, { path: "/register", element: _jsx(RegisterPage, {}) }), _jsx(Route, { path: "/upload", element: _jsx(Protected, { children: _jsx(UploadPreview, {}) }) }), _jsx(Route, { path: "/history", element: _jsx(Protected, { children: _jsx(HistoryPage, {}) }) }), _jsx(Route, { path: "*", element: _jsx(Navigate, { to: "/login", replace: true }) })] }) }) }));
