const sipService = require('../services/sip.service');
const { asyncHandler, handleServiceError } = require('../utils/asyncHandler');

const getAll = asyncHandler(async (_req, res) => {
  try {
    const sips = await sipService.getAllSchedules();
    if (!sips || !Array.isArray(sips)) {
      return res.status(500).json({ error: 'Invalid SIP data returned from service' });
    }
    res.status(200).json(sips);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const manage = asyncHandler(async (req, res) => {
  try {
    const result = await sipService.manageSchedule(req.params.id, req.body.action);
    res.status(200).json(result);
  } catch (err) {
    handleServiceError(res, err, 'SIP management failed.');
  }
});

const rollover = asyncHandler(async (req, res) => {
  try {
    const result = await sipService.rolloverSchedule(req.body);
    res.status(200).json(result);
  } catch (err) {
    handleServiceError(res, err, 'SIP rollover failed.');
  }
});

module.exports = { getAll, manage, rollover };
