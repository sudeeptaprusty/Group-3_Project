// Import the database repository that queries the main transactions ledger table
const transactionRepo = require('../repositories/transaction.repository');

// Retrieves all transactions (purchases, redemptions, switches) registered in the system
async function getAllTransactions() {
  // Execute database repository method and return the result list
  return transactionRepo.findAll();
}

// Export the transaction service module functions
module.exports = { getAllTransactions };
