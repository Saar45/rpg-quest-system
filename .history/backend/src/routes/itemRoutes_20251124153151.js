const express = require('express');
const { Item } = require('../models');

const router = express.Router();

// Get all items
router.get('/', async (req, res) => {
  try {
    const { type, rarity, minValue, maxValue, page = 1, limit = 10 } = req.query;
    
    // Build query filters
    const filters = {};
    if (type) filters.type = type;
    if (rarity) filters.rarity = rarity;
    if (minValue || maxValue) {
      filters.value = {};
      if (minValue) filters.value.$gte = parseInt(minValue);
      if (maxValue) filters.value.$lte = parseInt(maxValue);
    }

    // Pagination
    const skip = (page - 1) * limit;
    
    const items = await Item.find(filters)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ name: 1 });
    
    const total = await Item.countDocuments(filters);
    
    res.json({
      success: true,
      count: items.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
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
router.get('/:id', async (req, res) => {
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

// Create new item
router.post('/', async (req, res) => {
  try {
    const item = new Item(req.body);
    await item.save();
    res.status(201).json({
      success: true,
      message: 'Item created successfully',
      data: item
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
      message: 'Error creating item',
      error: error.message
    });
  }
});

// Update item by ID
router.put('/:id', async (req, res) => {
  try {
    const item = await Item.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Item updated successfully',
      data: item
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
      message: 'Error updating item',
      error: error.message
    });
  }
});

// Delete item by ID
router.delete('/:id', async (req, res) => {
  try {
    const item = await Item.findByIdAndDelete(req.params.id);
    
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Item deleted successfully',
      data: item
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting item',
      error: error.message
    });
  }
});

// Get items by type
router.get('/type/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const items = await Item.find({ type }).sort({ name: 1 });
    
    res.json({
      success: true,
      count: items.length,
      type,
      data: items
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving items by type',
      error: error.message
    });
  }
});

// Get items by rarity
router.get('/rarity/:rarity', async (req, res) => {
  try {
    const { rarity } = req.params;
    const items = await Item.find({ rarity }).sort({ value: -1 });
    
    res.json({
      success: true,
      count: items.length,
      rarity,
      data: items
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving items by rarity',
      error: error.message
    });
  }
});

module.exports = router;