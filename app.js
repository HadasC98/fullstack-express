import { MongoClient, ServerApiVersion } from 'mongodb';
import bodyParser from 'body-parser';
import express from 'express';

const app = express();
const port = 5000;

import cors from 'cors';
app.use(cors());
app.use(bodyParser.json());

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

// Root route
app.get('/', (req, res) => {
  res.send('Welcome to the Lesson Shop API');
});

// Fetch lessons
app.get('/api/lessons', async (req, res) => {
  try {
    const lessons = await db.collection('lessons').find({}).toArray();
    res.json(lessons);
  } catch (error) {
    res.status(500).send('Error fetching lessons');
  }
});

// Fetch orders
app.get('/api/orders', async (req, res) => {
  try {
    const orders = await db.collection('orders').find({}).toArray();
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching orders' });
  }
});

// Finalize order, update stock and return updated lessons
app.post('/api/orders', async (req, res) => {
  const { user, cart, totalPrice } = req.body;
  try {
    // Updates stock for each item in the cart
    for (const item of cart) {
      const product = await db.collection('lessons').findOne({ _id: item._id });
      if (product) {
        product.stock -= item.quantity;
        await db.collection('lessons').updateOne({ _id: item._id }, { $set: { stock: product.stock } });
      }
    }

    // Insert the order into the orders collection
    await db.collection('orders').insertOne({
      user,
      cart,
      totalPrice,
      date: new Date()
    });

    // Fetch updated lessons
    const updatedLessons = await db.collection('lessons').find({}).toArray();

    // Sends response with success message and updated lessons
    res.status(200).json({
      message: 'Order placed successfully!',
      updatedLessons, // Send back updated products with updated stock
    });
  } catch (error) {
    console.error('Error processing order:', error);
    res.status(500).json({ error: 'Failed to process order' });
  }
});

// Update stock on removal from cart
app.post('/api/cart/remove', async (req, res) => {
  const { lessonId, quantity } = req.body;
  try {
    await db.collection('lessons').updateOne(
      { _id: lessonId },
      { $inc: { stock: quantity } }
    );
    res.status(200).json({ message: 'Stock updated' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating stock' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
