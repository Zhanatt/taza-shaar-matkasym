import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom'
import { Camera, MapPin, Users, Trash2, CheckCircle, Clock, AlertCircle } from 'lucide-react'
import './index.css'

const STORAGE_KEY = 'urna_requests'

const getRequests = () => {
  const data = localStorage.getItem(STORAGE_KEY)
  return data ? JSON.parse(data) : []
}

const saveRequests = (requests) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(requests))
}

const groupByLocation = (requests) => {
  const groups = {}
  requests.forEach(req => {
    const key = req.address.toLowerCase().trim()
    if (!groups[key]) {
      groups[key] = {
        address: req.address,
        photos: [],
        count: 0,
        status: 'collecting',
        firstDate: req.date,
        lastDate: req.date
      }
    }
    groups[key].count++
    if (req.photo) groups[key].photos.push(req.photo)
    groups[key].lastDate = req.date
  })

  Object.keys(groups).forEach(key => {
    if (groups[key].count >= 10) {
      groups[key].status = 'ready'
    }
  })

  return Object.values(groups).sort((a, b) => b.count - a.count)
}

function Header() {
  const location = useLocation()

  return (
    <header className="header">
      <div className="container header-content">
        <Link to="/" className="logo">
          <div className="logo-icon">
            <Trash2 size={24} />
          </div>
          MATKASYM
        </Link>
        <nav className="nav">
          <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
            Главная
          </Link>
          <Link to="/map" className={`nav-link ${location.pathname === '/map' ? 'active' : ''}`}>
            Карта заявок
          </Link>
          <Link to="/manager" className={`nav-link ${location.pathname === '/manager' ? 'active' : ''}`}>
            Менеджер
          </Link>
          <Link to="/submit" className="nav-link accent">
            Подать заявку
          </Link>
        </nav>
      </div>
    </header>
  )
}

function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-logo">MATKASYM</div>
        <p>Вместе сделаем город чище</p>
      </div>
    </footer>
  )
}

