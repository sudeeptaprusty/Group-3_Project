// Import the database repository that queries the mutual fund schemes table
const fundRepo = require('../repositories/fund.repository');

// Retrieves all active mutual fund schemes in the directory
async function getAllFunds() {
  // Execute database query to retrieve all active schemes and return the list
  return fundRepo.findAllActive();
}

// Export the fund service module functions
module.exports = { getAllFunds };
