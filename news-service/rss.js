// Минималистичный парсер RSS 2.0 и Atom без DOMParser (его нет в Workers).
// Возвращает массив записей: { title, link, summary, publishedAt, guid }.

const namedEntities = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
  laquo: '«', raquo: '»', mdash: '—', ndash: '–', hellip: '…', deg: '°',
}

function decodeOnce(text) {
  return text
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => safeCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => safeCodePoint(parseInt(d, 10)))
    .replace(/&([a-zA-Z]+);/g, (m, name) => (name in namedEntities ? namedEntities[name] : m))
}

function decodeEntities(text) {
  if (!text) return ''
  // Вторая проходка раскрывает двойное кодирование (&amp;nbsp; → &nbsp; → пробел).
  const once = decodeOnce(text)
  return /&(#\d+|#x[0-9a-fA-F]+|[a-zA-Z]+);/.test(once) ? decodeOnce(once) : once
}

function safeCodePoint(code) {
  try {
    return String.fromCodePoint(code)
  } catch {
    return ''
  }
}

function stripCdata(text) {
  return text.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
}

function stripTags(text) {
  return text.replace(/<[^>]+>/g, ' ')
}

// Чистый текст из произвольного XML/HTML-фрагмента.
export function cleanText(raw) {
  if (!raw) return ''
  return decodeEntities(stripTags(stripCdata(raw)))
    .replace(/\s+/g, ' ')
    .trim()
}

// Внутренность первого встретившегося тега из списка имён.
function firstTagContent(block, names) {
  for (const name of names) {
    const match = block.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, 'i'))
    if (match) return match[1]
  }
  return ''
}

// Ссылка: у RSS — <link>url</link>, у Atom — <link href="url" rel="alternate"/>.
function extractLink(block) {
  const rss = block.match(/<link>([\s\S]*?)<\/link>/i)
  if (rss && cleanText(rss[1])) return cleanText(rss[1])
  const atomAlt = block.match(/<link[^>]*rel=["']alternate["'][^>]*href=["']([^"']+)["']/i)
    || block.match(/<link[^>]*href=["']([^"']+)["'][^>]*rel=["']alternate["']/i)
    || block.match(/<link[^>]*href=["']([^"']+)["']/i)
  return atomAlt ? decodeEntities(atomAlt[1]).trim() : ''
}

function toIso(dateStr) {
  if (!dateStr) return ''
  const ms = Date.parse(dateStr.trim())
  return Number.isNaN(ms) ? '' : new Date(ms).toISOString()
}

// Разбор одной ленты. Возвращает массив записей (может быть пустым).
export function parseFeed(xml) {
  if (typeof xml !== 'string' || !xml.includes('<')) return []
  const blocks = xml.match(/<item[\s\S]*?<\/item>|<entry[\s\S]*?<\/entry>/gi) || []
  const items = []
  for (const block of blocks) {
    const title = cleanText(firstTagContent(block, ['title']))
    const link = extractLink(block)
    if (!title || !link) continue
    const summaryRaw = firstTagContent(block, ['description', 'summary', 'content:encoded', 'content'])
    const dateRaw = cleanText(firstTagContent(block, ['pubDate', 'published', 'updated', 'dc:date']))
    const guid = cleanText(firstTagContent(block, ['guid', 'id'])) || link
    items.push({
      title,
      link,
      summary: cleanText(summaryRaw).slice(0, 1000),
      publishedAt: toIso(dateRaw),
      guid,
    })
  }
  return items
}
