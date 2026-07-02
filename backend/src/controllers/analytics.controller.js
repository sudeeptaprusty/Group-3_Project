// Import the analytics services module
const analyticsService = require('../services/analytics.service');
// Import Express route handlers error wrapper utilities
const { asyncHandler, handleServiceError } = require('../utils/asyncHandler');

// GET handler to retrieve list of all client churn predictions
const getChurnPredictions = asyncHandler(async (_req, res) => {
  try {
    // Fetch prediction structures from services layer
    const predictions = await analyticsService.getChurnPredictions();
    // Ensure predictions is an array
    if (!predictions || !Array.isArray(predictions)) {
      return res.status(500).json({ error: 'Invalid churn predictions data returned from service' });
    }
    // Return prediction response array with status 200 OK
    res.status(200).json(predictions);
  } catch (err) {
    // Return status 500 error response if execution fails
    res.status(500).json({ error: err.message });
  }
});

// POST handler to trigger outreach notifications for high risk users
const triggerOutreach = asyncHandler(async (req, res) => {
  try {
    // Forward the investor ID parameter to the outreach engine service
    const result = await analyticsService.triggerOutreach(req.body.userId);
    // Return successful dispatch payload response
    res.status(200).json(result);
  } catch (err) {
    // Handle error formatting
    handleServiceError(res, err, 'Outreach failed.');
  }
});

// Export the analytics controller handler endpoints
module.exports = { getChurnPredictions, triggerOutreach };
