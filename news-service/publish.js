// Слой публикации (publisher). Сейчас один канал — визитка (запись в KV news),
// но контракт publish(env, channel, draft) позволяет добавлять каналы (Telegram-
// канал, VK и т.п.) без изменения остального сервиса.

import {
  readNews, writeNews, putImage, delImage, imageIdFromUrl,
} from './store.js'
import { compressImage } from './compress.js'

// Сколько новостей храним на визитке; более старые удаляем (вместе с картинками).
const MAX_NEWS = 20

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
// Сжимает base64-картинку, кладёт в KV под ключ id, возвращает публичный URL.
async function storeImage(env, id, imageBase64, options = {}) {
  const raw = base64ToArrayBuffer(imageBase64)
  let bytes
  try {
    bytes = compressImage(raw)
  } catch (error) {
    console.warn('compressImage:', error.message)
    bytes = raw
  }
  await putImage(env, id, bytes, 'image/jpeg')
  const base = options.apiBase || env.PUBLIC_API_BASE || WORKER_BASE
  return `${base}/api/news/image/${id}`
}

async function publishToVisitka(env, draft, options = {}) {
  const id = `news-${Date.now()}-${uuid()}`
  let image = '/images/news-ai.svg'
  if (draft.imageBase64) {
    image = await storeImage(env, id, draft.imageBase64, options)
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

  // Оставляем только последние MAX_NEWS; у удаляемых подчищаем картинки из KV.
  if (news.length > MAX_NEWS) {
    const removed = news.slice(MAX_NEWS)
    news.length = MAX_NEWS
    for (const old of removed) {
      const imgId = imageIdFromUrl(old.image)
      if (imgId) await delImage(env, imgId)
    }
  }

  await writeNews(env, news)
  return item
}

// Догрузка картинки к уже опубликованной новости (best-effort, отдельным шагом,
// чтобы публикация текста не зависела от долгой генерации картинки).
export async function attachImage(env, id, imageBase64, options = {}) {
  const url = await storeImage(env, id, imageBase64, options)
  const news = await readNews(env)
  const item = news.find((n) => n.id === id)
  if (!item) return false
  item.image = url
  await writeNews(env, news)
  return true
}

const PUBLISHERS = {
  visitka: publishToVisitka,
}

export async function publish(env, channel, draft, options = {}) {
  const publisher = PUBLISHERS[channel]
  if (!publisher) throw new Error(`unknown_channel: ${channel}`)
  return publisher(env, draft, options)
}
