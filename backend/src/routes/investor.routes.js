// Import the Express framework module
const express = require('express');
// Import the investor directory and statistics controller
const investorController = require('../controllers/investor.controller');

// Initialize the Express router instance
const router = express.Router();

// GET /api/investors/ - Retrieves all registered investor accounts with statistics
router.get('/', investorController.getAll);

// Export the investor router module
module.exports = router;
