const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const apiRoutes = require('./routes/api');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/glosa-bharat';
mongoose.connect(MONGODB_URI)
    .then(() => console.log('✅ Connected to MongoDB (Localhost:27017)'))
    .catch(err => console.error('❌ MongoDB Connection Error:', err));

app.use(cors());
app.use(express.json());

// Main API Route
app.use('/api', apiRoutes);

app.get('/', (req, res) => {
    res.json({ message: 'GLOSA-Bharat Backend is running' });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
