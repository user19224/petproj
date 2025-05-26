import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// src/pages/HistoryPage.tsx
import { useEffect, useState } from 'react';
import { useAuth } from '../lib/AuthContext';
import { useNavigate } from 'react-router-dom';
import '../styles/History.css';
export const HistoryPage = () => {
    const { token } = useAuth();
    const navigate = useNavigate();
    const [history, setHistory] = useState([]);
    const [detail, setDetail] = useState(null);
    const [error, setError] = useState(null);
    useEffect(() => {
        fetch('http://localhost:4000/api/history', {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(res => res.json())
            .then(({ history }) => setHistory(history))
            .catch(err => setError(err.error || 'Failed to load history'));
    }, [token]);
    const loadDetail = (id) => {
        setError(null);
        fetch(`http://localhost:4000/api/history/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(res => res.json())
            .then(({ history: row }) => {
            const parsed = JSON.parse(row.results);
            setDetail({
                id: row.id,
                timestamp: row.timestamp,
                criteria: row.criteria,
                results: parsed,
                bestAdditive: parsed.bestAdditive,
                bestDistance: parsed.bestDistance,
            });
        })
            .catch(err => setError(err.error || 'Failed to load details'));
    };
    const recompute = (id) => {
        setError(null);
        fetch(`http://localhost:4000/api/history/${id}/compute`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(res => res.json())
            .then(data => {
            if (!detail)
                return;
            setDetail(Object.assign(Object.assign({}, detail), { results: data.results, bestAdditive: data.bestAdditive, bestDistance: data.bestDistance }));
        })
            .catch(err => setError(err.error || 'Recompute failed'));
    };
    return (_jsx("div", { className: "history-wrapper", children: _jsxs("div", { className: "history-card", children: [_jsx("h1", { children: "History" }), error && _jsx("div", { className: "error", children: error }), _jsx("div", { className: "history-table-container", children: _jsxs("table", { className: "history-table", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "ID" }), _jsx("th", { children: "Timestamp" }), _jsx("th", { children: "Actions" })] }) }), _jsx("tbody", { children: history.map(r => (_jsxs("tr", { children: [_jsx("td", { children: r.id }), _jsx("td", { children: new Date(r.timestamp).toLocaleString() }), _jsxs("td", { children: [_jsx("button", { className: "btn", onClick: () => loadDetail(r.id), children: "View" }), _jsx("button", { className: "btn", onClick: () => navigate(`/upload?runId=${r.id}`), children: "Recompute" })] })] }, r.id))) })] }) }), detail && (_jsxs("div", { className: "history-detail", children: [_jsxs("h2", { children: ["Details for Run #", detail.id] }), _jsxs("p", { children: [_jsx("strong", { children: "Timestamp:" }), ' ', new Date(detail.timestamp).toLocaleString()] }), _jsxs("p", { children: [_jsx("strong", { children: "Criteria:" }), ' ', _jsx("code", { children: detail.criteria })] }), _jsx("div", { className: "history-detail-table-container", children: _jsxs("table", { className: "results-table", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "Index" }), _jsx("th", { children: "Additive" }), _jsx("th", { children: "Distance" })] }) }), _jsx("tbody", { children: detail.results.map(r => (_jsxs("tr", { children: [_jsx("td", { children: r.index }), _jsx("td", { children: r.additive.toFixed(3) }), _jsx("td", { children: r.distance.toFixed(3) })] }, r.index))) })] }) }), _jsxs("div", { className: "detail-actions", children: [_jsx("button", { className: "btn", onClick: () => recompute(detail.id), children: "Recompute" }), _jsx("button", { className: "btn", onClick: () => setDetail(null), children: "Close" })] })] }))] }) }));
};
