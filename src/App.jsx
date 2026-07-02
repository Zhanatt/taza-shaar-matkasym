import { useState, useEffect, createContext, useContext } from 'react'
import { BrowserRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom'
import { Camera, MapPin, Users, CheckCircle, Clock, LogOut, Bell, Eye, Upload, Phone, ChevronRight } from 'lucide-react'
import { MapContainer, TileLayer, Marker, useMapEvents, useMap, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import './index.css'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

const API_URL = import.meta.env.PROD
  ? 'https://taza-shaar-api.onrender.com'
  : 'http://localhost:3001'

const AuthContext = createContext(null)
const useAuth = () => useContext(AuthContext)

const api = {
  // Auth
  async loginUser(phone) {
    const res = await fetch(`${API_URL}/api/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone })
    })
    return res.json()
  },
  async loginStaff(username, password) {
    const res = await fetch(`${API_URL}/api/auth/staff`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    })
    if (!res.ok) throw new Error('Invalid credentials')
    return res.json()
  },

  // Votes
  async submitVote(data) {
    const res = await fetch(`${API_URL}/api/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    return res.json()
  },
  async getUserVotes(phone) {
    const res = await fetch(`${API_URL}/api/votes/${phone}`)
    return res.json()
  },

  // Locations
  async getLocations() {
    const res = await fetch(`${API_URL}/api/locations`)
    return res.json()
  },
  async getReadyLocations() {
    const res = await fetch(`${API_URL}/api/locations/ready`)
    return res.json()
  },
  async getInstallingLocations() {
    const res = await fetch(`${API_URL}/api/locations/installing`)
    return res.json()
  },
  async getCompletedLocations() {
    const res = await fetch(`${API_URL}/api/locations/completed`)
    return res.json()
  },
  async markReady(id) {
    const res = await fetch(`${API_URL}/api/locations/${id}/ready`, { method: 'POST' })
    return res.json()
  },
  async assignInstaller(id) {
    const res = await fetch(`${API_URL}/api/locations/${id}/assign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ installerId: 'self' })
    })
    return res.json()
  },
  async completeInstallation(id, data) {
    const res = await fetch(`${API_URL}/api/locations/${id}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    return res.json()
  },

  // Notifications
  async getNotifications(phone) {
    const res = await fetch(`${API_URL}/api/notifications/${phone}`)
    return res.json()
  },

  // Stats
  async getStats() {
    const res = await fetch(`${API_URL}/api/stats`)
    return res.json()
  }
}

// ============ COMPONENTS ============

function Header() {
  const location = useLocation()
  const auth = useAuth()

  return (
    <header className="header">
      <div className="container header-content">
        <Link to="/" className="logo">
          <img className="logo-main" src="/logo-main.png" alt="TAZA SHAAR" />
        </Link>
        <nav className="nav">
          <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
            Главная
          </Link>
          {auth?.role === 'user' && (
            <>
              <Link to="/my-requests" className={`nav-link ${location.pathname === '/my-requests' ? 'active' : ''}`}>
                Мои заявки
              </Link>
              <Link to="/submit" className="nav-link accent">
                Подать заявку
              </Link>
            </>
          )}
          {auth?.role === 'manager' && (
            <Link to="/manager" className={`nav-link ${location.pathname === '/manager' ? 'active' : ''}`}>
              Панель
            </Link>
          )}
          {auth?.role === 'installer' && (
            <Link to="/installer" className={`nav-link ${location.pathname === '/installer' ? 'active' : ''}`}>
              Установки
            </Link>
          )}
          {auth?.role === 'admin' && (
            <Link to="/admin" className={`nav-link ${location.pathname === '/admin' ? 'active' : ''}`}>
              Админ
            </Link>
          )}
          {!auth?.role ? (
            <Link to="/login" className="nav-link">Вход</Link>
          ) : (
            <button onClick={auth.logout} className="nav-link logout-btn">
              <LogOut size={18} />
            </button>
          )}
        </nav>
      </div>
    </header>
  )
}

function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <img src="/logo-main.png" alt="TAZA SHAAR" style={{height: 24, marginBottom: 12, filter: 'brightness(0) invert(1)'}} />
        <p>Вместе сделаем город чище</p>
      </div>
    </footer>
  )
}

// ============ PAGES ============

function HomePage() {
  const auth = useAuth()

  return (
    <>
      <section className="hero">
        <div className="container">
          <h1>Чистый город — наша забота</h1>
          <p>Видите место, где нужна урна? Сообщите нам!</p>
          {auth?.role === 'user' ? (
            <Link to="/submit" className="btn btn-primary btn-lg">
              <Camera size={24} />
              Подать заявку
            </Link>
          ) : (
            <Link to="/login" className="btn btn-primary btn-lg">
              <Phone size={24} />
              Войти по номеру
            </Link>
          )}
        </div>
      </section>

      <section className="section">
        <div className="container">
          <h2 className="section-title">Как это работает?</h2>
          <div className="steps-grid">
            <div className="step-card">
              <div className="step-icon"><Camera size={32} /></div>
              <h3>1. Сфотографируйте</h3>
              <p>Найдите место где нужна урна</p>
            </div>
            <div className="step-card">
              <div className="step-icon"><MapPin size={32} /></div>
              <h3>2. Укажите место</h3>
              <p>Отметьте локацию на карте</p>
            </div>
            <div className="step-card">
              <div className="step-icon"><Users size={32} /></div>
              <h3>3. Соберите голоса</h3>
              <p>Когда 10 человек отметят — установим урну</p>
            </div>
            <div className="step-card">
              <div className="step-icon"><CheckCircle size={32} /></div>
              <h3>4. Получите отчёт</h3>
              <p>Пришлём фото установленной урны</p>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

function LoginPage() {
  const [mode, setMode] = useState('user')
  const [phone, setPhone] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const auth = useAuth()

  if (auth?.role) {
    if (auth.role === 'user') return <Navigate to="/my-requests" />
    if (auth.role === 'manager') return <Navigate to="/manager" />
    if (auth.role === 'installer') return <Navigate to="/installer" />
    if (auth.role === 'admin') return <Navigate to="/admin" />
  }

  const handleUserLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const cleanPhone = phone.replace(/\D/g, '')
      if (cleanPhone.length < 9) throw new Error('Введите корректный номер')
      const user = await api.loginUser(cleanPhone)
      auth.login({ ...user, role: 'user' })
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  const handleStaffLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const staff = await api.loginStaff(username, password)
      auth.login(staff)
    } catch (err) {
      setError('Неверный логин или пароль')
    }
    setLoading(false)
  }

  return (
    <div className="page">
      <div className="container" style={{maxWidth: '400px'}}>
        <h1 className="page-title" style={{textAlign: 'center'}}>Вход</h1>

        <div className="login-tabs">
          <button className={`login-tab ${mode === 'user' ? 'active' : ''}`} onClick={() => setMode('user')}>
            Пользователь
          </button>
          <button className={`login-tab ${mode === 'staff' ? 'active' : ''}`} onClick={() => setMode('staff')}>
            Сотрудник
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        {mode === 'user' ? (
          <form onSubmit={handleUserLogin} className="card">
            <div className="form-group">
              <label className="form-label">Номер телефона</label>
              <input
                type="tel"
                className="form-input"
                placeholder="+996 XXX XXX XXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{width: '100%'}} disabled={loading}>
              {loading ? 'Вход...' : 'Войти'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleStaffLogin} className="card">
            <div className="form-group">
              <label className="form-label">Логин</label>
              <input
                type="text"
                className="form-input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Пароль</label>
              <input
                type="password"
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{width: '100%'}} disabled={loading}>
              {loading ? 'Вход...' : 'Войти'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

// Location picker for map
function LocationMarker({ position, setPosition, setAddress }) {
  useMapEvents({
    click(e) {
      setPosition(e.latlng)
      reverseGeocode(e.latlng.lat, e.latlng.lng, setAddress)
    },
  })
  return position ? <Marker position={position} /> : null
}

async function reverseGeocode(lat, lng, setAddress) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1&zoom=18`,
      { headers: { 'Accept-Language': 'ru' } }
    )
    const data = await res.json()
    if (data.display_name) {
      const addr = data.address
      const parts = []
      if (addr.road) {
        let street = addr.road
        if (addr.house_number) street += ', ' + addr.house_number
        parts.push(street)
      }
      if (addr.city || addr.town || addr.village) {
        parts.push(addr.city || addr.town || addr.village)
      }
      if (!parts.length) parts.push(data.display_name.split(',').slice(0, 2).join(','))
      setAddress(parts.join(', '))
    }
  } catch (e) {
    console.error('Geocode error:', e)
  }
}

function SubmitPage() {
  const auth = useAuth()
  const [photo, setPhoto] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [address, setAddress] = useState('')
  const [comment, setComment] = useState('')
  const [position, setPosition] = useState(null)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const defaultCenter = [42.87, 74.59]

  if (!auth?.role) return <Navigate to="/login" />

  const handlePhotoChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => setPhotoPreview(reader.result)
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!address.trim()) return setError('Укажите адрес')

    setLoading(true)
    setError('')

    try {
      const result = await api.submitVote({
        phone: auth.phone,
        address: address.trim(),
        lat: position?.lat,
        lng: position?.lng,
        photo: photoPreview,
        comment
      })

      if (result.error) throw new Error(result.error)
      setSubmitted(true)
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  if (submitted) {
    return (
      <div className="page">
        <div className="container" style={{maxWidth: '500px', textAlign: 'center', paddingTop: '60px'}}>
          <div className="success-animation">
            <div className="success-checkmark">
              <svg className="checkmark" viewBox="0 0 52 52">
                <circle className="checkmark-circle" cx="26" cy="26" r="25" fill="none"/>
                <path className="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
              </svg>
            </div>
            <h2 className="success-title">Голос принят!</h2>
            <p className="success-text">
              Мы уведомим вас, когда урна будет установлена.
            </p>
            <div style={{display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '24px'}}>
              <button className="btn btn-secondary" onClick={() => setSubmitted(false)}>
                Ещё заявка
              </button>
              <Link to="/my-requests" className="btn btn-primary">
                Мои заявки
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="container" style={{maxWidth: '600px'}}>
        <h1 className="page-title">Подать заявку</h1>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="card">
          <div className="form-group">
            <label className="form-label">Фото места</label>
            <input type="file" accept="image/*" capture="environment" onChange={handlePhotoChange} style={{display: 'none'}} id="photo-input" />
            <label htmlFor="photo-input" className="photo-upload">
              {photoPreview ? (
                <img src={photoPreview} alt="Preview" className="photo-preview" />
              ) : (
                <>
                  <Camera className="photo-upload-icon" size={48} />
                  <div>Нажмите чтобы сделать фото</div>
                </>
              )}
            </label>
          </div>

          <div className="form-group">
            <label className="form-label"><MapPin size={18} /> Местоположение</label>
            <div className="map-wrapper">
              <MapContainer center={defaultCenter} zoom={12} className="location-map">
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <LocationMarker position={position} setPosition={setPosition} setAddress={setAddress} />
              </MapContainer>
            </div>
            <input
              type="text"
              className="form-input"
              placeholder="Нажмите на карту для выбора места"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              style={{marginTop: '12px'}}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label"><Phone size={18} /> Номер телефона</label>
            <input
              type="tel"
              className="form-input"
              placeholder="+996 XXX XXX XXX"
              value={auth.phone || ''}
              readOnly
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

          <button type="submit" className="btn btn-primary" style={{width: '100%'}} disabled={loading}>
            {loading ? 'Отправка...' : 'Отправить'}
          </button>
        </form>
      </div>
    </div>
  )
}

function MyRequestsPage() {
  const auth = useAuth()
  const [votes, setVotes] = useState([])
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (auth?.phone) {
      Promise.all([
        api.getUserVotes(auth.phone),
        api.getNotifications(auth.phone)
      ]).then(([v, n]) => {
        setVotes(v)
        setNotifications(n)
        setLoading(false)
      })
    }
  }, [auth?.phone])

  if (!auth?.role) return <Navigate to="/login" />

  const getStatusText = (vote) => {
    if (!vote.location) return 'Обработка...'
    switch (vote.location.status) {
      case 'collecting': return `Сбор голосов (${vote.location.votes}/10)`
      case 'ready': return 'Готово к установке'
      case 'installing': return 'Устанавливается'
      case 'completed': return 'Установлено!'
      default: return vote.location.status
    }
  }

  const getStatusClass = (vote) => {
    if (!vote.location) return 'badge-pending'
    switch (vote.location.status) {
      case 'collecting': return 'badge-pending'
      case 'ready': return 'badge-ready'
      case 'installing': return 'badge-installing'
      case 'completed': return 'badge-done'
      default: return ''
    }
  }

  return (
    <div className="page">
      <div className="container">
        <h1 className="page-title">Мои заявки</h1>

        {notifications.length > 0 && (
          <div className="notifications-section">
            <h3><Bell size={18} /> Уведомления</h3>
            {notifications.filter(n => !n.read).map(n => (
              <div key={n._id} className="notification-card">
                <p>{n.message}</p>
                {n.photos?.length > 0 && (
                  <div className="notification-photos">
                    {n.photos.map((p, i) => <img key={i} src={p} alt="" />)}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {loading ? (
          <div className="loading">Загрузка...</div>
        ) : votes.length === 0 ? (
          <div className="empty-state">
            <p>У вас пока нет заявок</p>
            <Link to="/submit" className="btn btn-primary">Подать заявку</Link>
          </div>
        ) : (
          <div className="votes-list">
            {votes.map(vote => (
              <div key={vote._id} className="vote-card">
                <div className="vote-header">
                  <div className="vote-address">{vote.address}</div>
                  <span className={`badge ${getStatusClass(vote)}`}>{getStatusText(vote)}</span>
                </div>
                {vote.location && (
                  <div className="vote-progress">
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{width: `${Math.min(vote.location.votes * 10, 100)}%`}}
                      />
                    </div>
                    <span>{vote.location.votes}/10 голосов</span>
                  </div>
                )}
                {vote.location?.installationReport && (
                  <div className="installation-report">
                    <h4>Отчёт об установке:</h4>
                    {vote.location.installationReport.photos?.map((p, i) => (
                      <img key={i} src={p} alt="" className="report-photo" />
                    ))}
                    <p>{vote.location.installationReport.report}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function ManagerPage() {
  const auth = useAuth()
  const [locations, setLocations] = useState([])
  const [tab, setTab] = useState('collecting')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const data = await api.getLocations()
    setLocations(data)
    setLoading(false)
  }

  if (!auth?.role || !['manager', 'admin'].includes(auth.role)) {
    return <Navigate to="/login" />
  }

  const collecting = locations.filter(l => l.status === 'collecting')
  const ready = locations.filter(l => l.status === 'ready')
  const installing = locations.filter(l => l.status === 'installing')
  const completed = locations.filter(l => l.status === 'completed')

  const displayed = tab === 'collecting' ? collecting :
                    tab === 'ready' ? ready :
                    tab === 'installing' ? installing : completed

  const handleMarkReady = async (id) => {
    await api.markReady(id)
    loadData()
  }

  return (
    <div className="dashboard">
      <div className="container">
        <h1 className="dashboard-title">Панель менеджера</h1>

        <div className="dashboard-tabs">
          <button className={`tab ${tab === 'collecting' ? 'active' : ''}`} onClick={() => setTab('collecting')}>
            Сбор ({collecting.length})
          </button>
          <button className={`tab ${tab === 'ready' ? 'active' : ''}`} onClick={() => setTab('ready')}>
            К установке ({ready.length})
          </button>
          <button className={`tab ${tab === 'installing' ? 'active' : ''}`} onClick={() => setTab('installing')}>
            Установка ({installing.length})
          </button>
          <button className={`tab ${tab === 'completed' ? 'active' : ''}`} onClick={() => setTab('completed')}>
            Готово ({completed.length})
          </button>
        </div>

        {/* Карта */}
        <div className="dashboard-map-wrapper" style={{marginTop: '24px'}}>
          <MapContainer center={[42.87, 74.59]} zoom={12} className="dashboard-map">
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {displayed.filter(l => l.lat && l.lng).map(loc => (
              <Marker key={loc._id} position={[loc.lat, loc.lng]}>
                <Popup>
                  <strong>{loc.address}</strong><br/>
                  {loc.votes} голосов
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        {/* Список */}
        <div style={{marginTop: '24px'}}>
          {loading ? <div className="loading">Загрузка...</div> :
           displayed.length === 0 ? <div className="empty-state">Нет локаций</div> :
           displayed.map(loc => (
            <div key={loc._id} className="manager-card">
              <div className="manager-card-content">
                <div className="manager-card-header">
                  <div className="manager-card-address">{loc.address}</div>
                  <span className={`badge badge-${loc.status}`}>{loc.votes} голосов</span>
                </div>
                <div className="manager-card-meta">
                  <span><Users size={16} /> {loc.voters?.length || 0} человек</span>
                  <span><Clock size={16} /> {new Date(loc.updatedAt).toLocaleDateString('ru-RU')}</span>
                </div>
                {loc.comments?.length > 0 && (
                  <div className="manager-card-comments">
                    <div className="comments-label">Комментарии:</div>
                    {loc.comments.slice(0, 3).map((c, i) => (
                      <div key={i} className="comment-item">"{c.text}"</div>
                    ))}
                  </div>
                )}
                <div className="manager-card-actions">
                  {loc.lat && loc.lng && (
                    <a href={`https://maps.google.com?q=${loc.lat},${loc.lng}`} target="_blank" className="btn btn-secondary btn-sm">
                      <Eye size={16} /> Карта
                    </a>
                  )}
                  {loc.status === 'collecting' && loc.votes >= 10 && (
                    <button className="btn btn-success btn-sm" onClick={() => handleMarkReady(loc._id)}>
                      <ChevronRight size={16} /> К установке
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function InstallerPage() {
  const auth = useAuth()
  const [locations, setLocations] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [photos, setPhotos] = useState([])
  const [report, setReport] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const [ready, installing] = await Promise.all([
      api.getReadyLocations(),
      api.getInstallingLocations()
    ])
    setLocations([...ready, ...installing])
    setLoading(false)
  }

  if (!auth?.role || !['installer', 'admin'].includes(auth.role)) {
    return <Navigate to="/login" />
  }

  const handleTakeJob = async (id) => {
    await api.assignInstaller(id)
    loadData()
  }

  const handlePhotoAdd = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => setPhotos([...photos, reader.result])
      reader.readAsDataURL(file)
    }
  }

  const handleSubmitReport = async () => {
    if (!selectedId || photos.length === 0) return
    setSubmitting(true)
    await api.completeInstallation(selectedId, { photos, report })
    setSelectedId(null)
    setPhotos([])
    setReport('')
    setSubmitting(false)
    loadData()
  }

  return (
    <div className="dashboard">
      <div className="container">
        <h1 className="dashboard-title">Установки</h1>

        {selectedId && (
          <div className="report-form card">
            <h3>Отчёт об установке</h3>
            <div className="form-group">
              <label className="form-label">Фото (минимум 1)</label>
              <input type="file" accept="image/*" onChange={handlePhotoAdd} />
              <div className="photo-previews">
                {photos.map((p, i) => <img key={i} src={p} alt="" />)}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Комментарий</label>
              <textarea className="form-textarea" value={report} onChange={(e) => setReport(e.target.value)} />
            </div>
            <div style={{display: 'flex', gap: '12px'}}>
              <button className="btn btn-secondary" onClick={() => setSelectedId(null)}>Отмена</button>
              <button className="btn btn-success" onClick={handleSubmitReport} disabled={submitting || photos.length === 0}>
                {submitting ? 'Отправка...' : 'Завершить'}
              </button>
            </div>
          </div>
        )}

        {loading ? <div className="loading">Загрузка...</div> :
         locations.length === 0 ? <div className="empty-state">Нет заданий</div> :
         locations.map(loc => (
          <div key={loc._id} className="manager-card">
            <div className="manager-card-content">
              <div className="manager-card-header">
                <div className="manager-card-address">{loc.address}</div>
                <span className={`badge badge-${loc.status}`}>
                  {loc.status === 'ready' ? 'Ожидает' : 'В работе'}
                </span>
              </div>
              <div className="manager-card-actions">
                <a href={`https://maps.google.com?q=${loc.lat},${loc.lng}`} target="_blank" className="btn btn-secondary btn-sm">
                  <MapPin size={16} /> Навигация
                </a>
                {loc.status === 'ready' && (
                  <button className="btn btn-primary btn-sm" onClick={() => handleTakeJob(loc._id)}>
                    Взять в работу
                  </button>
                )}
                {loc.status === 'installing' && (
                  <button className="btn btn-success btn-sm" onClick={() => setSelectedId(loc._id)}>
                    <Upload size={16} /> Загрузить отчёт
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function AdminPage() {
  const auth = useAuth()
  const [stats, setStats] = useState({})

  useEffect(() => {
    api.getStats().then(setStats)
  }, [])

  if (auth?.role !== 'admin') return <Navigate to="/login" />

  return (
    <div className="dashboard">
      <div className="container">
        <h1 className="dashboard-title">Админ панель</h1>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{stats.totalVotes || 0}</div>
            <div className="stat-label">Голосов</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.totalLocations || 0}</div>
            <div className="stat-label">Локаций</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.collecting || 0}</div>
            <div className="stat-label">Сбор</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.ready || 0}</div>
            <div className="stat-label">К установке</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.completed || 0}</div>
            <div className="stat-label">Завершено</div>
          </div>
        </div>

        <div style={{marginTop: '32px'}}>
          <Link to="/manager" className="btn btn-secondary" style={{marginRight: '12px'}}>
            Панель менеджера
          </Link>
          <Link to="/installer" className="btn btn-secondary">
            Панель установщика
          </Link>
        </div>
      </div>
    </div>
  )
}

// ============ APP ============

function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => {
    const saved = localStorage.getItem('taza_shaar_auth')
    return saved ? JSON.parse(saved) : null
  })

  const login = (data) => {
    setAuth(data)
    localStorage.setItem('taza_shaar_auth', JSON.stringify(data))
  }

  const logout = () => {
    setAuth(null)
    localStorage.removeItem('taza_shaar_auth')
  }

  return (
    <AuthContext.Provider value={{ ...auth, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Header />
        <main>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/submit" element={<SubmitPage />} />
            <Route path="/my-requests" element={<MyRequestsPage />} />
            <Route path="/manager" element={<ManagerPage />} />
            <Route path="/installer" element={<InstallerPage />} />
            <Route path="/admin" element={<AdminPage />} />
          </Routes>
        </main>
        <Footer />
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
