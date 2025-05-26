var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import '../styles/auth.css';
export const LoginPage = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const { login } = useAuth();
    const navigate = useNavigate();
    const handleSubmit = (e) => __awaiter(void 0, void 0, void 0, function* () {
        e.preventDefault();
        setError(null);
        try {
            const res = yield fetch('http://localhost:4000/auth/login', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            if (!res.ok)
                throw yield res.json();
            const { token } = yield res.json();
            login(token);
            navigate('/upload');
        }
        catch (err) {
            setError(err.error || 'Login failed');
        }
    });
    return (_jsx("div", { className: "auth-wrapper", children: _jsxs("div", { className: "auth-card", children: [_jsx("h1", { children: "Login" }), error && _jsx("div", { className: "error", children: error }), _jsxs("form", { onSubmit: handleSubmit, children: [_jsx("input", { type: "text", value: username, onChange: e => setUsername(e.target.value), placeholder: "Username" }), _jsx("input", { type: "password", value: password, onChange: e => setPassword(e.target.value), placeholder: "Password" }), _jsx("button", { type: "submit", children: "Login" })] }), _jsxs("div", { className: "switch-link", children: ["Don't have an account? ", _jsx(Link, { to: "/register", children: "Register here" })] })] }) }));
};
