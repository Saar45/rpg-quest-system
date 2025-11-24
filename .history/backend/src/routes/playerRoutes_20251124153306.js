const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Player, Quest, Item } = require('../models');

const router = express.Router();

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access token required'
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }
    req.user = user;
    next();
  });
};

// Register new player
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if user already exists
    const existingPlayer = await Player.findOne({ 
      $or: [{ email }, { username }] 
    });

    if (existingPlayer) {
      return res.status(400).json({
        success: false,
        message: 'Player with this email or username already exists'
      });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new player
    const player = new Player({
      username,
      email,
      password: hashedPassword,
      stats: {
        level: 1,
        experience: 0,
        health: 100,
        mana: 50,
        strength: 10,
        intelligence: 10,
        agility: 10
      }
    });

    await player.save();

    // Generate JWT token
    const token = jwt.sign(
      { playerId: player._id, username: player.username },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Remove password from response
    const playerResponse = player.toObject();
    delete playerResponse.password;

    res.status(201).json({
      success: true,
      message: 'Player registered successfully',
      data: {
        player: playerResponse,
        token
      }
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error registering player',
      error: error.message
    });
  }
});

// Login player
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find player by email
    const player = await Player.findOne({ email });
    if (!player) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, player.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Update last login
    player.lastLogin = new Date();
    await player.save();

    // Generate JWT token
    const token = jwt.sign(
      { playerId: player._id, username: player.username },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Remove password from response
    const playerResponse = player.toObject();
    delete playerResponse.password;

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        player: playerResponse,
        token
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error during login',
      error: error.message
    });
  }
});

// Get player profile (protected route)
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const player = await Player.findById(req.user.playerId)
      .populate('inventory.item')
      .populate('activeQuests')
      .populate('completedQuests')
      .select('-password');

    if (!player) {
      return res.status(404).json({
        success: false,
        message: 'Player not found'
      });
    }

    res.json({
      success: true,
      data: player
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving player profile',
      error: error.message
    });
  }
});

// Update player profile (protected route)
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const allowedUpdates = ['username', 'email'];
    const updates = {};
    
    // Only allow certain fields to be updated
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const player = await Player.findByIdAndUpdate(
      req.user.playerId,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    if (!player) {
      return res.status(404).json({
        success: false,
        message: 'Player not found'
      });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: player
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error updating profile',
      error: error.message
    });
  }
});

// Get player inventory (protected route)
router.get('/inventory', authenticateToken, async (req, res) => {
  try {
    const player = await Player.findById(req.user.playerId)
      .populate('inventory.item')
      .select('inventory');

    if (!player) {
      return res.status(404).json({
        success: false,
        message: 'Player not found'
      });
    }

    res.json({
      success: true,
      data: player.inventory
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving inventory',
      error: error.message
    });
  }
});

// Add item to inventory (protected route)
router.post('/inventory/add/:itemId', authenticateToken, async (req, res) => {
  try {
    const { itemId } = req.params;
    const { quantity = 1 } = req.body;

    const item = await Item.findById(itemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    const player = await Player.findById(req.user.playerId);
    if (!player) {
      return res.status(404).json({
        success: false,
        message: 'Player not found'
      });
    }

    // Check if item already exists in inventory
    const existingItemIndex = player.inventory.findIndex(
      invItem => invItem.item.toString() === itemId
    );

    if (existingItemIndex !== -1) {
      // Update quantity
      player.inventory[existingItemIndex].quantity += quantity;
    } else {
      // Add new item
      player.inventory.push({ item: itemId, quantity });
    }

    await player.save();

    // Populate the inventory for response
    await player.populate('inventory.item');

    res.json({
      success: true,
      message: 'Item added to inventory',
      data: player.inventory
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error adding item to inventory',
      error: error.message
    });
  }
});

// Remove item from inventory (protected route)
router.delete('/inventory/remove/:itemId', authenticateToken, async (req, res) => {
  try {
    const { itemId } = req.params;
    const { quantity = 1 } = req.body;

    const player = await Player.findById(req.user.playerId);
    if (!player) {
      return res.status(404).json({
        success: false,
        message: 'Player not found'
      });
    }

    const itemIndex = player.inventory.findIndex(
      invItem => invItem.item.toString() === itemId
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Item not found in inventory'
      });
    }

    // Reduce quantity or remove item
    if (player.inventory[itemIndex].quantity > quantity) {
      player.inventory[itemIndex].quantity -= quantity;
    } else {
      player.inventory.splice(itemIndex, 1);
    }

    await player.save();
    await player.populate('inventory.item');

    res.json({
      success: true,
      message: 'Item removed from inventory',
      data: player.inventory
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error removing item from inventory',
      error: error.message
    });
  }
});

