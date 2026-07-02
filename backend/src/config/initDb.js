require('dotenv').config();
const { pool } = require('./db');

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS public.users (
    id VARCHAR(64) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(64) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    date_of_birth VARCHAR(64) NOT NULL,
    role VARCHAR(64) CHECK(role IN ('INVESTOR','COMPLIANCE_OFFICER','ANALYST','FUND_MANAGER')) NOT NULL,
    status VARCHAR(64) CHECK(status IN ('PENDING_VERIFICATION','VERIFIED','KYC_SUBMITTED','ACTIVE','SUSPENDED','DEACTIVATED')) NOT NULL DEFAULT 'PENDING_VERIFICATION',
    mfa_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    mfa_secret VARCHAR(255),
    device_fingerprint VARCHAR(255),
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS kyc_records (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
    pan_number VARCHAR(255) NOT NULL,
    aadhaar_number VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    status VARCHAR(64) CHECK(status IN ('SUBMITTED','AI_PROCESSING','AUTO_APPROVED','ESCALATED','COMPLIANCE_APPROVED','REJECTED')) NOT NULL DEFAULT 'SUBMITTED',
    ai_confidence_score REAL,
    rejection_reason TEXT,
    verified_by VARCHAR(64),
    verified_at TIMESTAMPTZ,
    submitted_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    attempt_number INTEGER NOT NULL DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS kyc_documents (
    id VARCHAR(64) PRIMARY KEY,
    kyc_record_id VARCHAR(64) NOT NULL REFERENCES kyc_records(id) ON DELETE CASCADE,
    document_type VARCHAR(64) CHECK(document_type IN ('PAN','AADHAAR','ADDRESS_PROOF','PHOTOGRAPH','BANK_STATEMENT')) NOT NULL,
    file_path VARCHAR(512) NOT NULL,
    file_hash VARCHAR(255) NOT NULL,
    file_size_bytes INTEGER NOT NULL,
    mime_type VARCHAR(64) NOT NULL,
    ocr_extracted_data TEXT,
    ai_authenticity_score REAL,
    uploaded_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS cfa_approvals (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
    kyc_record_id VARCHAR(64) NOT NULL REFERENCES kyc_records(id) ON DELETE RESTRICT,
    cfa_approval_code VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(64) CHECK(status IN ('PENDING','APPROVED','REJECTED','EXPIRED')) NOT NULL DEFAULT 'PENDING',
    approved_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS funds (
    id VARCHAR(64) PRIMARY KEY,
    fund_code VARCHAR(64) UNIQUE NOT NULL,
    fund_name VARCHAR(255) NOT NULL,
    fund_house VARCHAR(255) NOT NULL,
    fund_manager_id VARCHAR(255) NOT NULL,
    category VARCHAR(64) CHECK(category IN ('EQUITY','DEBT','HYBRID','ELSS','INDEX','LIQUID','SECTORAL')) NOT NULL,
    risk_level VARCHAR(64) CHECK(risk_level IN ('LOW','MODERATE','HIGH','VERY_HIGH')) NOT NULL,
    current_nav REAL NOT NULL,
    nav_updated_at VARCHAR(64) NOT NULL,
    min_investment REAL NOT NULL,
    min_sip_amount REAL NOT NULL,
    expense_ratio REAL NOT NULL,
    exit_load_percent REAL DEFAULT 0.0,
    exit_load_period_days INTEGER DEFAULT 0,
    inception_date VARCHAR(64) NOT NULL,
    aum_crores REAL NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS investments (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
    fund_id VARCHAR(64) NOT NULL REFERENCES funds(id) ON DELETE RESTRICT,
    fund_name VARCHAR(255) NOT NULL,
    investment_type VARCHAR(64) CHECK(investment_type IN ('LUMPSUM','SIP','STP','SWP')) NOT NULL,
    amount REAL NOT NULL,
    frequency VARCHAR(64),
    sip_date INTEGER,
    mandate_status VARCHAR(64),
    start_date VARCHAR(64) NOT NULL,
    end_date VARCHAR(64),
    total_units REAL NOT NULL DEFAULT 0.0,
    current_value REAL NOT NULL DEFAULT 0.0,
    status VARCHAR(64) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
    investment_id VARCHAR(64) NOT NULL REFERENCES investments(id) ON DELETE RESTRICT,
    fund_id VARCHAR(64) NOT NULL REFERENCES funds(id) ON DELETE RESTRICT,
    fund_name VARCHAR(255) NOT NULL,
    transaction_type VARCHAR(64) NOT NULL,
    amount REAL NOT NULL,
    nav_applied REAL,
    units REAL,
    stamp_duty REAL NOT NULL DEFAULT 0.0,
    exit_load REAL NOT NULL DEFAULT 0.0,
    status VARCHAR(64) NOT NULL DEFAULT 'INITIATED',
    payment_ref VARCHAR(255),
    payment_mode VARCHAR(255),
    settlement_date VARCHAR(64),
    folio_number VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    settled_at TIMESTAMPTZ
  );

  CREATE TABLE IF NOT EXISTS compliance_checks (
    id VARCHAR(64) PRIMARY KEY,
    transaction_id VARCHAR(64) NOT NULL REFERENCES transactions(id) ON DELETE RESTRICT,
    user_id VARCHAR(64) NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
    check_type VARCHAR(255) NOT NULL,
    risk_score REAL NOT NULL,
    result VARCHAR(64) CHECK(result IN ('CLEAR','SUSPICIOUS','BLOCKED')) NOT NULL,
    details TEXT NOT NULL,
    checked_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS compliance_alerts (
    id VARCHAR(64) PRIMARY KEY,
    compliance_check_id VARCHAR(64) NOT NULL REFERENCES compliance_checks(id) ON DELETE RESTRICT,
    user_id VARCHAR(64) NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
    alert_type VARCHAR(255) NOT NULL,
    severity VARCHAR(64) CHECK(severity IN ('LOW','MEDIUM','HIGH','CRITICAL')) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(64) CHECK(status IN ('OPEN','UNDER_REVIEW','RESOLVED','STR_FILED','DISMISSED')) NOT NULL DEFAULT 'OPEN',
    assigned_to VARCHAR(64),
    resolved_at TIMESTAMPTZ,
    resolution_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(64) PRIMARY KEY,
    actor_id VARCHAR(64) REFERENCES public.users(id) ON DELETE SET NULL,
    actor_type VARCHAR(64) CHECK(actor_type IN ('USER','SYSTEM','AI_ENGINE','CRON_JOB')) NOT NULL,
    actor_name VARCHAR(255) NOT NULL,
    entity_type VARCHAR(255) NOT NULL,
    entity_id VARCHAR(64) NOT NULL,
    action VARCHAR(64) CHECK(action IN ('CREATE','READ','UPDATE','DELETE','LOGIN','LOGOUT','VERIFY','APPROVE','REJECT')) NOT NULL,
    changes TEXT,
    ip_address VARCHAR(64) NOT NULL,
    user_agent VARCHAR(512),
    session_id VARCHAR(64),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS sip_schedules (
    id VARCHAR(64) PRIMARY KEY,
    investor_name VARCHAR(255) NOT NULL,
    fund_name VARCHAR(255) NOT NULL,
    amount REAL NOT NULL,
    date INTEGER NOT NULL,
    status VARCHAR(64) NOT NULL DEFAULT 'ACTIVE',
    next_debit VARCHAR(64) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) REFERENCES public.users(id) ON DELETE CASCADE,
    channel VARCHAR(64) CHECK(channel IN ('EMAIL','SMS','PUSH','IN_APP')) NOT NULL,
    type VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    sent_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS system_users (
    id VARCHAR(64) PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    role VARCHAR(64) NOT NULL,
    status VARCHAR(64) NOT NULL DEFAULT 'ACTIVE'
  );
`;

const INDEXES = `
  CREATE INDEX IF NOT EXISTS idx_kyc_records_user_id ON kyc_records(user_id);
  CREATE INDEX IF NOT EXISTS idx_kyc_docs_record_id ON kyc_documents(kyc_record_id);
  CREATE INDEX IF NOT EXISTS idx_investments_user_id ON investments(user_id);
  CREATE INDEX IF NOT EXISTS idx_investments_fund_id ON investments(fund_id);
  CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
  CREATE INDEX IF NOT EXISTS idx_transactions_investment_id ON transactions(investment_id);
  CREATE INDEX IF NOT EXISTS idx_compliance_checks_transaction ON compliance_checks(transaction_id);
  CREATE INDEX IF NOT EXISTS idx_compliance_alerts_user ON compliance_alerts(user_id);
  CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_id);
  CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
`;

const DROP_ALL = `
  DROP TABLE IF EXISTS notifications CASCADE;
  DROP TABLE IF EXISTS audit_logs CASCADE;
  DROP TABLE IF EXISTS compliance_alerts CASCADE;
  DROP TABLE IF EXISTS compliance_checks CASCADE;
  DROP TABLE IF EXISTS sip_schedules CASCADE;
  DROP TABLE IF EXISTS transactions CASCADE;
  DROP TABLE IF EXISTS investments CASCADE;
  DROP TABLE IF EXISTS cfa_approvals CASCADE;
  DROP TABLE IF EXISTS kyc_documents CASCADE;
  DROP TABLE IF EXISTS kyc_records CASCADE;
  DROP TABLE IF EXISTS funds CASCADE;
  DROP TABLE IF EXISTS system_users CASCADE;
  DROP TABLE IF EXISTS public.users CASCADE;
`;

async function initDb(reset = false) {
  const client = await pool.connect();
  try {
    console.log('Initializing database schema...');
    if (reset) {
      console.log('[DB] Dropping all tables for reset...');
      await client.query(DROP_ALL);
    }
    await client.query(SCHEMA);
    await client.query(INDEXES);
    console.log('Database initialized successfully.');
  } catch (err) {
    console.error('Database init error:', err);
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { initDb };

// Run directly only when executed as a standalone script
if (require.main === module) {
  initDb().then(() => pool.end()).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
