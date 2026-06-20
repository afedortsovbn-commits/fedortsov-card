// Источник новостей из публичных Telegram-каналов через их веб-версию
// (https://t.me/s/<channel>). RSS у каналов нет, но веб-превью отдаёт посты.
// Возвращает записи в том же формате, что и RSS: { title, link, summary, publishedAt }.

function clean(html) {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#33;/g, '!')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function firstLine(text) {
  const line = text.split('\n').map((s) => s.trim()).find((s) => s.length > 0) || text
  // Убираем ведущие эмодзи/символы/пунктуацию, оставляя осмысленное начало.
  return line.replace(/^[^\p{L}\p{N}]+/u, '').slice(0, 140)
}

// Разбор HTML веб-версии канала. username — для построения ссылок на посты.
export function parseTelegramPosts(html, username) {
  const chunks = String(html).split('data-post="').slice(1)
  const posts = []
  for (const chunk of chunks) {
    const post = chunk.slice(0, chunk.indexOf('"'))
    const id = post.split('/')[1]
    if (!id) continue

    const textMatch = chunk.match(/tgme_widget_message_text[^>]*>([\s\S]*?)<\/div>\s*(?:<div class="tgme_widget_message_footer|<\/div>)/)
      || chunk.match(/tgme_widget_message_text[^>]*>([\s\S]*?)<\/div>/)
    const text = textMatch ? clean(textMatch[1]) : ''
    if (text.length < 50) continue

    const dateMatch = chunk.match(/datetime="([^"]+)"/)
    const publishedAt = dateMatch ? new Date(dateMatch[1]).toISOString() : ''

    posts.push({
      title: firstLine(text),
      link: `https://t.me/${username}/${id}`,
      summary: text.slice(0, 2000),
      publishedAt,
    })
  }
  return posts
}

// Загрузка канала. Возвращает массив записей.
export async function fetchTelegramChannel(username, options = {}) {
  const { fetchImpl = fetch, timeoutMs = 12000 } = options
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetchImpl(`https://t.me/s/${username}`, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; fedortsov-newsbot/1.0)', Accept: 'text/html' },
    })
    if (!response.ok) return { items: [], error: `http_${response.status}` }
    return { items: parseTelegramPosts(await response.text(), username), error: null }
  } catch (error) {
    return { items: [], error: error?.name === 'AbortError' ? 'timeout' : 'fetch_error' }
  } finally {
    clearTimeout(timer)
  }
}
