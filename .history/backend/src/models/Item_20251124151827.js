const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    type: { 
        type: String, 
        enum: ['weapon', 'armor', 'potion', 'quest_item'], 
        default: 'quest_item' },
    effect: { 
        type: String, required: true },
    value: { type: Number, default: 0 },
});

const Item = mongoose.model('Item', itemSchema);

module.exports = Item;