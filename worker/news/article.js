// Загрузка и извлечение основного текста статьи по URL, чтобы рерайт опирался
// на реальные факты и цифры, а не выдумывал их. Без библиотек: берём текст из
// <p>, отбросив скрипты/стили/разметку.

import { cleanText } from './rss.js'

function stripBlocks(html, tag) {
  return html.replace(new RegExp(`<${tag}[\\s\\S]*?</${tag}>`, 'gi'), ' ')
}

// Возвращает чистый текст статьи (ограниченный по длине) или ''.
export async function fetchArticleText(url, options = {}) {
  const { fetchImpl = fetch, timeoutMs = 12000, maxChars = 5000 } = options
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetchImpl(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'fedortsov-card-newsbot/1.0', Accept: 'text/html,*/*' },
    })
    if (!response.ok) return ''
    let html = await response.text()

    // Убираем заведомо нетекстовые блоки.
    for (const tag of ['script', 'style', 'noscript', 'svg', 'header', 'footer', 'nav', 'aside', 'form']) {
      html = stripBlocks(html, tag)
    }

    // Собираем текст из абзацев (основной контент новостных сайтов — в <p>).
    const paragraphs = (html.match(/<p[\s\S]*?<\/p>/gi) || [])
      .map((p) => cleanText(p))
      .filter((t) => t.length > 40)

    let text = paragraphs.join('\n\n')
    // Фолбэк: если абзацев мало — берём весь текст body.
    if (text.length < 200) {
      const body = html.match(/<body[\s\S]*?<\/body>/i)?.[0] || html
      text = cleanText(body)
    }
    return text.slice(0, maxChars)
  } catch {
    return ''
  } finally {
    clearTimeout(timer)
  }
}
