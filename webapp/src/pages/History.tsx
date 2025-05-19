import React, { useEffect, useState } from 'react'
import { useAuth } from '../lib/AuthContext'

interface Run {
  id: number
  timestamp: string
  criteria: string
}

export const HistoryPage: React.FC = () => {
  const { token } = useAuth()
  const [history, setHistory] = useState<Run[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch('http://localhost:4000/api/history', {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) throw await res.json()
        const data = await res.json()
        setHistory(data.history)
      } catch (err: any) {
        setError(err.error || 'Failed to load history')
      }
    })()
  }, [token])

  return (
    <div className="history-container">
      <h2>History</h2>
      {error && <div className="error">{error}</div>}
      <ul>
        {history.map((run) => (
          <li key={run.id}>
            ID {run.id} — {new Date(run.timestamp).toLocaleString()} — Criteria:{' '}
            {run.criteria}
          </li>
        ))}
      </ul>
    </div>
  )
}
