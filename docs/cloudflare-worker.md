# Отправка заявок через Cloudflare Worker

Публичный сайт на GitHub Pages отправляет форму практики в Cloudflare Worker.
Worker не хранит заявку и пересылает её непосредственно в Telegram.

## Секреты Worker

В Cloudflare должны быть заданы:

- `TELEGRAM_BOT_TOKEN`;
- `TELEGRAM_CHAT_ID`.

Они сохраняются как Cloudflare Secrets и не попадают в код сайта или GitHub.

## Адрес обработчика

После публикации Worker его адрес записывается в переменную репозитория GitHub:

`PRACTICE_API_URL=https://fedortsov-card-api.<поддомен>.workers.dev`

Workflow GitHub Pages передаёт адрес в сборку как `VITE_PRACTICE_API_URL`.

## Публикация

```bash
npm run worker:deploy
```

Для локального запуска:

```bash
npm run worker:dev
```
