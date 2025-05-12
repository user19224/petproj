import React, { useState, ChangeEvent, FormEvent } from 'react'
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
  const [step, setStep] = useState<'upload' | 'weights' | 'results'>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [headers, setHeaders] = useState<string[]>([])
  const [preview, setPreview] = useState<PreviewRow[]>([])
  const [criteria, setCriteria] = useState<Criteria>({})
  const [results, setResults] = useState<any[]>([])
  const [bestAdditive, setBestAdditive] = useState<any | null>(null)
  const [bestDistance, setBestDistance] = useState<any | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    setError(null)
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0])
    }
  }
  const handleUpload = async (e: FormEvent) => {
    e.preventDefault()
    if (!file) return setError('Select file')
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
      headers.forEach((h: string) => {
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
    setCriteria({ ...criteria, [col]: { ...criteria[col], weight: val } })
  }
  const handleDirectionToggle = (col: string) => {
    const cur = criteria[col]
    setCriteria({
      ...criteria,
      [col]: { ...cur, direction: cur.direction === 'max' ? 'min' : 'max' },
    })
  }
  const handleCompute = async () => {
    setLoading(true)
    setError(null)
    try {
      const form = new FormData()
      form.append('file', file as File)
      form.append('criteria', JSON.stringify(criteria))
      const res = await fetch('http://localhost:4000/api/compute', {
        method: 'POST',
        body: form,
      })
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
      <div className="results-container">
        <h1>Results</h1>
        {error && <div className="error">{error}</div>}
        <div className="results-summary">
          <div>
            Best by Additive: #{bestAdditive.index} (score=
            {bestAdditive.additive})
          </div>
          <div>
            Best by Distance: #{bestDistance.index} (distance=
            {bestDistance.distance})
          </div>
        </div>
        <div className="table-container">
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
          className="upload-button"
          onClick={() => window.location.reload()}
        >
          Restart
        </button>
      </div>
    )
  }

  return (
    <div className="upload-container">
      {step === 'upload' && (
        <form onSubmit={handleUpload} className="upload-form">
          <h1>Upload Excel</h1>
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            className="upload-input"
          />
          <button disabled={loading} className="upload-button">
            {loading ? 'Uploading...' : 'Upload & Next'}
          </button>
          {error && <div className="error">{error}</div>}
        </form>
      )}
      {step === 'weights' && (
        <div className="weights-container">
          <h1>Setup Criteria</h1>
          {error && <div className="error">{error}</div>}
          {headers.map((col) => (
            <div key={col} className="weight-row">
              <span>{col}</span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.1}
                value={criteria[col].weight}
                onChange={(e) =>
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
          <div className="button-group">
            <button
              className="upload-button"
              onClick={handleCompute}
              disabled={loading}
            >
              {loading ? 'Computing...' : 'Compute'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
