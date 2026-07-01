import React, { useState } from 'react';
import {
  ShieldAlert, ShieldCheck, AlertTriangle,
  UserCheck
} from 'lucide-react';

export default function AMLDashboard() {
  // --- AML Alerts state ---
  const [alerts, setAlerts] = useState([
    { id: 'TX-9241', date: '2026-06-25', name: 'Nippon Wealth Ltd', type: 'Corporate', amount: '₹12.4 Cr', reason: 'High-volume split transfers under 24hrs', status: 'Flagged', severity: 'critical' },
    { id: 'TX-8356', date: '2026-06-24', name: 'Rajesh Singhania', type: 'HNI Retail', amount: '₹2.8 Cr', reason: 'Multiple shell cash credits (3 accounts)', status: 'FIU Escalated', severity: 'warning' },
    { id: 'TX-7215', date: '2026-06-23', name: 'Vanguard Capital Corp', type: 'Institutional', amount: '₹28.0 Cr', reason: 'Source account unverified, high value', status: 'Flagged', severity: 'critical' },
    { id: 'TX-6042', date: '2026-06-22', name: 'Meera Deshmukh', type: 'Retail', amount: '₹48 Lakh', reason: 'Sudden high volume switch (non-KYC)', status: 'Released', severity: 'info' },
    { id: 'TX-5104', date: '2026-06-20', name: 'Golden Gate Advisors', type: 'Corporate', amount: '₹18.5 Cr', reason: 'Redemption to offshore account (Mauritius)', status: 'Frozen', severity: 'critical' }
  ]);

  const [activeSeverity, setActiveSeverity] = useState('all');

  // Interactive functions
  const handleAction = (id, newStatus) => {
    setAlerts(prev => prev.map(a => {
      if (a.id === id) {
        return { ...a, status: newStatus };
      }
      return a;
    }));
  };

  const filteredAlerts = activeSeverity === 'all'
    ? alerts
    : alerts.filter(a => a.severity === activeSeverity);

  // Stats computation
  const flaggedCount = alerts.filter(a => a.status === 'Flagged').length;
  const frozenCount = alerts.filter(a => a.status === 'Frozen').length;
  const escalatedCount = alerts.filter(a => a.status === 'FIU Escalated').length;

  return (
    <div>
      {/* Page Header */}
      <div className="page-header-strip">
        <div className="page-title-area">
          <h1 className="page-title">AML Dashboard</h1>
          <p className="page-subtitle">Anti-Money Laundering compliance checks, suspicious transactions, and FIU filings</p>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="kpi-row-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <div className="card kpi-card" style={{ minHeight: '110px' }}>
          <div>
            <div className="kpi-value-row">
              <span className="kpi-value">{flaggedCount}</span>
            </div>
            <div className="kpi-title" style={{ marginTop: '8px' }}>Pending Flagged Alerts</div>
          </div>
          <div className="kpi-footer">
            <span className="kpi-change-negative" style={{ color: 'var(--error-red)' }}>
              Requires immediate action
            </span>
          </div>
        </div>

        <div className="card kpi-card" style={{ minHeight: '110px' }}>
          <div>
            <div className="kpi-value-row">
              <span className="kpi-value">{frozenCount}</span>
            </div>
            <div className="kpi-title" style={{ marginTop: '8px' }}>Frozen Transactions</div>
          </div>
          <div className="kpi-footer">
            <span style={{ color: 'var(--success-green)', fontWeight: '600' }}>
              Capital held in escrow
            </span>
          </div>
        </div>

        <div className="card kpi-card" style={{ minHeight: '110px' }}>
          <div>
            <div className="kpi-value-row">
              <span className="kpi-value">{escalatedCount}</span>
            </div>
            <div className="kpi-title" style={{ marginTop: '8px' }}>Escalated to FIU-IND</div>
          </div>
          <div className="kpi-footer">
            <span style={{ color: 'var(--text-secondary)' }}>
              STR reports uploaded
            </span>
          </div>
        </div>

        <div className="card kpi-card" style={{ minHeight: '110px' }}>
          <div>
            <div className="kpi-value-row">
              <span className="kpi-value">99.8%</span>
            </div>
            <div className="kpi-title" style={{ marginTop: '8px' }}>KYC Onboarding Quality</div>
          </div>
          <div className="kpi-footer">
            <span className="kpi-change-positive">
              <UserCheck size={12} strokeWidth={2.5} /> Passed audits
            </span>
          </div>
        </div>
      </div>

      {/* AML Scenario Focus Banner */}
      <div className="card" style={{ marginBottom: '24px', borderLeft: '4px solid var(--error-red)' }}>
        <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--error-text)' }}>
          <ShieldAlert size={18} /> Regulatory Focus Area: High-Value Bracket Suspicious Volume Spike
        </h3>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '8px', lineHeight: '1.5' }}>
          Our AI Transaction Heatmap detected unusual switches and redemption patterns in the <strong>₹10L+ HNI and Corporate segment</strong>, exceeding the historical baseline by <strong>+340%</strong>. Compliance officers must verify matching bank accounts, freeze suspicious redemptions, and initiate enhanced due diligence (EDD) protocols to satisfy SEBI and FIU guidelines.
        </p>
      </div>

      {/* Main Alert List Table */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-title-row">
          <div>
            <h3 className="card-title">Suspicious Transaction Alerts</h3>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Real-time flagged transactions matching AML rulesets
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              onClick={() => setActiveSeverity('all')}
              className="dropdown-filter-btn"
              style={{
                borderColor: activeSeverity === 'all' ? 'var(--primary-blue)' : 'var(--border-color)',
                backgroundColor: activeSeverity === 'all' ? 'var(--accent-blue-bg)' : 'var(--bg-main)',
                color: activeSeverity === 'all' ? 'var(--primary-blue)' : 'var(--text-secondary)'
              }}
            >
              All Alerts
            </button>
            <button 
              onClick={() => setActiveSeverity('critical')}
              className="dropdown-filter-btn"
              style={{
                borderColor: activeSeverity === 'critical' ? 'var(--primary-blue)' : 'var(--border-color)',
                backgroundColor: activeSeverity === 'critical' ? 'var(--accent-blue-bg)' : 'var(--bg-main)',
                color: activeSeverity === 'critical' ? 'var(--primary-blue)' : 'var(--text-secondary)'
              }}
            >
              🔴 Critical
            </button>
            <button 
              onClick={() => setActiveSeverity('warning')}
              className="dropdown-filter-btn"
              style={{
                borderColor: activeSeverity === 'warning' ? 'var(--primary-blue)' : 'var(--border-color)',
                backgroundColor: activeSeverity === 'warning' ? 'var(--accent-blue-bg)' : 'var(--bg-main)',
                color: activeSeverity === 'warning' ? 'var(--primary-blue)' : 'var(--text-secondary)'
              }}
            >
              🟡 Warnings
            </button>
          </div>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Date</th>
                <th>Entity Name</th>
                <th>Segment</th>
                <th className="text-right">Amount</th>
                <th>AML Trigger Violation Reason</th>
                <th>Status</th>
                <th className="text-right" style={{ width: '220px' }}>Compliance Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAlerts.map((a) => {
                let badgeClass = 'status-badge status-medium';
                if (a.status === 'Flagged') badgeClass = 'status-badge status-high';
                else if (a.status === 'Frozen') badgeClass = 'status-badge status-high';
                else if (a.status === 'Released') badgeClass = 'status-badge status-low';
                
                return (
                  <tr key={a.id}>
                    <td className="mono" style={{ fontWeight: '700' }}>{a.id}</td>
                    <td className="mono" style={{ fontSize: '0.75rem' }}>{a.date}</td>
                    <td style={{ fontWeight: '600' }}>{a.name}</td>
                    <td>{a.type}</td>
                    <td className="text-right mono" style={{ fontWeight: '700' }}>{a.amount}</td>
                    <td style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      <span style={{ color: 'var(--error-red)', marginRight: '4px' }}>⚠</span>
                      {a.reason}
                    </td>
                    <td>
                      <span className={badgeClass}>{a.status}</span>
                    </td>
                    <td className="text-right">
                      {a.status === 'Flagged' && (
                        <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                          <button 
                            className="button-primary" 
                            onClick={() => handleAction(a.id, 'Frozen')}
                            style={{ padding: '4px 8px', fontSize: '0.68rem', backgroundColor: 'var(--error-red)' }}
                          >
                            Freeze
                          </button>
                          <button 
                            className="button-secondary" 
                            onClick={() => handleAction(a.id, 'FIU Escalated')}
                            style={{ padding: '4px 8px', fontSize: '0.68rem' }}
                          >
                            FIU
                          </button>
                          <button 
                            className="button-secondary" 
                            onClick={() => handleAction(a.id, 'Released')}
                            style={{ padding: '4px 8px', fontSize: '0.68rem' }}
                          >
                            Release
                          </button>
                        </div>
                      )}
                      {a.status === 'FIU Escalated' && (
                        <span style={{ fontSize: '0.7rem', color: 'var(--warning-orange)', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                          <AlertTriangle size={12} /> Pending FIU-IND Feedback
                        </span>
                      )}
                      {a.status === 'Frozen' && (
                        <span style={{ fontSize: '0.7rem', color: 'var(--error-red)', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                          <ShieldAlert size={12} /> Asset Frozen (Escrow)
                        </span>
                      )}
                      {a.status === 'Released' && (
                        <span style={{ fontSize: '0.7rem', color: 'var(--success-green)', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                          <ShieldCheck size={12} /> Whitelisted / Released
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filteredAlerts.length === 0 && (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)' }}>
                    No alerts in this severity scope.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* AML Checklists */}
      <div className="dashboard-grid-2">
        <div className="card">
          <h3 className="card-title" style={{ marginBottom: '12px' }}>Regulatory Compliance Checklist</h3>
          <div className="portfolio-progress-container">
            <div className="progress-row">
              <div className="progress-label-row">
                <span>Politically Exposed Persons (PEP) Screenings</span>
                <span className="mono">100%</span>
              </div>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: '100%', backgroundColor: 'var(--success-green)' }}></div>
              </div>
            </div>
            
            <div className="progress-row">
              <div className="progress-label-row">
                <span>Re-Verify KYC for Dormant HNI Accounts</span>
                <span className="mono">84%</span>
              </div>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: '84%', backgroundColor: 'var(--primary-blue)' }}></div>
              </div>
            </div>

            <div className="progress-row">
              <div className="progress-label-row">
                <span>Beneficial Ownership Declarations (UBO)</span>
                <span className="mono">92%</span>
              </div>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: '92%', backgroundColor: 'var(--primary-blue)' }}></div>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="card-title" style={{ marginBottom: '12px' }}>Suspicious Transaction Report (STR) Filings</h3>
          <div className="alert-feed-list">
            <div className="alert-feed-item info" style={{ padding: '8px 12px' }}>
              <div className="alert-feed-icon">📄</div>
              <div className="alert-feed-details">
                <div className="alert-feed-title">STR-2026-Q2-08 Filed</div>
                <div className="alert-feed-desc">Report of shell transfers for Rajesh Singhania uploaded to FIU-IND portal.</div>
              </div>
            </div>
            <div className="alert-feed-item info" style={{ padding: '8px 12px' }}>
              <div className="alert-feed-icon">📄</div>
              <div className="alert-feed-details">
                <div className="alert-feed-title">STR-2026-Q2-07 Filed</div>
                <div className="alert-feed-desc">Report of Mauritius redemptions for Golden Gate Advisors filed.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
