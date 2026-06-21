// Проверка обучения по оценкам: запись 🔥/👍/👎 и сборка калибровки для промпта.
// Запуск: node scripts/test-ratings.mjs
import { recordRating, buildCalibration, loadRatings } from '../news-service/ratings.js'
import { RATING_SCORES } from '../news-service/config.js'

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

const env = mockEnv()
const c = (title, summary = '') => ({ title, summary, sourceName: 'Тест' })

await recordRating(env, c('Креативный кейс Liquid Death с пародией на рекламу'), RATING_SCORES.fire)
await recordRating(env, c('Как нейросеть нарезала 100 роликов из одного'), RATING_SCORES.publish)
await recordRating(env, c('Объём рынка одежды в России вырос на 12%'), RATING_SCORES.down)
await recordRating(env, c('Госрегулирование рекламы в РФ: новые правила'), RATING_SCORES.down)
await recordRating(env, c('8 трендов маркетинга'), RATING_SCORES.up)

console.log('Всего оценок:', (await loadRatings(env)).length)
console.log('\n=== Калибровка, которая уйдёт в промпт отбора ===\n')
console.log(await buildCalibration(env))
