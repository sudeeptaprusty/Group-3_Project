const settingsService = require('../services/settings.service');
const { asyncHandler, handleServiceError } = require('../utils/asyncHandler');

const updateAiThreshold = asyncHandler(async (req, res) => {
  try {
    const result = await settingsService.updateAiThreshold(req.body.threshold);
    res.status(200).json(result);
  } catch (err) {
    handleServiceError(res, err, 'Threshold update failed.');
  }
});

const getAiThreshold = asyncHandler(async (_req, res) => {
  res.status(200).json(settingsService.getAiThresholdSetting());
});

const reset = asyncHandler(async (_req, res) => {
  try {
    const result = await settingsService.resetDatabase();
    res.status(200).json(result);
  } catch (err) {
    console.error('Reset failed:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = { updateAiThreshold, getAiThreshold, reset };
