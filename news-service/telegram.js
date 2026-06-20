// Отправка карточек новостей в Telegram с инлайн-кнопками и помощники для
// обработки нажатий (webhook). Env: NEWS_BOT_TOKEN (бот NewsFedortsov_Bot), TELEGRAM_CHAT_ID.

const api = (token, method) => `https://api.telegram.org/bot${token}/${method}`

export function escapeHtml(text) {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

// Простое текстовое уведомление в чат владельца (без кнопок).
export async function notify(env, text) {
  const token = env.NEWS_BOT_TOKEN
  const chatId = env.TELEGRAM_CHAT_ID
  if (!token || !chatId) return
  await fetch(api(token, 'sendMessage'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML', disable_web_page_preview: true }),
  })
}

// Текст карточки кандидата (HTML).
export function formatCard(candidate, meta = {}) {
  const { index, total, scope } = meta
  const lines = []
  const head = scope === 'day' ? '🔥 Новость дня' : scope === 'week' ? '📅 Новость недели' : '📰 Новость на согласование'
  const counter = index && total ? ` (${index}/${total})` : ''
  lines.push(`<b>${head}${counter}</b>`)
  lines.push('')
  lines.push(`<b>${escapeHtml(candidate.title)}</b>`)
  const meta2 = [candidate.sourceName, candidate.publishedAt?.slice(0, 10)].filter(Boolean).join(' · ')
  if (meta2) lines.push(`<i>${escapeHtml(meta2)}</i>`)
  if (candidate.gptScore != null) lines.push(`Виральность: <b>${candidate.gptScore}</b>/100`)
  if (candidate.gptReason) lines.push(`Почему: ${escapeHtml(candidate.gptReason)}`)
  if (candidate.summary) {
    lines.push('')
    lines.push(escapeHtml(candidate.summary.slice(0, 400)))
  }
  lines.push('')
  lines.push(`🔗 <a href="${escapeHtml(candidate.url)}">Источник: ${escapeHtml(candidate.sourceName)}</a>`)
  return lines.join('\n')
}

// Клавиатура согласования. id кандидата короткий (8 hex) — влезает в 64 байта.
export function reviewKeyboard(id) {
  return {
    inline_keyboard: [
      [
        { text: '✅ Согласовать', callback_data: `approve:${id}` },
        { text: '❌ Не размещать', callback_data: `reject:${id}` },
      ],
      [{ text: '🔁 Ещё 2', callback_data: `more:${id}` }],
    ],
  }
}

export async function sendNewsCard(env, candidate, meta = {}) {
  const token = env.NEWS_BOT_TOKEN
  const chatId = env.TELEGRAM_CHAT_ID
  if (!token || !chatId) throw new Error('telegram_not_configured')

  const response = await fetch(api(token, 'sendMessage'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: formatCard(candidate, meta),
      parse_mode: 'HTML',
      disable_web_page_preview: false,
      reply_markup: reviewKeyboard(candidate.id),
    }),
  })
  const data = await response.json()
  if (!data.ok) throw new Error(`telegram_send_${response.status}: ${JSON.stringify(data).slice(0, 300)}`)
  return data.result // содержит message_id
}

// Короткое всплывающее уведомление в ответ на нажатие кнопки.
export async function answerCallback(env, callbackQueryId, text = '') {
  const token = env.NEWS_BOT_TOKEN
  await fetch(api(token, 'answerCallbackQuery'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ callback_query_id: callbackQueryId, text }),
  })
}

// Заменить текст/клавиатуру у уже отправленной карточки (после решения).
export async function editCardText(env, messageId, text, replyMarkup) {
  const token = env.NEWS_BOT_TOKEN
  const chatId = env.TELEGRAM_CHAT_ID
  await fetch(api(token, 'editMessageText'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      message_id: messageId,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
      ...(replyMarkup ? { reply_markup: replyMarkup } : { reply_markup: { inline_keyboard: [] } }),
    }),
  })
}
