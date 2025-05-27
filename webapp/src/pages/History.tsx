import React, { useEffect, useState } from 'react';
import { useAuth } from '../lib/AuthContext';
import { useNavigate } from 'react-router-dom';
import '../styles/History.css';

interface Run { id: number; timestamp: string; filename: string; }
interface RunDetail {
  id: number;
  timestamp: string;
  filename: string;
  results: Array<{ index: number; additive: number; distance: number }>;
  bestAdditive: { index: number };
  bestDistance: { index: number };
}

export const HistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [history, setHistory] = useState<Run[]>([]);
  const [detail, setDetail] = useState<RunDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { fetchHistory(); }, []);

  async function fetchHistory() {
    try {
      const res = await fetch('http://localhost:4000/api/history', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw await res.json();
      const { history } = await res.json();
      setHistory(history);
    } catch (err: any) {
      setError(err.error || 'Не удалось загрузить историю');
    }
  }

  async function loadDetail(id: number) {
    setError(null);
    try {
      const res = await fetch(`http://localhost:4000/api/history/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw await res.json();
      const { history: row } = await res.json();
      setDetail(row);
    } catch (err: any) {
      setError(err.error || 'Не удалось загрузить детали');
    }
  }

  return (
    <div className="history-container">
      <h2>История</h2>
      {error && <div className="error">{error}</div>}

      <table className="history-table">
        <thead>
          <tr><th>ID</th><th>Дата</th><th>Файл</th><th>Действия</th></tr>
        </thead>
        <tbody>
          {history.map(r => (
            <tr key={r.id}>
              <td>{r.id}</td>
              <td>{new Date(r.timestamp).toLocaleString()}</td>
              <td>{r.filename || '—'}</td>
              <td>
                <button onClick={() => loadDetail(r.id)}>View</button>
                <button onClick={() => navigate(`/upload?runId=${r.id}`)}>
                  Recompute
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {detail && (
        <div className="detail-section">
          <h3>Файл отчёта: {detail.filename || '—'}</h3>
          <h4>Итоговые результаты</h4>
          <table className="result-table">
            <thead>
              <tr><th>#</th><th>Additive</th><th>Distance</th></tr>
            </thead>
            <tbody>
              {detail.results.map(r => (
                <tr
                  key={r.index}
                  className={
                    r.index === detail.bestAdditive.index
                      ? 'highlight-additive'
                      : r.index === detail.bestDistance.index
                        ? 'highlight-distance'
                        : ''
                  }
                >
                  <td>{r.index}</td>
                  <td>{r.additive.toFixed(3)}</td>
                  <td>{r.distance.toFixed(3)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

