// Тест связки: сбор → берём свежую новость → тянем статью → рерайт через GPT.
// Запуск: node scripts/test-rewrite.mjs
import 'dotenv/config'
import { SOURCES } from '../news-service/config.js'
import { collectCandidates } from '../news-service/collect.js'
import { selectTop } from '../news-service/score.js'
import { fetchArticleText } from '../news-service/article.js'
import { rewriteNews } from '../news-service/rewrite.js'

const { candidates } = await collectCandidates({ sources: SOURCES, days: 7 })
const top = selectTop(candidates, { limit: 20, strict: true })
// Берём новость С цифрами, чтобы проверить цифру в заголовке.
const hasNumber = (c) => /\d+\s?%|\d{2,}/.test(`${c.title} ${c.summary || ''}`)
const pick = top.find(hasNumber) || top[0]
console.log('Выбрана новость:', pick.title)
console.log('URL:', pick.url, '\n')

console.log('Тяну текст статьи…')
const article = pick.url.includes('t.me/') ? '' : await fetchArticleText(pick.url)
console.log(`Извлечено ${article.length} симв. Превью:`)
console.log(article.slice(0, 300), '\n')

console.log('Рерайт через YandexGPT…\n')
const result = await rewriteNews(process.env, pick, article)
console.log('=== ЗАГОЛОВОК ===')
console.log(result.title)
console.log('\n=== ТЕКСТ ===')
console.log(result.text)
