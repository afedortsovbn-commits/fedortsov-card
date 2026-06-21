// Отбор новостей через YandexGPT: оценивает виральность и соответствие
// редполитике (нужны цифры/исследования, приоритет — нейросети в маркетинге).
// Тот же контракт, что у эвристического selectTop: на входе кандидаты, на
// выходе отсортированный по убыванию ценности список. Эвристика остаётся как
// дешёвый предотбор и фолбэк.

import { yandexComplete, parseJsonFromText } from './yandex.js'
import { selectTop } from './score.js'
import { buildCalibration } from './ratings.js'

const SYSTEM = [
  'Ты — главный редактор авторского канала новостей о маркетинге. Автор — эксперт-маркетолог из Беларуси.',
  'Новости должны цениться в профессиональном маркетинговом сообществе: их должны хотеть читать и пересылать коллегам.',
  'Что отбирать (приоритет именно такой):',
  '— Яркие креативные кампании и виральные кейсы брендов (в т.ч. мировых: реклама, нестандартные ходы, ситуативы).',
  '— Нейросети и ИИ в маркетинге: реальные применения, кейсы, тренды.',
  '— Тренды и значимые изменения площадок и индустрии (соцсети, площадки, рекламные форматы, поведение аудитории).',
  '— Маркетинговые исследования, цифры и бенчмарки — это сильный плюс, но НЕ обязательное условие.',
  '— Новости маркетинга Беларуси — отдельно ценны.',
  'География: интересен мировой маркетинг в целом и Беларусь. Сухие сводки внутреннего рынка РФ (макроэкономика, доли локального рынка, госрегулирование РФ) — низкий приоритет, если в них нет общего маркетингового смысла.',
  'Что отбраковывать (fits=false): откровенный пиар-релиз без сути, подборки «N советов», мотивация, анонсы вебинаров/курсов, реклама инфопродуктов, мелкие незначимые обновления.',
  'Оценивай по шкале 0–100, насколько новость интересна и достойна репоста профессиональным маркетологом.',
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
    'Каждый элемент: {"n": номер из списка, "score": число 0-100, "fits": true|false, "reason": "кратко, почему интересно маркетологу"}.',
    'fits=false ставь рекламе/пиару/инфопродуктам, подборкам «N советов», мотивации и незначимым мелочам — их включать не нужно.',
  ].join('\n')
}

// Главная функция. Возвращает кандидатов с полями score/gptReason, по убыванию.
export async function gptSelect(env, candidates, options = {}) {
  // Отбор-ранжирование 25 заголовков — посильная задача для Lite (×5 дешевле
  // Pro). Дорогой Pro оставляем на финальный рерайт (rewrite.js).
  const { limit = 9, model = 'yandexgpt-lite', shortlist = 25 } = options
  if (!candidates.length) return []

  // 1. Дешёвый предотбор эвристикой — не шлём в модель весь поток.
  const pre = selectTop(candidates, { limit: shortlist, strict: false })
  if (!pre.length) return []

  // 1b. Калибровка по прошлым оценкам автора (обучение по вкусу).
  const calibration = env ? await buildCalibration(env).catch(() => '') : ''
  const system = calibration ? `${SYSTEM}\n\n${calibration}` : SYSTEM

  // 2. Запрос к YandexGPT.
  let parsed
  try {
    const text = await yandexComplete(env, {
      system,
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
