// Import the Express framework module
const express = require('express');
// Import the system settings controller
const settingsController = require('../controllers/settings.controller');

// Initialize the Express router instance
const router = express.Router();

// POST /api/settings/ai-threshold - Updates the global transaction suspicious trigger value
router.post('/ai-threshold', settingsController.updateAiThreshold);
// GET /api/settings/ai-threshold - Returns the current trigger threshold setting
router.get('/ai-threshold', settingsController.getAiThreshold);
// POST /api/settings/reset - Wipes SQLite/PG databases and runs initial seed scripts again
router.post('/reset', settingsController.reset);

// Export the settings router module
module.exports = router;
