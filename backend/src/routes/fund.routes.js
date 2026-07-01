// Import the Express framework module
const express = require('express');
// Import the mutual fund scheme directory controller
const fundController = require('../controllers/fund.controller');

// Initialize the Express router instance
const router = express.Router();

// GET /api/funds/ - Retrieves all active mutual fund schemes in the catalog
router.get('/', fundController.getAll);

// Export the fund router module
module.exports = router;
