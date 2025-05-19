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
import { useAuth } from '../lib/AuthContext';
import '../styles/UploadPreview.css';
import '../styles/WeightsSetup.css';
import '../styles/Results.css';
export const UploadPreview = () => {
    const { token } = useAuth();
    const [step, setStep] = useState('upload');
    const [file, setFile] = useState(null);
    const [headers, setHeaders] = useState([]);
    const [preview, setPreview] = useState([]);
    const [criteria, setCriteria] = useState({});
    const [results, setResults] = useState([]);
    const [bestAdditive, setBestAdditive] = useState(null);
    const [bestDistance, setBestDistance] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const handleFileChange = (e) => {
        setError(null);
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
        }
    };
    const handleUpload = (e) => __awaiter(void 0, void 0, void 0, function* () {
        e.preventDefault();
        if (!file)
            return setError('Select file');
        setLoading(true);
        try {
            const form = new FormData();
            form.append('file', file);
            const res = yield fetch('http://localhost:4000/api/upload', {
                method: 'POST',
                body: form,
            });
            if (!res.ok) {
                const err = yield res.json();
                throw new Error(err.error || 'Upload failed');
            }
            const { headers, preview } = yield res.json();
            setHeaders(headers);
            setPreview(preview);
            const w = parseFloat((1 / headers.length).toFixed(1));
            const init = {};
            headers.forEach((h) => {
                init[h] = { weight: w, direction: 'max' };
            });
            setCriteria(init);
            setStep('weights');
        }
        catch (err) {
            setError(err.message);
        }
        finally {
            setLoading(false);
        }
    });
    const handleWeightChange = (col, val) => {
        setCriteria(Object.assign(Object.assign({}, criteria), { [col]: Object.assign(Object.assign({}, criteria[col]), { weight: val }) }));
    };
    const handleDirectionToggle = (col) => {
        const cur = criteria[col];
        setCriteria(Object.assign(Object.assign({}, criteria), { [col]: Object.assign(Object.assign({}, cur), { direction: cur.direction === 'max' ? 'min' : 'max' }) }));
    };
    const handleCompute = () => __awaiter(void 0, void 0, void 0, function* () {
        setLoading(true);
        setError(null);
        try {
            const form = new FormData();
            form.append('file', file);
            form.append('criteria', JSON.stringify(criteria));
            const res = yield fetch('http://localhost:4000/api/compute', {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: form,
            });
            if (!res.ok) {
                const err = yield res.json();
                throw new Error(err.error || 'Compute failed');
            }
            const { results, bestAdditive, bestDistance } = yield res.json();
            setResults(results);
            setBestAdditive(bestAdditive);
            setBestDistance(bestDistance);
            setStep('results');
        }
        catch (err) {
            setError(err.message);
        }
        finally {
            setLoading(false);
        }
    });
    if (step === 'results') {
        return (_jsxs("div", { className: "results-container", children: [_jsx("h1", { children: "Results" }), error && _jsx("div", { className: "error", children: error }), _jsxs("div", { className: "results-summary", children: [_jsxs("div", { children: ["Best by Additive: #", bestAdditive.index, " (score=", bestAdditive.additive, ")"] }), _jsxs("div", { children: ["Best by Distance: #", bestDistance.index, " (distance=", bestDistance.distance, ")"] })] }), _jsx("div", { className: "table-container", children: _jsxs("table", { className: "results-table", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "Index" }), headers.map((h) => (_jsx("th", { children: h }, h))), headers.map((h) => (_jsx("th", { children: `Norm ${h}` }, `n-${h}`))), _jsx("th", { children: "Additive" }), _jsx("th", { children: "Distance" })] }) }), _jsx("tbody", { children: results.map((r) => (_jsxs("tr", { className: r.index === bestAdditive.index ||
                                        r.index === bestDistance.index
                                        ? 'highlight'
                                        : '', children: [_jsx("td", { children: r.index }), headers.map((h) => (_jsx("td", { children: r.original[h] }, h))), headers.map((h) => (_jsx("td", { children: r.normalized[h].toFixed(3) }, `n-${h}`))), _jsx("td", { children: r.additive }), _jsx("td", { children: r.distance })] }, r.index))) })] }) }), _jsx("button", { className: "upload-button", onClick: () => window.location.reload(), children: "Restart" })] }));
    }
    return (_jsxs("div", { className: "upload-container", children: [step === 'upload' && (_jsxs("form", { onSubmit: handleUpload, className: "upload-form", children: [_jsx("h1", { children: "Upload Excel" }), _jsx("input", { type: "file", accept: ".xlsx,.xls", onChange: handleFileChange, className: "upload-input" }), _jsx("button", { disabled: loading, className: "upload-button", children: loading ? 'Uploading...' : 'Upload & Next' }), error && _jsx("div", { className: "error", children: error })] })), step === 'weights' && (_jsxs("div", { className: "weights-container", children: [_jsx("h1", { children: "Setup Criteria" }), error && _jsx("div", { className: "error", children: error }), headers.map((col) => (_jsxs("div", { className: "weight-row", children: [_jsx("span", { children: col }), _jsx("input", { type: "range", min: 0, max: 1, step: 0.1, value: criteria[col].weight, onChange: (e) => handleWeightChange(col, parseFloat(e.target.value)) }), _jsx("span", { children: criteria[col].weight.toFixed(1) }), _jsx("button", { className: "toggle-button", onClick: () => handleDirectionToggle(col), children: criteria[col].direction === 'max' ? '↑' : '↓' })] }, col))), _jsx("div", { className: "button-group", children: _jsx("button", { className: "upload-button", onClick: handleCompute, disabled: loading, children: loading ? 'Computing...' : 'Compute' }) })] }))] }));
};
