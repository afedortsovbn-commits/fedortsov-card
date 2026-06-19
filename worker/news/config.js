// Конфигурация сервиса авто-публикации новостей.
// Всё, что меняется при адаптации под другие каналы/темы, держим здесь.

// Живые RSS-ленты (проверены 2026-06-18). weight — небольшой приоритет
// источника при равных оценках. Лента vc.ru отдаёт «популярное», что само по
// себе сигнал виральности.
export const SOURCES = [
  { id: 'sostav', name: 'Sostav', url: 'https://www.sostav.ru/rss/', weight: 1.0 },
  { id: 'cossa', name: 'Cossa', url: 'https://www.cossa.ru/rss/', weight: 1.0 },
  { id: 'adpass', name: 'ADPASS', url: 'https://adpass.ru/feed/', weight: 1.0 },
  { id: 'ppcworld', name: 'ppc.world', url: 'https://ppc.world/feed/', weight: 1.1 },
  { id: 'texterra', name: 'Texterra', url: 'https://texterra.ru/blog/rss/', weight: 0.9 },
  { id: 'rb', name: 'Rusbase', url: 'https://rb.ru/feeds/all/', weight: 0.8 },
  { id: 'vc', name: 'vc.ru', url: 'https://vc.ru/rss', weight: 1.1 },
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
  // Сколько показываем за раз в Telegram («Ещё 2» отдаёт следующую партию).
  batchSize: 1,
}
