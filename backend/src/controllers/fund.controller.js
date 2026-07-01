const fundService = require('../services/fund.service');
const { asyncHandler } = require('../utils/asyncHandler');

const getAll = asyncHandler(async (_req, res) => {
  try {
    const funds = await fundService.getAllFunds();
    if (!funds || !Array.isArray(funds)) {
      return res.status(500).json({ error: 'Invalid funds data returned from service' });
    }
    res.status(200).json(funds);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = { getAll };
