// Слой публикации (publisher). Сейчас один канал — визитка (запись в KV news),
// но контракт publish(env, channel, draft) позволяет добавлять каналы (Telegram-
// канал, VK и т.п.) без изменения остального сервиса.

import { readNews, writeNews, putImage } from './store.js'
import { compressImage } from './compress.js'

// База API воркера — нужна, чтобы картинка грузилась на визитке (другой домен).
const WORKER_BASE = 'https://fedortsov-card-api.afedortsovbn.workers.dev'

function uuid() {
  return globalThis.crypto?.randomUUID?.().slice(0, 8) || Math.random().toString(16).slice(2, 10)
}

function base64ToArrayBuffer(b64) {
  const binary = atob(b64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
  return bytes.buffer
}

// Публикация на визитку. draft: { title, text, sourceUrl, sourceName, imageBase64 }
async function publishToVisitka(env, draft, options = {}) {
  const id = `news-${Date.now()}-${uuid()}`
  let image = '/images/news-ai.svg'
  if (draft.imageBase64) {
    const raw = base64ToArrayBuffer(draft.imageBase64)
    let bytes
    try {
      bytes = compressImage(raw)
    } catch (error) {
      console.warn('compressImage:', error.message)
      bytes = raw
    }
    await putImage(env, id, bytes, 'image/jpeg')
    const base = options.apiBase || env.PUBLIC_API_BASE || WORKER_BASE
    image = `${base}/api/news/image/${id}`
  }
  const item = {
    id,
    title: draft.title,
    date: new Date().toISOString(),
    image,
    text: draft.text,
    sourceUrl: draft.sourceUrl || '',
    sourceName: draft.sourceName || '',
    status: 'approved',
  }
  const news = await readNews(env)
  news.unshift(item)
  await writeNews(env, news)
  return item
}

const PUBLISHERS = {
  visitka: publishToVisitka,
}

export async function publish(env, channel, draft, options = {}) {
  const publisher = PUBLISHERS[channel]
  if (!publisher) throw new Error(`unknown_channel: ${channel}`)
  return publisher(env, draft, options)
}
