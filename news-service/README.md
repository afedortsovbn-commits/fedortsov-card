# news-service

Автономный сервис поиска, согласования и публикации новостей.
Цепочка: **сбор RSS → отбор YandexGPT → согласование в Telegram → рерайт + картинка YandexART → публикация**.

Папка самодостаточна — её можно копировать в другой проект и адаптировать.

## Модули

| Файл | Назначение |
|---|---|
| `config.js` | RSS-источники и словари редполитики. **Главная точка настройки под тему/нишу.** |
| `rss.js` | Парсер RSS/Atom без DOMParser. |
| `collect.js` | Загрузка лент, канонизация URL, хэш-id, фильтр свежести. |
| `dedup.js` | Дедупликация через KV (`news:seen` + сверка с опубликованными). |
| `score.js` | Эвристическая оценка (быстрый предотбор и фолбэк). |
| `select-gpt.js` | Отбор и оценка виральности через YandexGPT. |
| `yandex.js` | Клиент Яндекс Foundation Models (GPT + ART). |
| `article.js` | Извлечение текста статьи по URL (для рерайта по фактам). |
| `rewrite.js` | Рерайт в оригинальный текст по редполитике. |
| `image.js` | Генерация фоновой картинки (YandexART). |
| `compress.js` | Сжатие картинки (Photon WASM). |
| `publish.js` | Слой `publisher` — куда публиковать (сейчас `visitka`). |
| `session.js` | Состояние согласования в KV. |
| `service.js` | Оркестратор: `runDaily` (cron) + `handleTelegramUpdate` (webhook). |
| `store.js` | Хранилище новостей и картинок в KV. |

## Точки входа

- `runDaily(env)` — ежедневный прогон (вызывать из cron).
- `handleTelegramUpdate(env, update, ctx)` — обработка нажатий кнопок (из webhook).

## Переменные окружения (env / секреты)

- `YANDEX_FOLDER_ID`, `YANDEX_API_KEY` — Яндекс Foundation Models.
- `NEWS_BOT_TOKEN` — токен Telegram-бота согласования.
- `TELEGRAM_CHAT_ID` — чат владельца (куда слать карточки).
- `TELEGRAM_WEBHOOK_SECRET` — секрет проверки webhook и ручного запуска.

Нужен KV-биндинг `JOBS` (ключи `news`, `news:seen`, `news:session`, `news:img:*`).

## Что менять при переиспользовании

1. `config.js` — список RSS и ключевые слова под новую тему.
2. `publish.js` — `WORKER_BASE` и/или добавить новый канал в `PUBLISHERS`.
3. `rewrite.js` / `select-gpt.js` — тексты промптов (редполитика).
4. `store.js` — `defaultNews` и модель новости под целевой ресурс.
