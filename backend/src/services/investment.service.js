// Import the database repository that queries core user profiles
const userRepo = require('../repositories/user.repository');
// Import the database repository that queries mutual fund schemes
const fundRepo = require('../repositories/fund.repository');
// Import the database repository that queries investment records
const investmentRepo = require('../repositories/investment.repository');
// Import the database repository that queries transaction ledger records
const transactionRepo = require('../repositories/transaction.repository');
// Import the database repository that queries active SIP schedules
const sipRepo = require('../repositories/sip.repository');
// Import the database repository that queries compliance alerts
const complianceRepo = require('../repositories/compliance.repository');
// Import the audit logger utility function to record system and user actions
const { logAuditAction } = require('../utils/auditLogger');
// Import the unique ID generator utility
const { generateId } = require('../utils/idGenerator');

// Creates a new investment schedule (SIP or Lump-Sum)
async function createInvestment({ userId, fundId, type, amount, frequency, sipDate }) {
  // Validate that all required investment parameters are provided
  if (!userId || !fundId || !amount) {
    const error = new Error('Missing investment setup parameters.');
    error.statusCode = 400;
    throw error;
  }

  // Retrieve user and mutual fund schema objects from the database
  const user = await userRepo.findById(userId);
  const fund = await fundRepo.findById(fundId);
  // Throw error if user or fund cannot be located
  if (!user || !fund) {
    const error = new Error('User or Mutual Fund not found.');
    error.statusCode = 404;
    throw error;
  }

  // Verify that the user account is active before allowing trades
  if (user.status !== 'ACTIVE') {
    const error = new Error('Compliance Block: Trading privileges locked.');
    error.statusCode = 403;
    throw error;
  }

  // Generate a unique identifier for the investment record
  const investmentId = generateId('inv_');

  // Insert investment record into database
  await investmentRepo.create({
    id: investmentId,
    userId,
    fundId,
    fundName: fund.fund_name,
    type,
    amount,
    frequency,
    sipDate,
  });

  // Log investment setup success inside audit logs
  await logAuditAction('USER', user.full_name, 'investments', investmentId, 'CREATE', {
    message: `Setup completed: ${type} order structured for ${fund.fund_name} (₹${parseFloat(amount).toLocaleString()}).`,
  });

  // If this investment is a recurring SIP, record a mandate schedule in the database
  if (type === 'SIP') {
    const scheduleId = generateId('sip-s');
    await sipRepo.create({
      id: scheduleId,
      investorName: user.full_name,
      fundName: fund.fund_name,
      amount,
      sipDate,
      nextDebit: `2026-07-0${sipDate}`,
    });
  }

  // Generate unique transaction reference and compute NAV allocations and stamp duty values
  const txnId = generateId('txn_');
  const nav = fund.current_nav;
  const stampDuty = parseFloat((amount * 0.00005).toFixed(2));
  const netInvestable = amount - stampDuty;
  const allocatedUnits = parseFloat((netInvestable / nav).toFixed(4));

  // Insert pending transaction record into database
  await transactionRepo.create({
    id: txnId,
    userId,
    investmentId,
    fundId,
    fundName: fund.fund_name,
    transactionType: type === 'SIP' ? 'SIP_AUTO' : 'PURCHASE',
    amount,
    nav,
    units: allocatedUnits,
    stampDuty,
  });

  // Log payment authorization action to system audit logs
  await logAuditAction('SYSTEM', 'PAYMENT_GATEWAY', 'transactions', txnId, 'CREATE', {
    message: `Transaction payment authorized: ₹${parseFloat(amount).toLocaleString()} received. Settlement queued.`,
  });

  // Trigger async background queue to settle transaction and allot units
  scheduleSettlement({ txnId, investmentId, allocatedUnits, nav, amount, userId, user });

  return { investment_id: investmentId, status: 'success' };
}

// Background scheduler simulating settlement delay (1.5 seconds)
function scheduleSettlement({ txnId, investmentId, allocatedUnits, nav, amount, userId, user }) {
  setTimeout(async () => {
    try {
      // Set transaction status to settled in database
      await transactionRepo.settle(txnId);
      // Allot mutual fund units to the investor's balance
      await investmentRepo.addUnits(investmentId, allocatedUnits, nav);

      // Log unit allotment success inside system audit logs
      await logAuditAction('SYSTEM', 'SETTLEMENT_ENGINE', 'transactions', txnId, 'UPDATE', {
        message: `Units allocation completed. Allotted ${allocatedUnits} units at NAV ₹${nav}.`,
      });

      // If the investment is high-value (>= ₹10 Lakhs), register compliance audit alert
      if (amount >= 1000000) {
        const alertId = generateId('alt_');
        await complianceRepo.create({
          id: alertId,
          complianceCheckId: 'chk_high_val',
          userId,
          alertType: 'HIGH_VALUE_TXN',
          severity: 'HIGH',
          description: `High-value transaction warning triggered for Txn: ${txnId}. Value: ₹${parseFloat(amount).toLocaleString()} exceeds limits.`,
        });

        // Record AML alert creation in system audit logs
        await logAuditAction('AI_ENGINE', 'AML-WATCHDOG-V1', 'compliance_checks', alertId, 'CREATE', {
          message: '🚩 AML Alert: Transaction velocity threshold limit exceeded. Risk score set to 75.00%.',
        });
      }
    } catch (innerErr) {
      console.error('Settlement async thread failed:', innerErr.message);
    }
  }, 1500);
}

// Export the investment services
module.exports = { createInvestment };
