// Конфигурация сервиса авто-публикации новостей.
// Всё, что меняется при адаптации под другие каналы/темы, держим здесь.

// Источники: RSS-ленты и публичные Telegram-каналы (type: 'telegram').
// weight — небольшой приоритет источника при равных оценках.
// Telegram-каналы взяты из тех, что курирует владелец (его вкус), плюс
// белорусский «Гусаров маркетинг» под локальную повестку РБ.
export const SOURCES = [
  // Профильные медиа о маркетинге/рекламе (RSS).
  { id: 'sostav', name: 'Sostav', type: 'rss', url: 'https://www.sostav.ru/rss/', weight: 1.0 },
  { id: 'cossa', name: 'Cossa', type: 'rss', url: 'https://www.cossa.ru/rss/', weight: 1.0 },
  { id: 'adpass', name: 'ADPASS', type: 'rss', url: 'https://adpass.ru/feed/', weight: 1.0 },
  { id: 'ppcworld', name: 'ppc.world', type: 'rss', url: 'https://ppc.world/feed/', weight: 1.0 },
  { id: 'texterra', name: 'Texterra', type: 'rss', url: 'https://texterra.ru/blog/rss/', weight: 0.9 },
  { id: 'vc', name: 'vc.ru', type: 'rss', url: 'https://vc.ru/rss', weight: 1.0 },
  // Telegram-каналы (вкус владельца + Беларусь).
  { id: 'gusarovby', name: 'Гусаров маркетинг', type: 'telegram', username: 'gusarovby', weight: 1.3 },
  { id: 'marketingploy', name: 'Маркетинговый ход', type: 'telegram', username: 'MarketingPloy', weight: 1.2 },
  { id: 'profitmaker', name: 'Инструменты маркетолога', type: 'telegram', username: 'profit_maker', weight: 1.1 },
  { id: 'neurocode', name: 'Нейро', type: 'telegram', username: 'neuro_code', weight: 1.0 },
  { id: 'digitalopinion', name: 'СугубоЛичноеМнение', type: 'telegram', username: 'digitalopinion', weight: 1.1 },
]

// Окна отбора.
export const WINDOW_DAYS = { day: 1, week: 7 }

// Слова, повышающие ценность для нашей редполитики (исследования и цифры).
export const RESEARCH_KEYWORDS = [
  'исследован', 'опрос', 'статистик', 'данные показал', 'аналитик', 'отчёт', 'отчет',
  'рейтинг', 'индекс', 'тренд', 'прогноз', 'доля рынка', 'бенчмарк', 'метрик',
]

export const AI_KEYWORDS = [
  'нейросет', 'искусственн', ' ии ', 'ии-', 'gpt', 'chatgpt', 'gigachat', 'yandexgpt',
  'генеративн', 'llm', 'машинн', 'алгоритм',
]

// Темы, которые точно интересны маркетологам.
export const TOPIC_KEYWORDS = [
  'маркетинг', 'реклам', 'бренд', 'аудитори', 'потребител', 'покупател', 'клиент',
  'конверси', 'трафик', 'воронк', 'performance', 'ритейл', 'e-commerce', 'ecommerce',
  'соцсет', 'контент', 'seo', 'таргет', 'медиа', 'продвижен',
]

// Мусор/пиар, который отбраковываем.
export const NEGATIVE_KEYWORDS = [
  'вакансия', 'дайджест', 'подкаст', 'вебинар', 'промокод', 'скидк', 'розыгрыш',
  'гороскоп', 'спецпроект',
]

// Минимальные требования к кандидату.
export const EDITORIAL = {
  minTitleLength: 15,
  // Сколько кандидатов держим в очереди на согласование за один прогон.
  queueSize: 9,
  // Сколько карточек показываем за раз в Telegram (и «Ещё» отдаёт столько же).
  batchSize: 3,
}

// Баллы оценок из бота (для обучения по вкусу). publish — сильнейший сигнал.
export const RATING_SCORES = {
  fire: 9, // 🔥 отлично
  up: 6, // 👍 норм
  down: 2, // 👎 не моё
  publish: 10, // ✅ разместил
}
