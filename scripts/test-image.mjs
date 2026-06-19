// Тест YandexART: генерируем фон под новость и сохраняем в файл для просмотра.
// Запуск: node scripts/test-image.mjs
import 'dotenv/config'
import { writeFileSync } from 'node:fs'
import { generateImage, buildImagePrompt } from '../worker/news/image.js'

const item = { title: 'Российский рынок ПО для ИИ вырастет в 4 раза к 2030 году' }
console.log('Промпт:', buildImagePrompt(item), '\n')
console.log('Генерирую (это 10–30 сек)…')

const t0 = Date.now()
const base64 = await generateImage(process.env, item)
if (!base64) {
  console.log('❌ Картинка не сгенерирована')
  process.exit(1)
}
const buf = Buffer.from(base64, 'base64')
writeFileSync('.tmp-news-image.jpg', buf)
console.log(`✅ Готово за ${((Date.now() - t0) / 1000).toFixed(0)}с, ${(buf.length / 1024).toFixed(0)} КБ → .tmp-news-image.jpg`)
