// Import the database query coordinator function
const { dbQuery } = require('../config/db');

// Inserts a new transaction record (purchase, redemption, switch) in the transactions ledger
async function create({ id, userId, investmentId, fundId, fundName, transactionType, amount, nav, units, stampDuty }) {
  return dbQuery.run(`
    INSERT INTO transactions (id, user_id, investment_id, fund_id, fund_name, transaction_type, amount, nav_applied, units, stamp_duty, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PAYMENT_RECEIVED')
  `, [id, userId, investmentId, fundId, fundName, transactionType, amount, nav, units, stampDuty]);
}

// Marks a pending transaction as settled and stores the settlement timestamp
async function settle(id) {
  return dbQuery.run(
    'UPDATE transactions SET status = "SETTLED", settled_at = CURRENT_TIMESTAMP WHERE id = ?',
    [id]
  );
}

// Retrieves all transactions ordered newest first, joined with funds to include category
async function findAll() {
  return dbQuery.all(`
    SELECT t.*, f.category
    FROM transactions t
    LEFT JOIN funds f ON t.fund_id = f.id
    ORDER BY t.created_at DESC
  `);
}

// Export the transaction repository queries
module.exports = { create, settle, findAll };
