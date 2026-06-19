// Отбор новостей через YandexGPT: оценивает виральность и соответствие
// редполитике (нужны цифры/исследования, приоритет — нейросети в маркетинге).
// Тот же контракт, что у эвристического selectTop: на входе кандидаты, на
// выходе отсортированный по убыванию ценности список. Эвристика остаётся как
// дешёвый предотбор и фолбэк.

import { yandexComplete, parseJsonFromText } from './yandex.js'
import { selectTop } from './score.js'

const SYSTEM = [
  'Ты — главный редактор авторского канала новостей о маркетинге.',
  'Автор позиционирует себя как эксперт-маркетолог, и новости должны цениться в профессиональном маркетинговом сообществе: их должны хотеть читать и пересылать коллегам.',
  'Отбирай новости по строгим критериям:',
  '— ОБЯЗАТЕЛЬНО: конкретные цифры, статистика или ссылка на исследование. Без этого новость не подходит.',
  '— Приоритет: маркетинговые исследования, доли рынка, метрики поведения потребителей, эффективность каналов и особенно связка «нейросети + маркетинг» с цифрами.',
  '— Отбраковывай: пиар-релизы без данных, подборки «N советов», мотивацию, анонсы вебинаров, мелкие продуктовые обновления без значимости.',
  'Оценивай виральность и профессиональную ценность по шкале 0–100.',
].join('\n')

function buildUser(items) {
  const list = items
    .map((c, i) => {
      const summary = c.summary ? ` — ${c.summary.slice(0, 220)}` : ''
      return `${i + 1}. [${c.sourceName}] ${c.title}${summary}`
    })
    .join('\n')
  return [
    'Вот список новостей-кандидатов:',
    '',
    list,
    '',
    'Верни ТОЛЬКО JSON-массив, без пояснений, отсортированный от лучшей к худшей.',
    'Каждый элемент: {"n": номер из списка, "score": число 0-100, "fits": true|false, "reason": "кратко, почему ценно для маркетолога"}.',
    'fits=false ставь тем, где нет конкретных цифр/исследований или это пиар/советы — их включать не нужно.',
  ].join('\n')
}

// Главная функция. Возвращает кандидатов с полями score/gptReason, по убыванию.
export async function gptSelect(env, candidates, options = {}) {
  const { limit = 9, model = 'yandexgpt', shortlist = 25 } = options
  if (!candidates.length) return []

  // 1. Дешёвый предотбор эвристикой — не шлём в модель весь поток.
  const pre = selectTop(candidates, { limit: shortlist, strict: false })
  if (!pre.length) return []

  // 2. Запрос к YandexGPT.
  let parsed
  try {
    const text = await yandexComplete(env, {
      system: SYSTEM,
      user: buildUser(pre),
      model,
      temperature: 0.2,
      maxTokens: 2000,
    })
    parsed = parseJsonFromText(text)
  } catch (error) {
    console.warn('gptSelect: фолбэк на эвристику —', error.message)
    return selectTop(candidates, { limit, strict: true })
  }

  if (!Array.isArray(parsed)) {
    return selectTop(candidates, { limit, strict: true })
  }

  // 3. Сопоставляем ответ модели с кандидатами по номеру.
  const ranked = []
  for (const row of parsed) {
    const idx = Number(row.n ?? row.number ?? row.id) - 1
    const candidate = pre[idx]
    if (!candidate || row.fits === false) continue
    const score = Number(row.score) || 0
    ranked.push({
      ...candidate,
      score,
      gptScore: score,
      gptReason: String(row.reason || '').slice(0, 200),
      reasons: [String(row.reason || '')].filter(Boolean),
    })
  }
  ranked.sort((a, b) => b.gptScore - a.gptScore)
  return ranked.slice(0, limit)
}
