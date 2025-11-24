const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Importer les modèles
const { Player, Item, Quest } = require('./src/models');

//importer les routes 

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
  });

// Basic route
app.get('/', (req, res) => {
  res.json({ 
    message: 'RPG Quest System API is running!',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Static Data Routes

// Get all items
app.get('/api/items', async (req, res) => {
  try {
    const items = await Item.find({});
    res.json({
      success: true,
      count: items.length,
      data: items
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving items',
      error: error.message
    });
  }
});

// Get single item by ID
app.get('/api/items/:id', async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }
    res.json({
      success: true,
      data: item
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving item',
      error: error.message
    });
  }
});

// Get all quests
app.get('/api/quests', async (req, res) => {
  try {
    const quests = await Quest.find({});
    res.json({
      success: true,
      count: quests.length,
      data: quests
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving quests',
      error: error.message
    });
  }
});

// Get single quest by ID
app.get('/api/quests/:id', async (req, res) => {
  try {
    const quest = await Quest.findById(req.params.id);
    if (!quest) {
      return res.status(404).json({
        success: false,
        message: 'Quest not found'
      });
    }
    res.json({
      success: true,
      data: quest
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving quest',
      error: error.message
    });
  }
});

/* Health check route
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});*/

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

app.use((req, res) => {
  res.status(404).json({ 
    message: 'Route not found',
    path: req.originalUrl
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Server URL: http://localhost:${PORT}`);
 // console.log(`Health check: http://localhost:${PORT}/health`);
});

module.exports = app;
