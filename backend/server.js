const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Importer les modèles
const { Player, Item, Quest } = require('./src/models');

// Importer le middleware d'authentification
const authMiddleware = require('./src/middleware/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*'); // not a good practice for prod, I know
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


// To do later : put the routes in different files except the static ones


// Basic route
app.get('/', (req, res) => {
  res.json({ 
    message: 'RPG Quest System API is running!',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Authentication Routes

// Register a new player
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password'
      });
    }

    const existingPlayer = await Player.findOne({ email });
    if (existingPlayer) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    // Vérifier la longueur du mot de passe
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    // le password sera automatiquement haché par le pre-save hook??
    const player = new Player({
      name,
      email,
      password
    });

    await player.save();

    // Générer le JWT
    const token = jwt.sign(
      { 
        id: player._id, 
        email: player.email,
        name: player.name 
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'Player registered successfully',
      data: {
        player: {
          id: player._id,
          name: player.name,
          email: player.email,
          level: player.level,
          experience: player.experience
        },
        token
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error registering player',
      error: error.message
    });
  }
});

// Login player
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Trouver le player
    const player = await Player.findOne({ email });
    if (!player) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Vérifier le mot de passe
    const isPasswordValid = await player.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Générer le JWT
    const token = jwt.sign(
      { 
        id: player._id, 
        email: player.email,
        name: player.name 
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        player: {
          id: player._id,
          name: player.name,
          email: player.email,
          level: player.level,
          experience: player.experience,
          inventory: player.inventory,
          quests: player.quests
        },
        token
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error logging in',
      error: error.message
    });
  }
});

// Static Data Routes

// Get all items
app.get('/api/items', authMiddleware, async (req, res) => {
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
app.get('/api/items/:id', authMiddleware, async (req, res) => {
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
app.get('/api/quests', authMiddleware, async (req, res) => {
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
app.get('/api/quests/:id', authMiddleware, async (req, res) => {
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

// Player Management Routes

// Get player profile
app.get('/api/player/profile', authMiddleware, async (req, res) => {
  try {
    const player = await Player.findById(req.player.id)
      .populate('inventory')
      .populate('quests.questId');
    
    if (!player) {
      return res.status(404).json({
        success: false,
        message: 'Player not found'
      });
    }

    res.json({
      success: true,
      data: {
        id: player._id,
        name: player.name,
        email: player.email,
        level: player.level,
        experience: player.experience,
        inventory: player.inventory,
        quests: player.quests
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving player profile',
      error: error.message
    });
  }
});

// Accept a quest
app.post('/api/player/accept-quest/:questId', authMiddleware, async (req, res) => {
  try {
    const { questId } = req.params;

    const quest = await Quest.findById(questId);
    if (!quest) {
      return res.status(404).json({
        success: false,
        message: 'Quest not found'
      });
    }

    const player = await Player.findById(req.player.id);
    if (!player) {
      return res.status(404).json({
        success: false,
        message: 'Player not found'
      });
    }

    // Vérifier si le joueur a déjà cette quête
    const existingQuest = player.quests.find(
      q => q.questId.toString() === questId
    );

    if (existingQuest) {
      return res.status(400).json({
        success: false,
        message: 'Quest already accepted',
        currentStatus: existingQuest.status
      });
    }

    player.quests.push({
      questId: questId,
      status: 'in_progress'
    });

    await player.save();

    // Repopuler les données pour la réponse
    await player.populate('quests.questId');

    res.json({
      success: true,
      message: 'Quest accepted successfully',
      data: {
        quest: player.quests[player.quests.length - 1]
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error accepting quest',
      error: error.message
    });
  }
});

// Use an item from inventory
app.post('/api/player/use-item/:itemId', authMiddleware, async (req, res) => {
  try {
    const { itemId } = req.params;

    const player = await Player.findById(req.player.id);
    if (!player) {
      return res.status(404).json({
        success: false,
        message: 'Player not found'
      });
    }

    const itemIndex = player.inventory.findIndex(
      item => item.toString() === itemId
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Item not found in inventory'
      });
    }

    // Récupérer les informations de l'item avant de le retirer
    const item = await Item.findById(itemId);

    // Retirer l'item de l'inventaire
    player.inventory.splice(itemIndex, 1);
    await player.save();

    res.json({
      success: true,
      message: 'Item used successfully',
      data: {
        usedItem: item,
        remainingInventory: player.inventory
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error using item',
      error: error.message
    });
  }
});

// Complete a quest
app.post('/api/player/complete-quest/:questId', authMiddleware, async (req, res) => {
  try {
    const { questId } = req.params;


    //holdup do u even exist
    const player = await Player.findById(req.player.id);
    if (!player) {
      return res.status(404).json({
        success: false,
        message: 'Player not found'
      });
    }

    // does it even exist 
    const quest = await Quest.findById(questId);
    if (!quest) {
      return res.status(404).json({
        success: false,
        message: 'Quest not found'
      });
    }

    // Find our quest baby bro 
    const playerQuestIndex = player.quests.findIndex(
      q => q.questId.toString() === questId
    );

    if (playerQuestIndex === -1) {
      return res.status(400).json({
        success: false,
        message: 'Quest not accepted by player'
      });
    }

    const playerQuest = player.quests[playerQuestIndex];

    if (playerQuest.status !== 'in_progress') {
      return res.status(400).json({
        success: false,
        message: `Quest is already ${playerQuest.status}`,
        currentStatus: playerQuest.status
      });
    }


    player.quests[playerQuestIndex].status = 'completed';

    const experienceReward = quest.rewards?.experience || 0;
    player.experience += experienceReward;

    // 100 xp par level here
    const newLevel = Math.floor(player.experience / 100) + 1;
    const leveledUp = newLevel > player.level; // boolean here might use it later 
    player.level = newLevel;

    const itemRewards = [];
    if (quest.rewards?.item) {
      player.inventory.push(quest.rewards.item);
      itemRewards.push(quest.rewards.item);
    }

    await player.save();

    // Repopuler les données pour la réponse
    await player.populate('inventory');
    await player.populate('quests.questId');

    res.json({
      success: true,
      message: 'Quest completed successfully',
      data: {
        quest: player.quests[playerQuestIndex],
        rewards: {
          experience: experienceReward,
          items: itemRewards
        },
        player: {
          level: player.level,
          experience: player.experience,
          leveledUp: leveledUp,
          inventory: player.inventory
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error completing quest',
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
