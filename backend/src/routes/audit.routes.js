// Import the Express framework module
const express = require('express');
// Import the audit logs controller handling log access
const auditController = require('../controllers/audit.controller');

// Initialize the Express router instance
const router = express.Router();

// GET /api/audit-logs/ - Returns list of all system and user action audit logs
router.get('/', auditController.getAll);

// Export the audit logs router module
module.exports = router;
