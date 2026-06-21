// Оркестратор сервиса: ежедневный прогон (cron) и обработка нажатий кнопок
// (Telegram webhook). Связывает отбор → согласование → рерайт → картинку →
// публикацию.

import { EDITORIAL } from './config.js'
import { buildQueue } from './pipeline.js'
import { gptSelect } from './select-gpt.js'
import { markSeen } from './dedup.js'
import { sendNewsCard, answerCallback, editCardText, notify, escapeHtml } from './telegram.js'
import {
  loadSession, saveSession, newSession, takeFromQueue,
} from './session.js'
import { fetchArticleText } from './article.js'
import { rewriteNews } from './rewrite.js'
import { generateImage } from './image.js'
import { publish, attachImage } from './publish.js'

const MORE_BATCH = 2

// Дата по Москве (UTC+3) в формате YYYY-MM-DD.
function todayMsk() {
  return new Date(Date.now() + 3 * 3600 * 1000).toISOString().slice(0, 10)
}

// === Ежедневный прогон (вызывается из scheduled) ===
export async function runDaily(env) {
  const ranker = (candidates) => gptSelect(env, candidates, { limit: EDITORIAL.queueSize })
  const { queue, stats } = await buildQueue(env, { ranker })

  if (!queue.length) {
    await notify(env, '📭 Сегодня свежих новостей по критериям не нашлось. Попробую завтра.')
    return { offered: 0, stats }
  }

  const session = newSession(todayMsk(), queue)
  const first = takeFromQueue(session, EDITORIAL.batchSize)
  await saveSession(env, session)
  for (const candidate of first) {
    await sendNewsCard(env, candidate, { scope: 'day' })
  }
  await markSeen(env, first.map((c) => c.id))
  return { offered: first.length, stats }
}

// === Обработка обновления Telegram (вызывается из webhook) ===
// ctx нужен для waitUntil — тяжёлую публикацию делаем в фоне, webhook отвечает сразу.
export async function handleTelegramUpdate(env, update, ctx) {
  const cb = update?.callback_query
  if (!cb) return

  // Безопасность: реагируем только на чат владельца.
  const chatId = String(cb.message?.chat?.id || '')
  if (chatId !== String(env.TELEGRAM_CHAT_ID)) {
    await answerCallback(env, cb.id, 'Нет доступа')
    return
  }

  const [action, id] = String(cb.data || '').split(':')
  const messageId = cb.message?.message_id
  const session = await loadSession(env)

  if (!session || !session.active) {
    await answerCallback(env, cb.id, 'Сессия неактивна — продолжим завтра')
    return
  }

  if (action === 'reject') {
    session.active = false
    await saveSession(env, session)
    await editCardText(env, messageId, '❌ Отклонено. Поиск продолжится завтра.')
    await answerCallback(env, cb.id, 'Отменено')
    return
  }

  if (action === 'more') {
    const next = takeFromQueue(session, MORE_BATCH)
    await saveSession(env, session)
    await answerCallback(env, cb.id, next.length ? 'Показываю ещё' : 'Свежих новостей больше нет')
    for (const candidate of next) {
      await sendNewsCard(env, candidate, { scope: 'week' })
    }
    if (next.length) await markSeen(env, next.map((c) => c.id))
    return
  }

  if (action === 'approve') {
    const candidate = session.offered[id]
    if (!candidate) {
      await answerCallback(env, cb.id, 'Новость не найдена в сессии')
      return
    }
    await answerCallback(env, cb.id, 'Готовлю публикацию…')
    await editCardText(env, messageId, '⏳ Готовлю оригинальный текст и фоновую картинку…')
    const work = processApproval(env, candidate, messageId)
    if (ctx?.waitUntil) ctx.waitUntil(work)
    else await work
  }
}

// Согласование. Сначала публикуем ТЕКСТ (быстро и надёжно), показываем успех и
// только потом догружаем картинку отдельным шагом — долгая генерация ART больше
// не может «уронить» публикацию (раньше фон воркера обрывался на картинке).
async function processApproval(env, candidate, messageId) {
  let item
  try {
    const article = await fetchArticleText(candidate.url)
    const { title, text } = await rewriteNews(env, candidate, article)

    item = await publish(env, 'visitka', {
      title,
      text,
      sourceUrl: candidate.url,
      sourceName: candidate.sourceName,
    })

    // По умолчанию — одна новость в день: закрываем сессию.
    const session = await loadSession(env)
    if (session) {
      session.active = false
      await saveSession(env, session)
    }

    await editCardText(env, messageId, `✅ Опубликовано на визитке:\n<b>${escapeHtml(title)}</b>`)
  } catch (error) {
    await editCardText(
      env,
      messageId,
      `⚠️ Не удалось опубликовать: ${escapeHtml(String(error.message).slice(0, 150))}\nМожно нажать «Согласовать» ещё раз.`,
    )
    return
  }

  // Картинка — best-effort: если не успеет/не выйдет, новость уже опубликована
  // с запасной картинкой, успех пользователю уже показан.
  try {
    const imageBase64 = await generateImage(env, { title: item.title }, { tries: 16, delayMs: 2500 })
    if (imageBase64) await attachImage(env, item.id, imageBase64)
  } catch (error) {
    console.warn('attachImage step failed:', error.message)
  }
}
