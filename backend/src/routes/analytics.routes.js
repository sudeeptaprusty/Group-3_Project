// Import the Express framework module
const express = require('express');
// Import the analytics controller handling client churn predictions
const analyticsController = require('../controllers/analytics.controller');

// Initialize the Express router instance
const router = express.Router();

// GET /api/analytics/churn-prediction - Returns churn risk predictions for all investors
router.get('/churn-prediction', analyticsController.getChurnPredictions);
// POST /api/analytics/outreach - Triggers proactive remarketing/retention campaigns
router.post('/outreach', analyticsController.triggerOutreach);

// Export the analytics router module
module.exports = router;
