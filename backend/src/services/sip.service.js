// Import the database repository that queries active SIP schedules
const sipRepo = require('../repositories/sip.repository');
// Import the audit logger utility function to record compliance actions
const { logAuditAction } = require('../utils/auditLogger');

// Retrieves all active/paused/cancelled SIP schedules in the directory
async function getAllSchedules() {
  // Execute database query and return lists
  return sipRepo.findAll();
}

// Manages status transitions (pause, resume, cancel) on active mandates
async function manageSchedule(id, action) {
  // Validate that the action parameter is provided
  if (!action) {
    const error = new Error('Missing action parameter.');
    error.statusCode = 400;
    throw error;
  }

  // Retrieve the target SIP schedule record from database
  const sip = await sipRepo.findById(id);
  // Throw error if the schedule does not exist
  if (!sip) {
    const error = new Error('SIP Mandate not found.');
    error.statusCode = 404;
    throw error;
  }

  // Map user actions to database status constraints
  const statusMap = { PAUSE: 'PAUSED', RESUME: 'ACTIVE', CANCEL: 'CANCELLED' };
  const targetStatus = statusMap[action];
  if (!targetStatus) {
    const error = new Error('Invalid action parameter.');
    error.statusCode = 400;
    throw error;
  }

  // Update the SIP schedule status columns in database
  await sipRepo.updateStatus(id, targetStatus);

  // Record status changes to global audit logs
  await logAuditAction('USER', 'Fund Manager', 'sip_schedules', id, 'UPDATE', {
    message: `SIP mandate for ${sip.fund_name} has been ${action.toLowerCase()}d.`,
  });

  return { status: 'success' };
}

// Triggers automated wealth retention rollover for matured schedules
async function rolloverSchedule({ investorName, fundName, amount, date }) {
  // Validate that all required parameters are provided
  if (!investorName || !fundName || !amount || !date) {
    const error = new Error('Missing rollover parameters.');
    error.statusCode = 400;
    throw error;
  }

  // Import the ID generator utility inline
  const { generateId } = require('../utils/idGenerator');
  const scheduleId = generateId('sip-s');

  // Format next debit cycle dates
  const nextDebit = `2026-07-${date < 10 ? '0' + date : date}`;

  // Insert a rolled over SIP mandate record in database
  await sipRepo.create({
    id: scheduleId,
    investorName,
    fundName,
    amount: parseFloat(amount),
    sipDate: parseInt(date),
    nextDebit,
  });

  // Log compliance/seeding details to system logs
  await logAuditAction('SYSTEM', 'Compliance Officer', 'sip_schedules', scheduleId, 'CREATE', {
    message: `SIP Matured Rollover: Automated wealth retention rollover of ₹${parseFloat(amount).toLocaleString()} SIP registered for ${investorName} in ${fundName}.`,
  });

  // Return the newly created rollover schedule structure
  return { 
    id: scheduleId, 
    investor_name: investorName, 
    fund_name: fundName, 
    amount: parseFloat(amount), 
    date: parseInt(date), 
    status: 'ACTIVE', 
    next_debit: nextDebit 
  };
}

// Export the SIP services
module.exports = { getAllSchedules, manageSchedule, rolloverSchedule };
