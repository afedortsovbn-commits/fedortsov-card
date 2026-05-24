import cors from 'cors'
import 'dotenv/config'
import crypto from 'node:crypto'
import express from 'express'
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')
const dbPath = path.join(__dirname, 'data', 'db.json')
const app = express()
const port = process.env.PORT || 4174
const adminPassword = process.env.ADMIN_PASSWORD || 'admin12345'
const tokenSecret = process.env.ADMIN_TOKEN_SECRET || adminPassword
const tokenLifetimeMs = 12 * 60 * 60 * 1000

app.use(cors())
app.use(express.json({ limit: '3mb' }))

async function readDb() {
  const content = await readFile(dbPath, 'utf8')
  return JSON.parse(content)
}

async function writeDb(db) {
  await writeFile(dbPath, `${JSON.stringify(db, null, 2)}\n`, 'utf8')
}

function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`
}

function signPayload(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const signature = crypto.createHmac('sha256', tokenSecret).update(body).digest('base64url')
  return `${body}.${signature}`
}

function verifyToken(token) {
  if (!token || !token.includes('.')) {
    return false
  }
  const [body, signature] = token.split('.')
  try {
    const expected = crypto.createHmac('sha256', tokenSecret).update(body).digest('base64url')
    if (signature.length !== expected.length) {
      return false
    }
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
      return false
    }
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'))
    return payload.role === 'admin' && payload.expiresAt > Date.now()
  } catch {
    return false
  }
}

function requireAdmin(request, response, next) {
  const token = request.headers.authorization?.replace('Bearer ', '')
  if (!verifyToken(token)) {
    response.status(401).json({ message: 'Требуется вход в админку' })
    return
  }
  next()
}

app.post('/api/auth/login', (request, response) => {
  if (request.body.password !== adminPassword) {
    response.status(401).json({ message: 'Неверный пароль' })
    return
  }
  response.json({
    token: signPayload({ role: 'admin', expiresAt: Date.now() + tokenLifetimeMs }),
  })
})

app.get('/api/news', async (_request, response) => {
  const db = await readDb()
  response.json(db.news.map((item) => ({ status: 'approved', ...item })).sort((a, b) => new Date(b.date) - new Date(a.date)))
})

app.post('/api/news', requireAdmin, async (request, response) => {
  const db = await readDb()
  const newsItem = {
    id: createId('news'),
    title: request.body.title,
    date: request.body.date || new Date().toISOString(),
    image: request.body.image || '/images/news-ai.svg',
    text: request.body.text,
    status: request.body.status === 'approved' ? 'approved' : 'pending',
  }
  db.news.unshift(newsItem)
  await writeDb(db)
  response.status(201).json(newsItem)
})

app.put('/api/news/:id', requireAdmin, async (request, response) => {
  const db = await readDb()
  const index = db.news.findIndex((item) => item.id === request.params.id)
  if (index === -1) {
    response.status(404).json({ message: 'Новость не найдена' })
    return
  }
  db.news[index] = { ...db.news[index], ...request.body, id: request.params.id }
  await writeDb(db)
  response.json(db.news[index])
})

app.delete('/api/news/:id', requireAdmin, async (request, response) => {
  const db = await readDb()
  db.news = db.news.filter((item) => item.id !== request.params.id)
  await writeDb(db)
  response.status(204).end()
})

app.get('/api/applications', requireAdmin, async (_request, response) => {
  const db = await readDb()
  response.json(db.applications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)))
})

app.post('/api/applications', async (request, response) => {
  const db = await readDb()
  const application = {
    id: createId('student'),
    createdAt: new Date().toISOString(),
    status: '',
    fullName: request.body.fullName || '',
    phone: request.body.phone || '',
    telegram: request.body.telegram || '',
    university: request.body.university || '',
    gradeAverage: request.body.gradeAverage || '',
    faculty: request.body.faculty || '',
    specialization: request.body.specialization || '',
    course: request.body.course || '',
    enrollmentYear: request.body.enrollmentYear || '',
    practiceDates: request.body.practiceDates || '',
  }
  db.applications.unshift(application)
  await writeDb(db)
  response.status(201).json(application)
})

app.put('/api/applications/:id', requireAdmin, async (request, response) => {
  const db = await readDb()
  const index = db.applications.findIndex((item) => item.id === request.params.id)
  if (index === -1) {
    response.status(404).json({ message: 'Заявка не найдена' })
    return
  }
  db.applications[index] = { ...db.applications[index], ...request.body, id: request.params.id }
  await writeDb(db)
  response.json(db.applications[index])
})

app.delete('/api/applications/:id', requireAdmin, async (request, response) => {
  const db = await readDb()
  db.applications = db.applications.filter((item) => item.id !== request.params.id)
  await writeDb(db)
  response.status(204).end()
})

app.use(express.static(path.join(rootDir, 'dist')))
app.get(/.*/, (_request, response) => {
  response.sendFile(path.join(rootDir, 'dist', 'index.html'))
})

app.listen(port, () => {
  console.log(`Сервер запущен: http://127.0.0.1:${port}`)
})
