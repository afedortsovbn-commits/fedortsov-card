const allowedOrigins = new Set([
  'https://afedortsovbn-commits.github.io',
  'http://127.0.0.1:5176',
  'http://localhost:5176',
])

const requiredFields = [
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
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
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

  const missing = requiredFields
    .filter(([key]) => !fields[key])
    .map(([, label]) => label)

  return { fields, missing }
}

function telegramText(fields) {
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

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || ''

    if (!allowedOrigins.has(origin)) {
      return jsonResponse({ message: 'Источник запроса не разрешён' }, 403, origin)
    }

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) })
    }

    const url = new URL(request.url)
    if (request.method !== 'POST' || url.pathname !== '/api/applications') {
      return jsonResponse({ message: 'Маршрут не найден' }, 404, origin)
    }

    const contentLength = Number(request.headers.get('Content-Length') || 0)
    if (contentLength > 16_384) {
      return jsonResponse({ message: 'Слишком большой запрос' }, 413, origin)
    }

    let data
    try {
      data = await request.json()
    } catch {
      return jsonResponse({ message: 'Некорректные данные формы' }, 400, origin)
    }

    if (clean(data.website)) {
      return jsonResponse({ sent: true }, 201, origin)
    }

    const { fields, missing } = formatApplication(data)
    if (missing.length) {
      return jsonResponse({
        message: `Заполните обязательные поля: ${missing.join(', ')}`,
      }, 400, origin)
    }

    if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) {
      return jsonResponse({ message: 'Отправка заявок временно не настроена' }, 503, origin)
    }

    const telegramResponse = await fetch(
      `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: env.TELEGRAM_CHAT_ID,
          text: telegramText(fields),
          disable_web_page_preview: true,
        }),
      },
    )

    if (!telegramResponse.ok) {
      console.error('Telegram rejected application:', telegramResponse.status)
      return jsonResponse({
        message: 'Не удалось отправить заявку. Попробуйте ещё раз позже',
      }, 502, origin)
    }

    return jsonResponse({ sent: true }, 201, origin)
  },
}
