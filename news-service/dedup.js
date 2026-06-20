// Дедупликация: исключаем кандидатов, которые уже показывались (seen) или уже
// опубликованы на визитке. Хранилище — то же KV (binding JOBS).
//
// Ключи KV:
//   news:seen  → { [id]: isoTime }  — что уже предлагалось/обрабатывалось
//   news       → [NewsItem]         — опубликованные новости (у них есть sourceUrl)

import { canonicalUrl } from './collect.js'

const SEEN_KEY = 'news:seen'
const PUBLISHED_KEY = 'news'
const SEEN_TTL_DAYS = 60

export async function loadSeen(env) {
  return (await env.JOBS.get(SEEN_KEY, 'json')) || {}
}

async function loadPublishedCanonicals(env) {
  const published = (await env.JOBS.get(PUBLISHED_KEY, 'json')) || []
  const set = new Set()
  for (const item of published) {
    if (item?.sourceUrl) set.add(canonicalUrl(item.sourceUrl))
  }
  return set
}

// Оставляет только тех кандидатов, которых ещё не показывали и не публиковали.
export async function filterUnseen(env, candidates) {
  const [seen, publishedCanon] = await Promise.all([
    loadSeen(env),
    loadPublishedCanonicals(env),
  ])
  return candidates.filter((c) => !(c.id in seen) && !publishedCanon.has(c.canonical))
}

// Помечает id как показанные и подчищает записи старше SEEN_TTL_DAYS.
export async function markSeen(env, ids) {
  const seen = await loadSeen(env)
  const nowIso = new Date().toISOString()
  for (const id of ids) seen[id] = nowIso

  const cutoff = Date.now() - SEEN_TTL_DAYS * 24 * 60 * 60 * 1000
  for (const [id, iso] of Object.entries(seen)) {
    if (Date.parse(iso) < cutoff) delete seen[id]
  }
  await env.JOBS.put(SEEN_KEY, JSON.stringify(seen))
  return seen
}
