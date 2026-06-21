// Память оценок пользователя (🔥/👍/👎/разместил) для обучения отбора по вкусу.
// Оценки копятся в KV и подмешиваются в промпт select-gpt как калибровка.

const RATINGS_KEY = 'news:ratings'
const MAX_RATINGS = 150
const LIKED_THRESHOLD = 8 // 🔥 и «разместил»
const DISLIKED_THRESHOLD = 3 // 👎

export async function loadRatings(env) {
  return (await env.JOBS.get(RATINGS_KEY, 'json')) || []
}

// Записать/обновить оценку новости (по заголовку — чтобы не плодить дубли).
export async function recordRating(env, candidate, score) {
  const ratings = await loadRatings(env)
  const entry = {
    title: candidate.title,
    summary: (candidate.summary || '').slice(0, 200),
    sourceName: candidate.sourceName || '',
    score,
    ts: new Date().toISOString(),
  }
  const idx = ratings.findIndex((r) => r.title === entry.title)
  if (idx !== -1) ratings.splice(idx, 1)
  ratings.push(entry)
  // Держим последние MAX_RATINGS.
  const trimmed = ratings.slice(-MAX_RATINGS)
  await env.JOBS.put(RATINGS_KEY, JSON.stringify(trimmed))
  return trimmed
}

// Блок калибровки для промпта: что автору нравится / не нравится (по оценкам).
// Возвращает строку (пустую, если оценок ещё нет).
export async function buildCalibration(env, { perSide = 10 } = {}) {
  const ratings = await loadRatings(env)
  if (!ratings.length) return ''

  const recent = ratings.slice().reverse()
  const liked = recent.filter((r) => r.score >= LIKED_THRESHOLD).slice(0, perSide)
  const disliked = recent.filter((r) => r.score <= DISLIKED_THRESHOLD).slice(0, perSide)
  if (!liked.length && !disliked.length) return ''

  const lines = ['Калибровка по прошлым оценкам автора — учитывай её при оценке:']
  if (liked.length) {
    lines.push('Автору НРАВЯТСЯ новости вроде этих:')
    for (const r of liked) lines.push(`+ ${r.title}`)
  }
  if (disliked.length) {
    lines.push('Автору НЕ нравятся новости вроде этих:')
    for (const r of disliked) lines.push(`- ${r.title}`)
  }
  return lines.join('\n')
}
