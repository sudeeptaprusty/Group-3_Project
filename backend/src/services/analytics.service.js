// Import the user repository database queries module
const userRepo = require('../repositories/user.repository');
// Import the transaction ledger repository queries module
const transactionRepo = require('../repositories/transaction.repository');
// Import the SIP mandate schedules repository queries module
const sipRepo = require('../repositories/sip.repository');
// Import the notifications/reminders repository module
const notificationRepo = require('../repositories/notification.repository');
// Import the audit logger utility function to record compliance actions
const { logAuditAction } = require('../utils/auditLogger');
// Import the unique ID generator utility
const { generateId } = require('../utils/idGenerator');
// Import the trained Random Forest Classifier model predictor
const { predictChurnProbability } = require('../utils/randomForest');

// Calculates a machine learning Random Forest probability score (5-95) for investor churn
function computeChurnScore(inv, userTxns, userSips) {
  // 1. Feature Extraction: Activity Recency (Days elapsed since last transaction)
  let recency = 365; // Default to 1 year if zero transactions exist
  if (userTxns.length > 0) {
    const lastTxn = userTxns.reduce((latest, t) => {
      const tDate = new Date(t.created_at || t.settled_at);
      return tDate > latest ? tDate : latest;
    }, new Date(0));
    recency = Math.floor((new Date() - lastTxn) / (1000 * 60 * 60 * 24));
  }

  // 2. Feature Extraction: Redemption Ratio (withdrawn capital relative to total investments)
  const redemptions = userTxns.filter((t) => t.transaction_type === 'REDEMPTION');
  const totalRedeemed = redemptions.reduce((sum, t) => sum + t.amount, 0);
  const totalInvested = userTxns.reduce((sum, t) => sum + t.amount, 0);
  const redemptionRatio = totalInvested > 0 ? parseFloat((totalRedeemed / totalInvested).toFixed(4)) : 0.0;

  // 3. Feature Extraction: SIP Mandate Status mapping
  // 0 = Active, 1 = None, 2 = Paused, 3 = Cancelled
  let sipStatus = 1;
  if (userSips.length > 0) {
    const hasCancelled = userSips.some((s) => s.status === 'CANCELLED');
    const hasPaused = userSips.some((s) => s.status === 'PAUSED');
    if (hasCancelled) sipStatus = 3;
    else if (hasPaused) sipStatus = 2;
    else sipStatus = 0;
  }

  // 4. Run Random Forest Ensemble Classifier Prediction (percentage of voting trees)
  const probability = predictChurnProbability([recency, redemptionRatio, sipStatus]);
  // Convert probability to score percentage capped between 5% and 95%
  const score = Math.min(95, Math.max(5, Math.floor(probability * 100)));

  // Identify the feature driver that triggered this risk classification
  let primaryDriver = 'Stagnant Portfolio';
  if (sipStatus === 3) primaryDriver = 'SIP Mandate Cancelled';
  else if (sipStatus === 2) primaryDriver = 'SIP Mandate Paused';
  else if (redemptionRatio > 0.5) primaryDriver = 'High Redemption Volume';
  else if (recency > 90) primaryDriver = 'Activity Recency > 90 Days';
  else if (recency > 60) primaryDriver = 'Activity Recency > 60 Days';

  // Determine categorical classification based on risk score thresholds
  let riskCategory = 'LOW';
  if (score > 60) riskCategory = 'HIGH';
  else if (score >= 30) riskCategory = 'MEDIUM';

  // Return prediction results payload
  return {
    userId: inv.id,
    fullName: inv.fullName,
    email: inv.email,
    phone: inv.phone,
    status: inv.status,
    aum: inv.aum,
    churnRisk: score,
    riskCategory,
    primaryDriver,
  };
}

// Queries database, groups histories, and builds churn risk reports for all investors
async function getChurnPredictions() {
  // Retrieve list of all investors with active folios from database
  const investors = await userRepo.findInvestorsForAnalytics();
  // Fetch all transaction records in system
  const allTxns = await transactionRepo.findAll();
  // Fetch all SIP mandate schedules in system
  const allSips = await sipRepo.findAll();

  // Track the count of investors placed in high risk category
  let highRiskCount = 0;
  // Calculate risk statistics for each investor folio
  const predictions = investors.map((inv) => {
    // Filter transactions belonging to this specific user
    const userTxns = allTxns.filter((t) => t.user_id === inv.id);
    // Filter SIP schedules belonging to this specific user
    const userSips = allSips.filter((s) => s.investor_name === inv.fullName);
    // Run the scoring heuristic calculation
    const prediction = computeChurnScore(inv, userTxns, userSips);
    // Increment high risk counter if category is HIGH
    if (prediction.riskCategory === 'HIGH') highRiskCount++;
    // Return prediction result object
    return prediction;
  });

  // Sort cohort predictions descending by churn risk percentage
  predictions.sort((a, b) => b.churnRisk - a.churnRisk);

  // Write access logs to system audit ledger
  await logAuditAction('AI_ENGINE', 'ML-CHURN-V1', 'users', 'all', 'UPDATE', {
    message: 'Executed investor behavioral churn prediction pipeline.',
    folios_analyzed: investors.length,
    high_risk_cohorts: highRiskCount,
  });

  // Return sorted lists of prediction reports
  return predictions;
}

// Triggers retention campaign communication (emails with fee waivers) for high risk clients
async function triggerOutreach(userId) {
  // Validate that a userId parameter was provided
  if (!userId) {
    const error = new Error('Missing userId parameter.');
    error.statusCode = 400;
    throw error;
  }

  // Retrieve user account details from database
  const user = await userRepo.findById(userId);
  // Throw error if user session cannot be found
  if (!user) {
    const error = new Error('Investor session not found.');
    error.statusCode = 404;
    throw error;
  }

  // Write action details to WORM system audit ledger
  await logAuditAction('USER', 'Fund Manager', 'users', userId, 'UPDATE', {
    message: `Dispatched proactive client retention outreach campaign to ${user.full_name}. Offered 15bp fee waiver on next allocation.`,
  });

  // Write email notification record to database
  await notificationRepo.create({
    id: generateId('not_'),
    userId,
    channel: 'EMAIL',
    type: 'REMARKETING',
    title: 'Exclusive Relationship Reward',
    body: `Dear ${user.full_name}, we value your trust. Enjoy an exclusive 0.15% expense ratio fee waiver on your next scheme allocation. Apply code RELATIONSHIP15 at checkout.`,
  });

  // Return completion status message
  return { status: 'success', message: `Retention outreach triggered for ${user.full_name}.` };
}

// Export the analytics services to be called by routers
module.exports = { getChurnPredictions, triggerOutreach };
