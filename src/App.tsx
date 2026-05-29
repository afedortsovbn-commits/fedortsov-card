import type { FormEvent, ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import {
  Award,
  BriefcaseBusiness,
  Check,
  Clock,
  Edit3,
  ExternalLink,
  GraduationCap,
  Mail,
  Megaphone,
  MessageCircle,
  Newspaper,
  Phone,
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
  status?: NewsStatus
}

type NewsStatus = 'pending' | 'approved'

type StudentStatus =
  | ''
  | 'На рассмотрении'
  | 'Ожидаю обратную связь'
  | 'Согласовано'
  | 'Отказано'

type StudentApplication = {
  id: string
  createdAt: string
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
  status: StudentStatus
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
  requirements: string
  responsibilities: string
  status: 'active' | 'paused'
}

type StudentDraft = Omit<StudentApplication, 'id' | 'createdAt' | 'status'>
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

const emptyJob: JobDraft = {
  title: '',
  startDate: '',
  endDate: '',
  isOpenEnded: true,
  city: '',
  workFormat: '',
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

const statusOptions: StudentStatus[] = [
  '',
  'На рассмотрении',
  'Ожидаю обратную связь',
  'Согласовано',
  'Отказано',
]

const fallbackNews: NewsItem[] = [
  {
    id: 'news-1',
    title: 'Нейросети в маркетинге: главные тренды года',
    date: '2026-05-18',
    image: '/images/news-ai.svg',
    text: 'Маркетинговые команды все чаще используют нейросети не как отдельный инструмент, а как часть ежедневного процесса: от анализа аудитории до подготовки креативов и быстрых гипотез. Главный фокус смещается к качеству промптов, проверке фактов и прозрачной редактуре результата.',
  },
  {
    id: 'news-2',
    title: 'Персонализация: как данные помогают продавать больше',
    date: '2026-05-17',
    image: '/images/news-data.svg',
    text: 'Бренды возвращаются к прагматичной персонализации: сегментируют аудиторию по поведению, уточняют офферы и тестируют коммуникации небольшими циклами. Побеждают не самые сложные системы, а команды, которые умеют быстро превращать данные в понятные действия.',
  },
  {
    id: 'news-3',
    title: 'Новые алгоритмы соцсетей: что важно знать маркетологу',
    date: '2026-05-16',
    image: '/images/news-social.svg',
    text: 'Социальные платформы продолжают усиливать роль удержания внимания, сохранений и обсуждений. Для маркетологов это означает больший спрос на контент с практической ценностью, ясной позицией и форматом, который удобно пересылать коллегам.',
  },
]

const api = {
  async login(password: string) {
    let response: Response
    try {
      response = await fetch('/api/auth/login', {
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
  async listNews() {
    const response = await fetch('/api/news')
    return response.json() as Promise<NewsItem[]>
  },
  async listJobs() {
    const response = await fetch('/api/jobs')
    return response.json() as Promise<JobOpening[]>
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
    const response = await fetch('/api/jobs', {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify(payload),
    })
    return response.json() as Promise<JobOpening>
  },
  async updateJob(id: string, payload: Partial<JobOpening>, token: string) {
    const response = await fetch(`/api/jobs/${id}`, {
      method: 'PUT',
      headers: authHeaders(token),
      body: JSON.stringify(payload),
    })
    return response.json() as Promise<JobOpening>
  },
  async deleteJob(id: string, token: string) {
    await fetch(`/api/jobs/${id}`, { method: 'DELETE', headers: authHeaders(token) })
  },
  async listStudents(token: string) {
    const response = await fetch('/api/applications', { headers: authHeaders(token) })
    if (!response.ok) {
      throw new Error('Нужно войти в админку')
    }
    return response.json() as Promise<StudentApplication[]>
  },
  async createStudent(payload: StudentDraft) {
    const response = await fetch('/api/applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    return response.json() as Promise<StudentApplication>
  },
  async updateStudent(id: string, payload: Partial<StudentApplication>, token: string) {
    const response = await fetch(`/api/applications/${id}`, {
      method: 'PUT',
      headers: authHeaders(token),
      body: JSON.stringify(payload),
    })
    return response.json() as Promise<StudentApplication>
  },
  async deleteStudent(id: string, token: string) {
    await fetch(`/api/applications/${id}`, { method: 'DELETE', headers: authHeaders(token) })
  },
  async createResume(payload: ResumeDraft) {
    const response = await fetch('/api/resumes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    return response.json()
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

function App() {
  const [news, setNews] = useState<NewsItem[]>(fallbackNews)
  const [jobs, setJobs] = useState<JobOpening[]>([])
  const [students, setStudents] = useState<StudentApplication[]>([])
  const [adminToken, setAdminToken] = useState(() => localStorage.getItem('fedortsov-admin-token') || '')
  const [activeNews, setActiveNews] = useState<NewsItem | null>(null)
  const [activeJob, setActiveJob] = useState<JobOpening | null>(null)
  const [isPracticeOpen, setPracticeOpen] = useState(false)
  const [studentDraft, setStudentDraft] = useState(emptyStudent)
  const [resumeDraft, setResumeDraft] = useState(emptyResume)
  const [isQrOpen, setQrOpen] = useState(window.location.hash === '#qr')
  const [notice, setNotice] = useState('')
  const [route, setRoute] = useState(window.location.hash === '#admin' ? 'admin' : 'site')

  const isAdmin = route === 'admin'
  const publicNews = news.filter((item) => item.status !== 'pending')
  const publicJobs = jobs.filter((item) => item.status !== 'paused')

  useEffect(() => {
    const load = async () => {
      const [newsItems, jobItems] = await Promise.all([api.listNews(), api.listJobs()])
      setNews(newsItems)
      setJobs(jobItems)
    }

    load().catch(() => {
      if (!isStaticPagesHost()) {
        setNotice('Не удалось загрузить данные. Проверьте, запущен ли сервер.')
      }
    })
  }, [])

  useEffect(() => {
    if (!adminToken) {
      return
    }
    api
      .listStudents(adminToken)
      .then(setStudents)
      .catch(() => {
        localStorage.removeItem('fedortsov-admin-token')
        setAdminToken('')
        setStudents([])
      })
  }, [adminToken])

  useEffect(() => {
    const onHashChange = () => {
      setRoute(window.location.hash === '#admin' ? 'admin' : 'site')
      if (window.location.hash === '#qr') {
        setQrOpen(true)
      }
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  const openQr = () => {
    if (window.location.hash === '#qr') {
      setQrOpen(true)
      return
    }
    window.location.hash = 'qr'
  }

  const closeQr = () => {
    setQrOpen(false)
    if (window.location.hash === '#qr') {
      window.history.pushState('', document.title, `${window.location.pathname}${window.location.search}`)
    }
  }

  const submitPractice = async (event: FormEvent) => {
    event.preventDefault()
    const saved = await api.createStudent(studentDraft)
    setStudents((items) => [saved, ...items])
    setStudentDraft(emptyStudent)
    setPracticeOpen(false)
    setNotice('Заявка отправлена. Александр свяжется с вами после просмотра анкеты.')
  }

  const submitResume = async (event: FormEvent) => {
    event.preventDefault()
    if (!activeJob) {
      return
    }
    await api.createResume({ ...resumeDraft, jobId: activeJob.id, jobTitle: activeJob.title })
    setResumeDraft(emptyResume)
    setActiveJob(null)
    setNotice('Отклик отправлен. Александр получит резюме в Telegram.')
  }

  const refreshNewsItem = (updated: NewsItem) => {
    setNews((items) => items.map((item) => (item.id === updated.id ? updated : item)))
  }

  const refreshStudent = (updated: StudentApplication) => {
    setStudents((items) => items.map((item) => (item.id === updated.id ? updated : item)))
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
        <div className="toast" role="status">
          {notice}
          <button type="button" onClick={() => setNotice('')} aria-label="Закрыть уведомление">
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
            students={students}
            onLogout={() => {
              localStorage.removeItem('fedortsov-admin-token')
              setAdminToken('')
              setStudents([])
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
            onStudentUpdated={refreshStudent}
            onStudentDeleted={(id) => setStudents((items) => items.filter((item) => item.id !== id))}
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
          <JobsSection jobs={publicJobs} onRespond={setActiveJob} />
          <NewsSection news={publicNews} onOpen={setActiveNews} />
          <Projects />
        </main>
      )}

      <footer className="footer">
        <span>© {new Date().getFullYear()} Федорцов Александр</span>
      </footer>

      {isPracticeOpen && (
        <Modal title="Запись на прохождение практики" onClose={() => setPracticeOpen(false)}>
          <form className="practice-form" onSubmit={submitPractice}>
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
              <span>Даты практики</span>
              <textarea
                value={studentDraft.practiceDates}
                onChange={(event) => setStudentDraft({ ...studentDraft, practiceDates: event.target.value })}
                placeholder="Например: 03.06.2026 - 28.06.2026"
                required
              />
            </label>
            <button className="primary-action field-wide" type="submit">
              <Send size={18} />
              Отправить заявку
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
          </article>
        </Modal>
      )}

      {activeJob && (
        <Modal title="Отправить резюме" onClose={() => setActiveJob(null)}>
          <form className="practice-form" onSubmit={submitResume}>
            <div className="field field-wide">
              <span>Вакансия</span>
              <strong>{activeJob.title}</strong>
            </div>
            <TextInput label="ФИО" value={resumeDraft.fullName} onChange={(fullName) => setResumeDraft({ ...resumeDraft, fullName })} required />
            <TextInput label="Телефон" value={resumeDraft.phone} onChange={(phone) => setResumeDraft({ ...resumeDraft, phone })} required />
            <TextInput label="Телеграм" value={resumeDraft.telegram} onChange={(telegram) => setResumeDraft({ ...resumeDraft, telegram })} required />
            <TextInput label="E-mail" type="email" value={resumeDraft.email} onChange={(email) => setResumeDraft({ ...resumeDraft, email })} />
            <TextInput label="Ссылка на резюме" value={resumeDraft.resumeLink} onChange={(resumeLink) => setResumeDraft({ ...resumeDraft, resumeLink })} placeholder="Google Drive, hh, LinkedIn или другой URL" />
            <label className="field field-wide">
              <span>Комментарий</span>
              <textarea value={resumeDraft.comment} onChange={(event) => setResumeDraft({ ...resumeDraft, comment: event.target.value })} />
            </label>
            <button className="primary-action field-wide" type="submit">
              <Send size={18} />
              Отправить резюме
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
  const label = {
    in: 'in',
    ig: '◎',
    threads: '@',
    tenchat: 'T',
  }[kind]

  return <span className={`brand-mark brand-mark-${kind}`} aria-hidden="true">{label}</span>
}

function JobsSection({ jobs, onRespond }: { jobs: JobOpening[]; onRespond: (job: JobOpening) => void }) {
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
            <div>
              <h3>{job.title}</h3>
              <p className="job-meta">
                {[job.city, job.workFormat, formatJobDates(job)].filter(Boolean).join(' · ')}
              </p>
            </div>
            <dl className="job-details">
              <div>
                <dt>Требования</dt>
                <dd>{job.requirements}</dd>
              </div>
              <div>
                <dt>Задачи и обязанности</dt>
                <dd>{job.responsibilities}</dd>
              </div>
            </dl>
            <button className="primary-action" type="button" onClick={() => onRespond(job)}>
              <Send size={18} />
              Отправить резюме
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
  return (
    <section className="section-shell" id="projects">
      <div className="section-title">
        <BriefcaseBusiness />
        <h2>Мои проекты</h2>
      </div>
      <div className="project-grid">
        <a
          href="https://afedortsovbn-commits.github.io/marketer-competency-service/"
          className="project-card"
          aria-label="Подбор маркетологов"
          target="_blank"
          rel="noreferrer"
        >
          <Users />
          <h3>Подбор маркетологов</h3>
          <p>Поиск и оценка маркетинговых специалистов под задачи вашего бизнеса.</p>
          <span>Подробнее <ExternalLink size={16} /></span>
        </a>
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
      </div>
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
        <p>Доступ к заявкам студентов и управлению новостями закрыт паролем.</p>
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
  students,
  onLogout,
  onBack,
  onNewsCreated,
  onNewsUpdated,
  onNewsDeleted,
  onJobCreated,
  onJobUpdated,
  onJobDeleted,
  onStudentUpdated,
  onStudentDeleted,
}: {
  token: string
  news: NewsItem[]
  jobs: JobOpening[]
  students: StudentApplication[]
  onLogout: () => void
  onBack: () => void
  onNewsCreated: (item: NewsItem) => void
  onNewsUpdated: (item: NewsItem) => void
  onNewsDeleted: (id: string) => void
  onJobCreated: (item: JobOpening) => void
  onJobUpdated: (item: JobOpening) => void
  onJobDeleted: (id: string) => void
  onStudentUpdated: (item: StudentApplication) => void
  onStudentDeleted: (id: string) => void
}) {
  const [newsDraft, setNewsDraft] = useState(emptyNews)
  const [jobDraft, setJobDraft] = useState(emptyJob)
  const [editingNews, setEditingNews] = useState<string | null>(null)
  const [editingJob, setEditingJob] = useState<string | null>(null)
  const [editingStudent, setEditingStudent] = useState<string | null>(null)
  const [studentDrafts, setStudentDrafts] = useState<Record<string, StudentApplication>>({})

  const studentStats = useMemo(
    () => ({
      total: students.length,
      agreed: students.filter((item) => item.status === 'Согласовано').length,
      waiting: students.filter((item) => item.status === 'Ожидаю обратную связь').length,
    }),
    [students],
  )

  const submitNews = async (event: FormEvent) => {
    event.preventDefault()
    const image = newsDraft.image || '/images/news-ai.svg'
    const created = await api.createNews({ ...newsDraft, image, status: 'pending' }, token)
    onNewsCreated(created)
    setNewsDraft(emptyNews)
  }

  const submitJob = async (event: FormEvent) => {
    event.preventDefault()
    const created = await api.createJob(jobDraft, token)
    onJobCreated(created)
    setJobDraft(emptyJob)
  }

  const updateStudentField = (student: StudentApplication, field: keyof StudentApplication, value: string) => {
    setStudentDrafts((items) => ({
      ...items,
      [student.id]: { ...(items[student.id] || student), [field]: value },
    }))
  }

  return (
    <main className="admin-shell">
      <div className="admin-heading">
        <div>
          <p className="eyebrow">Административная часть</p>
          <h1>Заявки, вакансии и новости</h1>
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
        <span>Всего заявок: <strong>{studentStats.total}</strong></span>
        <span>Вакансий: <strong>{jobs.length}</strong></span>
        <span>Согласовано: <strong>{studentStats.agreed}</strong></span>
        <span>Ожидают ответа: <strong>{studentStats.waiting}</strong></span>
      </div>

      <section className="admin-section">
        <h2>Управление новостями</h2>
        <form className="news-form" onSubmit={submitNews}>
          <TextInput label="Заголовок" value={newsDraft.title} onChange={(title) => setNewsDraft({ ...newsDraft, title })} required />
          <TextInput label="Дата" type="date" value={newsDraft.date} onChange={(date) => setNewsDraft({ ...newsDraft, date })} required />
          <TextInput label="URL или путь картинки" value={newsDraft.image} onChange={(image) => setNewsDraft({ ...newsDraft, image })} placeholder="/images/news-ai.svg" />
          <label className="field field-wide">
            <span>Текст новости</span>
            <textarea value={newsDraft.text} onChange={(event) => setNewsDraft({ ...newsDraft, text: event.target.value })} required />
          </label>
          <button className="primary-action field-wide" type="submit">
            <Plus size={18} />
            Добавить новость
          </button>
        </form>

        <div className="admin-list">
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
                  <p>{item.text}</p>
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
            <span>Требования</span>
            <textarea value={jobDraft.requirements} onChange={(event) => setJobDraft({ ...jobDraft, requirements: event.target.value })} required />
          </label>
          <label className="field field-wide">
            <span>Задачи и обязанности</span>
            <textarea value={jobDraft.responsibilities} onChange={(event) => setJobDraft({ ...jobDraft, responsibilities: event.target.value })} required />
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
                      <p>{[job.city, job.workFormat, formatJobDates(job)].filter(Boolean).join(' · ')}</p>
                    </div>
                  </div>
                  <dl className="student-details">
                    <div>
                      <dt>Требования</dt>
                      <dd>{job.requirements || 'Не указано'}</dd>
                    </div>
                    <div>
                      <dt>Задачи и обязанности</dt>
                      <dd>{job.responsibilities || 'Не указано'}</dd>
                    </div>
                  </dl>
                  <div className="row-actions">
                    <button type="button" onClick={() => setEditingJob(job.id)}><Edit3 size={16} />Редактировать</button>
                    <button type="button" onClick={async () => { await api.deleteJob(job.id, token); onJobDeleted(job.id) }}><Trash2 size={16} />Удалить</button>
                  </div>
                </>
              )}
            </article>
          ))}
        </div>
      </section>

      <section className="admin-section">
        <h2>Заявки на практику</h2>
        <div className="student-list">
          {students.length === 0 && <p className="empty-state">Пока нет заявок. Новые анкеты появятся здесь автоматически.</p>}
          {students.map((student) => {
            const draft = studentDrafts[student.id] || student
            const isEditing = editingStudent === student.id

            return (
              <article className="student-card" key={student.id}>
                <div className="student-top">
                  <div>
                    <time>Заявка от {formatDate(student.createdAt)}</time>
                    <h3>{student.fullName}</h3>
                  </div>
                  <select
                    value={student.status}
                    onChange={async (event) => onStudentUpdated(await api.updateStudent(student.id, { status: event.target.value as StudentStatus }, token))}
                    aria-label="Статус заявки"
                  >
                    {statusOptions.map((status) => (
                      <option key={status || 'empty'} value={status}>
                        {status || 'Без статуса'}
                      </option>
                    ))}
                  </select>
                </div>

                {isEditing ? (
                  <div className="student-edit-grid">
                    {studentFields.map((field) => (
                      <TextInput
                        key={field.key}
                        label={field.label}
                        value={String(draft[field.key])}
                        onChange={(value) => updateStudentField(student, field.key, value)}
                      />
                    ))}
                    <div className="row-actions field-wide">
                      <button type="button" onClick={async () => { const updated = await api.updateStudent(student.id, draft, token); onStudentUpdated(updated); setEditingStudent(null) }}><Check size={16} />Сохранить</button>
                      <button type="button" onClick={() => setEditingStudent(null)}><X size={16} />Отмена</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <dl className="student-details">
                      {studentFields.map((field) => (
                        <div key={field.key}>
                          <dt>{field.label}</dt>
                          <dd>{String(student[field.key]) || 'Не указано'}</dd>
                        </div>
                      ))}
                    </dl>
                    <div className="row-actions">
                      <button type="button" onClick={() => setEditingStudent(student.id)}><Edit3 size={16} />Редактировать</button>
                      <button type="button" onClick={async () => { await api.deleteStudent(student.id, token); onStudentDeleted(student.id) }}><Trash2 size={16} />Удалить</button>
                    </div>
                  </>
                )}
              </article>
            )
          })}
        </div>
      </section>
    </main>
  )
}

const studentFields: { key: keyof StudentApplication; label: string }[] = [
  { key: 'fullName', label: 'ФИО' },
  { key: 'phone', label: 'Телефон' },
  { key: 'telegram', label: 'Телеграм' },
  { key: 'university', label: 'ВУЗ' },
  { key: 'gradeAverage', label: 'Средний балл' },
  { key: 'faculty', label: 'Факультет' },
  { key: 'specialization', label: 'Специализация' },
  { key: 'course', label: 'Курс' },
  { key: 'enrollmentYear', label: 'Год поступления' },
  { key: 'practiceDates', label: 'Даты практики' },
]

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
      <TextInput label="Картинка" value={draft.image} onChange={(image) => setDraft({ ...draft, image })} />
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
        <span>Требования</span>
        <textarea value={draft.requirements} onChange={(event) => setDraft({ ...draft, requirements: event.target.value })} />
      </label>
      <label className="field field-wide">
        <span>Задачи и обязанности</span>
        <textarea value={draft.responsibilities} onChange={(event) => setDraft({ ...draft, responsibilities: event.target.value })} />
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
      <span>{label}</span>
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} required={required} placeholder={placeholder} />
    </label>
  )
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
