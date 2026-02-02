const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true }, // Simple string for now as per user's "no extra login possible" likely meaning simple
    lastLat: { type: Number },
    lastLng: { type: Number },
    lastLogin: { type: Date, default: Date.now },
    role: { type: String, default: 'operator' }
});

module.exports = mongoose.model('User', userSchema);
