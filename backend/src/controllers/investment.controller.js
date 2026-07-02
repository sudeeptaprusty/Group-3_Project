const investmentService = require('../services/investment.service');
const { asyncHandler, handleServiceError } = require('../utils/asyncHandler');

const create = asyncHandler(async (req, res) => {
  try {
    const result = await investmentService.createInvestment(req.body);
    res.status(201).json(result);
  } catch (err) {
    handleServiceError(res, err, 'Investment placement failed.');
  }
});

module.exports = { create };
