var __awaiter =
  (this && this.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function (resolve) {
            resolve(value)
          })
    }
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value))
        } catch (e) {
          reject(e)
        }
      }
      function rejected(value) {
        try {
          step(generator['throw'](value))
        } catch (e) {
          reject(e)
        }
      }
      function step(result) {
        result.done
          ? resolve(result.value)
          : adopt(result.value).then(fulfilled, rejected)
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next())
    })
  }
import { jsx as _jsx, jsxs as _jsxs } from 'react/jsx-runtime'
import { useEffect, useState } from 'react'
import { useAuth } from '../lib/AuthContext'
import { useNavigate } from 'react-router-dom'
import '../styles/History.css'
export const HistoryPage = () => {
  const navigate = useNavigate()
  const { token } = useAuth()
  const [history, setHistory] = useState([])
  const [detail, setDetail] = useState(null)
  const [error, setError] = useState(null)
  useEffect(() => {
    fetchHistory()
  }, [])
  function fetchHistory() {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const res = yield fetch('http://localhost:4000/api/history', {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) throw yield res.json()
        const { history } = yield res.json()
        setHistory(history)
      } catch (err) {
        setError(err.error || 'Не удалось загрузить историю')
      }
    })
  }
  function loadDetail(id) {
    return __awaiter(this, void 0, void 0, function* () {
      setError(null)
      try {
        const res = yield fetch(`http://localhost:4000/api/history/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) throw yield res.json()
        const { history: row } = yield res.json()
        setDetail(row)
      } catch (err) {
        setError(err.error || 'Не удалось загрузить детали')
      }
    })
  }
  return _jsxs('div', {
    className: 'history-container',
    children: [
      _jsx('h2', { children: '\u0418\u0441\u0442\u043E\u0440\u0438\u044F' }),
      error && _jsx('div', { className: 'error', children: error }),
      _jsxs('table', {
        className: 'history-table',
        children: [
          _jsx('thead', {
            children: _jsxs('tr', {
              children: [
                _jsx('th', { children: 'ID' }),
                _jsx('th', { children: '\u0414\u0430\u0442\u0430' }),
                _jsx('th', { children: '\u0424\u0430\u0439\u043B' }),
                _jsx('th', {
                  children: '\u0414\u0435\u0439\u0441\u0442\u0432\u0438\u044F',
                }),
              ],
            }),
          }),
          _jsx('tbody', {
            children: history.map((r) =>
              _jsxs(
                'tr',
                {
                  children: [
                    _jsx('td', { children: r.id }),
                    _jsx('td', {
                      children: new Date(r.timestamp).toLocaleString(),
                    }),
                    _jsx('td', { children: r.filename || '—' }),
                    _jsxs('td', {
                      children: [
                        _jsx('button', {
                          onClick: () => loadDetail(r.id),
                          children: 'View',
                        }),
                        _jsx('button', {
                          onClick: () => navigate(`/upload?runId=${r.id}`),
                          children: 'Recompute',
                        }),
                      ],
                    }),
                  ],
                },
                r.id,
              ),
            ),
          }),
        ],
      }),
      detail &&
        _jsxs('div', {
          className: 'detail-section',
          children: [
            _jsxs('h3', {
              children: [
                '\u0424\u0430\u0439\u043B \u043E\u0442\u0447\u0451\u0442\u0430: ',
                detail.filename || '—',
              ],
            }),
            _jsx('h4', {
              children:
                '\u0418\u0442\u043E\u0433\u043E\u0432\u044B\u0435 \u0440\u0435\u0437\u0443\u043B\u044C\u0442\u0430\u0442\u044B',
            }),
            _jsxs('table', {
              className: 'result-table',
              children: [
                _jsx('thead', {
                  children: _jsxs('tr', {
                    children: [
                      _jsx('th', { children: '#' }),
                      _jsx('th', { children: 'Additive' }),
                      _jsx('th', { children: 'Distance' }),
                    ],
                  }),
                }),
                _jsx('tbody', {
                  children: detail.results.map((r) =>
                    _jsxs(
                      'tr',
                      {
                        className:
                          r.index === detail.bestAdditive.index
                            ? 'highlight-additive'
                            : r.index === detail.bestDistance.index
                              ? 'highlight-distance'
                              : '',
                        children: [
                          _jsx('td', { children: r.index + 2 }),
                          _jsx('td', { children: r.additive.toFixed(3) }),
                          _jsx('td', { children: r.distance.toFixed(3) }),
                        ],
                      },
                      r.index,
                    ),
                  ),
                }),
              ],
            }),
          ],
        }),
    ],
  })
}
