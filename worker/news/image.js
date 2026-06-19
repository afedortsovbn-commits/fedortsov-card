// Генерация фоновой картинки новости через YandexART. Возвращает base64 (JPEG).
// YandexART плохо рисует текст, поэтому делаем абстрактный фон по теме — без
// надписей и логотипов.

import { yandexArtStart, yandexArtPoll } from './yandex.js'

export function buildImagePrompt(item) {
  const theme = (item.title || '').slice(0, 120)
  return [
    'Минималистичная абстрактная цифровая иллюстрация для новости о маркетинге и технологиях.',
    `Тема: ${theme}.`,
    'Современный корпоративный стиль, плавные геометрические формы, лёгкая инфографика,',
    'синие, бирюзовые и фиолетовые тона, мягкое свечение, чистая композиция.',
    'Без текста, без букв, без цифр, без надписей, без логотипов.',
  ].join(' ')
}

// Возвращает base64-строку JPEG или '' при ошибке (картинка не критична).
export async function generateImage(env, item, options = {}) {
  const prompt = options.prompt || buildImagePrompt(item)
  try {
    const operationId = await yandexArtStart(env, prompt, { width: 16, height: 9, seed: options.seed })
    return await yandexArtPoll(env, operationId, options)
  } catch (error) {
    console.warn('generateImage:', error.message)
    return ''
  }
}
