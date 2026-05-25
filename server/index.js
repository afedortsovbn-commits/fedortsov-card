import cors from 'cors'
import 'dotenv/config'
import crypto from 'node:crypto'
import express from 'express'
import { access, copyFile, mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')
const bundledDbPath = path.join(__dirname, 'data', 'db.json')
const dbPath = process.env.DB_PATH ? path.resolve(process.env.DB_PATH) : bundledDbPath
const app = express()
const port = process.env.PORT || 4174
const adminPassword = process.env.ADMIN_PASSWORD || 'admin12345'
const tokenSecret = process.env.ADMIN_TOKEN_SECRET || adminPassword
const tokenLifetimeMs = 12 * 60 * 60 * 1000
const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN || ''
const telegramChatId = process.env.TELEGRAM_CHAT_ID || ''

app.use(cors())
app.use(express.json({ limit: '3mb' }))

async function ensureDb() {
  try {
    await access(dbPath)
  } catch {
    await mkdir(path.dirname(dbPath), { recursive: true })
    await copyFile(bundledDbPath, dbPath)
  }
}

async function readDb() {
  await ensureDb()
  const content = await readFile(dbPath, 'utf8')
  const db = JSON.parse(content)
  return {
    news: [],
    applications: [],
    jobs: [],
    resumes: [],
    ...db,
  }
}

async function writeDb(db) {
  await ensureDb()
  await writeFile(dbPath, `${JSON.stringify(db, null, 2)}\n`, 'utf8')
}

function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`
}

function compactLines(lines) {
  return lines.filter((line) => line && String(line).trim()).join('\n')
}

async function notifyTelegram(text) {
  if (!telegramBotToken || !telegramChatId) {
    return
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${telegramBotToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: telegramChatId,
        text,
        disable_web_page_preview: true,
      }),
    })

    if (!response.ok) {
      console.warn(`Telegram notification failed: ${response.status}`)
    }
  } catch (error) {
    console.warn('Telegram notification failed:', error)
  }
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

app.get('/api/jobs', async (_request, response) => {
  const db = await readDb()
  response.json(db.jobs.sort((a, b) => new Date(b.createdAt || b.startDate || 0) - new Date(a.createdAt || a.startDate || 0)))
})

app.post('/api/jobs', requireAdmin, async (request, response) => {
  const db = await readDb()
  const job = {
    id: createId('job'),
    createdAt: new Date().toISOString(),
    title: request.body.title || '',
    startDate: request.body.startDate || '',
    endDate: request.body.isOpenEnded ? '' : request.body.endDate || '',
    isOpenEnded: Boolean(request.body.isOpenEnded),
    city: request.body.city || '',
    workFormat: request.body.workFormat || '',
    requirements: request.body.requirements || '',
    responsibilities: request.body.responsibilities || '',
    status: request.body.status === 'paused' ? 'paused' : 'active',
  }
  db.jobs.unshift(job)
  await writeDb(db)
  response.status(201).json(job)
})

app.put('/api/jobs/:id', requireAdmin, async (request, response) => {
  const db = await readDb()
  const index = db.jobs.findIndex((item) => item.id === request.params.id)
  if (index === -1) {
    response.status(404).json({ message: 'Вакансия не найдена' })
    return
  }
  const nextJob = { ...db.jobs[index], ...request.body, id: request.params.id }
  if (nextJob.isOpenEnded) {
    nextJob.endDate = ''
  }
  db.jobs[index] = nextJob
  await writeDb(db)
  response.json(db.jobs[index])
})

app.delete('/api/jobs/:id', requireAdmin, async (request, response) => {
  const db = await readDb()
  db.jobs = db.jobs.filter((item) => item.id !== request.params.id)
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
  await notifyTelegram(compactLines([
    'Новая заявка на практику',
    `ФИО: ${application.fullName}`,
    `Телефон: ${application.phone}`,
    `Telegram: ${application.telegram}`,
    `ВУЗ: ${application.university}`,
    `Средний балл: ${application.gradeAverage}`,
    `Факультет: ${application.faculty}`,
    `Специализация: ${application.specialization}`,
    `Курс: ${application.course}`,
    `Год поступления: ${application.enrollmentYear}`,
    `Даты практики: ${application.practiceDates}`,
  ]))
  response.status(201).json(application)
})

app.post('/api/resumes', async (request, response) => {
  const db = await readDb()
  const job = db.jobs.find((item) => item.id === request.body.jobId)
  const resume = {
    id: createId('resume'),
    createdAt: new Date().toISOString(),
    jobId: request.body.jobId || '',
    jobTitle: job?.title || request.body.jobTitle || '',
    fullName: request.body.fullName || '',
    phone: request.body.phone || '',
    telegram: request.body.telegram || '',
    email: request.body.email || '',
    resumeLink: request.body.resumeLink || '',
    comment: request.body.comment || '',
  }
  db.resumes.unshift(resume)
  await writeDb(db)
  await notifyTelegram(compactLines([
    'Новый отклик на вакансию',
    `Вакансия: ${resume.jobTitle || 'не указана'}`,
    `ФИО: ${resume.fullName}`,
    `Телефон: ${resume.phone}`,
    `Telegram: ${resume.telegram}`,
    `E-mail: ${resume.email}`,
    `Резюме: ${resume.resumeLink}`,
    `Комментарий: ${resume.comment}`,
  ]))
  response.status(201).json(resume)
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
