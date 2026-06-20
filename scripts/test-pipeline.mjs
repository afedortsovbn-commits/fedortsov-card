// Проверка пайплайна с мок-KV: дедупликация (seen + published) и сборка очереди.
// Запуск: node scripts/test-pipeline.mjs
import { buildQueue } from '../news-service/pipeline.js'

// Мини-эмуляция Cloudflare KV в памяти.
function mockEnv(store = {}) {
  return {
    JOBS: {
      async get(key, type) {
        const v = store[key]
        if (v == null) return null
        return type === 'json' ? v : JSON.stringify(v)
      },
      async put(key, val) { store[key] = JSON.parse(val) },
    },
  }
}

console.log('\n=== Прогон 1: чистый KV ===')
const env1 = mockEnv()
const r1 = await buildQueue(env1)
console.log('stats:', r1.stats)
console.log('\nТоп за ДЕНЬ:')
r1.day.slice(0, 3).forEach((c, i) => console.log(`  ${i + 1}. [${c.score}] ${c.title} (${c.sourceName})`))
console.log('\nТоп за НЕДЕЛЮ:')
r1.week.slice(0, 3).forEach((c, i) => console.log(`  ${i + 1}. [${c.score}] ${c.title} (${c.sourceName})`))
console.log('\nОчередь на согласование:', r1.queue.map((c) => c.id).join(', '))

if (r1.queue.length >= 2) {
  const skipSeen = r1.queue[0]
  const skipPublished = r1.queue[1]
  console.log(`\n=== Прогон 2: помечаем как seen «${skipSeen.title.slice(0, 40)}…» и как опубликованную «${skipPublished.title.slice(0, 40)}…» ===`)
  const env2 = mockEnv({
    'news:seen': { [skipSeen.id]: new Date().toISOString() },
    news: [{ id: 'x', title: 'pub', sourceUrl: skipPublished.url }],
  })
  const r2 = await buildQueue(env2)
  const ids2 = new Set(r2.queue.map((c) => c.id))
  console.log('seen-кандидат исключён из очереди:', !ids2.has(skipSeen.id) ? 'ДА ✅' : 'НЕТ ❌')
  console.log('опубликованный исключён из очереди:', !ids2.has(skipPublished.id) ? 'ДА ✅' : 'НЕТ ❌')
  console.log('stats:', r2.stats)
}
