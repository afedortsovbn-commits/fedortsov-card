// Эвристическая оценка кандидатов по редполитике: ценим цифры, исследования,
// связку с нейросетями и маркетинговые темы; штрафуем пиар/мусор.
// Это временная замена YandexGPT — интерфейс selectTop() останется тем же,
// когда подключим модель (Phase 2b).

import {
  RESEARCH_KEYWORDS, AI_KEYWORDS, TOPIC_KEYWORDS, NEGATIVE_KEYWORDS, EDITORIAL,
} from './config.js'

function countMatches(text, words) {
  let n = 0
  for (const w of words) {
    if (text.includes(w)) n += 1
  }
  return n
}

// Есть ли конкретные числа: проценты, «в N раз», крупные числительные, деньги.
function hasNumbers(text) {
  return /\d+\s?%|\d[\d\s.,]*\s?(млн|млрд|тыс|раз|руб|\$|₽|пункт|процент)/i.test(text)
    || /\b\d{2,}\b/.test(text)
}

export function scoreCandidate(candidate) {
  const text = `${candidate.title} ${candidate.summary || ''}`.toLowerCase()
  const reasons = []
  let score = 0

  const research = countMatches(text, RESEARCH_KEYWORDS)
  if (research) { score += research * 3; reasons.push(`исследование×${research}`) }

  const numbers = hasNumbers(text)
  if (numbers) { score += 3; reasons.push('есть цифры') }

  const ai = countMatches(text, AI_KEYWORDS)
  if (ai) { score += ai * 2; reasons.push(`нейросети×${ai}`) }

  const topic = countMatches(text, TOPIC_KEYWORDS)
  if (topic) { score += Math.min(topic, 3); reasons.push(`тема×${topic}`) }

  const negative = countMatches(text, NEGATIVE_KEYWORDS)
  if (negative) { score -= negative * 4; reasons.push(`минус×${negative}`) }

  // Лёгкий приоритет источника.
  score *= candidate.weight ?? 1

  // Ключевая ценность редполитики — связка «цифры + исследование».
  const meetsPolicy = (research > 0 || numbers) && topic > 0

  return { ...candidate, score: Math.round(score * 100) / 100, reasons, meetsPolicy }
}

// Отбор и сортировка. strict=true оставляет только проходящих редполитику.
export function selectTop(candidates, { limit = EDITORIAL.queueSize, strict = true } = {}) {
  const scored = candidates
    .map(scoreCandidate)
    .filter((c) => c.title.length >= EDITORIAL.minTitleLength)
    .filter((c) => (strict ? c.meetsPolicy : true))
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score)
  return scored.slice(0, limit)
}
