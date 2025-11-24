const mongoose = require('mongoose');

const questSchema = new mongoose.Schema({
    title: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    level: { type: Number, default: 1 },

    status: {
        type: String,
        enum: ['available', 'in_progress', 'completed'],
        default: 'available'
    },

    rewards: {
        experience: { type: Number, default: 100 },
        item: { type: mongoose.Schema.Types.ObjectId, ref: 'Item' }
    }
}, { timestamps: true }); 
const Quest = mongoose.model('Quest', questSchema);
module.exports = Quest;