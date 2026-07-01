const systemUserService = require('../services/systemUser.service');
const { asyncHandler, handleServiceError } = require('../utils/asyncHandler');

const getAll = asyncHandler(async (_req, res) => {
  try {
    const users = await systemUserService.getAllSystemUsers();
    if (!users || !Array.isArray(users)) {
      return res.status(500).json({ error: 'Invalid system users data returned from service' });
    }
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const create = asyncHandler(async (req, res) => {
  try {
    const result = await systemUserService.createSystemUser(req.body);
    res.status(201).json(result);
  } catch (err) {
    handleServiceError(res, err, 'User provisioning failed.');
  }
});

module.exports = { getAll, create };