function HomePage() {
  const [requests, setRequests] = useState([])
  const [locations, setLocations] = useState([])

  useEffect(() => {
    const data = getRequests()
    setRequests(data)
    setLocations(groupByLocation(data))
  }, [])

  const totalRequests = requests.length
  const readyLocations = locations.filter(l => l.status === 'ready').length
  const collectingLocations = locations.filter(l => l.status === 'collecting').length

  return (
    <>
      <section className="hero">
        <div className="container">
          <h1>Чистый город — наша забота</h1>
          <p>
            Сообщите о грязном месте в городе. Когда наберётся 10 заявок на одну точку —
            мы установим там урну!
          </p>
          <Link to="/submit" className="btn btn-primary" style={{fontSize: '18px', padding: '18px 36px'}}>
            <Camera size={24} />
            Подать заявку
          </Link>

          <div className="hero-stats">
            <div className="stat">
              <div className="stat-value">{totalRequests}</div>
              <div className="stat-label">Всего заявок</div>
            </div>
            <div className="stat">
              <div className="stat-value">{readyLocations}</div>
              <div className="stat-label">Готово к установке</div>
            </div>
            <div className="stat">
              <div className="stat-value">{collectingLocations}</div>
              <div className="stat-label">Собираем голоса</div>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <h2 className="section-title">Как это работает?</h2>
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '32px'}}>
            <div className="card" style={{textAlign: 'center'}}>
              <div style={{width: '64px', height: '64px', background: 'rgba(233, 69, 96, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: 'var(--accent)'}}>
                <Camera size={32} />
              </div>
              <h3 style={{marginBottom: '12px', color: 'var(--text)'}}>1. Сфотографируйте</h3>
              <p style={{color: 'var(--text-muted)'}}>Найдите грязное место и сделайте фото</p>
            </div>
            <div className="card" style={{textAlign: 'center'}}>
              <div style={{width: '64px', height: '64px', background: 'rgba(233, 69, 96, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: 'var(--accent)'}}>
                <MapPin size={32} />
              </div>
              <h3 style={{marginBottom: '12px', color: 'var(--text)'}}>2. Укажите адрес</h3>
              <p style={{color: 'var(--text-muted)'}}>Напишите адрес или отметьте на карте</p>
            </div>
            <div className="card" style={{textAlign: 'center'}}>
              <div style={{width: '64px', height: '64px', background: 'rgba(233, 69, 96, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: 'var(--accent)'}}>
                <Users size={32} />
              </div>
              <h3 style={{marginBottom: '12px', color: 'var(--text)'}}>3. Соберите 10 голосов</h3>
              <p style={{color: 'var(--text-muted)'}}>Когда 10 человек пожалуются — установим урну</p>
            </div>
          </div>
        </div>
      </section>

      {locations.length > 0 && (
        <section className="section" style={{background: 'var(--bg)'}}>
          <div className="container">
            <h2 className="section-title">Активные точки</h2>
            <div className="requests-grid">
              {locations.slice(0, 6).map((loc, idx) => (
                <div key={idx} className="request-card">
                  {loc.photos[0] && (
                    <img src={loc.photos[0]} alt="" className="request-image" />
                  )}
                  {!loc.photos[0] && (
                    <div className="request-image" style={{background: 'linear-gradient(135deg, var(--primary), var(--secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                      <MapPin size={48} color="white" />
                    </div>
                  )}
                  <div className="request-content">
                    <div className="request-address">{loc.address}</div>
                    <div className={`request-count ${loc.status === 'ready' ? 'ready' : ''}`}>
                      {loc.status === 'ready' ? <CheckCircle size={16} /> : <Users size={16} />}
                      {loc.count} {loc.count === 1 ? 'заявка' : loc.count < 5 ? 'заявки' : 'заявок'}
                    </div>
                    <div className="request-progress">
                      <div className="progress-bar">
                        <div
                          className={`progress-fill ${loc.count >= 10 ? 'complete' : ''}`}
                          style={{width: `${Math.min(loc.count * 10, 100)}%`}}
                        />
                      </div>
                      <div className="progress-text">
                        {loc.count >= 10
                          ? 'Готово к установке урны!'
                          : `Ещё ${10 - loc.count} заявок до установки`}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {locations.length > 6 && (
              <div style={{textAlign: 'center', marginTop: '20px'}}>
                <Link to="/map" className="btn btn-secondary">
                  Смотреть все точки
                </Link>
              </div>
            )}
          </div>
        </section>
      )}
    </>
  )
}

function SubmitPage() {
  const [photo, setPhoto] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [address, setAddress] = useState('')
  const [comment, setComment] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handlePhotoChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setPhoto(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhotoPreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!address.trim()) return

    const requests = getRequests()
    requests.push({
      id: Date.now(),
      address: address.trim(),
      comment,
      photo: photoPreview,
      date: new Date().toISOString()
    })
    saveRequests(requests)

    setSubmitted(true)
    setPhoto(null)
    setPhotoPreview(null)
    setAddress('')
    setComment('')
  }

  return (
    <div className="page">
      <div className="container" style={{maxWidth: '600px'}}>
        <h1 className="page-title">Подать заявку</h1>
        <p className="page-subtitle">
          Сообщите о грязном месте, где нужна урна
        </p>

        {submitted && (
          <div className="success-message">
            <CheckCircle size={24} style={{marginBottom: '8px'}} />
            <div style={{fontWeight: '600'}}>Заявка отправлена!</div>
            <div style={{fontSize: '14px', marginTop: '4px'}}>
              Спасибо за вашу помощь в создании чистого города
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="card">
          <div className="form-group">
            <label className="form-label">Фото места</label>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhotoChange}
              style={{display: 'none'}}
              id="photo-input"
            />
            <label htmlFor="photo-input" className="photo-upload">
              {photoPreview ? (
                <img src={photoPreview} alt="Preview" className="photo-preview" />
              ) : (
                <>
                  <Camera className="photo-upload-icon" size={64} />
                  <div style={{fontWeight: '600', marginBottom: '4px'}}>
                    Нажмите, чтобы сделать фото
                  </div>
                  <div style={{color: 'var(--text-muted)', fontSize: '14px'}}>
                    или выберите из галереи
                  </div>
                </>
              )}
            </label>
          </div>

          <div className="form-group">
            <label className="form-label">
              <MapPin size={18} style={{display: 'inline', marginRight: '6px', verticalAlign: 'middle'}} />
              Адрес *
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="Например: ул. Абая, возле дома 45"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Комментарий</label>
            <textarea
              className="form-textarea"
              placeholder="Опишите проблему (необязательно)"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{width: '100%'}}>
            Отправить заявку
          </button>
        </form>
      </div>
    </div>
  )
}

function MapPage() {
  const [locations, setLocations] = useState([])

  useEffect(() => {
    const data = getRequests()
    setLocations(groupByLocation(data))
  }, [])

  return (
    <div className="page">
      <div className="container">
        <h1 className="page-title">Карта заявок</h1>
        <p className="page-subtitle">
          Все точки, где жители просят установить урны
        </p>

        <div className="requests-grid">
          {locations.map((loc, idx) => (
            <div key={idx} className="request-card">
              {loc.photos[0] ? (
                <img src={loc.photos[0]} alt="" className="request-image" />
              ) : (
                <div className="request-image" style={{background: 'linear-gradient(135deg, var(--primary), var(--secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                  <MapPin size={48} color="white" />
                </div>
              )}
              <div className="request-content">
                <div className="request-address">{loc.address}</div>
                <div className={`request-count ${loc.status === 'ready' ? 'ready' : ''}`}>
                  {loc.status === 'ready' ? <CheckCircle size={16} /> : <Users size={16} />}
                  {loc.count} {loc.count === 1 ? 'заявка' : loc.count < 5 ? 'заявки' : 'заявок'}
                </div>
                <div className="request-progress">
                  <div className="progress-bar">
                    <div
                      className={`progress-fill ${loc.count >= 10 ? 'complete' : ''}`}
                      style={{width: `${Math.min(loc.count * 10, 100)}%`}}
                    />
                  </div>
                  <div className="progress-text">
                    {loc.count >= 10
                      ? 'Готово к установке урны!'
                      : `Ещё ${10 - loc.count} до установки`}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {locations.length === 0 && (
            <div className="card" style={{gridColumn: '1/-1', textAlign: 'center', padding: '60px'}}>
              <AlertCircle size={48} style={{color: 'var(--text-muted)', marginBottom: '16px'}} />
              <h3 style={{marginBottom: '8px'}}>Пока нет заявок</h3>
              <p style={{color: 'var(--text-muted)', marginBottom: '24px'}}>
                Будьте первым, кто сообщит о грязном месте!
              </p>
              <Link to="/submit" className="btn btn-primary">
                Подать заявку
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ManagerPage() {
  const [locations, setLocations] = useState([])
  const [tab, setTab] = useState('ready')
  const [processed, setProcessed] = useState(() => {
    const data = localStorage.getItem('urna_processed')
    return data ? JSON.parse(data) : []
  })

  useEffect(() => {
    const data = getRequests()
    setLocations(groupByLocation(data))
  }, [])

  const markAsProcessed = (address) => {
    const newProcessed = [...processed, address.toLowerCase().trim()]
    setProcessed(newProcessed)
    localStorage.setItem('urna_processed', JSON.stringify(newProcessed))
  }

  const isProcessed = (address) => processed.includes(address.toLowerCase().trim())

  const readyLocations = locations.filter(l => l.count >= 10 && !isProcessed(l.address))
  const pendingLocations = locations.filter(l => l.count < 10)
  const doneLocations = locations.filter(l => isProcessed(l.address))

  const displayLocations = tab === 'ready' ? readyLocations : tab === 'pending' ? pendingLocations : doneLocations

  return (
    <div className="dashboard">
      <div className="container">
        <div className="dashboard-header">
          <h1 className="dashboard-title">Панель менеджера</h1>
          <div className="dashboard-tabs">
            <button
              className={`tab ${tab === 'ready' ? 'active' : ''}`}
              onClick={() => setTab('ready')}
            >
              К установке ({readyLocations.length})
            </button>
            <button
              className={`tab ${tab === 'pending' ? 'active' : ''}`}
              onClick={() => setTab('pending')}
            >
              Собираем ({pendingLocations.length})
            </button>
            <button
              className={`tab ${tab === 'done' ? 'active' : ''}`}
              onClick={() => setTab('done')}
            >
              Выполнено ({doneLocations.length})
            </button>
          </div>
        </div>

        {displayLocations.length === 0 && (
          <div className="card" style={{textAlign: 'center', padding: '60px'}}>
            <Clock size={48} style={{color: 'var(--text-muted)', marginBottom: '16px'}} />
            <h3>Нет заявок в этой категории</h3>
          </div>
        )}

        {displayLocations.map((loc, idx) => (
          <div key={idx} className="manager-card">
            {loc.photos[0] ? (
              <img src={loc.photos[0]} alt="" className="manager-card-image" />
            ) : (
              <div className="manager-card-image" style={{background: 'linear-gradient(135deg, var(--primary), var(--secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                <MapPin size={48} color="white" />
              </div>
            )}
            <div className="manager-card-content">
              <div className="manager-card-header">
                <div className="manager-card-address">{loc.address}</div>
                <span className={`badge ${loc.count >= 10 ? (isProcessed(loc.address) ? 'badge-done' : 'badge-ready') : 'badge-pending'}`}>
                  {isProcessed(loc.address) ? 'Установлено' : loc.count >= 10 ? 'Готово' : 'Сбор заявок'}
                </span>
              </div>
              <div className="manager-card-meta">
                <span><Users size={16} style={{verticalAlign: 'middle', marginRight: '4px'}} /> {loc.count} заявок</span>
                <span><Clock size={16} style={{verticalAlign: 'middle', marginRight: '4px'}} /> {new Date(loc.lastDate).toLocaleDateString('ru-RU')}</span>
                <span>{loc.photos.length} фото</span>
              </div>
              {!isProcessed(loc.address) && loc.count >= 10 && (
                <div className="manager-card-actions">
                  <button
                    className="btn btn-success btn-sm"
                    onClick={() => markAsProcessed(loc.address)}
                  >
                    <CheckCircle size={16} />
                    Отметить как выполнено
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/submit" element={<SubmitPage />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/manager" element={<ManagerPage />} />
        </Routes>
      </main>
      <Footer />
    </BrowserRouter>
  )
}

export default App
