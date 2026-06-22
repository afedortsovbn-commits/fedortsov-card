import { readNews, writeNews, getImage } from '../news-service/store.js'
import { runDaily, handleTelegramUpdate } from '../news-service/service.js'

const allowedOrigins = new Set([
  'https://afedortsovbn-commits.github.io',
  'http://127.0.0.1:5176',
  'http://localhost:5176',
])

const jobsKey = 'jobs'
const adminPasswordKey = 'admin-password'
const tokenLifetimeMs = 12 * 60 * 60 * 1000
const maxResumeSize = 10 * 1024 * 1024

const applicationRequiredFields = [
  ['fullName', 'ФИО'],
  ['phone', 'Телефон'],
  ['university', 'ВУЗ'],
  ['faculty', 'Факультет'],
  ['specialization', 'Специализация'],
  ['course', 'Курс'],
  ['enrollmentYear', 'Год поступления'],
  ['practiceDates', 'Даты практики'],
]

function corsHeaders(origin) {
  if (!allowedOrigins.has(origin)) {
    return {}
  }

  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  }
}

function jsonResponse(body, status, origin) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...corsHeaders(origin),
    },
  })
}

function clean(value, maxLength = 500) {
  return String(value ?? '').trim().slice(0, maxLength)
}

function encodeBase64Url(value) {
  const bytes = typeof value === 'string' ? new TextEncoder().encode(value) : value
  let binary = ''
  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function decodeBase64Url(value) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')
  return atob(padded)
}

async function hmac(value, secret) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  return new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value)))
}

async function createAdminToken(secret) {
  const payload = encodeBase64Url(JSON.stringify({
    role: 'admin',
    expiresAt: Date.now() + tokenLifetimeMs,
  }))
  return `${payload}.${encodeBase64Url(await hmac(payload, secret))}`
}

async function derivePasswordHash(password, salt, secret) {
  return encodeBase64Url(await hmac(`${salt}:${password}`, secret))
}

async function verifyPassword(password, env) {
  const stored = await env.JOBS.get(adminPasswordKey, 'json')
  if (stored?.salt && stored?.hash) {
    return await derivePasswordHash(password, stored.salt, env.ADMIN_TOKEN_SECRET) === stored.hash
  }
  return Boolean(env.ADMIN_PASSWORD) && password === env.ADMIN_PASSWORD
}

async function savePassword(password, env) {
  const salt = crypto.randomUUID()
  await env.JOBS.put(adminPasswordKey, JSON.stringify({
    salt,
    hash: await derivePasswordHash(password, salt, env.ADMIN_TOKEN_SECRET),
    updatedAt: new Date().toISOString(),
  }))
}

async function verifyAdmin(request, env) {
  const token = request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '')
  if (!token || !token.includes('.') || !env.ADMIN_TOKEN_SECRET) {
    return false
  }

  const [payload, signature] = token.split('.')
  try {
    const expected = encodeBase64Url(await hmac(payload, env.ADMIN_TOKEN_SECRET))
    if (signature !== expected) {
      return false
    }
    const parsed = JSON.parse(decodeBase64Url(payload))
    return parsed.role === 'admin' && parsed.expiresAt > Date.now()
  } catch {
    return false
  }
}

async function requireAdmin(request, env, origin) {
  if (await verifyAdmin(request, env)) {
    return null
  }
  return jsonResponse({ message: 'Требуется вход в админку' }, 401, origin)
}

async function readJobs(env) {
  const jobs = (await env.JOBS.get(jobsKey, 'json')) || []
  return jobs.map((job) => ({ conditions: '', ...job }))
}

async function writeJobs(env, jobs) {
  await env.JOBS.put(jobsKey, JSON.stringify(jobs))
}

function normalizeNews(data, existing = {}) {
  return {
    ...existing,
    title: clean(data.title, 200),
    date: clean(data.date, 30) || existing.date || new Date().toISOString(),
    image: clean(data.image, 500) || existing.image || '/images/news-ai.svg',
    text: clean(data.text, 6000),
    sourceUrl: clean(data.sourceUrl, 500),
    sourceName: clean(data.sourceName, 150),
    status: data.status === 'approved' ? 'approved' : (existing.status || 'pending'),
  }
}

function validateNews(item) {
  const missing = []
  if (!item.title) missing.push('заголовок')
  if (!item.text) missing.push('текст')
  return missing
}

