// Import the Express framework module
const express = require('express');
// Import the customer investments setup controller
const investmentController = require('../controllers/investment.controller');

// Initialize the Express router instance
const router = express.Router();

// POST /api/investments/ - Initiates a new investment schedule (SIP or purchase)
router.post('/', investmentController.create);

// Export the investment router module
module.exports = router;
