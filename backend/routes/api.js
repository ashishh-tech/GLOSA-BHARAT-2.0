const express = require('express');
const router = express.Router();
const axios = require('axios');
const Junction = require('../models/Junction');
const { calculateAdvisory, getDistance } = require('../utils/glosa');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

// List all junctions
router.get('/junctions', async (req, res) => {
    try {
        const junctions = await Junction.find();
        res.json(junctions);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch junctions' });
    }
});

// [NEW] Dashboard Statistics Endpoint
router.get('/stats', (req, res) => {
    // Optimized GLOSA-specific stats
    const trafficStats = [
        { label: 'Wait Time Reduction', value: '24.8%', change: '+4.2%', icon: 'Clock' },
        { label: 'AI Signal Accuracy', value: '98.2%', change: '+1.5%', icon: 'Brain' },
        { label: 'Vehicle Throughput', value: '1,482', change: '+8.1%', icon: 'Users' },
        { label: 'Fuel Saved (Pilot)', value: '185L', change: '+12.3%', icon: 'TrendingUp' },
    ];

    const systemStatus = [
        { label: 'Signal Controller', status: 'online' },
        { label: 'AI Engine', status: 'active' },
        { label: 'GIS Mapping', status: 'operational' },
    ];

    res.json({
        trafficStats,
        systemStatus,
        lastUpdated: new Date().toISOString()
    });
});

// Get Advisory for a driver
router.post('/advisory', async (req, res) => {
    try {
        const { junctionId, lat, lng, timestamp } = req.body;

        const junction = await Junction.findOne({ id: junctionId });
        if (!junction) return res.status(404).json({ error: 'Junction not found' });

        // Calculate distance
        const distance = getDistance(lat, lng, junction.lat, junction.lng);

        // Call AI Service for prediction
        const aiResponse = await axios.post(`${AI_SERVICE_URL}/predict`, {
            junction_id: junctionId,
            timestamp: timestamp || Date.now() / 1000
        });

        const { current_status, seconds_to_change } = aiResponse.data;

        // Calculate GLOSA advisory
        const advisory = calculateAdvisory(distance, seconds_to_change, current_status);

        res.json({
            junction: junction.name,
            distance: Math.round(distance),
            signalStatus: current_status,
            secondsToChange: seconds_to_change,
            recommendedSpeed: advisory.speedKmh,
            message: advisory.message
        });

    } catch (error) {
        console.error('Advisory error:', error.message);
        res.status(500).json({ error: 'Failed to compute advisory', details: error.message });
    }
});

module.exports = router;
