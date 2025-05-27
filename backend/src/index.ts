import express, { Request, Response, NextFunction } from 'express'
import cors from 'cors'
import multer, { FileFilterCallback } from 'multer'
import * as xlsx from 'xlsx'
import path from 'path'
import Database from 'better-sqlite3'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'


const JWT_SECRET = process.env.JWT_SECRET || 'supersecret'
const PORT = process.env.PORT || 4000
const app = express()


app.use(cors())
app.use(express.json())


const db = new Database('app.db')
// Users
db.prepare(
  `CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL
  )`,
).run()

db.prepare(
  `CREATE TABLE IF NOT EXISTS runs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    criteria TEXT NOT NULL,
    results TEXT NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`,
).run()

try {
  db.prepare(`ALTER TABLE runs ADD COLUMN filename TEXT`).run();
} catch (e) {
 }


try {
  db.prepare(`ALTER TABLE runs ADD COLUMN updated_at DATETIME`).run();
} catch (e) {
 
}


interface AuthRequest extends Request {
  body: { username: string; password: string }
}
interface MulterRequest extends Request {
  file?: Express.Multer.File
  userId?: number
}
interface CriteriaEntry {
  weight: number
  direction: 'max' | 'min'
}


const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (_req, file, cb: FileFilterCallback) => {
    const ext = path.extname(file.originalname).toLowerCase()
    if (ext !== '.xlsx' && ext !== '.xls') {
      return new Error('Only Excel files are allowed')
    } else {
      cb(null, true)
    }
  },
})

function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const auth = req.headers.authorization
  if (!auth || !auth.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }
  const token = auth.slice(7)
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: number }
    ;(req as MulterRequest).userId = payload.userId
    next()
  } catch {
    res.status(401).json({ error: 'Invalid token' })
  }
}




app.post(
  '/auth/register',
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { username, password } = req.body
    if (!username || !password) {
      res.status(400).json({ error: 'Username and password required' })
      return
    }
    const hash = await bcrypt.hash(password, 10)
    try {
      const info = db
        .prepare('INSERT INTO users (username, password) VALUES (?, ?)')
        .run(username, hash)
      res.json({ userId: info.lastInsertRowid })
    } catch {
      res.status(400).json({ error: 'Username already exists' })
    }
  },
)


app.post(
  '/auth/login',
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { username, password } = req.body
    if (!username || !password) {
      res.status(400).json({ error: 'Username and password required' })
      return
    }
    const row = db
      .prepare('SELECT id, password FROM users WHERE username = ?')
      .get(username) as { id: number; password: string } | undefined
    if (!row) {
      res.status(400).json({ error: 'Invalid credentials' })
      return
    }
    const match = await bcrypt.compare(password, row.password)
    if (!match) {
      res.status(400).json({ error: 'Invalid credentials' })
      return
    }
    const token = jwt.sign({ userId: row.id }, JWT_SECRET, { expiresIn: '1h' })
    res.json({ token })
  },
)


app.post(
  '/api/upload',
  upload.single('file'),
  (req: MulterRequest, res: Response, next: NextFunction): void => {
    const file = req.file
    if (!file) {
      res.status(400).json({ error: 'No file uploaded' })
      return
    }
    try {
      const wb = xlsx.read(file.buffer, { type: 'buffer' })
      const sheet = wb.Sheets[wb.SheetNames[0]]
      const data = xlsx.utils.sheet_to_json(sheet, { defval: null }) as any[]
      const preview = data.slice(0, 5)
      const headers = preview.length ? Object.keys(preview[0]) : []
      res.json({ headers, preview })
    } catch (err) {
      next(err)
    }
  },
)


