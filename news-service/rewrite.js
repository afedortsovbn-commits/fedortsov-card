// Рерайт новости через YandexGPT в оригинальный авторский текст по редполитике.
// Цифры и факты берём только из исходника (не выдумываем). Возвращает готовый
// NewsItem-черновик: { title, text } (sourceName/sourceUrl добавляет publisher).

import { yandexComplete, parseJsonFromText } from './yandex.js'

const SYSTEM = [
  'Ты — маркетолог-эксперт, который ведёт авторскую новостную ленту для профессионального маркетингового сообщества.',
  'Перепиши новость своими словами так, чтобы она читалась оригинально и экспертно. Строгие правила:',
  '— Сохраняй ВСЕ конкретные цифры, проценты и факты из исходника ТОЧНО. Ничего не выдумывай: если данных нет в исходнике — не добавляй их.',
  '— Заголовок: ёмкий, без кликбейта, по сути.',
  '— Первая строка текста — ключевая цифра или факт.',
  '— 2–3 абзаца, всего 600–900 знаков, спокойный аналитический тон, без воды и хайпа.',
  '— Последний абзац начни со слов «Что это значит для маркетолога:» и дай практический экспертный вывод.',
  '— Не упоминай, что это рерайт или что текст сгенерирован.',
].join('\n')

function buildUser(candidate, articleText) {
  return [
    `Заголовок источника: ${candidate.title}`,
    `Источник: ${candidate.sourceName}`,
    '',
    'Текст статьи (опирайся только на него):',
    (articleText || candidate.summary || '').slice(0, 5000),
    '',
    'Верни ТОЛЬКО JSON: {"title": "...", "text": "...абзацы через \\n\\n..."}',
  ].join('\n')
}

export async function rewriteNews(env, candidate, articleText, options = {}) {
  const { model = 'yandexgpt' } = options
  const text = await yandexComplete(env, {
    system: SYSTEM,
    user: buildUser(candidate, articleText),
    model,
    temperature: 0.4,
    maxTokens: 1500,
  })

  const parsed = parseJsonFromText(text)
  if (parsed?.title && parsed?.text) {
    return {
      title: String(parsed.title).slice(0, 200).trim(),
      text: String(parsed.text).trim(),
    }
  }
  // Фолбэк: если модель не вернула JSON — используем как есть.
  return {
    title: candidate.title.slice(0, 200),
    text: text.trim() || candidate.summary || '',
  }
}
