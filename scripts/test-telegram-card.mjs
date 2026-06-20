// Отправка тестовой карточки новости в Telegram (без трат на GPT — берём
// готовый пример из реального прогона отбора).
// Запуск: node scripts/test-telegram-card.mjs
import 'dotenv/config'
import { sendNewsCard } from '../news-service/telegram.js'

const sample = {
  id: '1a2b3c4d',
  title: 'Российский рынок ПО для ИИ вырастет в 4 раза к 2030 году',
  url: 'https://rb.ru/news/ai-software-market/',
  sourceName: 'Rusbase',
  publishedAt: '2026-06-19',
  gptScore: 100,
  gptReason: 'Исследование с конкретным прогнозом роста рынка ИИ-ПО — цифры и тренд, ценные для маркетолога.',
  summary: 'По прогнозу аналитиков, объём российского рынка программного обеспечения для искусственного интеллекта вырастет в четыре раза к 2030 году. Быстрее всего развиваются платформы для создания и дообучения ИИ-моделей.',
}

console.log('Отправляю тестовую карточку в Telegram (chat:', process.env.TELEGRAM_CHAT_ID, ')…')
try {
  const msg = await sendNewsCard(process.env, sample, { scope: 'week', index: 1, total: 9 })
  console.log('✅ Отправлено, message_id:', msg.message_id)
  console.log('Проверьте Telegram — должна прийти карточка с кнопками.')
} catch (e) {
  console.log('❌', e.message)
}
