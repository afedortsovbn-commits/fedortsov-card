// Клиент Яндекс Foundation Models: YandexGPT (текст) и YandexART (картинки).
// Env-агностичен: env — это process.env (Node) или env воркера (Cloudflare),
// нужны поля YANDEX_FOLDER_ID и YANDEX_API_KEY.

const GPT_URL = 'https://llm.api.cloud.yandex.net/foundationModels/v1/completion'
const ART_URL = 'https://llm.api.cloud.yandex.net/foundationModels/v1/imageGenerationAsync'
const OP_URL = 'https://llm.api.cloud.yandex.net/operations/'

function creds(env) {
  const folder = env.YANDEX_FOLDER_ID
  const apiKey = env.YANDEX_API_KEY
  if (!folder || !apiKey) throw new Error('yandex_not_configured')
  return { folder, apiKey }
}

// Запрос к YandexGPT. Возвращает текст ответа.
export async function yandexComplete(env, options = {}) {
  const { folder, apiKey } = creds(env)
  const {
    system, user, messages,
    temperature = 0.3, maxTokens = 2000, model = 'yandexgpt',
  } = options

  const msgs = messages || [
    ...(system ? [{ role: 'system', text: system }] : []),
    { role: 'user', text: user },
  ]

  const response = await fetch(GPT_URL, {
    method: 'POST',
    headers: { Authorization: `Api-Key ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      modelUri: `gpt://${folder}/${model}/latest`,
      completionOptions: { stream: false, temperature, maxTokens: String(maxTokens) },
      messages: msgs,
    }),
  })

  if (!response.ok) {
    throw new Error(`yandex_gpt_${response.status}: ${(await response.text()).slice(0, 400)}`)
  }
  const data = await response.json()
  return data?.result?.alternatives?.[0]?.message?.text ?? ''
}

// Помогает разобрать JSON-ответ GPT, даже если модель обернула его в текст.
export function parseJsonFromText(text) {
  if (!text) return null
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)
  const raw = fenced ? fenced[1] : text
  const start = raw.indexOf('{')
  const startArr = raw.indexOf('[')
  const from = startArr !== -1 && (startArr < start || start === -1) ? startArr : start
  if (from === -1) return null
  const end = Math.max(raw.lastIndexOf('}'), raw.lastIndexOf(']'))
  try {
    return JSON.parse(raw.slice(from, end + 1))
  } catch {
    return null
  }
}

// Запуск генерации картинки YandexART. Возвращает id операции.
export async function yandexArtStart(env, prompt, options = {}) {
  const { folder, apiKey } = creds(env)
  const { width = 1024, height = 576, seed } = options
  const response = await fetch(ART_URL, {
    method: 'POST',
    headers: { Authorization: `Api-Key ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      modelUri: `art://${folder}/yandex-art/latest`,
      generationOptions: {
        aspectRatio: { widthRatio: String(width), heightRatio: String(height) },
        ...(seed != null ? { seed: String(seed) } : {}),
      },
      messages: [{ weight: '1', text: prompt }],
    }),
  })
  if (!response.ok) {
    throw new Error(`yandex_art_${response.status}: ${(await response.text()).slice(0, 400)}`)
  }
  const data = await response.json()
  return data?.id
}

// Опрос операции YandexART до готовности. Возвращает base64 картинки (PNG/JPEG).
export async function yandexArtPoll(env, operationId, { tries = 20, delayMs = 3000, sleep } = {}) {
  const { apiKey } = creds(env)
  const wait = sleep || ((ms) => new Promise((r) => setTimeout(r, ms)))
  for (let i = 0; i < tries; i += 1) {
    const response = await fetch(`${OP_URL}${operationId}`, {
      headers: { Authorization: `Api-Key ${apiKey}` },
    })
    if (!response.ok) {
      throw new Error(`yandex_art_poll_${response.status}: ${(await response.text()).slice(0, 300)}`)
    }
    const data = await response.json()
    if (data.done) {
      if (data.error) throw new Error(`yandex_art_op_error: ${JSON.stringify(data.error).slice(0, 300)}`)
      return data?.response?.image || ''
    }
    await wait(delayMs)
  }
  throw new Error('yandex_art_timeout')
}
