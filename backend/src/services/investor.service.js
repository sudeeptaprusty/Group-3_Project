// Import the database repository that queries core investor profiles and statistics
const userRepo = require('../repositories/user.repository');

// Retrieves all registered investors along with their AUM, SIP, and transaction stats
async function getAllInvestors() {
  // Execute database repository method and return the result list
  return userRepo.findInvestorsWithStats();
}

// Export the investor service module functions
module.exports = { getAllInvestors };
