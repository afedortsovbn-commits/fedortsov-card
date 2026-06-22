// Рерайт новости через YandexGPT в оригинальный авторский текст по редполитике.
// Цифры и факты берём только из исходника (не выдумываем). Возвращает готовый
// NewsItem-черновик: { title, text } (sourceName/sourceUrl добавляет publisher).

import { yandexComplete, parseJsonFromText } from './yandex.js'

const SYSTEM = [
  'Ты — маркетолог-эксперт, который ведёт авторскую новостную ленту для профессионального маркетингового сообщества.',
  'Перепиши новость своими словами так, чтобы она читалась оригинально и экспертно. Строгие правила:',
  '— Все интересные маркетинговые цифры, проценты и статистику из исходника ОБЯЗАТЕЛЬНО приводи в тексте — это самое ценное для читателя. Сохраняй их ТОЧНО. Ничего не выдумывай: если каких-то данных в исходнике нет — не добавляй их.',
  '— Заголовок: ёмкий, без кликбейта. Если в новости есть яркая ключевая цифра или процент — вынеси эту главную цифру прямо в заголовок.',
  '— Первая строка текста — самое интересное: ключевая цифра, факт или суть кейса.',
  '— 3–5 абзацев, примерно 1100–1700 знаков. Раскрой суть содержательно: контекст, детали, как это работает и почему важно. Тон живой и профессиональный, без воды, хайпа и канцелярита.',
  '— Последний абзац начни со слов «Что это значит для маркетолога:» и дай практический экспертный вывод.',
  '— Не упоминай, что это рерайт или что текст сгенерирован.',
].join('\n')

function buildUser(candidate, articleText) {
  // Берём самый содержательный источник: для Telegram-постов это summary (полный
  // текст поста), для статей — выкачанный текст. Так короткий «мусор» от t.me
  // не перебьёт нормальный текст.
  const source = [articleText, candidate.summary]
    .filter(Boolean)
    .sort((a, b) => b.length - a.length)[0] || ''
  return [
    `Заголовок источника: ${candidate.title}`,
    `Источник: ${candidate.sourceName}`,
    '',
    'Текст статьи (опирайся только на него):',
    source.slice(0, 5000),
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
    maxTokens: 2500,
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