function normalizeJob(data, existing = {}) {
  const isOpenEnded = Boolean(data.isOpenEnded)
  return {
    ...existing,
    title: clean(data.title, 150),
    startDate: clean(data.startDate, 20),
    endDate: isOpenEnded ? '' : clean(data.endDate, 20),
    isOpenEnded,
    city: clean(data.city, 100),
    workFormat: clean(data.workFormat, 100),
    conditions: clean(data.conditions, 2000),
    requirements: clean(data.requirements, 4000),
    responsibilities: clean(data.responsibilities, 4000),
    status: data.status === 'paused' ? 'paused' : 'active',
  }
}

function validateJob(job) {
  const missing = []
  if (!job.title) missing.push('должность')
  if (!job.city) missing.push('город')
  if (!job.workFormat) missing.push('формат работы')
  if (!job.requirements) missing.push('требования')
  if (!job.responsibilities) missing.push('задачи и обязанности')
  return missing
}

function formatApplication(data) {
  const fields = {
    fullName: clean(data.fullName, 150),
    phone: clean(data.phone, 50),
    telegram: clean(data.telegram, 100),
    university: clean(data.university, 200),
    gradeAverage: clean(data.gradeAverage, 30),
    faculty: clean(data.faculty, 200),
    specialization: clean(data.specialization, 200),
    course: clean(data.course, 30),
    enrollmentYear: clean(data.enrollmentYear, 20),
    practiceDates: clean(data.practiceDates, 200),
  }
  const missing = applicationRequiredFields
    .filter(([key]) => !fields[key])
    .map(([, label]) => label)
  return { fields, missing }
}

