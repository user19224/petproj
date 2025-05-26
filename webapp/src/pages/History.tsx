import React, { useEffect, useState } from 'react';
import { useAuth } from '../lib/AuthContext';
import '../styles/History.css';
import { useNavigate } from 'react-router-dom';

interface Run { id: number; timestamp: string; /* … */ }
interface RunDetail {
  id: number;
  timestamp: string;
  // предполагаем, что здесь лежит полный массив объектов — каждый row содержит все столбцы исходной таблицы, плюс
  // { additive, distance }
  results: Array<Record<string, any>>;
  bestAdditive: any;
  bestDistance: any;
}

export const HistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [history, setHistory] = useState<Run[]>([]);
  const [detail, setDetail] = useState<RunDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  async function fetchHistory() {
    try {
      const res = await fetch('http://localhost:4000/api/history', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw await res.json();
      const { history } = await res.json();
      setHistory(history);
    } catch (err: any) {
      setError(err.error || 'Failed to load history');
    }
  }

  async function loadDetail(id: number) {
    setError(null);
    try {
      const res = await fetch(`http://localhost:4000/api/history/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw await res.json();
      const { history: row } = await res.json();
      const parsed: any = JSON.parse(row.results);
      setDetail({
        id: row.id,
        timestamp: row.timestamp,
        results: parsed,                // здесь parsed — массив объектов
        bestAdditive: parsed.bestAdditive,
        bestDistance: parsed.bestDistance
      });
    } catch (err: any) {
      setError(err.error || 'Failed to load details');
    }
  }

  return (
    <div className="history-container">
      <h2>History</h2>
      {error && <div className="error">{error}</div>}

      <table className="history-table">
        <thead>
          <tr><th>ID</th><th>Timestamp</th><th>Actions</th></tr>
        </thead>
        <tbody>
          {history.map(run => (
            <tr key={run.id}>
              <td>{run.id}</td>
              <td>{new Date(run.timestamp).toLocaleString()}</td>
              <td>
                <button onClick={() => loadDetail(run.id)}>View</button>
                <button onClick={() => navigate(`/upload?runId=${run.id}`)}>Recompute</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* --- модальное окно деталей --- */}
      {detail && (
        <div className="modal-overlay" onClick={() => setDetail(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setDetail(null)}>×</button>
            <h3>Details for Run #{detail.id}</h3>
            <p><strong>Timestamp:</strong> {new Date(detail.timestamp).toLocaleString()}</p>

            {/* 1) Полная исходная таблица */}
            <div className="table-wrapper">
              <h4>Full Data</h4>
              <table className="base-table">
                <thead>
                  <tr>
                    {Object.keys(detail.results[0]).map(col => (
                      // не рисуем в шапке поля bestAdditive/bestDistance
                      col === 'bestAdditive' || col === 'bestDistance' ? null : 
                      <th key={col}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {detail.results.map((row, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'even' : 'odd'}>
                      {Object.entries(row).map(([col, val]) =>
                        (col === 'bestAdditive' || col === 'bestDistance') ? null :
                        <td key={col}>{val}</td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 2) Результирующая табличка */}
            <div className="table-wrapper results-section">
              <h4>Results</h4>
              <table className="result-table">
                <thead>
                  <tr><th>Index</th><th>Additive</th><th>Distance</th></tr>
                </thead>
                <tbody>
                  {detail.results.map((r, i) => (
                    <tr key={i} className={i === detail.bestAdditive.index || i === detail.bestDistance.index ? 'highlight' : ''}>
                      <td>{r.index}</td>
                      <td>{r.additive.toFixed(3)}</td>
                      <td>{r.distance.toFixed(3)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

