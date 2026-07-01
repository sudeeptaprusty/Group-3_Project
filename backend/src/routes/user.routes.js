// Import the Express framework module
const express = require('express');
// Import the system user management controller (analysts, officers)
const systemUserController = require('../controllers/systemUser.controller');

// Initialize the Express router instance
const router = express.Router();

// GET /api/users/system - Retrieves internal staff account directories
router.get('/system', systemUserController.getAll);
// POST /api/users/system - Registers a new internal system staff user account
router.post('/system', systemUserController.create);

// Export the system users router module
module.exports = router;
