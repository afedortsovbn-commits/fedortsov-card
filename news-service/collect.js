// Сбор кандидатов из RSS-источников: загрузка, нормализация, дедупликация
// внутри партии и фильтр по свежести. Не зависит от Cloudflare — работает и в
// Node (для локальных тестов), и в Worker (общий global fetch).

import { parseFeed } from './rss.js'

// FNV-1a 32-бит → стабильный hex-id для дедупликации между запусками.
function hashId(text) {
  let hash = 0x811c9dc5
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return (hash >>> 0).toString(16).padStart(8, '0')
}

// Канонизация URL для дедупликации: убираем utm/query/fragment, www, слэш.
export function canonicalUrl(url) {
  try {
    const u = new URL(url)
    u.hash = ''
    u.search = ''
    let host = u.host.replace(/^www\./, '')
    let path = u.pathname.replace(/\/+$/, '')
    return `${host}${path}`.toLowerCase()
  } catch {
    return String(url || '').trim().toLowerCase()
  }
}

function withinDays(iso, days, now) {
  if (!iso) return false
  const ms = Date.parse(iso)
  if (Number.isNaN(ms)) return false
  return now - ms <= days * 24 * 60 * 60 * 1000
}

async function fetchFeed(source, fetchImpl, timeoutMs) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetchImpl(source.url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'fedortsov-card-newsbot/1.0', Accept: 'application/rss+xml, application/xml, text/xml, */*' },
    })
    if (!response.ok) return { source, items: [], error: `http_${response.status}` }
    const xml = await response.text()
    return { source, items: parseFeed(xml), error: null }
  } catch (error) {
    return { source, items: [], error: error?.name === 'AbortError' ? 'timeout' : 'fetch_error' }
  } finally {
    clearTimeout(timer)
  }
}

// Главная функция сбора.
// options: { sources, fetchImpl, withinDays (число дней), now (ms), timeoutMs }
export async function collectCandidates(options = {}) {
  const {
    sources = [],
    fetchImpl = fetch,
    days = 7,
    now = Date.now(),
    timeoutMs = 12000,
  } = options

  const results = await Promise.all(sources.map((s) => fetchFeed(s, fetchImpl, timeoutMs)))

  const errors = []
  const seenIds = new Set()
  const candidates = []

  for (const { source, items, error } of results) {
    if (error) errors.push({ source: source.id, error })
    for (const item of items) {
      const canonical = canonicalUrl(item.link)
      const id = hashId(canonical)
      if (seenIds.has(id)) continue
      seenIds.add(id)
      candidates.push({
        id,
        title: item.title,
        url: item.link,
        canonical,
        source: source.id,
        sourceName: source.name,
        weight: source.weight ?? 1,
        publishedAt: item.publishedAt,
        summary: item.summary,
      })
    }
  }

  const fresh = candidates.filter((c) => !c.publishedAt || withinDays(c.publishedAt, days, now))
  fresh.sort((a, b) => (Date.parse(b.publishedAt || 0) || 0) - (Date.parse(a.publishedAt || 0) || 0))

  return {
    candidates: fresh,
    errors,
    stats: { fetched: results.length, totalItems: candidates.length, fresh: fresh.length },
  }
}
