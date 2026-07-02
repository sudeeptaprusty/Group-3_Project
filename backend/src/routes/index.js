// Import the Express library module
const express = require('express');

// Import authentication route handlers (login, register)
const authRoutes = require('./auth.routes');
// Import investor folio and profile route handlers
const investorRoutes = require('./investor.routes');
// Import mutual fund schemes directory route handlers
const fundRoutes = require('./fund.routes');
// Import user investments and unit holdings route handlers
const investmentRoutes = require('./investment.routes');
// Import SIP mandate scheduling and execution route handlers
const sipRoutes = require('./sip.routes');
// Import the core transaction ledger auditing route handlers
const transactionRoutes = require('./transaction.routes');
// Import anti-money laundering (AML) compliance case override routes
const complianceRoutes = require('./compliance.routes');
// Import risk intelligence reports and client churn predictor routes
const analyticsRoutes = require('./analytics.routes');
// Import WORM immutable system audit logs route handlers
const auditRoutes = require('./audit.routes');
// Import global system settings and sandbox reset route handlers
const settingsRoutes = require('./settings.routes');
// Import internal system user directory management route handlers
const userRoutes = require('./user.routes');
// Import AI chatbot route handlers
const aiRoutes = require('./ai.routes');

// Initialize the Express router instance
const router = express.Router();
const { authenticateToken } = require('../middleware/auth.middleware');

// Mount authentication API paths under /api/auth (Public)
router.use('/auth', authRoutes);

// Apply JWT verification middleware (Protected)
router.use(authenticateToken);

// Mount investor reports API paths under /api/investors
router.use('/investors', investorRoutes);
// Mount mutual fund schemes API paths under /api/funds
router.use('/funds', fundRoutes);
// Mount customer investments API paths under /api/investments
router.use('/investments', investmentRoutes);
// Mount SIP mandate schedules API paths under /api/sip-schedules
router.use('/sip-schedules', sipRoutes);
// Mount transaction ledger API paths under /api/transactions
router.use('/transactions', transactionRoutes);
// Mount AML compliance alerting API paths under /api/compliance
router.use('/compliance', complianceRoutes);
// Mount AI analytics and churn predictions under /api/analytics
router.use('/analytics', analyticsRoutes);
// Mount system audit log tracking under /api/audit-logs
router.use('/audit-logs', auditRoutes);
// Mount system settings panel API paths under /api/settings
router.use('/settings', settingsRoutes);
// Mount internal admin accounts API paths under /api/users
router.use('/users', userRoutes);
// Mount AI chatbot endpoints under /api/ai
router.use('/ai', aiRoutes);

module.exports = router;
