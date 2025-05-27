import React, {
  useState,
  useEffect,
  ChangeEvent,
  FormEvent
} from 'react'
import { useAuth } from '../lib/AuthContext'
import { useSearchParams, useNavigate } from 'react-router-dom'
import '../styles/UploadPreview.css'
import '../styles/WeightsSetup.css'
import '../styles/Results.css'

interface PreviewRow {
  [key: string]: any
}
interface CriteriaEntry {
  weight: number
  direction: 'max' | 'min'
}
type Criteria = Record<string, CriteriaEntry>

export const UploadPreview: React.FC = () => {
  const [search] = useSearchParams()
  const runId = search.get('runId')
  const isEditing = !!runId
  const { token } = useAuth()
  const navigate = useNavigate()

  const [step, setStep] = useState<'upload' | 'weights' | 'results'>(
    isEditing ? 'weights' : 'upload'
  )
  const [file, setFile] = useState<File | null>(null)
  const [headers, setHeaders] = useState<string[]>([])
  const [preview, setPreview] = useState<PreviewRow[]>([])
  const [criteria, setCriteria] = useState<Criteria>({})
  const [results, setResults] = useState<any[]>([])
  const [bestAdditive, setBestAdditive] = useState<any | null>(null)
  const [bestDistance, setBestDistance] = useState<any | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  
  useEffect(() => {
    if (!isEditing) {
      setStep('upload')
      setFile(null)
      setHeaders([])
      setPreview([])
      setCriteria({})
      setResults([])
      setBestAdditive(null)
      setBestDistance(null)
      setError(null)
    }
  }, [isEditing])

  
  useEffect(() => {
    if (!isEditing) return
    setLoading(true)
    fetch(`http://localhost:4000/api/history/${runId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => {
        if (!res.ok) throw res
        return res.json()
      })
      .then(data => {
        const row = data.history
        const parsed = JSON.parse(row.results) as Array<{
          original: PreviewRow
        }>
        const raw = parsed.map(r => r.original)
        if (raw.length) {
          setHeaders(Object.keys(raw[0]))
          setPreview(raw.slice(0, 5))
          setCriteria(JSON.parse(row.criteria))
          setStep('weights')
        }
      })
      .catch((err: any) =>
        setError(err.error || 'Failed to load run for editing')
      )
      .finally(() => setLoading(false))
  }, [isEditing, runId, token])

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    setError(null)
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0])
    }
  }

  const handleUpload = async (e: FormEvent) => {
    e.preventDefault()
    if (!file) {
      setError('Select a file')
      return
    }
    setLoading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('http://localhost:4000/api/upload', {
        method: 'POST',
        body: form,
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Upload failed')
      }
      const { headers, preview } = await res.json()
      setHeaders(headers)
      setPreview(preview)


      const w = parseFloat((1 / headers.length).toFixed(1))
      const init: Criteria = {}
      headers.forEach((h:any) => {
        init[h] = { weight: w, direction: 'max' }
      })
      setCriteria(init)
      setStep('weights')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleWeightChange = (col: string, val: number) => {
    setCriteria(prev => ({
      ...prev,
      [col]: { ...prev[col], weight: val },
    }))
  }
  const handleDirectionToggle = (col: string) => {
    setCriteria(prev => ({
      ...prev,
      [col]: {
        ...prev[col],
        direction: prev[col].direction === 'max' ? 'min' : 'max',
      },
    }))
  }

  const handleCompute = async () => {
    setLoading(true)
    setError(null)
    try {
      let res: Response
      if (isEditing) {
     
        res = await fetch(
          `http://localhost:4000/api/history/${runId}/compute`,
          {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
          }
        )
      } else {
       
        const form = new FormData()
        form.append('file', file as File)
        form.append('criteria', JSON.stringify(criteria))
        res = await fetch('http://localhost:4000/api/compute', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: form,
        })
      }
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Compute failed')
      }
      const { results, bestAdditive, bestDistance } = await res.json()
      setResults(results)
      setBestAdditive(bestAdditive)
      setBestDistance(bestDistance)
      setStep('results')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (step === 'results') {
  return (
    <div className="upload-wrapper">
      <div className="results-card">
        <h1>Results</h1>

        {/* Карточки Best by */}
        <div className="best-cards">
          <div className="best-card">
            <span className="icon">🏆</span>
            <span>Best by Additive: #{bestAdditive.index} (score={bestAdditive.additive})</span>
          </div>
          <div className="best-card">
            <span className="icon">🏆</span>
            <span>Best by Distance: #{bestDistance.index} (distance={bestDistance.distance})</span>
          </div>
        </div>

        {/* Таблица с фиксированным хедом */}
        <div className="table-wrapper">
          <table className="results-table">
            <thead>
              <tr>
                <th>Index</th>
                {headers.map((h) => (
                  <th key={h}>{h}</th>
                ))}
                {headers.map((h) => (
                  <th key={`n-${h}`}>{`Norm ${h}`}</th>
                ))}
                <th>Additive</th>
                <th>Distance</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r) => (
                <tr
                  key={r.index}
                  className={
                    r.index === bestAdditive.index ||
                    r.index === bestDistance.index
                      ? 'highlight'
                      : ''
                  }
                >
                  <td>{r.index}</td>
                  {headers.map((h) => (
                    <td key={h}>{r.original[h]}</td>
                  ))}
                  {headers.map((h) => (
                    <td key={`n-${h}`}>{r.normalized[h].toFixed(3)}</td>
                  ))}
                  <td>{r.additive}</td>
                  <td>{r.distance}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      
        <button
          className="back-button"
          onClick={() => navigate('/history')}
        >
          Back to History
        </button>
      </div>
    </div>
  );
}

return (
  <div className="upload-wrapper">
    <div className="upload-card">
      {step === 'upload' && !isEditing && (
        <>
          <h1>Upload Excel</h1>
          <form onSubmit={handleUpload} className="upload-form">
            <div className="upload-input-wrapper">
              <label htmlFor="file">Выберите файл</label>
              <input
                id="file"
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
              />
              <span>{file ? file.name : 'Файл не выбран'}</span>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="upload-button"
            >
              {loading ? 'Uploading...' : 'Upload & Next'}
            </button>
            {error && <div className="error">{error}</div>}
          </form>
        </>
      )}

      {step === 'weights' && (
        <>
          <h1>Setup Criteria</h1>
          {error && <div className="error">{error}</div>}
          <div className="weights-container">
            {headers.map(col => (
              <div key={col} className="weight-row">
                <span>{col}</span>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.1}
                  value={criteria[col].weight}
                  onChange={e =>
                    handleWeightChange(col, parseFloat(e.target.value))
                  }
                />
                <span>{criteria[col].weight.toFixed(1)}</span>
                <button
                  className="toggle-button"
                  onClick={() => handleDirectionToggle(col)}
                >
                  {criteria[col].direction === 'max' ? '↑' : '↓'}
                </button>
              </div>
            ))}
          </div>
          <button
            className="upload-button compute-button"
            onClick={handleCompute}
            disabled={loading}
          >
            {loading
              ? (isEditing ? 'Recomputing...' : 'Computing...')
              : (isEditing ? 'Recompute' : 'Compute')}
          </button>
        </>
      )}
    </div>
  </div>
)



 }