app.post(
  '/api/compute',
  authMiddleware,
  upload.single('file'),
  (req: MulterRequest, res: Response, next: NextFunction): void => {
    const file = req.file
    const critStr = (req.body as any).criteria
    if (!file) {
      res.status(400).json({ error: 'No file uploaded' })
      return
    }
    if (!critStr) {
      res.status(400).json({ error: 'Criteria not provided' })
      return
    }
    let criteria: Record<string, CriteriaEntry>
    try {
      criteria = JSON.parse(critStr)
    } catch {
      res.status(400).json({ error: 'Invalid criteria JSON' })
      return
    }
    try {
      const wb = xlsx.read(file.buffer, { type: 'buffer' })
      const data = xlsx.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], {
        defval: 0,
      }) as any[]
      const cols = Object.keys(criteria)
      const minMax: Record<string, { min: number; max: number }> = {}
      cols.forEach((col) => {
        const vals = data.map((r) => Number(r[col]) || 0)
        minMax[col] = { min: Math.min(...vals), max: Math.max(...vals) }
      })
      const normalized = data.map((row) => {
        const nr: Record<string, number> = {}
        cols.forEach((col) => {
          let v = Number(row[col]) || 0
          const { min, max } = minMax[col]
          let norm = max > min ? (v - min) / (max - min) : 0
          if (criteria[col].direction === 'min') norm = 1 - norm
          nr[col] = parseFloat(norm.toFixed(4))
        })
        return nr
      })
      const ideal: Record<string, number> = {}
      cols.forEach((col) => {
        ideal[col] = 1
      })
      const results = normalized.map((nr, idx) => {
        let additive = 0
        cols.forEach((col) => {
          additive += nr[col] * criteria[col].weight
        })
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
      // Select best
      const maxAdd = Math.max(...results.map((r) => r.additive))
      let bestAddArr = results.filter((r) => r.additive === maxAdd)
      if (bestAddArr.length > 1) {
        const minD = Math.min(...bestAddArr.map((r) => r.distance))
        bestAddArr = bestAddArr.filter((r) => r.distance === minD)
      }
      const bestAdditive = bestAddArr[0]
      const minDistAll = Math.min(...results.map((r) => r.distance))
      let bestDistArr = results.filter((r) => r.distance === minDistAll)
      if (bestDistArr.length > 1) {
        const maxA2 = Math.max(...bestDistArr.map((r) => r.additive))
        bestDistArr = bestDistArr.filter((r) => r.additive === maxA2)
      }
      const bestDistance = bestDistArr[0]
    
      db.prepare(
        'INSERT INTO runs (user_id,criteria,results,filename) VALUES (?,?,?,?)',
      ).run(req.userId, critStr, JSON.stringify(results),file.originalname)
      res.json({ results, bestAdditive, bestDistance, })
    } catch (err) {
      next(err)
    }
  },
)


app.get(
  '/api/history',
  authMiddleware,
  (req: MulterRequest, res: Response): void => {
    const rows = db
      .prepare(
        'SELECT id, timestamp,filename FROM runs WHERE user_id = ? ORDER BY timestamp DESC',
      )
      .all(req.userId)
    res.json({ history: rows })
  },
)


app.get('/api/history/:id', authMiddleware, (req: MulterRequest, res: Response): void => {
  const id = Number(req.params.id);
  const row = db
    .prepare(
      `SELECT id, timestamp, filename, results 
         FROM runs 
        WHERE id = ? AND user_id = ?`
    )
    .get(id, req.userId as number) as
      | { id: number; timestamp: string; filename: string; results: string }
      | undefined;

  if (!row) {
    res.status(404).json({ error: 'Not found' });
    return;
  }

  // Парсим результаты
  const results = JSON.parse(row.results) as Array<{
    index: number;
    additive: number;
    distance: number;
  }>;

  // Ищем bestAdditive
  let bestAdditive = results[0];
  results.forEach(r => {
    if (
      r.additive > bestAdditive.additive ||
      (r.additive === bestAdditive.additive && r.distance < bestAdditive.distance)
    ) {
      bestAdditive = r;
    }
  });

  // Ищем bestDistance
  let bestDistance = results[0];
  results.forEach(r => {
    if (
      r.distance < bestDistance.distance ||
      (r.distance === bestDistance.distance && r.additive > bestDistance.additive)
    ) {
      bestDistance = r;
    }
  });

  res.json({
    history: {
      id: row.id,
      timestamp: row.timestamp,
      filename: row.filename,
      results,
      bestAdditive,
      bestDistance,
    },
  });
});



