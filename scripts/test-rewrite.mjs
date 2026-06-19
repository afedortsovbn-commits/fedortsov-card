// Тест связки: сбор → берём свежую новость → тянем статью → рерайт через GPT.
// Запуск: node scripts/test-rewrite.mjs
import 'dotenv/config'
import { SOURCES } from '../worker/news/config.js'
import { collectCandidates } from '../worker/news/collect.js'
import { selectTop } from '../worker/news/score.js'
import { fetchArticleText } from '../worker/news/article.js'
import { rewriteNews } from '../worker/news/rewrite.js'

const { candidates } = await collectCandidates({ sources: SOURCES, days: 7 })
const top = selectTop(candidates, { limit: 5, strict: true })
const pick = top[0]
console.log('Выбрана новость:', pick.title)
console.log('URL:', pick.url, '\n')

console.log('Тяну текст статьи…')
const article = await fetchArticleText(pick.url)
console.log(`Извлечено ${article.length} симв. Превью:`)
console.log(article.slice(0, 300), '\n')

console.log('Рерайт через YandexGPT…\n')
const result = await rewriteNews(process.env, pick, article)
console.log('=== ЗАГОЛОВОК ===')
console.log(result.title)
console.log('\n=== ТЕКСТ ===')
console.log(result.text)
