const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const apiRoutes = require('./routes/api');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

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
