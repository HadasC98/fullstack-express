import { MongoClient, ObjectId } from 'mongodb';
import bodyParser from 'body-parser';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const port = 5000;

// Middleware
app.use(cors());

app.use(cors({
  origin: ['http://localhost:8080', 'https://hadasc98.github.io'], // Allow these origins
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],             // Allowed methods
  credentials: true                                               // Allow cookies, if needed
}));

const API_BASE_URL = process.env.NODE_ENV === 'production'
    ? 'https://fullstack-express-9dbh.onrender.com'
    : 'http://localhost:5000';

app.use(bodyParser.json());
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Static file middleware for images
app.use('/img', express.static(path.join(__dirname, 'img')));
app.use('/img', (req, res) => {
  res.status(404).send('Image not found');
});

// Home route
app.get('/', (req, res) => {
  res.send('Welcome to the Lesson Shop API');
});

// MongoDB connection
const password = "Ncohen98";
const userName = "hc820";
const server = "m00917628.xhltf9o.mongodb.net";

const encodedUsername = encodeURIComponent(userName);
const encodedPassword = encodeURIComponent(password);

const connectionURI = `mongodb+srv://${encodedUsername}:${encodedPassword}@${server}/?retryWrites=true&w=majority`;
const client = new MongoClient(connectionURI, {
  useUnifiedTopology: true
});

let db;

client.connect()
  .then(() => {
    db = client.db('lessonShop');
    console.log("Connected to MongoDB");
  })
  .catch(err => {
    console.error('Failed to connect to MongoDB', err.message);
    process.exit(1);
  });

// Routes

// GET /api/lessons - Retrieve all lessons
app.get('/api/lessons', async (req, res) => {
  try {
    console.log('Fetching lessons from database...');
    const lessons = await db.collection('lessons').find({}).toArray();
    console.log('Lessons retrieved:', lessons);
    res.json(lessons);
  } catch (error) {
    console.error('Error fetching lessons:', error.message);
    res.status(500).send('Error fetching lessons');
  }
});


// POST /api/orders - Place a new order
app.post('/api/orders', async (req, res) => {
  const { name, phoneNumber, lessonIDs, numberOfSpaces } = req.body;

  // Validate request body
  if (!name || !phoneNumber || !Array.isArray(lessonIDs) || !Array.isArray(numberOfSpaces) || lessonIDs.length !== numberOfSpaces.length) {
    return res.status(400).send('Invalid request body');
  }

  try {
    // Fetch lessons from the database
    const lessons = await db.collection('lessons').find({
      _id: { $in: lessonIDs.map(id => new ObjectId(id)) }
    }).toArray();

    // Check if lessons have enough space
    for (let i = 0; i < lessons.length; i++) {
      if (lessons[i].space < numberOfSpaces[i]) {
        return res.status(400).send(`Not enough space for lesson: ${lessons[i].topic}`);
      }
    }

    // Update lesson spaces
    for (let i = 0; i < lessons.length; i++) {
      await db.collection('lessons').updateOne(
        { _id: lessons[i]._id },
        { $inc: { space: -numberOfSpaces[i] } }
      );
    }

    // Insert the new order into the orders collection
    await db.collection('orders').insertOne({ name, phoneNumber, lessonIDs, numberOfSpaces });

    res.status(200).send('Order placed successfully');
  } catch (error) {
    console.error('Error placing order:', error.message);
    res.status(500).send('Error placing order');
  }
});

// PUT /api/lessons/:id - Update lesson details
app.put('/api/lessons/:id', async (req, res) => {
  const { id } = req.params;
  const { updates } = req.body;

  // Validate updates
  if (!updates || typeof updates !== 'object') {
    return res.status(400).send('Invalid updates');
  }

  try {
    // Update the lesson in the database
    await db.collection('lessons').updateOne(
      { _id: new ObjectId(id) },
      { $set: updates }
    );
    res.status(200).send('Lesson updated successfully');
  } catch (error) {
    console.error('Error updating lesson:', error.message);
    res.status(500).send('Error updating lesson');
  }
});

// POST /api/users - Create a new user
app.post('/api/users', async (req, res) => {
  const { name, phone, email, address } = req.body;

  // Validate request body
  if (!name || !phone || !email || !address) {
    return res.status(400).send('Missing required fields');
  }

  try {
    // Insert user into the 'users' collection
    const result = await db.collection('users').insertOne({ name, phone, email, address });

    res.status(201).json({
      message: 'User created successfully',
      userId: result.insertedId
    });
  } catch (error) {
    console.error('Error creating user:', error.message);
    res.status(500).send('Error creating user');
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
