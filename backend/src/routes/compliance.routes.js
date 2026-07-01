// Import the Express framework module
const express = require('express');
// Import the compliance controller handling AML triggers and overrides
const complianceController = require('../controllers/compliance.controller');

// Initialize the Express router instance
const router = express.Router();

// GET /api/compliance/alerts - Retrieves all compliance and AML alerts
router.get('/alerts', complianceController.getAlerts);
// POST /api/compliance/resolve - Handles alert resolutions and notes logging
router.post('/resolve', complianceController.resolve);

// Export the compliance router module
module.exports = router;
