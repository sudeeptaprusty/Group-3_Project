import React, { useState } from 'react';
import {
  ShieldCheck, AlertCircle, CheckCircle
} from 'lucide-react';
import { usePlatform } from '../context/PlatformContext';

export default function ComplianceAlert() {
  const { allComplianceAlerts = [], resolveAlert } = usePlatform() || {};
  const [activeTab, setActiveTab] = useState('all');

  const exceptions = allComplianceAlerts.map(a => ({
    id: a.id,
    date: new Date(a.created_at).toISOString().split('T')[0],
    scheme: 'Aegis Platform',
    guideline: a.alert_type.replace(/_/g, ' '),
    details: a.description,
    status: a.status === 'OPEN' ? 'Open' : (a.status === 'RESOLVED' ? 'Resolved' : 'Normal'),
    risk: a.severity.toLowerCase() === 'critical' || a.severity.toLowerCase() === 'high' ? 'critical' : 'warning'
  }));

  const handleResolve = async (id) => {
    if (resolveAlert) {
      await resolveAlert(id, 'RESOLVED', 'Resolved via Compliance Dashboard UI.');
    }
  };

  const filteredExceptions = activeTab === 'all'
    ? exceptions
    : exceptions.filter(e => e.status.toLowerCase() === activeTab);

  const openCount = exceptions.filter(e => e.status === 'Open').length;
  const resolvedCount = exceptions.filter(e => e.status === 'Resolved').length;

  return (
    <div>
      {/* Page Header */}
      <div className="page-header-strip">
        <div className="page-title-area">
          <h1 className="page-title">Compliance Alert</h1>
          <p className="page-subtitle">SEBI mutual fund regulations audit logs, asset concentration, and style drifts</p>
        </div>
      </div>

      {/* KPI Row */}
      <div className="kpi-row-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <div className="card kpi-card" style={{ minHeight: '110px' }}>
          <div>
            <div className="kpi-value-row">
              <span className="kpi-value">{openCount}</span>
            </div>
            <div className="kpi-title" style={{ marginTop: '8px' }}>Active Compliance Exceptions</div>
          </div>
          <div className="kpi-footer">
            <span className="kpi-change-negative" style={{ color: 'var(--error-red)' }}>
              Requires portfolio rebalancing
            </span>
          </div>
        </div>

        <div className="card kpi-card" style={{ minHeight: '110px' }}>
          <div>
            <div className="kpi-value-row">
              <span className="kpi-value">{resolvedCount}</span>
            </div>
            <div className="kpi-title" style={{ marginTop: '8px' }}>Exceptions Resolved MTD</div>
          </div>
          <div className="kpi-footer">
            <span className="kpi-change-positive">
              <CheckCircle size={12} /> Corrective actions logged
            </span>
          </div>
        </div>

        <div className="card kpi-card" style={{ minHeight: '110px' }}>
          <div>
            <div className="kpi-value-row">
              <span className="kpi-value">14 / 14</span>
            </div>
            <div className="kpi-title" style={{ marginTop: '8px' }}>Daily Audits Completed</div>
          </div>
          <div className="kpi-footer">
            <span className="kpi-change-positive" style={{ color: 'var(--success-green)' }}>
              All tests passed today
            </span>
          </div>
        </div>

        <div className="card kpi-card" style={{ minHeight: '110px' }}>
          <div>
            <div className="kpi-value-row">
              <span className="kpi-value">98.5%</span>
            </div>
            <div className="kpi-title" style={{ marginTop: '8px' }}>Overall Compliance Score</div>
          </div>
          <div className="kpi-footer">
            <span style={{ color: 'var(--text-secondary)' }}>
              Target: &gt;98.0% rating
            </span>
          </div>
        </div>
      </div>

      {/* SEBI Compliance Alert Rules Summary */}
      <div className="card" style={{ marginBottom: '24px', borderLeft: '4px solid var(--warning-orange)' }}>
        <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--warning-text)' }}>
          <AlertCircle size={18} /> Active Warning: Style Drift detected in Smallcap Fund Allocation
        </h3>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '8px', lineHeight: '1.5' }}>
          Asset allocation checks triggered an alert on <strong>FinVista Smallcap Fund</strong>. SEBI rules dictate small-cap schemes must allocate a minimum of <strong>65%</strong> to small-cap equity shares. Currently, due to mid-cap price appreciation, the small-cap asset exposure dropped to <strong>63.8%</strong>. A rebalancing task has been dispatched to treasury.
        </p>
      </div>

      {/* Exceptions Log Table */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-title-row">
          <div>
            <h3 className="card-title">Regulatory Exceptions Logs</h3>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Detailed audit trace of threshold breaches
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              onClick={() => setActiveTab('all')}
              className="dropdown-filter-btn"
              style={{
                borderColor: activeTab === 'all' ? 'var(--primary-blue)' : 'var(--border-color)',
                backgroundColor: activeTab === 'all' ? 'var(--accent-blue-bg)' : 'var(--bg-main)',
                color: activeTab === 'all' ? 'var(--primary-blue)' : 'var(--text-secondary)'
              }}
            >
              All Checklists
            </button>
            <button 
              onClick={() => setActiveTab('open')}
              className="dropdown-filter-btn"
              style={{
                borderColor: activeTab === 'open' ? 'var(--primary-blue)' : 'var(--border-color)',
                backgroundColor: activeTab === 'open' ? 'var(--accent-blue-bg)' : 'var(--bg-main)',
                color: activeTab === 'open' ? 'var(--primary-blue)' : 'var(--text-secondary)'
              }}
            >
              Open Violations
            </button>
            <button 
              onClick={() => setActiveTab('resolved')}
              className="dropdown-filter-btn"
              style={{
                borderColor: activeTab === 'resolved' ? 'var(--primary-blue)' : 'var(--border-color)',
                backgroundColor: activeTab === 'resolved' ? 'var(--accent-blue-bg)' : 'var(--bg-main)',
                color: activeTab === 'resolved' ? 'var(--primary-blue)' : 'var(--text-secondary)'
              }}
            >
              Resolved Audits
            </button>
          </div>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Audit ID</th>
                <th>Date</th>
                <th>Mutual Fund Scheme</th>
                <th>SEBI Guideline Breached</th>
                <th>Details of Violation</th>
                <th>Risk Rating</th>
                <th>Status</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredExceptions.map((e) => {
                let badgeClass = 'status-badge status-medium';
                if (e.risk === 'critical') badgeClass = 'status-badge status-high';
                else if (e.risk === 'info') badgeClass = 'status-badge status-low';
                
                return (
                  <tr key={e.id}>
                    <td className="mono" style={{ fontWeight: '700' }}>{e.id}</td>
                    <td className="mono" style={{ fontSize: '0.75rem' }}>{e.date}</td>
                    <td style={{ fontWeight: '600' }}>{e.scheme}</td>
                    <td style={{ fontWeight: '500' }}>{e.guideline}</td>
                    <td style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{e.details}</td>
                    <td>
                      <span className={badgeClass}>{e.risk}</span>
                    </td>
                    <td>
                      <span className={`status-badge ${e.status === 'Open' ? 'status-high' : e.status === 'Resolved' ? 'status-low' : 'status-medium'}`}>
                        {e.status}
                      </span>
                    </td>
                    <td className="text-right">
                      {e.status === 'Open' ? (
                        <button 
                          className="button-primary" 
                          onClick={() => handleResolve(e.id)}
                          style={{ padding: '4px 10px', fontSize: '0.7rem' }}
                        >
                          Resolve Drift
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.72rem', color: 'var(--success-green)', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '3px' }}>
                          <ShieldCheck size={12} /> Rebalanced &amp; Audited
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Concentration thresholds */}
      <div className="card">
        <h3 className="card-title" style={{ marginBottom: '16px' }}>Equity Concentration Compliance Limits</h3>
        <p className="card-subtitle">SEBI Guidelines: Max 40% combined equity concentration in top 5 stock holdings.</p>
        
        <div className="portfolio-progress-container" style={{ gap: '16px' }}>
          <div className="progress-row">
            <div className="progress-label-row">
              <span>FinVista Bluechip Fund (Top 5 Stocks Concentration)</span>
              <span className="mono">34.6% / 40.0% Limit</span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: '86.5%', backgroundColor: 'var(--primary-blue)' }}></div>
            </div>
          </div>

          <div className="progress-row">
            <div className="progress-label-row">
              <span>FinVista Midcap Fund (Top 5 Stocks Concentration)</span>
              <span className="mono">28.2% / 40.0% Limit</span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: '70.5%', backgroundColor: 'var(--success-green)' }}></div>
            </div>
          </div>

          <div className="progress-row">
            <div className="progress-label-row">
              <span>FinVista Smallcap Fund (Top 5 Stocks Concentration)</span>
              <span className="mono">22.8% / 40.0% Limit</span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: '57.0%', backgroundColor: 'var(--success-green)' }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
