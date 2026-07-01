// Import the Express framework module
const express = require('express');
// Import the core transaction ledger query controller
const transactionController = require('../controllers/transaction.controller');

// Initialize the Express router instance
const router = express.Router();

// GET /api/transactions/ - Retrieves all registered transaction records
router.get('/', transactionController.getAll);

// Export the transactions router module
module.exports = router;
