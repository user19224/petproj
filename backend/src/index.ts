import express, { Request, Response, NextFunction } from 'express'
import cors from 'cors'
import multer, { FileFilterCallback } from 'multer'
import * as xlsx from 'xlsx'
import path from 'path'

interface MulterRequest extends Request {
  file?: Express.Multer.File
  body: {
    criteria?: string
  }
}

const app = express()
const PORT = process.env.PORT || 4000

app.use(cors())

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (_req, file, cb: FileFilterCallback) => {
    const ext = path.extname(file.originalname).toLowerCase()
    if (ext !== '.xlsx' && ext !== '.xls') {
      return new Error('Only Excel files are allowed')
    }
    cb(null, true)
  },
})

app.post('/api/upload', upload.single('file'), (req, res) => {
  const file = req.file
  if (!file) {
    return res.status(400).json({ error: 'No file uploaded' })
  }
  try {
    const workbook = xlsx.read(file.buffer, { type: 'buffer' })
    const sheetName = workbook.SheetNames[0]
    const sheet = workbook.Sheets[sheetName]
    const data: any[] = xlsx.utils.sheet_to_json(sheet, { defval: null })
    const preview = data.slice(0, 5)
    const headers = preview.length ? Object.keys(preview[0]) : []
    return res.json({ headers, preview })
  } catch (err: any) {
    return err.message
  }
})

app.post('/api/compute', upload.single('file'), (req, res) => {
  const file = req.file
  const critStr = req.body.criteria
  if (!file) return res.status(400).json({ error: 'No file uploaded' })
  if (!critStr) return res.status(400).json({ error: 'Criteria not provided' })

  let criteria: Record<string, { weight: number; direction: 'max' | 'min' }>
  try {
    criteria = JSON.parse(critStr)
  } catch {
    return res.status(400).json({ error: 'Invalid criteria JSON' })
  }

  try {
    const wb = xlsx.read(file.buffer, { type: 'buffer' })
    const sheet = wb.Sheets[wb.SheetNames[0]]
    const data: any[] = xlsx.utils.sheet_to_json(sheet, { defval: 0 })
    const cols = Object.keys(criteria)

    const minMax: Record<string, { min: number; max: number }> = {}
    cols.forEach((col) => {
      const vals = data.map((r) => Number(r[col]) || 0)
      minMax[col] = { min: Math.min(...vals), max: Math.max(...vals) }
    })

    const normalized = data.map((row) => {
      const normRow: Record<string, number> = {}
      cols.forEach((col) => {
        const raw = Number(row[col]) || 0
        const { min, max } = minMax[col]
        let norm = max > min ? (raw - min) / (max - min) : 0
        if (criteria[col].direction === 'min') norm = 1 - norm
        normRow[col] = parseFloat(norm.toFixed(4))
      })
      return normRow
    })

    const ideal: Record<string, number> = {}
    cols.forEach((col) => {
      ideal[col] = 1
    })

    const results = normalized.map((nr, idx) => {
      let additive = 0
      cols.forEach((col) => (additive += nr[col] * criteria[col].weight))
      additive = parseFloat(additive.toFixed(4))

      const dist = Math.sqrt(
        cols.reduce((sum, col) => sum + Math.pow(ideal[col] - nr[col], 2), 0),
      )
      const distance = parseFloat(dist.toFixed(4))

      return {
        index: idx,
        original: data[idx],
        normalized: nr,
        additive,
        distance,
      }
    })

    const maxAdd = Math.max(...results.map((r) => r.additive))
    let bestByAdd = results.filter((r) => r.additive === maxAdd)
    if (bestByAdd.length > 1) {
      const minDist = Math.min(...bestByAdd.map((r) => r.distance))
      bestByAdd = bestByAdd.filter((r) => r.distance === minDist)
    }
    const bestAdditive = bestByAdd[0]

    const minDistAll = Math.min(...results.map((r) => r.distance))
    let bestByDist = results.filter((r) => r.distance === minDistAll)
    if (bestByDist.length > 1) {
      const maxAdd2 = Math.max(...bestByDist.map((r) => r.additive))
      bestByDist = bestByDist.filter((r) => r.additive === maxAdd2)
    }
    const bestDistance = bestByDist[0]

    return res.json({ results, bestAdditive, bestDistance })
  } catch (err: any) {
    return err.message
  }
})

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err)
  res.status(500).json({ error: err.message || 'Internal server error' })
})

app.listen(PORT, () => console.log(`Server on http://localhost:${PORT}`))
