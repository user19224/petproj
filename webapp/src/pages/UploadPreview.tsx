import React, { useState, ChangeEvent, FormEvent } from 'react'
import '../styles/UploadPreview.css'

interface PreviewRow {
  [key: string]: any
}

export const UploadPreview: React.FC = () => {
  const [file, setFile] = useState<File | null>(null)
  const [headers, setHeaders] = useState<string[]>([])
  const [preview, setPreview] = useState<PreviewRow[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    setError(null)
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0])
    } else {
      setFile(null)
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!file) {
      setError('Please select an Excel file first.')
      return
    }

    const formData = new FormData()
    formData.append('file', file)

    setLoading(true)
    try {
      const res = await fetch('http://localhost:4000/api/upload', {
        method: 'POST',
        body: formData,
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Upload failed')
      }
      const { headers, preview } = await res.json()
      setHeaders(headers)
      setPreview(preview)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="upload-container">
      <h1>Upload Excel and Preview</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileChange}
          className="upload-input"
        />
        <button type="submit" disabled={loading} className="upload-button">
          {loading ? 'Uploading...' : 'Upload & Preview'}
        </button>
      </form>
      {error && <div className="error">{error}</div>}
      {preview.length > 0 && (
        <div>
          <h2>Preview (first 5 rows)</h2>
          <div className="table-container">
            <table className="preview-table">
              <thead>
                <tr>
                  {headers.map((hdr) => (
                    <th key={hdr} className="px-4 py-2 text-left">
                      {hdr}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.map((row, idx) => (
                  <tr
                    key={idx}
                    className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                  >
                    {headers.map((hdr) => (
                      <td key={hdr}>
                        {row[hdr] != null ? String(row[hdr]) : ''}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
