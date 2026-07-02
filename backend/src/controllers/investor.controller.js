const investorService = require('../services/investor.service');
const { asyncHandler } = require('../utils/asyncHandler');

const getAll = asyncHandler(async (_req, res) => {
  try {
    const investors = await investorService.getAllInvestors();
    if (!investors || !Array.isArray(investors)) {
      return res.status(500).json({ error: 'Invalid investors data returned from service' });
    }
    res.status(200).json(investors);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = { getAll };
