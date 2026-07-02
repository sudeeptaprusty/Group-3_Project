// Import the database query coordinator function (resolves Postgres or SQLite fallback pool)
const { dbQuery } = require('../config/db');

// Maximum number of live-generated transactions to keep in the DB at any time
const LIVE_TXN_CAP = 10000;

// Starts the mock trade generator, feeding live events to connected websockets
function startGenerator(wss) {
  console.log('[GENERATOR] Launching Real-time Transaction Generator...');
  
  // Use timestamp + random suffix to guarantee uniqueness across server restarts
  const sessionId = Math.random().toString(36).slice(2, 7);
  let sequence = Date.now();

  // Recursive transaction creator method
  const generate = async () => {
    let user = null;
    let fund = null;
    let invId = null;
    try {
      // Check live transaction count and prune if over cap to prevent unbounded DB growth
      const countRow = await dbQuery.get("SELECT COUNT(*) as cnt FROM transactions WHERE id LIKE 'txn-live-%'");
      const liveCount = parseInt(countRow?.cnt || 0);
      if (liveCount >= LIVE_TXN_CAP) {
        console.log(`[GENERATOR] ⚠️  Live transaction cap (${LIVE_TXN_CAP}) reached (${liveCount} rows). Pruning oldest 1,000 rows...`);
        const rowsToDelete = await dbQuery.all(`
          SELECT id FROM transactions WHERE id LIKE 'txn-live-%'
          ORDER BY created_at ASC LIMIT 1000
        `);
        if (rowsToDelete && rowsToDelete.length > 0) {
          const ids = rowsToDelete.map(row => `'${row.id}'`).join(',');
          // Delete child records first to satisfy Postgres Foreign Key constraints
          await dbQuery.run(`DELETE FROM compliance_alerts WHERE compliance_check_id IN (SELECT id FROM compliance_checks WHERE transaction_id IN (${ids}))`);
          await dbQuery.run(`DELETE FROM compliance_checks WHERE transaction_id IN (${ids})`);
          // Finally delete the parent transactions
          await dbQuery.run(`DELETE FROM transactions WHERE id IN (${ids})`);
        }
        setTimeout(generate, 60000); // Wait 60s after pruning
        return;
      }

      // Pick a random user from actual registered DB users
      const dbUsers = await dbQuery.all('SELECT id, full_name as name FROM users');
      if (dbUsers.length === 0) {
        // No registered users yet, wait 5s and try again
        setTimeout(generate, 5000);
        return;
      }

      user = dbUsers[Math.floor(Math.random() * dbUsers.length)];

      // Pick a random real fund row from the DB (matches FK constraint)
      const dbFunds = await dbQuery.all('SELECT id, fund_name as name, category, current_nav as nav FROM funds WHERE is_active = true');
      if (dbFunds.length === 0) {
        // No seeded funds yet, wait 5s and try again
        setTimeout(generate, 5000);
        return;
      }
      fund = dbFunds[Math.floor(Math.random() * dbFunds.length)];
      
      // Select type with realistic weights (Purchase: 55%, Redemption: 25%, SIP: 10%, Switch In: 5%, Switch Out: 5%)
      const r = Math.random();
      let type = 'PURCHASE';
      if (r < 0.55) type = 'PURCHASE';
      else if (r < 0.80) type = 'REDEMPTION';
      else if (r < 0.90) type = 'SIP_AUTO';
      else if (r < 0.95) type = 'SWITCH_IN';
      else type = 'SWITCH_OUT';

      // Decide transaction size (8% chance of HNW spike)
      // Regular investors: ₹5,000 to ₹5,00,000 (realistic retail SIP/lumpsum)
      // HNW investors: ₹25 Lakh to ₹5 Cr (realistic HNI range)
      const isHNW = Math.random() < 0.08;
      let amount = 0;
      if (isHNW) {
        amount = Math.floor(Math.random() * 475 + 25) * 100000; // ₹25 Lakh to ₹5 Cr
      } else {
        amount = Math.floor(Math.random() * 99 + 1) * 5000;    // ₹5,000 to ₹5,00,000
      }

      // Format identifiers and calculate unit counts and stamp duties
      const txnId = `txn-live-${sessionId}-${sequence++}`;
      invId = `inv-${user.id}-${fund.id}`;
      const nav = fund.nav;
      const units = parseFloat((amount / nav).toFixed(4));
      const stampDuty = parseFloat((amount * 0.00005).toFixed(2));
      const timestamp = new Date().toISOString();

      // Ensure investment record exists to satisfy foreign key constraints
      const invRow = await dbQuery.get('SELECT id FROM investments WHERE id = ?', [invId]);
      if (!invRow) {
        await dbQuery.run(`
          INSERT INTO investments (id, user_id, fund_id, fund_name, investment_type, amount, start_date, total_units, current_value, status)
          VALUES (?, ?, ?, ?, ?, 0, ?, 0, 0, 'ACTIVE')
        `, [invId, user.id, fund.id, fund.name, type === 'SIP_AUTO' ? 'SIP' : 'LUMPSUM', timestamp.split('T')[0]]);
      }

      // Write transaction to database
      await dbQuery.run(`
        INSERT INTO transactions (id, user_id, investment_id, fund_id, fund_name, transaction_type, amount, nav_applied, units, stamp_duty, status, created_at, settled_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'SETTLED', ?, ?)
      `, [txnId, user.id, invId, fund.id, fund.name, type, amount, nav, units, stampDuty, timestamp, timestamp]);

      // Flag transactions > ₹1 Cr as large value, or a 3% random velocity check
      let alertData = null;
      const isSuspicious = (isHNW && amount > 10000000) || (Math.random() < 0.03);
      
      if (isSuspicious) {
        const checkId = `chk-live-${sessionId}-${sequence}`;
        const alertId = `alt-live-${sessionId}-${sequence}`;
        const checkType = amount > 10000000 ? 'LARGE_VALUE_ALERT' : 'VELOCITY_LIMIT_EXCEEDED';
        const severity = amount > 10000000 ? 'HIGH' : 'MEDIUM';
        const description = amount > 10000000
          ? `High-value transaction flagged: ₹${(amount / 100000).toFixed(2)} Lakh allocation in ${fund.name} by ${user.name}.`
          : `Velocity limit warning: Multiple trades detected within short window for ${user.name}.`;

        // Record compliance checks report in database
        await dbQuery.run(`
          INSERT INTO compliance_checks (id, transaction_id, user_id, check_type, risk_score, result, details, checked_at)
          VALUES (?, ?, ?, ?, ?, 'SUSPICIOUS', ?, ?)
        `, [checkId, txnId, user.id, checkType, Math.floor(Math.random() * 30 + 65), description, timestamp]);

        // Record active compliance alerts dashboard item in database
        await dbQuery.run(`
          INSERT INTO compliance_alerts (id, compliance_check_id, user_id, alert_type, severity, description, status, assigned_to, created_at)
          VALUES (?, ?, ?, ?, ?, ?, 'OPEN', 'sys-usr-2', ?)
        `, [alertId, checkId, user.id, checkType, severity, description, timestamp]);

        // Map database records to the alert output object
        alertData = {
          id: alertId,
          compliance_check_id: checkId,
          user_id: user.id,
          alert_type: checkType,
          severity,
          description,
          status: 'OPEN',
          assigned_to: 'sys-usr-2',
          created_at: timestamp
        };

        console.log(`[GENERATOR] ⚠️ Compliance Alert triggered: ${description}`);
      }

      // Randomly create a new SIP schedule (3% chance) to boost New Registrations
      if (Math.random() < 0.03) {
        try {
          const newSipId = `sip-live-${sessionId}-${sequence}`;
          await dbQuery.run(`
            INSERT INTO sip_schedules (id, investor_name, fund_name, amount, date, status, next_debit)
            VALUES (?, ?, ?, ?, ?, 'ACTIVE', ?)
          `, [newSipId, user.name, fund.name, amount, Math.floor(Math.random() * 28) + 1, timestamp]);
          
          console.log(`[GENERATOR] 🌱 An investor has registered a new SIP.`);
          wss.clients.forEach(client => {
            if (client.readyState === 1) {
              client.send(JSON.stringify({ type: 'SIP_CREATED', sipId: newSipId }));
            }
          });
        } catch (e) {
          // Ignore
        }
      }

      // Randomly cancel a SIP schedule (1% chance) to populate the Stoppage Ratio gauge
      if (Math.random() < 0.01) {
        try {
          const cancelledSip = await dbQuery.get(`
            UPDATE sip_schedules 
            SET status = 'CANCELLED', updated_at = CURRENT_TIMESTAMP 
            WHERE id IN (
              SELECT id FROM sip_schedules WHERE status = 'ACTIVE' ORDER BY RANDOM() LIMIT 1
            )
            RETURNING id
          `);
          if (cancelledSip) {
            console.log(`[GENERATOR] 🛑 An investor has cancelled their SIP.`);
            wss.clients.forEach(client => {
              if (client.readyState === 1) {
                client.send(JSON.stringify({ type: 'SIP_CANCELLED', sipId: cancelledSip.id }));
              }
            });
          }
        } catch (e) {
          // Ignore if no active SIPs or random error
        }
      }

      // Broadcast transaction & optional alert to all connected WebSocket clients
      const payload = JSON.stringify({
        type: 'NEW_TRANSACTION',
        transaction: {
          id: txnId,
          user_id: user.id,
          user_name: user.name,
          investment_id: invId,
          fund_id: fund.id,
          fund_name: fund.name,
          category: fund.category,
          transaction_type: type,
          amount: amount,
          nav_applied: nav,
          units: units,
          stamp_duty: stampDuty,
          status: 'SETTLED',
          created_at: timestamp
        },
        alert: alertData
      });

      // Distribute payload to all active WS clients
      wss.clients.forEach(client => {
        if (client.readyState === 1) { // WebSocket.OPEN
          client.send(payload);
        }
      });

      console.log(`[GENERATOR] 💸 Broadcasted live transaction: ${type} of ₹${(amount / 10000000).toFixed(4)} Cr in ${fund.name}`);

    } catch (err) {
      console.error('[GENERATOR] Error generating transaction:', err.message, `| User ID: ${user?.id}, Fund ID: ${fund?.id}, Investment ID: ${invId}`);
    }

    // Schedule next transaction after a random interval between 1.5s and 4.5s
    const delay = Math.floor(Math.random() * 3000) + 1500;
    setTimeout(generate, delay);
  };

  // Start the loop after a 5 second warm-up delay
  setTimeout(generate, 5000);
}

// Export the start generator function
module.exports = {
  startGenerator
};