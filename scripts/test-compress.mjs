// Проверка сжатия картинки Photon на реальной генерации YandexART.
// Запуск: node scripts/test-compress.mjs
import 'dotenv/config'
import { writeFileSync } from 'node:fs'
import { PhotonImage, resize, SamplingFilter } from '@cf-wasm/photon/node'
import { generateImage } from '../news-service/image.js'

console.log('Генерирую картинку ART…')
const base64 = await generateImage(process.env, { title: 'Российский рынок ПО для ИИ вырастет в 4 раза' })
const original = Buffer.from(base64, 'base64')
console.log(`Оригинал: ${(original.length / 1024).toFixed(0)} КБ`)

const img = PhotonImage.new_from_byteslice(new Uint8Array(original))
const w = img.get_width()
const h = img.get_height()
const targetW = Math.min(1280, w)
const targetH = Math.round((h * targetW) / w)
const resized = resize(img, targetW, targetH, SamplingFilter.Lanczos3)
const out = Buffer.from(resized.get_bytes_jpeg(85))
img.free()
resized.free()

writeFileSync('.tmp-compressed.jpg', out)
console.log(`Было ${w}×${h}, стало ${targetW}×${targetH}`)
console.log(`Сжато: ${(out.length / 1024).toFixed(0)} КБ (×${(original.length / out.length).toFixed(1)} меньше) → .tmp-compressed.jpg`)