app.put('/api/history/:id', authMiddleware, (req: MulterRequest, res: Response): void => {
  const id = Number(req.params.id);
  const { params } = req.body;
  if (typeof params !== 'object') {
    res.status(400).json({ error: 'Invalid params' });
    return;
  }
  const exists = db.prepare('SELECT 1 FROM runs WHERE id = ? AND user_id = ?').get(id, req.userId);
  if (!exists) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  db.prepare(
    'UPDATE runs SET criteria = ?, results = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
  ).run(JSON.stringify(params), JSON.stringify([]), id);
  res.json({ message: 'Parameters updated' });
});



app.post(
  '/api/history/:id/compute',
  authMiddleware,
  (req: MulterRequest, res: Response, next: NextFunction): void => {
    const id = Number(req.params.id);
  
    const row = db
      .prepare('SELECT criteria, results FROM runs WHERE id = ? AND user_id = ?')
      .get(id, req.userId) as { criteria: string; results: string } | undefined;
    if (!row) {
      res.status(404).json({ error: 'Not found' });
      return;
    }

    try {
      
      const criteria = JSON.parse(row.criteria) as Record<
        string,
        { weight: number; direction: 'max' | 'min' }
      >;
      const prev = JSON.parse(row.results) as any[];
    
      const rawData = prev.map((r) => r.original);
      const cols = Object.keys(criteria);

     
      const minMax: Record<string, { min: number; max: number }> = {};
      cols.forEach((c) => {
        const vals = rawData.map((r) => Number(r[c]) || 0);
        minMax[c] = { min: Math.min(...vals), max: Math.max(...vals) };
      });

     
      const normalized = rawData.map((r) => {
        const nr: Record<string, number> = {};
        cols.forEach((c) => {
          let v = Number(r[c]) || 0;
          const { min, max } = minMax[c];
          let z = max > min ? (v - min) / (max - min) : 0;
          if (criteria[c].direction === 'min') z = 1 - z;
          nr[c] = parseFloat(z.toFixed(4));
        });
        return nr;
      });

      const ideal = Object.fromEntries(cols.map((c) => [c, 1])) as Record<string, number>;
      const results = normalized.map((nr, i) => {
        const additive = parseFloat(
          cols.reduce((s, c) => s + nr[c] * criteria[c].weight, 0).toFixed(4)
        );
        const distance = parseFloat(
          Math.sqrt(
            cols.reduce((s, c) => s + Math.pow(ideal[c] - nr[c], 2), 0)
          ).toFixed(4)
        );
        return { index: i, original: rawData[i], normalized: nr, additive, distance };
      });

     
      let bestAdd = results.filter((r) => r.additive === Math.max(...results.map((r) => r.additive)));
      if (bestAdd.length > 1) {
        const minD = Math.min(...bestAdd.map((r) => r.distance));
        bestAdd = bestAdd.filter((r) => r.distance === minD);
      }
      let bestDist = results.filter((r) => r.distance === Math.min(...results.map((r) => r.distance)));
      if (bestDist.length > 1) {
        const maxA = Math.max(...bestDist.map((r) => r.additive));
        bestDist = bestDist.filter((r) => r.additive === maxA);
      }

    
      db.prepare('UPDATE runs SET results = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
        .run(JSON.stringify(results), id);

     
      res.json({
        results,
        bestAdditive: bestAdd[0],
        bestDistance: bestDist[0],
      });
    } catch (err) {
      next(err);
    }
  }
);





app.use((err: any, _req: Request, res: Response, _next: NextFunction): void => {
  console.error(err)
  res.status(500).json({ error: err.message || 'Internal server error' })
})

app.listen(PORT, () =>
  console.log(`Server listening at http://localhost:${PORT}`),
)
