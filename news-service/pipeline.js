// Оркестратор отбора: сбор → дедупликация → оценка → формирование очереди.
// Возвращает «топ за день», «топ за неделю» и единую очередь кандидатов на
// согласование (её сервис отдаёт в Telegram по одному, кнопка «Ещё 2» берёт
// следующих). Побочных эффектов нет — пометка seen происходит при показе.

import { SOURCES, WINDOW_DAYS, EDITORIAL } from './config.js'
import { collectCandidates } from './collect.js'
import { filterUnseen } from './dedup.js'
import { selectTop } from './score.js'

function withinDays(iso, days, now) {
  if (!iso) return false
  const ms = Date.parse(iso)
  return !Number.isNaN(ms) && now - ms <= days * 24 * 60 * 60 * 1000
}

// Уникальное объединение списков с сохранением порядка.
function uniqueById(...lists) {
  const seen = new Set()
  const out = []
  for (const list of lists) {
    for (const item of list) {
      if (seen.has(item.id)) continue
      seen.add(item.id)
      out.push(item)
    }
  }
  return out
}

// Ранжировщик по умолчанию — эвристика. Сменный, чтобы подключать YandexGPT.
function heuristicRanker(candidates) {
  return selectTop(candidates, { limit: EDITORIAL.queueSize * 2, strict: true })
}

// env нужен для дедупликации через KV; в тестах передаём мок или null.
// options.ranker — async (candidates) => отсортированный по убыванию список.
export async function buildQueue(env, options = {}) {
  const {
    fetchImpl = fetch,
    now = Date.now(),
    sources = SOURCES,
    ranker = heuristicRanker,
  } = options

  const { candidates, errors, stats } = await collectCandidates({
    sources, fetchImpl, days: WINDOW_DAYS.week, now,
  })

  const unseen = env ? await filterUnseen(env, candidates) : candidates

  // Единое ранжирование всего недельного пула, день — это срез по свежести.
  const ranked = await ranker(unseen)
  const weekTop = ranked.slice(0, EDITORIAL.queueSize)
  const dayTop = ranked
    .filter((c) => withinDays(c.publishedAt, WINDOW_DAYS.day, now))
    .slice(0, EDITORIAL.queueSize)

  // Очередь: сначала лучшее за день, затем добиваем лучшим за неделю.
  const queue = uniqueById(dayTop, weekTop).slice(0, EDITORIAL.queueSize)

  return {
    day: dayTop,
    week: weekTop,
    queue,
    errors,
    stats: { ...stats, unseen: unseen.length, ranked: ranked.length, queued: queue.length },
  }
}
