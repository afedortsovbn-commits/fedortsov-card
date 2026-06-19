// Полный прогон отбора через YandexGPT на живых RSS.
// Запуск: node scripts/test-gpt-select.mjs
import 'dotenv/config'
import { buildQueue } from '../worker/news/pipeline.js'
import { gptSelect } from '../worker/news/select-gpt.js'

const env = process.env
const ranker = (candidates) => gptSelect(env, candidates, { limit: 9 })

console.log('\n=== Отбор новостей через YandexGPT ===\n')
const t0 = Date.now()
const { day, week, queue, errors, stats } = await buildQueue(null, { ranker })
console.log('stats:', stats, `| ${((Date.now() - t0) / 1000).toFixed(1)}с`)
if (errors.length) console.log('ошибки источников:', errors)

console.log('\n--- ТОП за ДЕНЬ (GPT) ---')
day.forEach((c, i) => {
  console.log(`${i + 1}. [${c.gptScore}] ${c.title}`)
  console.log(`   ${c.sourceName} · ${c.publishedAt?.slice(0, 10) || '—'} · ${c.gptReason}`)
})

console.log('\n--- ТОП за НЕДЕЛЮ (GPT) ---')
week.forEach((c, i) => {
  console.log(`${i + 1}. [${c.gptScore}] ${c.title}  (${c.sourceName})`)
})

console.log('\nОчередь на согласование:', queue.length, 'шт.')
