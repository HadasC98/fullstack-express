import { MongoClient, ServerApiVersion } from 'mongodb';
import bodyParser from 'body-parser';
import express from 'express';
import cors from 'cors';

const app = express();
const port = 5000;

// MongoDB connection details
const password = "Ncohen98";
const userName = "hc820";
const server = "m00917628.xhltf9o.mongodb.net";

// Encode special characters
const encodedUsername = encodeURIComponent(userName);
const encodedPassword = encodeURIComponent(password);

// Create connection URI
const connectionURI = `mongodb+srv://${encodedUsername}:${encodedPassword}@${server}/?retryWrites=true&w=majority&appName=M00917628`;

// Set up MongoDB client
const client = new MongoClient(connectionURI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: false,
    deprecationErrors: true,
  }
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

app.use(cors());
app.use(bodyParser.json()); // Use body-parser to parse JSON

// Debugging: Logs every incoming request
app.use((req, res, next) => {
  console.log(`Received ${req.method} request for ${req.originalUrl}`);
  next();
});

// Fetch lessons (GET request)
app.get('/api/lessons', async (req, res) => {
  console.log("GET request to /api/lessons");
  try {
    const lessons = await db.collection('lessons').find({}).toArray();
    res.json(lessons);
  } catch (error) {
    console.error('Error fetching lessons', error);
    res.status(500).send('Error fetching lessons');
  }
});

// Root route for testing
app.get('/', (req, res) => {
  res.send('Welcome to the lessons shop API!');
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
