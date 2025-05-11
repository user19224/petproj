import express, { Request, Response, NextFunction } from 'express'
import cors from 'cors'
import multer, { FileFilterCallback } from 'multer'
import * as xlsx from 'xlsx'
import path from 'path'

interface MulterRequest extends Request {
  file?: Express.Multer.File
}

const app = express()
const PORT = process.env.PORT || 4000

app.use(cors())

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (
    req: Request,
    file: Express.Multer.File,
    cb: FileFilterCallback,
  ) => {
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
    const headers = preview.length > 0 ? Object.keys(preview[0]) : []

    return res.json({ headers, preview })
  } catch (err: any) {
    return err
  }
})

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err)
  res.status(500).json({ error: err.message || 'Internal server error' })
})

app.listen(PORT, () => {
  console.log(`Backend server listening on http://localhost:${PORT}`)
})
