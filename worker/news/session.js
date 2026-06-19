// Состояние сессии согласования в KV. Живёт между нажатиями кнопок: помнит
// показанных кандидатов (чтобы при «Согласовать» знать их данные) и очередь
// ещё не показанных (для «Ещё 2»).

const SESSION_KEY = 'news:session'

export async function loadSession(env) {
  return (await env.JOBS.get(SESSION_KEY, 'json')) || null
}

export async function saveSession(env, session) {
  await env.JOBS.put(SESSION_KEY, JSON.stringify({ ...session, updatedAt: new Date().toISOString() }))
}

export async function clearSession(env) {
  await env.JOBS.delete(SESSION_KEY)
}

export function newSession(date, queue) {
  return {
    date,
    offered: {},     // id -> candidate (показанные карточки)
    queue,           // ещё не показанные кандидаты
    active: true,
    createdAt: new Date().toISOString(),
  }
}

// Переносит до n кандидатов из очереди в «показанные», возвращает их.
export function takeFromQueue(session, n) {
  const taken = session.queue.slice(0, n)
  session.queue = session.queue.slice(n)
  for (const c of taken) session.offered[c.id] = c
  return taken
}
