const express = require('express');
const { Quest } = require('../models');

const router = express.Router();

// Get all quests
router.get('/', async (req, res) => {
  try {
    const { 
      difficulty, 
      type, 
      status, 
      minReward, 
      maxReward,
      page = 1, 
      limit = 10 
    } = req.query;
    
    // Build query filters
    const filters = {};
    if (difficulty) filters.difficulty = difficulty;
    if (type) filters.type = type;
    if (status) filters.status = status;
    if (minReward || maxReward) {
      filters['rewards.experience'] = {};
      if (minReward) filters['rewards.experience'].$gte = parseInt(minReward);
      if (maxReward) filters['rewards.experience'].$lte = parseInt(maxReward);
    }

    // Pagination
    const skip = (page - 1) * limit;
    
    const quests = await Quest.find(filters)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ difficulty: 1, title: 1 });
    
    const total = await Quest.countDocuments(filters);
    
    res.json({
      success: true,
      count: quests.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
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
router.get('/:id', async (req, res) => {
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

// Create new quest
router.post('/', async (req, res) => {
  try {
    const quest = new Quest(req.body);
    await quest.save();
    res.status(201).json({
      success: true,
      message: 'Quest created successfully',
      data: quest
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
      message: 'Error creating quest',
      error: error.message
    });
  }
});

// Update quest by ID
router.put('/:id', async (req, res) => {
  try {
    const quest = await Quest.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!quest) {
      return res.status(404).json({
        success: false,
        message: 'Quest not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Quest updated successfully',
      data: quest
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
      message: 'Error updating quest',
      error: error.message
    });
  }
});

// Delete quest by ID
router.delete('/:id', async (req, res) => {
  try {
    const quest = await Quest.findByIdAndDelete(req.params.id);
    
    if (!quest) {
      return res.status(404).json({
        success: false,
        message: 'Quest not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Quest deleted successfully',
      data: quest
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting quest',
      error: error.message
    });
  }
});

// Get quests by difficulty
router.get('/difficulty/:difficulty', async (req, res) => {
  try {
    const { difficulty } = req.params;
    const validDifficulties = ['easy', 'medium', 'hard', 'legendary'];
    
    if (!validDifficulties.includes(difficulty.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid difficulty. Valid values are: easy, medium, hard, legendary'
      });
    }
    
    const quests = await Quest.find({ difficulty: difficulty.toLowerCase() })
      .sort({ title: 1 });
    
    res.json({
      success: true,
      count: quests.length,
      difficulty,
      data: quests
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving quests by difficulty',
      error: error.message
    });
  }
});

// Get quests by type
router.get('/type/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const validTypes = ['main', 'side', 'daily', 'event'];
    
    if (!validTypes.includes(type.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid quest type. Valid values are: main, side, daily, event'
      });
    }
    
    const quests = await Quest.find({ type: type.toLowerCase() })
      .sort({ difficulty: 1, title: 1 });
    
    res.json({
      success: true,
      count: quests.length,
      type,
      data: quests
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving quests by type',
      error: error.message
    });
  }
});

// Get available quests (not completed)
router.get('/status/available', async (req, res) => {
  try {
    const quests = await Quest.find({ 
      status: { $in: ['available', 'in-progress'] } 
    }).sort({ difficulty: 1, title: 1 });
    
    res.json({
      success: true,
      count: quests.length,
      data: quests
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving available quests',
      error: error.message
    });
  }
});

module.exports = router;