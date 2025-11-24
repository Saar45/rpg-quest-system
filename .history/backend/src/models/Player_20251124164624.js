const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const playerSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    quests: [{ questId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quest' }, status: { type: String, enum: ['available', 'in_progress', 'completed'], default: 'available' } }],
    level: { type: Number, default: 1 },
    experience: { type: Number, default: 0 },
    inventory: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Item' }],
});
playerSchema.pre('save', async function () {
    if (!this.isModified('password')) {
        return;
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});
playerSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};
const Player = mongoose.model('Player', playerSchema);

module.exports = Player;