// Start quest (protected route)
router.post('/quests/start/:questId', authenticateToken, async (req, res) => {
  try {
    const { questId } = req.params;

    const quest = await Quest.findById(questId);
    if (!quest) {
      return res.status(404).json({
        success: false,
        message: 'Quest not found'
      });
    }

    const player = await Player.findById(req.user.playerId);
    if (!player) {
      return res.status(404).json({
        success: false,
        message: 'Player not found'
      });
    }

    // Check if quest is already active or completed
    const isActiveQuest = player.activeQuests.includes(questId);
    const isCompletedQuest = player.completedQuests.includes(questId);

    if (isActiveQuest) {
      return res.status(400).json({
        success: false,
        message: 'Quest is already active'
      });
    }

    if (isCompletedQuest) {
      return res.status(400).json({
        success: false,
        message: 'Quest is already completed'
      });
    }

    // Add quest to active quests
    player.activeQuests.push(questId);
    await player.save();

    res.json({
      success: true,
      message: 'Quest started successfully',
      data: { questId, questTitle: quest.title }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error starting quest',
      error: error.message
    });
  }
});

// Complete quest (protected route)
router.post('/quests/complete/:questId', authenticateToken, async (req, res) => {
  try {
    const { questId } = req.params;

    const quest = await Quest.findById(questId);
    if (!quest) {
      return res.status(404).json({
        success: false,
        message: 'Quest not found'
      });
    }

    const player = await Player.findById(req.user.playerId);
    if (!player) {
      return res.status(404).json({
        success: false,
        message: 'Player not found'
      });
    }

    // Check if quest is active
    const activeQuestIndex = player.activeQuests.indexOf(questId);
    if (activeQuestIndex === -1) {
      return res.status(400).json({
        success: false,
        message: 'Quest is not active'
      });
    }

    // Remove from active quests and add to completed
    player.activeQuests.splice(activeQuestIndex, 1);
    player.completedQuests.push(questId);

    // Award rewards
    player.stats.experience += quest.rewards.experience;
    
    // Level up check
    const experienceForNextLevel = player.stats.level * 100;
    if (player.stats.experience >= experienceForNextLevel) {
      player.stats.level += 1;
      player.stats.experience -= experienceForNextLevel;
      // Increase stats on level up
      player.stats.health += 10;
      player.stats.mana += 5;
      player.stats.strength += 1;
      player.stats.intelligence += 1;
      player.stats.agility += 1;
    }

    // Add reward items to inventory
    if (quest.rewards.items && quest.rewards.items.length > 0) {
      for (const rewardItem of quest.rewards.items) {
        const existingItemIndex = player.inventory.findIndex(
          invItem => invItem.item.toString() === rewardItem.toString()
        );
        
        if (existingItemIndex !== -1) {
          player.inventory[existingItemIndex].quantity += 1;
        } else {
          player.inventory.push({ item: rewardItem, quantity: 1 });
        }
      }
    }

    await player.save();

    res.json({
      success: true,
      message: 'Quest completed successfully',
      data: {
        questCompleted: quest.title,
        experienceGained: quest.rewards.experience,
        currentLevel: player.stats.level,
        currentExperience: player.stats.experience
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

// Get player's active quests (protected route)
router.get('/quests/active', authenticateToken, async (req, res) => {
  try {
    const player = await Player.findById(req.user.playerId)
      .populate('activeQuests')
      .select('activeQuests');

    if (!player) {
      return res.status(404).json({
        success: false,
        message: 'Player not found'
      });
    }

    res.json({
      success: true,
      count: player.activeQuests.length,
      data: player.activeQuests
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving active quests',
      error: error.message
    });
  }
});

// Get player's completed quests (protected route)
router.get('/quests/completed', authenticateToken, async (req, res) => {
  try {
    const player = await Player.findById(req.user.playerId)
      .populate('completedQuests')
      .select('completedQuests');

    if (!player) {
      return res.status(404).json({
        success: false,
        message: 'Player not found'
      });
    }

    res.json({
      success: true,
      count: player.completedQuests.length,
      data: player.completedQuests
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving completed quests',
      error: error.message
    });
  }
});

module.exports = router;