async function sendTelegram(env, text) {
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) {
    return false
  }

  const response = await fetch(
    `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: env.TELEGRAM_CHAT_ID,
        text,
        disable_web_page_preview: true,
      }),
    },
  )
  return response.ok
}

function isAllowedResume(file) {
  if (!(file instanceof File) || file.size === 0 || file.size > maxResumeSize) {
    return false
  }
  const allowedTypes = new Set([
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ])
  const extension = file.name.toLowerCase().split('.').pop()
  return allowedTypes.has(file.type) || ['pdf', 'doc', 'docx'].includes(extension)
}

async function sendTelegramDocument(env, text, file) {
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) {
    return false
  }
  const form = new FormData()
  form.set('chat_id', env.TELEGRAM_CHAT_ID)
  form.set('caption', text.slice(0, 1024))
  form.set('document', file, file.name)
  const response = await fetch(
    `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendDocument`,
    { method: 'POST', body: form },
  )
  return response.ok
}

function applicationText(fields) {
  return [
    'Новая заявка на практику',
    `ФИО: ${fields.fullName}`,
    `Телефон: ${fields.phone}`,
    `Telegram: ${fields.telegram || 'не указан'}`,
    `ВУЗ: ${fields.university}`,
    `Средний балл: ${fields.gradeAverage || 'не указан'}`,
    `Факультет: ${fields.faculty}`,
    `Специализация: ${fields.specialization}`,
    `Курс: ${fields.course}`,
    `Год поступления: ${fields.enrollmentYear}`,
    `Даты практики: ${fields.practiceDates}`,
  ].join('\n')
}

function resumeText(data) {
  return [
    'Новый отклик на вакансию',
    `Вакансия: ${clean(data.jobTitle, 150) || 'не указана'}`,
    `ФИО: ${clean(data.fullName, 150)}`,
    `Телефон: ${clean(data.phone, 50)}`,
    `Telegram: ${clean(data.telegram, 100) || 'не указан'}`,
    `E-mail: ${clean(data.email, 150) || 'не указан'}`,
    `Резюме: ${clean(data.resumeLink, 500) || 'не приложено'}`,
    `Комментарий: ${clean(data.comment, 1000) || 'нет'}`,
  ].join('\n')
}

async function readJson(request) {
  const contentLength = Number(request.headers.get('Content-Length') || 0)
  if (contentLength > 16_384) {
    throw new Error('request_too_large')
  }
  return request.json()
}

export default {
  // Ежедневный прогон по расписанию (cron) — отбор и первая карточка в Telegram.
  async scheduled(event, env, ctx) {
    ctx.waitUntil(runDaily(env).catch((error) => console.error('runDaily failed:', error)))
  },

  async fetch(request, env, ctx) {
    const url = new URL(request.url)

    // Публичные маршруты без проверки Origin (Telegram и теги <img> его не шлют).

    // Webhook Telegram: приём нажатий кнопок согласования.
    if (request.method === 'POST' && url.pathname === '/api/news/telegram-webhook') {
      if (env.TELEGRAM_WEBHOOK_SECRET
        && request.headers.get('X-Telegram-Bot-Api-Secret-Token') !== env.TELEGRAM_WEBHOOK_SECRET) {
        return new Response('forbidden', { status: 403 })
      }
      let update
      try {
        update = await request.json()
      } catch {
        return new Response('bad request', { status: 400 })
      }
      ctx.waitUntil(handleTelegramUpdate(env, update, ctx).catch((error) => console.error('tg update:', error)))
      return new Response('ok')
    }

    // Ручной запуск ежедневного прогона (для теста и запуска по требованию).
    if (request.method === 'POST' && url.pathname === '/api/news/run') {
      if (!env.TELEGRAM_WEBHOOK_SECRET || url.searchParams.get('key') !== env.TELEGRAM_WEBHOOK_SECRET) {
        return new Response('forbidden', { status: 403 })
      }
      const force = url.searchParams.get('force') === '1'
      ctx.waitUntil(runDaily(env, { force }).catch((error) => console.error('runDaily failed:', error)))
      return new Response('started')
    }

    // Отдача сгенерированной картинки новости.
    const imageMatch = url.pathname.match(/^\/api\/news\/image\/([^/]+)$/)
    if (request.method === 'GET' && imageMatch) {
      const image = await getImage(env, imageMatch[1])
      if (!image) return new Response('not found', { status: 404 })
      return new Response(image.bytes, {
        headers: {
          'Content-Type': image.contentType,
          'Cache-Control': 'public, max-age=31536000, immutable',
          'Access-Control-Allow-Origin': '*',
        },
      })
    }

    const origin = request.headers.get('Origin') || ''
    if (!allowedOrigins.has(origin)) {
      return jsonResponse({ message: 'Источник запроса не разрешён' }, 403, origin)
    }

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) })
    }

    if (request.method === 'POST' && url.pathname === '/api/auth/login') {
      const data = await readJson(request)
      if (!await verifyPassword(clean(data.password, 200), env)) {
        return jsonResponse({ message: 'Неверный пароль' }, 401, origin)
      }
      return jsonResponse({
        token: await createAdminToken(env.ADMIN_TOKEN_SECRET),
      }, 200, origin)
    }

    if (request.method === 'POST' && url.pathname === '/api/auth/password') {
      const unauthorized = await requireAdmin(request, env, origin)
      if (unauthorized) return unauthorized
      const data = await readJson(request)
      const currentPassword = clean(data.currentPassword, 200)
      const newPassword = clean(data.newPassword, 200)
      if (!await verifyPassword(currentPassword, env)) {
        return jsonResponse({ message: 'Текущий пароль указан неверно' }, 400, origin)
      }
      if (newPassword.length < 10) {
        return jsonResponse({ message: 'Новый пароль должен содержать не менее 10 символов' }, 400, origin)
      }
      await savePassword(newPassword, env)
      return jsonResponse({ changed: true }, 200, origin)
    }

    if (url.pathname === '/api/news') {
      if (request.method === 'GET') {
        const news = await readNews(env)
        return jsonResponse(
          [...news].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0)),
          200,
          origin,
        )
      }

      const unauthorized = await requireAdmin(request, env, origin)
      if (unauthorized) return unauthorized

      if (request.method === 'POST') {
        const item = {
          id: `news-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
          ...normalizeNews(await readJson(request)),
        }
        const missing = validateNews(item)
        if (missing.length) {
          return jsonResponse({ message: `Заполните поля: ${missing.join(', ')}` }, 400, origin)
        }
        const news = await readNews(env)
        news.unshift(item)
        await writeNews(env, news)
        return jsonResponse(item, 201, origin)
      }
    }

    const newsMatch = url.pathname.match(/^\/api\/news\/([^/]+)$/)
    if (newsMatch && (request.method === 'PUT' || request.method === 'DELETE')) {
      const unauthorized = await requireAdmin(request, env, origin)
      if (unauthorized) return unauthorized

      const news = await readNews(env)
      const index = news.findIndex((item) => item.id === newsMatch[1])
      if (index === -1) {
        return jsonResponse({ message: 'Новость не найдена' }, 404, origin)
      }

      if (request.method === 'DELETE') {
        news.splice(index, 1)
        await writeNews(env, news)
        return new Response(null, { status: 204, headers: corsHeaders(origin) })
      }

      const updated = { ...normalizeNews(await readJson(request), news[index]), id: news[index].id }
      const missing = validateNews(updated)
      if (missing.length) {
        return jsonResponse({ message: `Заполните поля: ${missing.join(', ')}` }, 400, origin)
      }
      news[index] = updated
      await writeNews(env, news)
      return jsonResponse(updated, 200, origin)
    }

    if (url.pathname === '/api/jobs') {
      if (request.method === 'GET') {
        const jobs = await readJobs(env)
        return jsonResponse(jobs.sort((a, b) => (
          new Date(b.createdAt || b.startDate || 0) - new Date(a.createdAt || a.startDate || 0)
        )), 200, origin)
      }

      const unauthorized = await requireAdmin(request, env, origin)
      if (unauthorized) return unauthorized

      if (request.method === 'POST') {
        const job = {
          id: `job-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
          createdAt: new Date().toISOString(),
          ...normalizeJob(await readJson(request)),
        }
        const missing = validateJob(job)
        if (missing.length) {
          return jsonResponse({ message: `Заполните поля: ${missing.join(', ')}` }, 400, origin)
        }
        const jobs = await readJobs(env)
        jobs.unshift(job)
        await writeJobs(env, jobs)
        return jsonResponse(job, 201, origin)
      }
    }

    const jobMatch = url.pathname.match(/^\/api\/jobs\/([^/]+)$/)
    if (jobMatch && (request.method === 'PUT' || request.method === 'DELETE')) {
      const unauthorized = await requireAdmin(request, env, origin)
      if (unauthorized) return unauthorized

      const jobs = await readJobs(env)
      const index = jobs.findIndex((job) => job.id === jobMatch[1])
      if (index === -1) {
        return jsonResponse({ message: 'Вакансия не найдена' }, 404, origin)
      }

      if (request.method === 'DELETE') {
        jobs.splice(index, 1)
        await writeJobs(env, jobs)
        return new Response(null, { status: 204, headers: corsHeaders(origin) })
      }

      const updated = normalizeJob(await readJson(request), jobs[index])
      const missing = validateJob(updated)
      if (missing.length) {
        return jsonResponse({ message: `Заполните поля: ${missing.join(', ')}` }, 400, origin)
      }
      jobs[index] = updated
      await writeJobs(env, jobs)
      return jsonResponse(updated, 200, origin)
    }

    if (request.method === 'GET' && url.pathname === '/api/applications') {
      const unauthorized = await requireAdmin(request, env, origin)
      if (unauthorized) return unauthorized
      return jsonResponse([], 200, origin)
    }

    if (request.method === 'POST' && url.pathname === '/api/applications') {
      const data = await readJson(request)
      if (clean(data.website)) {
        return jsonResponse({ sent: true }, 201, origin)
      }
      const { fields, missing } = formatApplication(data)
      if (missing.length) {
        return jsonResponse({
          message: `Заполните обязательные поля: ${missing.join(', ')}`,
        }, 400, origin)
      }
      if (!await sendTelegram(env, applicationText(fields))) {
        return jsonResponse({
          message: 'Не удалось отправить заявку. Попробуйте ещё раз позже',
        }, 502, origin)
      }
      return jsonResponse({ sent: true }, 201, origin)
    }

    if (request.method === 'POST' && url.pathname === '/api/resumes') {
      let data
      let file = null
      const contentType = request.headers.get('Content-Type') || ''
      if (contentType.includes('multipart/form-data')) {
        const form = await request.formData()
        data = Object.fromEntries(form.entries())
        file = form.get('resumeFile')
        if (file && !isAllowedResume(file)) {
          return jsonResponse({
            message: 'Файл должен быть в формате PDF, DOC или DOCX и размером не более 10 МБ',
          }, 400, origin)
        }
      } else {
        data = await readJson(request)
      }
      if (!clean(data.fullName) || !clean(data.phone)) {
        return jsonResponse({ message: 'Укажите ФИО и телефон' }, 400, origin)
      }
      const sent = file
        ? await sendTelegramDocument(env, resumeText(data), file)
        : await sendTelegram(env, resumeText(data))
      if (!sent) {
        return jsonResponse({
          message: 'Telegram не принял отклик. Проверьте файл и попробуйте ещё раз',
        }, 502, origin)
      }
      return jsonResponse({ sent: true }, 201, origin)
    }

    return jsonResponse({ message: 'Маршрут не найден' }, 404, origin)
  },
}
