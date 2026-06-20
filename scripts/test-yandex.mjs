// Проверка ключа Яндекса: YandexGPT (текст) и YandexART (запуск генерации).
// Запуск: node scripts/test-yandex.mjs
import 'dotenv/config'
import { yandexComplete, yandexArtStart } from '../news-service/yandex.js'

const env = process.env
console.log('Folder:', env.YANDEX_FOLDER_ID || '(нет)')
console.log('API key:', env.YANDEX_API_KEY ? `${env.YANDEX_API_KEY.slice(0, 8)}…` : '(нет)')

console.log('\n=== 1. YandexGPT (область languageModels) ===')
try {
  const text = await yandexComplete(env, {
    user: 'Ответь ровно одним словом «работает», без точки.',
    model: 'yandexgpt-lite',
    maxTokens: 20,
  })
  console.log('Ответ модели:', JSON.stringify(text))
  console.log('✅ YandexGPT доступен')
} catch (e) {
  console.log('❌ YandexGPT:', e.message)
}

console.log('\n=== 2. YandexART (область imageGeneration) ===')
try {
  const opId = await yandexArtStart(env, 'минималистичный абстрактный фон, синие тона, маркетинг')
  console.log('Операция запущена, id:', opId)
  console.log('✅ YandexART доступен (генерацию не ждём, проверяем только доступ)')
} catch (e) {
  console.log('❌ YandexART:', e.message)
}
