// Локальная проверка каркаса сбора новостей: тянет живые RSS, парсит,
// оценивает эвристикой и печатает топ. Запуск: node scripts/test-collect.mjs
import { SOURCES, WINDOW_DAYS } from '../worker/news/config.js'
import { collectCandidates } from '../worker/news/collect.js'
import { selectTop } from '../worker/news/score.js'

const days = Number(process.argv[2]) || WINDOW_DAYS.week

console.log(`\n=== Сбор кандидатов за ${days} дн. из ${SOURCES.length} источников ===\n`)
const { candidates, errors, stats } = await collectCandidates({ sources: SOURCES, days })

console.log('Статистика:', stats)
if (errors.length) console.log('Ошибки источников:', errors)

const top = selectTop(candidates, { limit: 10, strict: true })
console.log(`\n=== ТОП-${top.length} по редполитике (strict) ===\n`)
for (const [i, c] of top.entries()) {
  console.log(`${i + 1}. [${c.score}] ${c.title}`)
  console.log(`   ${c.sourceName} · ${c.publishedAt?.slice(0, 10) || 'без даты'} · ${c.reasons.join(', ')}`)
  console.log(`   ${c.url}\n`)
}

if (!top.length) {
  console.log('Строгий фильтр пуст — показываю топ-5 без strict для диагностики:\n')
  for (const c of selectTop(candidates, { limit: 5, strict: false })) {
    console.log(`[${c.score}] ${c.title} (${c.sourceName}) — ${c.reasons.join(', ')}`)
  }
}
