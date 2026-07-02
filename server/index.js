import express from 'express'
import cors from 'cors'
import { MongoClient, ObjectId } from 'mongodb'

const app = express()
app.use(cors())
app.use(express.json({ limit: '50mb' }))

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://zhanattool_db_user:FNQYRTnWYSOJVE8B@m0.z8eawsy.mongodb.net/?appName=M0'
const DB_NAME = 'taza_shaar'

let db

async function connectDB() {
  const client = new MongoClient(MONGO_URI)
  await client.connect()
  db = client.db(DB_NAME)
  console.log('Connected to MongoDB')
}

// ============ USERS ============

// Register/Login by phone
app.post('/api/auth', async (req, res) => {
  try {
    const { phone } = req.body
    if (!phone) return res.status(400).json({ error: 'Phone required' })

    let user = await db.collection('users').findOne({ phone })
    if (!user) {
      const result = await db.collection('users').insertOne({
        phone,
        role: 'user',
        createdAt: new Date().toISOString()
      })
      user = { _id: result.insertedId, phone, role: 'user' }
    }
    res.json(user)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Staff login
app.post('/api/auth/staff', async (req, res) => {
  try {
    const { username, password } = req.body
    const staff = await db.collection('staff').findOne({ username, password })
    if (!staff) return res.status(401).json({ error: 'Invalid credentials' })
    res.json({ _id: staff._id, username: staff.username, role: staff.role })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ============ LOCATIONS ============

// Get all locations with votes (for manager)
app.get('/api/locations', async (req, res) => {
  try {
    const locations = await db.collection('locations').find().sort({ createdAt: -1 }).toArray()
    res.json(locations)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Get locations ready for installation (10+ votes, status = ready)
app.get('/api/locations/ready', async (req, res) => {
  try {
    const locations = await db.collection('locations').find({ status: 'ready' }).toArray()
    res.json(locations)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Get locations in installation
app.get('/api/locations/installing', async (req, res) => {
  try {
    const locations = await db.collection('locations').find({ status: 'installing' }).toArray()
    res.json(locations)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Get completed locations
app.get('/api/locations/completed', async (req, res) => {
  try {
    const locations = await db.collection('locations').find({ status: 'completed' }).toArray()
    res.json(locations)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ============ VOTES (User submissions) ============

// Submit a vote (user's request for a location)
app.post('/api/vote', async (req, res) => {
  try {
    const { userId, phone, address, lat, lng, photo, comment } = req.body

    if (!phone || !address) {
      return res.status(400).json({ error: 'Phone and address required' })
    }

    const locationKey = address.toLowerCase().trim()

    // Check if user already voted for this location
    const existingVote = await db.collection('votes').findOne({
      phone,
      locationKey
    })

    if (existingVote) {
      return res.status(400).json({ error: 'Вы уже оставляли заявку на эту локацию' })
    }

    // Find or create location
    let location = await db.collection('locations').findOne({ locationKey })

    if (!location) {
      const result = await db.collection('locations').insertOne({
        locationKey,
        address,
        lat,
        lng,
        votes: 0,
        status: 'collecting', // collecting -> ready -> installing -> completed
        photos: [],
        comments: [],
        voters: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      location = { _id: result.insertedId }
    }

    // Add vote
    const vote = {
      phone,
      locationId: location._id,
      locationKey,
      address,
      photo,
      comment,
      status: 'pending', // pending -> approved -> completed
      createdAt: new Date().toISOString()
    }

    await db.collection('votes').insertOne(vote)

    // Update location
    const updateData = {
      $inc: { votes: 1 },
      $push: { voters: phone },
      $set: { updatedAt: new Date().toISOString() }
    }

    if (photo) updateData.$push.photos = photo
    if (comment) updateData.$push.comments = { text: comment, phone, date: new Date().toISOString() }

    const updatedLocation = await db.collection('locations').findOneAndUpdate(
      { _id: location._id },
      updateData,
      { returnDocument: 'after' }
    )

    // Auto-set to ready if 10 votes reached
    if (updatedLocation.votes >= 10 && updatedLocation.status === 'collecting') {
      await db.collection('locations').updateOne(
        { _id: location._id },
        { $set: { status: 'ready' } }
      )
    }

    res.json({ success: true, votes: updatedLocation.votes })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Get user's votes
app.get('/api/votes/:phone', async (req, res) => {
  try {
    const { phone } = req.params
    const votes = await db.collection('votes').find({ phone }).sort({ createdAt: -1 }).toArray()

    // Enrich with location data
    const enrichedVotes = await Promise.all(votes.map(async (vote) => {
      const location = await db.collection('locations').findOne({ _id: new ObjectId(vote.locationId) })
      return { ...vote, location }
    }))

    res.json(enrichedVotes)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ============ MANAGER ACTIONS ============

// Mark location as ready for installation
app.post('/api/locations/:id/ready', async (req, res) => {
  try {
    const { id } = req.params
    await db.collection('locations').updateOne(
      { _id: new ObjectId(id) },
      { $set: { status: 'ready', readyAt: new Date().toISOString() } }
    )
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Assign to installer
app.post('/api/locations/:id/assign', async (req, res) => {
  try {
    const { id } = req.params
    const { installerId } = req.body
    await db.collection('locations').updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          status: 'installing',
          installerId,
          assignedAt: new Date().toISOString()
        }
      }
    )
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ============ INSTALLER ACTIONS ============

// Submit installation report
app.post('/api/locations/:id/complete', async (req, res) => {
  try {
    const { id } = req.params
    const { photos, video, report } = req.body

    await db.collection('locations').updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          status: 'completed',
          completedAt: new Date().toISOString(),
          installationReport: {
            photos: photos || [],
            video,
            report,
            submittedAt: new Date().toISOString()
          }
        }
      }
    )

    // Update all votes for this location
    await db.collection('votes').updateMany(
      { locationId: new ObjectId(id) },
      { $set: { status: 'completed' } }
    )

    // Get location to notify voters
    const location = await db.collection('locations').findOne({ _id: new ObjectId(id) })

    // TODO: Send notifications to voters (location.voters)
    // For now, just mark as notified
    if (location.voters) {
      await db.collection('notifications').insertMany(
        location.voters.map(phone => ({
          phone,
          locationId: new ObjectId(id),
          type: 'completed',
          message: `Урна установлена по адресу: ${location.address}`,
          photos: photos || [],
          video,
          read: false,
          createdAt: new Date().toISOString()
        }))
      )
    }

    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ============ NOTIFICATIONS ============

// Get user notifications
app.get('/api/notifications/:phone', async (req, res) => {
  try {
    const { phone } = req.params
    const notifications = await db.collection('notifications')
      .find({ phone })
      .sort({ createdAt: -1 })
      .toArray()
    res.json(notifications)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Mark notification as read
app.post('/api/notifications/:id/read', async (req, res) => {
  try {
    const { id } = req.params
    await db.collection('notifications').updateOne(
      { _id: new ObjectId(id) },
      { $set: { read: true } }
    )
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ============ STATS ============

app.get('/api/stats', async (req, res) => {
  try {
    const totalLocations = await db.collection('locations').countDocuments()
    const collecting = await db.collection('locations').countDocuments({ status: 'collecting' })
    const ready = await db.collection('locations').countDocuments({ status: 'ready' })
    const installing = await db.collection('locations').countDocuments({ status: 'installing' })
    const completed = await db.collection('locations').countDocuments({ status: 'completed' })
    const totalVotes = await db.collection('votes').countDocuments()

    res.json({ totalLocations, collecting, ready, installing, completed, totalVotes })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ============ ADMIN ============

// Create staff account
app.post('/api/admin/staff', async (req, res) => {
  try {
    const { username, password, role } = req.body
    const existing = await db.collection('staff').findOne({ username })
    if (existing) return res.status(400).json({ error: 'Username exists' })

    await db.collection('staff').insertOne({
      username,
      password,
      role, // manager, installer, admin
      createdAt: new Date().toISOString()
    })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Delete location (admin only)
app.delete('/api/locations/:id', async (req, res) => {
  try {
    const { id } = req.params
    await db.collection('locations').deleteOne({ _id: new ObjectId(id) })
    await db.collection('votes').deleteMany({ locationId: new ObjectId(id) })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

const PORT = process.env.PORT || 3001

connectDB().then(async () => {
  // Create default staff accounts if not exist
  const adminExists = await db.collection('staff').findOne({ username: 'admin' })
  if (!adminExists) {
    await db.collection('staff').insertMany([
      { username: 'admin', password: 'admin123', role: 'admin', createdAt: new Date().toISOString() },
      { username: 'manager', password: 'manager123', role: 'manager', createdAt: new Date().toISOString() },
      { username: 'installer', password: 'installer123', role: 'installer', createdAt: new Date().toISOString() }
    ])
    console.log('Default staff accounts created')
  }

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
  })
})
