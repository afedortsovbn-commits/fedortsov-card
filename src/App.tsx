import type { FormEvent, ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import {
  Award,
  BriefcaseBusiness,
  Check,
  Clock,
  Edit3,
  ExternalLink,
  Fuel,
  GraduationCap,
  Gift,
  Mail,
  Megaphone,
  MessageCircle,
  Newspaper,
  Paperclip,
  Phone,
  Presentation,
  Plus,
  QrCode,
  Send,
  ShieldCheck,
  Smartphone,
  Trash2,
  UserPlus,
  Users,
  X,
} from 'lucide-react'
import profilePhoto from './assets/profile.jpg'
import './App.css'

type NewsItem = {
  id: string
  title: string
  date: string
  image: string
  text: string
  sourceUrl?: string
  sourceName?: string
  status?: NewsStatus
}

type NewsStatus = 'pending' | 'approved'

type StudentDraft = {
  fullName: string
  phone: string
  telegram: string
  university: string
  gradeAverage: string
  faculty: string
  specialization: string
  course: string
  enrollmentYear: string
  practiceDates: string
}

type JobOpening = {
  id: string
  createdAt?: string
  title: string
  startDate: string
  endDate: string
  isOpenEnded: boolean
  city: string
  workFormat: string
  conditions: string
  requirements: string
  responsibilities: string
  status: 'active' | 'paused'
}

type JobDraft = Omit<JobOpening, 'id' | 'createdAt'>

type ResumeDraft = {
  jobId: string
  jobTitle: string
  fullName: string
  phone: string
  telegram: string
  email: string
  resumeLink: string
  comment: string
}

type NoticeState = {
  message: string
  type: 'success' | 'error'
}

const emptyStudent: StudentDraft = {
  fullName: '',
  phone: '',
  telegram: '',
  university: '',
  gradeAverage: '',
  faculty: '',
  specialization: '',
  course: '',
  enrollmentYear: '',
  practiceDates: '',
}

const emptyNews: Omit<NewsItem, 'id'> = {
  title: '',
  date: new Date().toISOString().slice(0, 10),
  image: '',
  text: '',
  status: 'pending',
}

const newsImageTemplates = [
  '/images/news-ai.svg',
  '/images/news-data.svg',
  '/images/news-social.svg',
  '/images/news-strategy.svg',
  '/images/news-commerce.svg',
  '/images/news-content.svg',
  '/images/news-email.svg',
  '/images/news-brand.svg',
  '/images/news-events.svg',
  '/images/news-customer.svg',
]

const emptyJob: JobDraft = {
  title: '',
  startDate: new Date().toLocaleDateString('en-CA'),
  endDate: '',
  isOpenEnded: true,
  city: '',
  workFormat: '',
  conditions: '',
  requirements: '',
  responsibilities: '',
  status: 'active',
}

const emptyResume: ResumeDraft = {
  jobId: '',
  jobTitle: '',
  fullName: '',
  phone: '',
  telegram: '',
  email: '',
  resumeLink: '',
  comment: '',
}

const practiceApiBase = import.meta.env.VITE_PRACTICE_API_URL?.replace(/\/$/, '')
  || (window.location.hostname.endsWith('github.io')
    ? 'https://fedortsov-card-api.afedortsovbn.workers.dev'
    : '')
const cloudApi = (path: string) => `${practiceApiBase}${path}`

const fallbackNews: NewsItem[] = [
  {
    id: 'news-ai-loyalty-2026',
    title: 'ИИ становится новым посредником между брендом и покупателем',
    date: '2026-06-08',
    image: '/images/news-ai.svg',
    text: 'Покупатели всё чаще доверяют нейросетям не только поиск информации, но и выбор товаров, сравнение предложений и формирование списка предпочтительных брендов. Исследование агентства Gale показывает: более половины потребителей готовы пропускать коммуникацию компаний через ИИ-помощников.\n\nДля маркетинга это означает серьёзный сдвиг. Красивой рекламной кампании уже недостаточно — бренд должен быть понятен алгоритмам, иметь качественные данные о продуктах и сохранять прямую связь с аудиторией. Особую ценность приобретают собственные базы клиентов, сильные сообщества и последовательное присутствие во всех цифровых каналах.\n\nВ новой модели лояльность формируется не только между человеком и брендом. На решение всё чаще влияет цифровой помощник, который отбирает варианты и объясняет, почему один из них подходит лучше другого.',
    sourceUrl: 'https://www.marketingdive.com/news/why-marketers-must-rethink-loyalty-as-ai-reshapes-consumer-connections/822003/',
    sourceName: 'Marketing Dive',
  },
  {
    id: 'news-meta-ai-ads-2026',
    title: 'Meta усиливает маркировку рекламы, созданной с помощью ИИ',
    date: '2026-06-01',
    image: '/images/news-social.svg',
    text: 'Meta расширяет правила прозрачности для рекламы, созданной или существенно изменённой генеративным ИИ. Теперь информация будет учитывать не только инструменты самой Meta, но и сторонние нейросети, использованные рекламодателями.\n\nВ меню каждого объявления постепенно появляется единый раздел «Об этой рекламе». В нём пользователь сможет увидеть сведения о причинах показа и применении искусственного интеллекта при подготовке материалов.\n\nДля брендов вывод простой: использование ИИ в креативах становится обычной практикой, но скрывать его будет всё сложнее. Маркетологам стоит заранее выстроить правила маркировки, проверки изображений и сохранения доверия аудитории.',
    sourceUrl: 'https://about.fb.com/news/2025/02/gen-ai-transparency-metas-ads-products/',
    sourceName: 'Meta',
  },
  {
    id: 'news-google-ai-search-ads-2026',
    title: 'Google переносит рекламу в диалоговый AI-поиск',
    date: '2026-05-25',
    image: '/images/news-data.svg',
    text: 'На Google Marketing Live компания представила новое поколение рекламы для поиска с искусственным интеллектом. Объявления становятся частью диалога: Gemini сможет подбирать коммерческие предложения, объяснять преимущества товаров и показывать релевантные варианты прямо во время обсуждения запроса.\n\nСреди новых форматов — Conversational Discovery ads и Highlighted Answers. Они рассчитаны на ситуации, когда человек ещё не выбрал конкретный товар и уточняет потребности в разговорной форме. Google также развивает специальные предложения и упрощённую покупку непосредственно из поискового интерфейса.\n\nДля рекламодателей это усиливает значение качественных товарных данных, Performance Max, AI Max и понятного позиционирования бренда. Конкурировать предстоит уже не только за поисковую строку, но и за место в ответе нейросети.',
    sourceUrl: 'https://blog.google/products/ads-commerce/google-marketing-live-search-ads',
    sourceName: 'Google',
  },
  {
    id: 'news-1',
    title: 'Нейросети в маркетинге: главные тренды года',
    date: '2026-05-18',
    image: '/images/news-strategy.svg',
    text: 'Маркетинговые команды все чаще используют нейросети не как отдельный инструмент, а как часть ежедневного процесса: от анализа аудитории до подготовки креативов и быстрых гипотез. Главный фокус смещается к качеству промптов, проверке фактов и прозрачной редактуре результата.',
  },
  {
    id: 'news-2',
    title: 'Персонализация: как данные помогают продавать больше',
    date: '2026-05-17',
    image: '/images/news-commerce.svg',
    text: 'Бренды возвращаются к прагматичной персонализации: сегментируют аудиторию по поведению, уточняют офферы и тестируют коммуникации небольшими циклами. Побеждают не самые сложные системы, а команды, которые умеют быстро превращать данные в понятные действия.',
  },
  {
    id: 'news-3',
    title: 'Новые алгоритмы соцсетей: что важно знать маркетологу',
    date: '2026-05-16',
    image: '/images/news-content.svg',
    text: 'Социальные платформы продолжают усиливать роль удержания внимания, сохранений и обсуждений. Для маркетологов это означает больший спрос на контент с практической ценностью, ясной позицией и форматом, который удобно пересылать коллегам.',
  },
]

const api = {
  async login(password: string) {
    let response: Response
    try {
      response = await fetch(cloudApi('/api/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
    } catch {
      throw new Error('Серверная часть недоступна. Откройте админку по адресу Node-сервера, а не GitHub Pages.')
    }
    if (response.status === 404 || response.status === 405) {
      throw new Error('Серверная часть недоступна. GitHub Pages не проверяет пароль и не сохраняет данные.')
    }
    if (!response.ok) {
      throw new Error('Неверный пароль')
    }
    return response.json() as Promise<{ token: string }>
  },
  async changePassword(currentPassword: string, newPassword: string, token: string) {
    const response = await fetch(cloudApi('/api/auth/password'), {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ currentPassword, newPassword }),
    })
    const result = await response.json() as { changed?: boolean; message?: string }
    if (!response.ok) {
      throw new Error(result.message || 'Не удалось изменить пароль')
    }
    return result
  },
  async listNews() {
    const response = await fetch('/api/news')
    return response.json() as Promise<NewsItem[]>
  },
  async listJobs() {
    const response = await fetch(cloudApi('/api/jobs'))
    const jobs = await response.json() as JobOpening[]
    return jobs.map((job) => ({ ...job, conditions: job.conditions || '' }))
  },
  async createNews(payload: Omit<NewsItem, 'id'>, token: string) {
    const response = await fetch('/api/news', {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify(payload),
    })
    return response.json() as Promise<NewsItem>
  },
  async updateNews(id: string, payload: Partial<NewsItem>, token: string) {
    const response = await fetch(`/api/news/${id}`, {
      method: 'PUT',
      headers: authHeaders(token),
      body: JSON.stringify(payload),
    })
    return response.json() as Promise<NewsItem>
  },
  async deleteNews(id: string, token: string) {
    await fetch(`/api/news/${id}`, { method: 'DELETE', headers: authHeaders(token) })
  },
  async createJob(payload: JobDraft, token: string) {
    const response = await fetch(cloudApi('/api/jobs'), {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify(payload),
    })
    return response.json() as Promise<JobOpening>
  },
  async updateJob(id: string, payload: Partial<JobOpening>, token: string) {
    const response = await fetch(cloudApi(`/api/jobs/${id}`), {
      method: 'PUT',
      headers: authHeaders(token),
      body: JSON.stringify(payload),
    })
    return response.json() as Promise<JobOpening>
  },
  async deleteJob(id: string, token: string) {
    await fetch(cloudApi(`/api/jobs/${id}`), { method: 'DELETE', headers: authHeaders(token) })
  },
  async createStudent(payload: StudentDraft) {
    const response = await fetch(`${practiceApiBase}/api/applications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const result = await response.json() as { sent?: boolean; message?: string }
    if (!response.ok) {
      throw new Error(result.message || 'Не удалось отправить заявку')
    }
    return result
  },
  async createResume(payload: ResumeDraft, resumeFile: File | null) {
    const body = new FormData()
    Object.entries(payload).forEach(([key, value]) => body.set(key, value))
    if (resumeFile) {
      body.set('resumeFile', resumeFile)
    }
    const response = await fetch(cloudApi('/api/resumes'), {
      method: 'POST',
      body,
    })
    const result = await response.json() as { sent?: boolean; message?: string }
    if (!response.ok) {
      throw new Error(result.message || 'Не удалось отправить отклик')
    }
    return result
  },
}

function authHeaders(token: string) {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  }
}

function publicAsset(path: string) {
  if (path.startsWith('http') || path.startsWith('data:')) {
    return path
  }
  return path.startsWith('/') ? `${import.meta.env.BASE_URL}${path.slice(1)}` : path
}

function isStaticPagesHost() {
  return window.location.hostname.endsWith('github.io')
}

function isQrAddress() {
  return window.location.hash === '#qr' || new URLSearchParams(window.location.search).get('qr') === '1'
}

function App() {
  const [news, setNews] = useState<NewsItem[]>(fallbackNews)
  const [jobs, setJobs] = useState<JobOpening[]>([])
  const [adminToken, setAdminToken] = useState(() => localStorage.getItem('fedortsov-admin-token') || '')
  const [activeNews, setActiveNews] = useState<NewsItem | null>(null)
  const [viewedJob, setViewedJob] = useState<JobOpening | null>(null)
  const [activeJob, setActiveJob] = useState<JobOpening | null>(null)
  const [isPracticeOpen, setPracticeOpen] = useState(false)
  const [isPracticeSubmitting, setPracticeSubmitting] = useState(false)
  const [studentDraft, setStudentDraft] = useState(emptyStudent)
  const [resumeDraft, setResumeDraft] = useState(emptyResume)
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [isResumeSubmitting, setResumeSubmitting] = useState(false)
  const [isQrOpen, setQrOpen] = useState(isQrAddress)
  const [notice, setNotice] = useState<NoticeState | null>(null)
  const [route, setRoute] = useState(window.location.hash === '#admin' ? 'admin' : 'site')

  const isAdmin = route === 'admin'
  const publicNews = news.filter((item) => item.status !== 'pending')
  const publicJobs = jobs.filter((item) => item.status !== 'paused')

  const showNotice = (message: string, type: NoticeState['type'] = 'error') => {
    setNotice({ message, type })
  }

  useEffect(() => {
    const load = async () => {
      const [newsResult, jobsResult] = await Promise.allSettled([api.listNews(), api.listJobs()])
      if (newsResult.status === 'fulfilled') {
        setNews(newsResult.value)
      }
      if (jobsResult.status === 'fulfilled') {
        setJobs(jobsResult.value)
      }
    }

    load().catch(() => {
      if (!isStaticPagesHost()) {
        showNotice('Не удалось загрузить данные. Проверьте, запущен ли сервер.')
      }
    })
  }, [])

  useEffect(() => {
    if (notice?.type !== 'success') {
      return
    }
    const timer = window.setTimeout(() => setNotice(null), 3000)
    return () => window.clearTimeout(timer)
  }, [notice])

  useEffect(() => {
    const onLocationChange = () => {
      setRoute(window.location.hash === '#admin' ? 'admin' : 'site')
      setQrOpen(isQrAddress())
    }
    window.addEventListener('hashchange', onLocationChange)
    window.addEventListener('popstate', onLocationChange)
    return () => {
      window.removeEventListener('hashchange', onLocationChange)
      window.removeEventListener('popstate', onLocationChange)
    }
  }, [])

  const openQr = () => {
    const url = new URL(window.location.href)
    url.searchParams.set('qr', '1')
    url.hash = ''
    window.history.pushState('', document.title, url)
    setQrOpen(true)
  }

  const closeQr = () => {
    setQrOpen(false)
    const url = new URL(window.location.href)
    url.searchParams.delete('qr')
    if (url.hash === '#qr') {
      url.hash = ''
    }
    window.history.pushState('', document.title, url)
  }

  const submitPractice = async (event: FormEvent) => {
    event.preventDefault()
    setPracticeSubmitting(true)
    try {
      await api.createStudent(studentDraft)
      setStudentDraft(emptyStudent)
      setPracticeOpen(false)
      showNotice('Заявка отправлена в Telegram. Александр свяжется с вами после просмотра анкеты.', 'success')
    } catch (error) {
      showNotice(error instanceof Error ? error.message : 'Не удалось отправить заявку. Попробуйте еще раз.')
    } finally {
      setPracticeSubmitting(false)
    }
  }

  const submitResume = async (event: FormEvent) => {
    event.preventDefault()
    if (!activeJob) {
      return
    }
    if (resumeFile) {
      const extension = resumeFile.name.toLowerCase().split('.').pop()
      if (!['pdf', 'doc', 'docx'].includes(extension || '')) {
        showNotice('Файл резюме должен быть в формате PDF, DOC или DOCX')
        return
      }
      if (resumeFile.size > 10 * 1024 * 1024) {
        showNotice('Размер файла резюме не должен превышать 10 МБ')
        return
      }
    }
    setResumeSubmitting(true)
    try {
      await api.createResume(
        { ...resumeDraft, jobId: activeJob.id, jobTitle: activeJob.title },
        resumeFile,
      )
      setResumeDraft(emptyResume)
      setResumeFile(null)
      setActiveJob(null)
      showNotice('Отклик успешно отправлен в Telegram.', 'success')
    } catch (error) {
      showNotice(error instanceof Error ? error.message : 'Не удалось отправить отклик')
    } finally {
      setResumeSubmitting(false)
    }
  }

  const refreshNewsItem = (updated: NewsItem) => {
    setNews((items) => items.map((item) => (item.id === updated.id ? updated : item)))
  }

  const refreshJob = (updated: JobOpening) => {
    setJobs((items) => items.map((item) => (item.id === updated.id ? updated : item)))
  }

  return (
    <>
      <header className="topbar">
        <nav aria-label="Основная навигация">
          <a href="#contacts">Контакты</a>
          <a href="#jobs">Вакансии</a>
          <a href="#news">Новости</a>
          <a href="#projects">Проекты</a>
        </nav>
      </header>

      {notice && (
        <div className={`toast is-${notice.type}`} role="status">
          {notice.message}
          <button type="button" onClick={() => setNotice(null)} aria-label="Закрыть уведомление">
            <X size={16} />
          </button>
        </div>
      )}

      {isAdmin ? (
        adminToken ? (
          <AdminPanel
            token={adminToken}
            news={news}
            jobs={jobs}
            onLogout={() => {
              localStorage.removeItem('fedortsov-admin-token')
              setAdminToken('')
            }}
            onBack={() => {
              window.location.hash = ''
              setRoute('site')
            }}
            onNewsCreated={(created) => setNews((items) => [created, ...items])}
            onNewsUpdated={refreshNewsItem}
            onNewsDeleted={(id) => setNews((items) => items.filter((item) => item.id !== id))}
            onJobCreated={(created) => setJobs((items) => [created, ...items])}
            onJobUpdated={refreshJob}
            onJobDeleted={(id) => setJobs((items) => items.filter((item) => item.id !== id))}
          />
        ) : (
          <AdminLogin
            onBack={() => {
              window.location.hash = ''
              setRoute('site')
            }}
            onLogin={async (password) => {
              const result = await api.login(password)
              localStorage.setItem('fedortsov-admin-token', result.token)
              setAdminToken(result.token)
            }}
          />
        )
      ) : (
        <main>
          <Hero onPractice={() => setPracticeOpen(true)} />
          <Contacts />
          <JobsSection jobs={publicJobs} onOpen={setViewedJob} />
          <NewsSection news={publicNews} onOpen={setActiveNews} />
          <Projects />
        </main>
      )}

      <footer className="footer">
        <span>© {new Date().getFullYear()} Федорцов Александр</span>
      </footer>

      {isPracticeOpen && (
        <Modal title="Запись на прохождение практики" onClose={() => setPracticeOpen(false)}>
          <form className="practice-form" onSubmit={submitPractice} onInvalidCapture={handleInvalidForm} onInput={clearInvalidField}>
            <TextInput label="ФИО полностью" value={studentDraft.fullName} onChange={(fullName) => setStudentDraft({ ...studentDraft, fullName })} required />
            <TextInput label="Телефон" value={studentDraft.phone} onChange={(phone) => setStudentDraft({ ...studentDraft, phone })} required />
            <TextInput label="Телеграм" value={studentDraft.telegram} onChange={(telegram) => setStudentDraft({ ...studentDraft, telegram })} required />
            <TextInput label="ВУЗ" value={studentDraft.university} onChange={(university) => setStudentDraft({ ...studentDraft, university })} required />
            <TextInput label="Средний балл за последний семестр" value={studentDraft.gradeAverage} onChange={(gradeAverage) => setStudentDraft({ ...studentDraft, gradeAverage })} required />
            <TextInput label="Факультет" value={studentDraft.faculty} onChange={(faculty) => setStudentDraft({ ...studentDraft, faculty })} required />
            <TextInput label="Специализация" value={studentDraft.specialization} onChange={(specialization) => setStudentDraft({ ...studentDraft, specialization })} required />
            <TextInput label="Курс" value={studentDraft.course} onChange={(course) => setStudentDraft({ ...studentDraft, course })} required />
            <TextInput label="Год поступления" value={studentDraft.enrollmentYear} onChange={(enrollmentYear) => setStudentDraft({ ...studentDraft, enrollmentYear })} required />
            <label className="field field-wide">
              <span>Даты практики <RequiredMark /></span>
              <textarea
                value={studentDraft.practiceDates}
                onChange={(event) => setStudentDraft({ ...studentDraft, practiceDates: event.target.value })}
                placeholder="Например: 03.06.2026 - 28.06.2026"
                required
              />
            </label>
            <button className="primary-action field-wide" type="submit" disabled={isPracticeSubmitting}>
              <Send size={18} />
              {isPracticeSubmitting ? 'Отправляю...' : 'Отправить заявку'}
            </button>
          </form>
        </Modal>
      )}

      {activeNews && (
        <Modal title={activeNews.title} onClose={() => setActiveNews(null)}>
          <article className="news-full">
            <img src={publicAsset(activeNews.image)} alt="" />
            <time>{formatDate(activeNews.date)}</time>
            <p>{activeNews.text}</p>
            {activeNews.sourceUrl && (
              <a className="news-source" href={activeNews.sourceUrl} target="_blank" rel="noreferrer">
                Источник: {activeNews.sourceName || 'первоисточник'}
                <ExternalLink size={16} />
              </a>
            )}
          </article>
        </Modal>
      )}

      {viewedJob && (
        <Modal title={viewedJob.title} onClose={() => setViewedJob(null)}>
          <article className="job-full">
            <p className="job-meta">
              {[viewedJob.city, viewedJob.workFormat, formatJobDates(viewedJob)].filter(Boolean).join(' · ')}
            </p>
            {viewedJob.conditions && (
              <section>
                <h3>Условия работы</h3>
                <p>{viewedJob.conditions}</p>
              </section>
            )}
            <section>
              <h3>Задачи и обязанности</h3>
              <p>{viewedJob.responsibilities}</p>
            </section>
            <section>
              <h3>Требования</h3>
              <p>{viewedJob.requirements}</p>
            </section>
            <button
              className="primary-action"
              type="button"
              onClick={() => {
                setActiveJob(viewedJob)
                setViewedJob(null)
              }}
            >
              <Send size={18} />
              Отправить резюме
            </button>
          </article>
        </Modal>
      )}

      {activeJob && (
        <Modal title="Отправить резюме" onClose={() => setActiveJob(null)}>
          <form className="practice-form" onSubmit={submitResume} onInvalidCapture={handleInvalidForm} onInput={clearInvalidField}>
            <div className="field field-wide">
              <span>Вакансия</span>
              <strong>{activeJob.title}</strong>
            </div>
            <TextInput label="ФИО" value={resumeDraft.fullName} onChange={(fullName) => setResumeDraft({ ...resumeDraft, fullName })} required />
            <TextInput label="Телефон" value={resumeDraft.phone} onChange={(phone) => setResumeDraft({ ...resumeDraft, phone })} required />
            <TextInput label="Телеграм" value={resumeDraft.telegram} onChange={(telegram) => setResumeDraft({ ...resumeDraft, telegram })} />
            <TextInput label="E-mail" type="email" value={resumeDraft.email} onChange={(email) => setResumeDraft({ ...resumeDraft, email })} />
            <TextInput label="Ссылка на резюме" value={resumeDraft.resumeLink} onChange={(resumeLink) => setResumeDraft({ ...resumeDraft, resumeLink })} placeholder="Google Drive, hh, LinkedIn или другой URL" />
            <label className="field field-wide file-field">
              <span>Файл резюме (необязательно)</span>
              <input
                type="file"
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={(event) => setResumeFile(event.target.files?.[0] || null)}
              />
              <small>PDF, DOC или DOCX, до 10 МБ</small>
            </label>
            <label className="field field-wide">
              <span>Комментарий</span>
              <textarea value={resumeDraft.comment} onChange={(event) => setResumeDraft({ ...resumeDraft, comment: event.target.value })} />
            </label>
            <button className="primary-action field-wide" type="submit" disabled={isResumeSubmitting}>
              {resumeFile ? <Paperclip size={18} /> : <Send size={18} />}
              {isResumeSubmitting ? 'Отправляю...' : 'Отправить резюме'}
            </button>
          </form>
        </Modal>
      )}

      {isQrOpen && (
        <Modal title="QR-код сайта" onClose={closeQr}>
          <div className="qr-modal">
            <img src={publicAsset('/images/site-qr.svg')} alt="QR-код сайта" />
          </div>
        </Modal>
      )}

      {!isAdmin && <ShareActions onQr={openQr} />}
    </>
  )
}

function ShareActions({ onQr }: { onQr: () => void }) {
  return (
    <div className="share-actions" aria-label="Быстрые действия">
      <button type="button" onClick={onQr}>
        <QrCode size={16} />
        QR-код
      </button>
      <a href={publicAsset('/downloads/alexander-fedortsov.vcf')} download>
        <UserPlus size={16} />
        Сохранить контакт
      </a>
    </div>
  )
}

function Hero({ onPractice }: { onPractice: () => void }) {
  return (
    <section className="hero-section">
      <div className="hero-copy">
        <p className="eyebrow">Профессиональный маркетолог</p>
        <p className="workplace">CMO Белоруснефть</p>
        <h1>Федорцов Александр</h1>
        <ul className="proof-list" aria-label="Профессиональные достижения">
          <li>
            <ShieldCheck />
            <span>Спикер международных маркетинговых конференций</span>
          </li>
          <li>
            <Award />
            <span>Финалист персонального рейтинга эффективности маркетологов</span>
          </li>
          <li>
            <Users />
            <span>Член жюри белорусских маркетинговых конкурсов</span>
          </li>
          <li>
            <Clock />
            <span>Стаж работы в маркетинге: <strong>15+ лет</strong></span>
          </li>
        </ul>
        <button className="practice-button" type="button" onClick={onPractice}>
          <GraduationCap size={24} />
          <span>
            <b>Записаться на прохождение</b>
            <b>практики</b>
            <small>для студентов</small>
          </span>
        </button>
      </div>
      <div
        className="portrait-card"
        aria-label="Фото Александра Федорцова"
      >
        <img src={profilePhoto} alt="Александр Федорцов" />
      </div>
    </section>
  )
}

function Contacts() {
  const contacts: ({ label: string; href: string; icon: LucideIcon } | { label: string; href: string; brand: 'in' | 'ig' | 'threads' | 'tenchat' })[] = [
    { label: '+375 29 690 88 59', href: 'tel:+375296908859', icon: Phone },
    { label: 'A.Fedortsov@beloil.by', href: 'mailto:A.Fedortsov@beloil.by', icon: Mail },
    { label: '@Alex_Fedortsov', href: 'https://t.me/Alex_Fedortsov', icon: Send },
    { label: 'Александр Федорцов', href: 'https://www.linkedin.com/in/александр-федорцов-246a02a5', brand: 'in' },
    { label: '@alexandrfedartsov', href: 'https://www.instagram.com/alexandrfedartsov', brand: 'ig' },
    { label: 'Threads', href: 'https://www.threads.com/@alexandrfedortsov', brand: 'threads' },
    { label: 'TenChat', href: 'https://m.tenchat.ru/u/sxKC4cSd', brand: 'tenchat' },
  ]

  return (
    <section className="contacts-band" id="contacts" aria-label="Контакты">
      <div className="contact-grid">
        {contacts.map((item) => (
          <a key={item.href} href={item.href} target={item.href.startsWith('http') ? '_blank' : undefined} rel="noreferrer">
            {'icon' in item ? <item.icon /> : <BrandMark kind={item.brand} />}
            {item.label}
          </a>
        ))}
      </div>
      <a className="telegram-channel" href="https://t.me/MarketingAndAI" target="_blank" rel="noreferrer">
        <MessageCircle size={40} />
        <span>
          Телеграм-канал:
          <strong>Маркетинг и нейросети</strong>
        </span>
        <b>t.me/MarketingAndAI</b>
        <ExternalLink size={20} />
      </a>
    </section>
  )
}

function BrandMark({ kind }: { kind: 'in' | 'ig' | 'threads' | 'tenchat' }) {
  if (kind === 'in') {
    return (
      <span className="brand-mark brand-mark-in" aria-hidden="true">
        <svg viewBox="0 0 24 24" focusable="false">
          <rect x="3" y="3" width="18" height="18" rx="3" />
          <path d="M8 10v7M8 7.5v.05M12 17v-7M12 13.2c0-2 1.1-3.4 3-3.4 1.8 0 3 1.2 3 3.6V17" />
        </svg>
      </span>
    )
  }
  if (kind === 'ig') {
    return (
      <span className="brand-mark brand-mark-ig" aria-hidden="true">
        <svg viewBox="0 0 24 24" focusable="false">
          <rect x="4" y="4" width="16" height="16" rx="5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17" cy="7" r="1" />
        </svg>
      </span>
    )
  }
  const label = kind === 'threads' ? '@' : 'T'
  return <span className={`brand-mark brand-mark-${kind}`} aria-hidden="true">{label}</span>
}

function JobsSection({ jobs, onOpen }: { jobs: JobOpening[]; onOpen: (job: JobOpening) => void }) {
  if (jobs.length === 0) {
    return null
  }

  return (
    <section className="section-shell" id="jobs">
      <div className="section-title">
        <BriefcaseBusiness />
        <h2>Ищу сотрудников</h2>
      </div>
      <div className="job-grid">
        {jobs.map((job) => (
          <article className="job-card" key={job.id}>
            <h3>{job.title}</h3>
            <p className="job-meta">
              {[job.city, job.conditions].filter(Boolean).join(' · ')}
            </p>
            <button className="job-open-button" type="button" onClick={() => onOpen(job)}>
              Подробнее
              <ExternalLink size={16} />
            </button>
          </article>
        ))}
      </div>
    </section>
  )
}

function NewsSection({ news, onOpen }: { news: NewsItem[]; onOpen: (item: NewsItem) => void }) {
  return (
    <section className="section-shell" id="news">
      <div className="section-title">
        <Newspaper />
        <h2>Маркетинговые новости</h2>
      </div>
      <div className="news-rail" aria-label="Список маркетинговых новостей">
        {news.map((item) => (
          <article className="news-card" key={item.id}>
            <img src={publicAsset(item.image)} alt="" />
            <div>
              <time>{formatDate(item.date)}</time>
              <h3>{item.title}</h3>
              <button type="button" onClick={() => onOpen(item)}>
                Читать далее
                <ExternalLink size={16} />
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

function Projects() {
  const [isCompetencyOpen, setCompetencyOpen] = useState(false)

  return (
    <section className="section-shell" id="projects">
      <div className="section-title">
        <BriefcaseBusiness />
        <h2>Мои проекты</h2>
      </div>
      <div className="project-grid">
        <a
          href="https://afedortsovbn-commits.github.io/promo-mechanics-selector/"
          className="project-card"
          aria-label="Выбор механики акции"
          target="_blank"
          rel="noreferrer"
        >
          <Megaphone />
          <h3>Выбор механики акции</h3>
          <p>Разработка эффективных механик для продвижения товаров и услуг.</p>
          <span>Подробнее <ExternalLink size={16} /></span>
        </a>
        <article className="project-card">
          <Users />
          <h3>Тестирование компетенций персонала</h3>
          <p>Оценка компетенций кандидатов и сотрудников под задачи вашего бизнеса.</p>
          <button className="project-details-button" type="button" onClick={() => setCompetencyOpen(true)}>
            Подробнее <ExternalLink size={16} />
          </button>
        </article>
        <a
          href="https://afedortsovbn-commits.github.io/poll-slide-studio/"
          className="project-card"
          aria-label="Интерактивные презентации"
          target="_blank"
          rel="noreferrer"
        >
          <Presentation />
          <h3>Интерактивные презентации</h3>
          <p>Конструктор презентаций с админкой, QR-опросами, голосованием и результатами в реальном времени.</p>
          <span>Открыть сервис <ExternalLink size={16} /></span>
        </a>
        <a
          href={publicAsset('/downloads/expense-control.apk')}
          className="project-card"
          aria-label="Скачать приложение для контроля расходов"
          download
        >
          <Smartphone />
          <h3>Контроль расходов</h3>
          <p>Мобильное приложение для Android, чтобы фиксировать расходы и держать личные финансы под контролем.</p>
          <span>Скачать APK <ExternalLink size={16} /></span>
        </a>
        <a
          href="https://afedortsovbn-commits.github.io/Kassa/"
          className="project-card"
          aria-label="Эмулятор терминала самообслуживания АЗС"
          target="_blank"
          rel="noreferrer"
        >
          <Fuel />
          <h3>Терминал самообслуживания АЗС</h3>
          <p>Эмулятор терминала для проектирования и улучшения пользовательского опыта в системах самообслуживания АЗС.</p>
          <span>Открыть эмулятор <ExternalLink size={16} /></span>
        </a>
        <a
          href="https://afedortsovbn-commits.github.io/Suvenir/"
          className="project-card"
          aria-label="Каталог сувенирной продукции"
          target="_blank"
          rel="noreferrer"
        >
          <Gift />
          <h3>Каталог сувенирной продукции</h3>
          <p>Управляемый каталог сувениров с выбором позиций, подробными характеристиками и формированием PDF.</p>
          <span>Открыть каталог <ExternalLink size={16} /></span>
        </a>
      </div>
      {isCompetencyOpen && (
        <Modal title="Тестирование компетенций персонала" onClose={() => setCompetencyOpen(false)}>
          <div className="project-details">
            <p>
              «Оценка компетенций» — веб-сервис, который позволяет HR-специалисту за минуту создать
              профессиональный опрос, отправить кандидату QR-код или ссылку, и в реальном времени
              наблюдать за прохождением.
            </p>
            <h3>Ключевые возможности</h3>
            <ul>
              <li><strong>Гибкий конструктор опросов</strong> — выбирайте от 1 до 23 компетенций, комбинируя разделы под конкретную вакансию</li>
              <li><strong>QR-код и ссылка</strong> — кандидат открывает тест за секунду, без регистрации и приложений</li>
              <li><strong>Мониторинг в реальном времени</strong> — видите ответы кандидата по мере прохождения, прямо в своём кабинете</li>
              <li><strong>Наглядные результаты</strong> — цветовая шкала от красного к зелёному мгновенно показывает сильные и слабые стороны</li>
              <li><strong>Работает на любом устройстве</strong> — адаптирован для десктопа и мобильных; HR может проводить собеседование с телефона</li>
              <li><strong>Перемешивание ответов</strong> — варианты ответов каждый раз в случайном порядке, что исключает списывание</li>
              <li><strong>Таймер на вопрос</strong> — настраиваемое время ответа для контроля темпа прохождения</li>
            </ul>
            <h3>Для кого</h3>
            <ul>
              <li>HR-отделы компаний, которые набирают маркетологов, аналитиков, менеджеров</li>
              <li>Руководители отделов маркетинга и аналитики, которые хотят быстро оценить уровень кандидата</li>
              <li>HR-агентства, которым нужен инструмент для стандартизированной оценки соискателей</li>
            </ul>
            <h3>Начните прямо сейчас</h3>
            <p>Сервис работает в браузере, не требует установки. Доступ по запросу.</p>
            <a
              className="primary-action project-service-link"
              href="https://afedortsovbn-commits.github.io/marketer-competency-service/"
              target="_blank"
              rel="noreferrer"
            >
              Открыть сервис <ExternalLink size={18} />
            </a>
          </div>
        </Modal>
      )}
    </section>
  )
}

function AdminLogin({ onBack, onLogin }: { onBack: () => void; onLogin: (password: string) => Promise<void> }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setLoading] = useState(false)

  return (
    <main className="admin-login-shell">
      <section className="admin-login-card">
        <p className="eyebrow">Вход в админку</p>
        <h1>Введите пароль</h1>
        <p>Доступ к управлению вакансиями и новостями закрыт паролем.</p>
        <form
          onSubmit={async (event) => {
            event.preventDefault()
            setLoading(true)
            setError('')
            try {
              await onLogin(password)
            } catch (error) {
              setError(error instanceof Error ? error.message : 'Пароль не подошел. Проверьте ввод и попробуйте еще раз.')
            } finally {
              setLoading(false)
            }
          }}
        >
          <label className="field">
            <span>Пароль администратора</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
          </label>
          {error && <p className="form-error">{error}</p>}
          <button className="primary-action" type="submit" disabled={isLoading}>
            <ShieldCheck size={18} />
            {isLoading ? 'Проверяю...' : 'Войти'}
          </button>
          <button className="ghost-button" type="button" onClick={onBack}>
            Вернуться на сайт
          </button>
        </form>
      </section>
    </main>
  )
}

function AdminPanel({
  token,
  news,
  jobs,
  onLogout,
  onBack,
  onNewsCreated,
  onNewsUpdated,
  onNewsDeleted,
  onJobCreated,
  onJobUpdated,
  onJobDeleted,
}: {
  token: string
  news: NewsItem[]
  jobs: JobOpening[]
  onLogout: () => void
  onBack: () => void
  onNewsCreated: (item: NewsItem) => void
  onNewsUpdated: (item: NewsItem) => void
  onNewsDeleted: (id: string) => void
  onJobCreated: (item: JobOpening) => void
  onJobUpdated: (item: JobOpening) => void
  onJobDeleted: (id: string) => void
}) {
  const [newsDraft, setNewsDraft] = useState(emptyNews)
  const [jobDraft, setJobDraft] = useState(emptyJob)
  const [editingNews, setEditingNews] = useState<string | null>(null)
  const [editingJob, setEditingJob] = useState<string | null>(null)
  const [expandedJob, setExpandedJob] = useState<string | null>(null)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordMessage, setPasswordMessage] = useState('')

  const submitNews = async (event: FormEvent) => {
    event.preventDefault()
    const image = newsDraft.image || newsImageTemplates.find((template) => !news.some((item) => item.image === template)) || newsImageTemplates[0]
    const created = await api.createNews({ ...newsDraft, image, status: 'pending' }, token)
    onNewsCreated(created)
    setNewsDraft(emptyNews)
  }

  const submitJob = async (event: FormEvent) => {
    event.preventDefault()
    const created = await api.createJob(jobDraft, token)
    onJobCreated(created)
    setJobDraft({ ...emptyJob, startDate: new Date().toLocaleDateString('en-CA') })
  }

  const submitPassword = async (event: FormEvent) => {
    event.preventDefault()
    setPasswordMessage('')
    if (newPassword !== confirmPassword) {
      setPasswordMessage('Новые пароли не совпадают')
      return
    }
    try {
      await api.changePassword(currentPassword, newPassword, token)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setPasswordMessage('Пароль успешно изменён')
    } catch (error) {
      setPasswordMessage(error instanceof Error ? error.message : 'Не удалось изменить пароль')
    }
  }

  return (
    <main className="admin-shell">
      <div className="admin-heading">
        <div>
          <p className="eyebrow">Административная часть</p>
          <h1>Вакансии и новости</h1>
        </div>
        <div className="admin-heading-actions">
          <button className="ghost-button" type="button" onClick={onBack}>
            Вернуться на сайт
          </button>
          <button className="ghost-button" type="button" onClick={onLogout}>
            Выйти
          </button>
        </div>
      </div>

      <div className="admin-stats">
        <span>Вакансий: <strong>{jobs.length}</strong></span>
        <span>Опубликовано: <strong>{jobs.filter((job) => job.status === 'active').length}</strong></span>
        <span>Скрыто: <strong>{jobs.filter((job) => job.status === 'paused').length}</strong></span>
        <span>Новостей: <strong>{news.length}</strong></span>
      </div>

      <section className="admin-section">
        <h2>Управление новостями</h2>
        <form className="news-form" onSubmit={submitNews}>
          <TextInput label="Заголовок" value={newsDraft.title} onChange={(title) => setNewsDraft({ ...newsDraft, title })} required />
          <TextInput label="Дата" type="date" value={newsDraft.date} onChange={(date) => setNewsDraft({ ...newsDraft, date })} required />
          <label className="field field-wide">
            <span>Шаблон фоновой картинки</span>
            <div className="news-template-grid">
              {newsImageTemplates.map((template, index) => (
                <button
                  className={newsDraft.image === template ? 'is-selected' : ''}
                  type="button"
                  key={template}
                  onClick={() => setNewsDraft({ ...newsDraft, image: template })}
                  aria-label={`Выбрать шаблон ${index + 1}`}
                  title={`Шаблон ${index + 1}`}
                >
                  <img src={publicAsset(template)} alt="" />
                  <span>{index + 1}</span>
                </button>
              ))}
            </div>
          </label>
          <TextInput label="Свой URL или путь картинки (необязательно)" value={newsDraft.image} onChange={(image) => setNewsDraft({ ...newsDraft, image })} placeholder="/images/news-ai.svg" />
          <label className="field field-wide">
            <span>Текст новости</span>
            <textarea value={newsDraft.text} onChange={(event) => setNewsDraft({ ...newsDraft, text: event.target.value })} required />
          </label>
          <button className="primary-action field-wide" type="submit">
            <Plus size={18} />
            Добавить новость
          </button>
        </form>

        <div className="admin-list admin-news-rail">
          {news.map((item) => (
            <article className="admin-card" key={item.id}>
              <img src={publicAsset(item.image)} alt="" />
              {editingNews === item.id ? (
                <NewsEditor
                  item={item}
                  onCancel={() => setEditingNews(null)}
                  onSave={async (payload) => {
                    const updated = await api.updateNews(item.id, payload, token)
                    onNewsUpdated(updated)
                    setEditingNews(null)
                  }}
                />
              ) : (
                <div>
                  <time>{formatDate(item.date)}</time>
                  <span className={`news-status ${item.status === 'pending' ? 'is-pending' : 'is-approved'}`}>
                    {item.status === 'pending' ? 'На согласовании' : 'Опубликовано'}
                  </span>
                  <h3>{item.title}</h3>
                  <p className="admin-news-excerpt">{getNewsExcerpt(item.text)}</p>
                  <div className="row-actions">
                    {item.status === 'pending' && (
                      <button type="button" onClick={async () => onNewsUpdated(await api.updateNews(item.id, { status: 'approved' }, token))}>
                        <Check size={16} />Согласовать
                      </button>
                    )}
                    <button type="button" onClick={() => setEditingNews(item.id)}><Edit3 size={16} />Редактировать</button>
                    <button type="button" onClick={async () => { await api.deleteNews(item.id, token); onNewsDeleted(item.id) }}><Trash2 size={16} />Удалить</button>
                  </div>
                </div>
              )}
            </article>
          ))}
        </div>
      </section>

      <section className="admin-section">
        <h2>Ищу сотрудников</h2>
        <form className="news-form" onSubmit={submitJob}>
          <TextInput label="Должность" value={jobDraft.title} onChange={(title) => setJobDraft({ ...jobDraft, title })} required />
          <TextInput label="Дата начала" type="date" value={jobDraft.startDate} onChange={(startDate) => setJobDraft({ ...jobDraft, startDate })} />
          <label className="field">
            <span>Дата окончания</span>
            <input
              type="date"
              value={jobDraft.endDate}
              onChange={(event) => setJobDraft({ ...jobDraft, endDate: event.target.value })}
              disabled={jobDraft.isOpenEnded}
            />
          </label>
          <label className="field checkbox-field">
            <input
              type="checkbox"
              checked={jobDraft.isOpenEnded}
              onChange={(event) => setJobDraft({ ...jobDraft, isOpenEnded: event.target.checked, endDate: event.target.checked ? '' : jobDraft.endDate })}
            />
            <span>Открытая дата окончания</span>
          </label>
          <TextInput label="Город" value={jobDraft.city} onChange={(city) => setJobDraft({ ...jobDraft, city })} required />
          <TextInput label="Формат работы" value={jobDraft.workFormat} onChange={(workFormat) => setJobDraft({ ...jobDraft, workFormat })} placeholder="Офис, гибрид, удаленно" required />
          <label className="field field-wide">
            <span>Условия работы (необязательно)</span>
            <textarea value={jobDraft.conditions} onChange={(event) => setJobDraft({ ...jobDraft, conditions: event.target.value })} />
          </label>
          <label className="field field-wide">
            <span>Задачи и обязанности</span>
            <textarea value={jobDraft.responsibilities} onChange={(event) => setJobDraft({ ...jobDraft, responsibilities: event.target.value })} required />
          </label>
          <label className="field field-wide">
            <span>Требования</span>
            <textarea value={jobDraft.requirements} onChange={(event) => setJobDraft({ ...jobDraft, requirements: event.target.value })} required />
          </label>
          <label className="field">
            <span>Статус</span>
            <select value={jobDraft.status} onChange={(event) => setJobDraft({ ...jobDraft, status: event.target.value as JobOpening['status'] })}>
              <option value="active">Опубликована</option>
              <option value="paused">Скрыта</option>
            </select>
          </label>
          <button className="primary-action field-wide" type="submit">
            <Plus size={18} />
            Добавить вакансию
          </button>
        </form>

        <div className="student-list">
          {jobs.length === 0 && <p className="empty-state">Пока нет вакансий. Новые вакансии появятся на сайте после добавления.</p>}
          {jobs.map((job) => (
            <article className="student-card" key={job.id}>
              {editingJob === job.id ? (
                <JobEditor
                  item={job}
                  onCancel={() => setEditingJob(null)}
                  onSave={async (payload) => {
                    const updated = await api.updateJob(job.id, payload, token)
                    onJobUpdated(updated)
                    setEditingJob(null)
                  }}
                />
              ) : (
                <>
                  <div className="student-top">
                    <div>
                      <span className={`news-status ${job.status === 'paused' ? 'is-pending' : 'is-approved'}`}>
                        {job.status === 'paused' ? 'Скрыта' : 'Опубликована'}
                      </span>
                      <h3>{job.title}</h3>
                      <p>{[job.city, job.workFormat, job.conditions, formatJobDates(job)].filter(Boolean).join(' · ')}</p>
                    </div>
                    <button
                      className="ghost-button"
                      type="button"
                      onClick={() => setExpandedJob(expandedJob === job.id ? null : job.id)}
                    >
                      {expandedJob === job.id ? 'Свернуть' : 'Подробнее'}
                    </button>
                  </div>
                  {expandedJob === job.id && (
                    <>
                      <dl className="student-details admin-job-details">
                        <div className="job-conditions">
                          <dt>Условия работы</dt>
                          <dd>{job.conditions || 'Не указано'}</dd>
                        </div>
                        <div>
                          <dt>Задачи и обязанности</dt>
                          <dd>{job.responsibilities || 'Не указано'}</dd>
                        </div>
                        <div>
                          <dt>Требования</dt>
                          <dd>{job.requirements || 'Не указано'}</dd>
                        </div>
                      </dl>
                      <div className="row-actions">
                        <button type="button" onClick={() => setEditingJob(job.id)}><Edit3 size={16} />Редактировать</button>
                        <button type="button" onClick={async () => { await api.deleteJob(job.id, token); onJobDeleted(job.id) }}><Trash2 size={16} />Удалить</button>
                      </div>
                    </>
                  )}
                </>
              )}
            </article>
          ))}
        </div>
      </section>

      <section className="admin-section">
        <h2>Смена пароля</h2>
        <form className="news-form password-form" onSubmit={submitPassword}>
          <TextInput label="Текущий пароль" type="password" value={currentPassword} onChange={setCurrentPassword} required />
          <TextInput label="Новый пароль" type="password" value={newPassword} onChange={setNewPassword} required />
          <TextInput label="Повторите новый пароль" type="password" value={confirmPassword} onChange={setConfirmPassword} required />
          {passwordMessage && <p className="password-message">{passwordMessage}</p>}
          <button className="primary-action field-wide" type="submit">
            <ShieldCheck size={18} />
            Изменить пароль
          </button>
        </form>
      </section>
    </main>
  )
}

function NewsEditor({
  item,
  onCancel,
  onSave,
}: {
  item: NewsItem
  onCancel: () => void
  onSave: (payload: Partial<NewsItem>) => void
}) {
  const [draft, setDraft] = useState(item)

  return (
    <form className="news-form compact" onSubmit={(event) => { event.preventDefault(); onSave(draft) }}>
      <TextInput label="Заголовок" value={draft.title} onChange={(title) => setDraft({ ...draft, title })} />
      <TextInput label="Дата" type="date" value={draft.date.slice(0, 10)} onChange={(date) => setDraft({ ...draft, date })} />
      <label className="field field-wide">
        <span>Шаблон фоновой картинки</span>
        <div className="news-template-grid">
          {newsImageTemplates.map((template, index) => (
            <button
              className={draft.image === template ? 'is-selected' : ''}
              type="button"
              key={template}
              onClick={() => setDraft({ ...draft, image: template })}
              aria-label={`Выбрать шаблон ${index + 1}`}
              title={`Шаблон ${index + 1}`}
            >
              <img src={publicAsset(template)} alt="" />
              <span>{index + 1}</span>
            </button>
          ))}
        </div>
      </label>
      <TextInput label="Свой URL или путь картинки" value={draft.image} onChange={(image) => setDraft({ ...draft, image })} />
      <label className="field field-wide">
        <span>Текст</span>
        <textarea value={draft.text} onChange={(event) => setDraft({ ...draft, text: event.target.value })} />
      </label>
      <div className="row-actions field-wide">
        <button type="submit"><Check size={16} />Сохранить</button>
        <button type="button" onClick={onCancel}><X size={16} />Отмена</button>
      </div>
    </form>
  )
}

function JobEditor({
  item,
  onCancel,
  onSave,
}: {
  item: JobOpening
  onCancel: () => void
  onSave: (payload: Partial<JobOpening>) => void
}) {
  const [draft, setDraft] = useState(item)

  return (
    <form className="news-form compact" onSubmit={(event) => { event.preventDefault(); onSave(draft) }}>
      <TextInput label="Должность" value={draft.title} onChange={(title) => setDraft({ ...draft, title })} />
      <TextInput label="Дата начала" type="date" value={draft.startDate} onChange={(startDate) => setDraft({ ...draft, startDate })} />
      <label className="field">
        <span>Дата окончания</span>
        <input type="date" value={draft.endDate} onChange={(event) => setDraft({ ...draft, endDate: event.target.value })} disabled={draft.isOpenEnded} />
      </label>
      <label className="field checkbox-field">
        <input
          type="checkbox"
          checked={draft.isOpenEnded}
          onChange={(event) => setDraft({ ...draft, isOpenEnded: event.target.checked, endDate: event.target.checked ? '' : draft.endDate })}
        />
        <span>Открытая дата окончания</span>
      </label>
      <TextInput label="Город" value={draft.city} onChange={(city) => setDraft({ ...draft, city })} />
      <TextInput label="Формат работы" value={draft.workFormat} onChange={(workFormat) => setDraft({ ...draft, workFormat })} />
      <label className="field field-wide">
        <span>Условия работы (необязательно)</span>
        <textarea value={draft.conditions} onChange={(event) => setDraft({ ...draft, conditions: event.target.value })} />
      </label>
      <label className="field field-wide">
        <span>Задачи и обязанности</span>
        <textarea value={draft.responsibilities} onChange={(event) => setDraft({ ...draft, responsibilities: event.target.value })} />
      </label>
      <label className="field field-wide">
        <span>Требования</span>
        <textarea value={draft.requirements} onChange={(event) => setDraft({ ...draft, requirements: event.target.value })} />
      </label>
      <label className="field">
        <span>Статус</span>
        <select value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value as JobOpening['status'] })}>
          <option value="active">Опубликована</option>
          <option value="paused">Скрыта</option>
        </select>
      </label>
      <div className="row-actions field-wide">
        <button type="submit"><Check size={16} />Сохранить</button>
        <button type="button" onClick={onCancel}><X size={16} />Отмена</button>
      </div>
    </form>
  )
}

function TextInput({
  label,
  value,
  onChange,
  required,
  placeholder,
  type = 'text',
}: {
  label: string
  value: string
  onChange: (value: string) => void
  required?: boolean
  placeholder?: string
  type?: string
}) {
  return (
    <label className="field">
      <span>{label} {required && <RequiredMark />}</span>
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} required={required} placeholder={placeholder} />
    </label>
  )
}

function RequiredMark() {
  return <b className="required-mark" aria-hidden="true">*</b>
}

function handleInvalidForm(event: FormEvent<HTMLFormElement>) {
  const control = event.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
  if (!('validity' in control)) {
    return
  }
  event.preventDefault()
  control.closest('.field')?.classList.add('is-invalid')
  const form = event.currentTarget
  if (form.dataset.invalidFocused) {
    return
  }
  form.dataset.invalidFocused = 'true'
  control.focus({ preventScroll: true })
  control.scrollIntoView({ behavior: 'smooth', block: 'center' })
  window.setTimeout(() => {
    delete form.dataset.invalidFocused
  }, 0)
}

function clearInvalidField(event: FormEvent<HTMLFormElement>) {
  const control = event.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
  if ('validity' in control && control.validity.valid) {
    control.closest('.field')?.classList.remove('is-invalid')
  }
}

function Modal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label={title}>
      <div className="modal-panel">
        <div className="modal-head">
          <h2>{title}</h2>
          <button type="button" onClick={onClose} aria-label="Закрыть">
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(date))
}

function getNewsExcerpt(text: string, wordLimit = 18) {
  const words = text.trim().replace(/\s+/g, ' ').split(' ')
  return words.length > wordLimit ? `${words.slice(0, wordLimit).join(' ')}...` : words.join(' ')
}

function formatJobDates(job: JobOpening) {
  if (!job.startDate && !job.endDate && !job.isOpenEnded) {
    return ''
  }
  const start = job.startDate ? formatDate(job.startDate) : 'дата старта открыта'
  if (job.isOpenEnded) {
    return `${start} · открытая дата окончания`
  }
  return job.endDate ? `${start} - ${formatDate(job.endDate)}` : start
}

export default App
