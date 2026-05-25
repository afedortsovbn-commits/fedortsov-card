# Облачный запуск админки

GitHub Pages показывает только статическую витрину. Админка, заявки, вакансии и Telegram-уведомления работают на Node.js-сервере.

## Render

1. Создайте Web Service из репозитория `fedortsov-card`.
2. Render прочитает `render.yaml`.
3. Добавьте переменные окружения:

```env
ADMIN_PASSWORD=ваш-сильный-пароль
ADMIN_TOKEN_SECRET=длинная-случайная-строка
TELEGRAM_BOT_TOKEN=токен-бота-из-BotFather
TELEGRAM_CHAT_ID=ваш-chat-id
DB_PATH=/var/data/db.json
```

4. В сервисе должен быть подключен диск `fedortsov-card-data` с mount path `/var/data`.

Данные админки сохраняются в `/var/data/db.json`. Это постоянный диск, поэтому вакансии, заявки и резюме не пропадут при перезапуске сервиса.

## Ссылки

После деплоя используйте адрес Render:

```text
https://ваш-render-сервис.onrender.com/
https://ваш-render-сервис.onrender.com/#admin
```

GitHub Pages можно оставить как публичную статическую версию, но для живой админки и Telegram лучше использовать именно серверный адрес Render.
