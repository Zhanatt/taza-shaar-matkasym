import express from 'express'
import cors from 'cors'
import { MongoClient, ObjectId } from 'mongodb'

const app = express()
app.use(cors())
app.use(express.json({ limit: '10mb' }))

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://zhanattool_db_user:FNQYRTnWYSOJVE8B@m0.z8eawsy.mongodb.net/?appName=M0'
const DB_NAME = 'taza_shaar'

let db

async function connectDB() {
  const client = new MongoClient(MONGO_URI)
  await client.connect()
  db = client.db(DB_NAME)
  console.log('Connected to MongoDB')
}

// Get all requests
app.get('/api/requests', async (req, res) => {
  try {
    const requests = await db.collection('requests').find().sort({ date: -1 }).toArray()
    res.json(requests)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Get stats
app.get('/api/stats', async (req, res) => {
  try {
    const requests = await db.collection('requests').find().toArray()
    const processed = await db.collection('processed').find().toArray()
    const processedAddresses = processed.map(p => p.address.toLowerCase().trim())

    // Group by address
    const groups = {}
    requests.forEach(req => {
      const key = req.address.toLowerCase().trim()
      if (!groups[key]) {
        groups[key] = { address: req.address, count: 0, photos: [], lat: req.lat, lng: req.lng, lastDate: req.date }
      }
      groups[key].count++
      if (req.photo) groups[key].photos.push(req.photo)
      groups[key].lastDate = req.date
    })

    const locations = Object.values(groups)
    const totalRequests = requests.length
    const readyLocations = locations.filter(l => l.count >= 10 && !processedAddresses.includes(l.address.toLowerCase().trim())).length
    const collectingLocations = locations.filter(l => l.count < 10).length

    res.json({ totalRequests, readyLocations, collectingLocations, locations })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Create request
app.post('/api/requests', async (req, res) => {
  try {
    const { address, comment, photo, lat, lng } = req.body
    const newRequest = {
      address,
      comment,
      photo,
      lat,
      lng,
      date: new Date().toISOString()
    }
    const result = await db.collection('requests').insertOne(newRequest)
    res.json({ ...newRequest, _id: result.insertedId })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Mark as processed
app.post('/api/processed', async (req, res) => {
  try {
    const { address } = req.body
    await db.collection('processed').insertOne({ address, date: new Date().toISOString() })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Get processed
app.get('/api/processed', async (req, res) => {
  try {
    const processed = await db.collection('processed').find().toArray()
    res.json(processed.map(p => p.address))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

const PORT = process.env.PORT || 3001

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
  })
})
