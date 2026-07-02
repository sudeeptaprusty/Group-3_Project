// Import the database query coordinator function
const { dbQuery } = require('../config/db');

// Inserts a structured customer investment row in the database
async function create({ id, userId, fundId, fundName, type, amount, frequency, sipDate }) {
  return dbQuery.run(`
    INSERT INTO investments (id, user_id, fund_id, fund_name, investment_type, amount, frequency, sip_date, mandate_status, start_date, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, date(CURRENT_TIMESTAMP), 'ACTIVE')
  `, [id, userId, fundId, fundName, type, amount, frequency, sipDate, type === 'SIP' ? 'ACTIVE' : null]);
}

// Allots additional units and recalculates value when transactions settle
async function addUnits(investmentId, allocatedUnits, nav) {
  // Update unit totals and compute current valuation of assets based on nav
  return dbQuery.run(`
    UPDATE investments 
    SET total_units = total_units + ?, current_value = (total_units + ?) * ?
    WHERE id = ?
  `, [allocatedUnits, allocatedUnits, nav, investmentId]);
}

// Export the investment repository queries
module.exports = { create, addUnits };
