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
import { useEffect, useState } from 'react';
import { useAuth } from '../lib/AuthContext';
export const HistoryPage = () => {
    const { token } = useAuth();
    const [history, setHistory] = useState([]);
    const [error, setError] = useState(null);
    useEffect(() => {
        ;
        (() => __awaiter(void 0, void 0, void 0, function* () {
            try {
                const res = yield fetch('http://localhost:4000/api/history', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!res.ok)
                    throw yield res.json();
                const data = yield res.json();
                setHistory(data.history);
            }
            catch (err) {
                setError(err.error || 'Failed to load history');
            }
        }))();
    }, [token]);
    return (_jsxs("div", { className: "history-container", children: [_jsx("h2", { children: "History" }), error && _jsx("div", { className: "error", children: error }), _jsx("ul", { children: history.map((run) => (_jsxs("li", { children: ["ID ", run.id, " \u2014 ", new Date(run.timestamp).toLocaleString(), " \u2014 Criteria:", ' ', run.criteria] }, run.id))) })] }));
};
