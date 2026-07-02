// Import the Express framework module
const express = require('express');
// Import the active SIP mandate schedules controller
const sipController = require('../controllers/sip.controller');

// Initialize the Express router instance
const router = express.Router();

// GET /api/sip-schedules/ - Retrieves all registered SIP schedules
router.get('/', sipController.getAll);
// POST /api/sip-schedules/rollover - Triggers automated wealth rollover for matured mandates
router.post('/rollover', sipController.rollover);
// POST /api/sip-schedules/:id/manage - Pauses, resumes, or cancels an active SIP schedule
router.post('/:id/manage', sipController.manage);

// Export the SIP schedules router module
module.exports = router;
