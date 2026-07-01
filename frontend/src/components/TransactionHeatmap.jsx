import React, { useState, useEffect } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { usePlatform } from '../context/PlatformContext';

export default function TransactionHeatmap({ autoRefresh = true }) {
  const { allTransactions = [], investors = [], allComplianceAlerts = [] } = usePlatform() || {};

  // --- States ---
  const [viewMode, setViewMode] = useState('Inflow'); // 'Inflow' or 'Outflow'
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [hoveredCell, setHoveredCell] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const settledTxns = allTransactions.filter(t => t.status === 'SETTLED' || t.status === 'SUCCESS');
  const inflowTxns = settledTxns.filter(t => t.transaction_type === 'PURCHASE' || t.transaction_type === 'SIP_AUTO' || t.transaction_type === 'SWITCH_IN');
  const outflowTxns = settledTxns.filter(t => t.transaction_type === 'REDEMPTION' || t.transaction_type === 'SWITCH_OUT');

  const inflowSum = inflowTxns.reduce((sum, t) => sum + t.amount, 0) / 10000000; // Cr
  const outflowSum = outflowTxns.reduce((sum, t) => sum + t.amount, 0) / 10000000; // Cr
  const netFlowSum = inflowSum - outflowSum;

  const stats = {
    volMtd: allTransactions.length,
    totalTx: parseFloat((allTransactions.length / 100000).toFixed(2)),
    netInflow: netFlowSum,
    totalInflow: inflowSum,
    totalOutflow: outflowSum,
    investorsCount: investors.length,
    complianceLogs: allComplianceAlerts.length
  };

  // Map DB categories to display names — matches actual fund `category` column values
  const categories = [
    { name: 'Equity Funds',   filter: (f, cat) => cat === 'EQUITY' },
    { name: 'Debt Funds',     filter: (f, cat) => cat === 'DEBT' },
    { name: 'Hybrid Funds',   filter: (f, cat) => cat === 'HYBRID' },
    { name: 'ELSS Funds',     filter: (f, cat) => cat === 'ELSS' },
    { name: 'Index Funds',    filter: (f, cat) => cat === 'INDEX' },
    { name: 'Liquid Funds',   filter: (f, cat) => cat === 'LIQUID' },
    { name: 'Sectoral Funds', filter: (f, cat) => cat === 'SECTORAL' },
    { name: 'Other Funds',    filter: (_f, _cat) => true },
  ];

  const heatmapData = categories.map((cat, catIdx) => {
    const vals = Array(31).fill(0);
    allTransactions.forEach(t => {
      const fundName = t.fund_name || '';
      const fundCat  = (t.category || '').toUpperCase();

      // "Other Funds" (last) catches everything not matched above
      const matches = catIdx === categories.length - 1
        ? !categories.slice(0, -1).some(other => other.filter(fundName, fundCat))
        : cat.filter(fundName, fundCat);

      if (matches) {
        const dateObj = new Date(t.created_at);
        const day = dateObj.getDate();
        if (day >= 1 && day <= 31) {
          vals[day - 1] += t.amount / 10000000;
        }
      }
    });
    // 2 decimal places so small transactions (< ₹1 Cr) are still visible
    return { name: cat.name, vals: vals.map(v => parseFloat(v.toFixed(2))) };
  });


  // --- Real-time Fluctuation Simulation ---
  useEffect(() => {
    // Keep static as requested
  }, [autoRefresh]);

  // Compute the global max across all heatmap cells for dynamic color scaling
  const allVals = heatmapData.flatMap(row => row.vals).filter(v => v > 0).sort((a, b) => a - b);
  // Use 85th percentile as the scale cap — this prevents one massive outlier day
  // from squishing all other days into the lightest color zone
  const p85idx = Math.floor(allVals.length * 0.85);
  const globalMax = allVals.length > 0 ? (allVals[p85idx] || allVals[allVals.length - 1]) : 1;

  // Returns { bg, text } using RELATIVE thresholds (% of 85th-percentile max)
  // Values above the cap show dark red; everything else spreads naturally
  const getCellStyle = (val) => {
    const v = viewMode === 'Inflow' ? val : Math.max(0.01, val * 0.78);

    if (v === 0) return { bg: '#F8FAFC', text: '#CBD5E1' };

    const pct = Math.min(v / globalMax, 1.0); // clamp to 1.0

    if (pct <= 0.08)  return { bg: '#F0FDF4', text: '#166534' }; // very light green
    if (pct <= 0.18)  return { bg: '#DCFCE7', text: '#166534' }; // light green
    if (pct <= 0.30)  return { bg: '#BBF7D0', text: '#14532D' }; // medium light green
    if (pct <= 0.42)  return { bg: '#86EFAC', text: '#14532D' }; // medium green
    if (pct <= 0.55)  return { bg: '#4ADE80', text: '#14532D' }; // green
    if (pct <= 0.67)  return { bg: '#22C55E', text: '#fff' };    // dark green
    if (pct <= 0.78)  return { bg: '#16A34A', text: '#fff' };    // deeper green
    if (pct <= 0.87)  return { bg: '#F59E0B', text: '#fff' };    // amber
    if (pct <= 0.94)  return { bg: '#F97316', text: '#fff' };    // orange
    return                   { bg: '#EF4444', text: '#fff' };    // red (top 6% + outliers)
  };

  // Tooltip tracking
  const handleMouseMove = (e) => {
    setTooltipPos({
      x: e.clientX + 14,
      y: e.clientY - 24
    });
  };

  const handleCellHover = (cellData) => {
    setHoveredCell(cellData);
  };

  const handleCellLeave = () => {
    setHoveredCell(null);
  };

  // Filter rows
  const filteredData = categoryFilter === 'all'
    ? heatmapData
    : heatmapData.filter(row => row.name.toLowerCase().includes(categoryFilter.toLowerCase()));

  return (
    <div>
      {/* Page Header */}
      <div className="page-header-strip">
        <div className="page-title-area">
          <h1 className="page-title">Transaction Heatmap</h1>
          <p className="page-subtitle">Real-time daily transaction volumes across mutual fund categories</p>
        </div>

        {/* View filters */}
        <div className="header-controls">
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              onClick={() => setViewMode('Inflow')}
              className="dropdown-filter-btn"
              style={{
                borderColor: viewMode === 'Inflow' ? 'var(--primary-blue)' : 'var(--border-color)',
                backgroundColor: viewMode === 'Inflow' ? 'var(--accent-blue-bg)' : 'var(--bg-main)',
                color: viewMode === 'Inflow' ? 'var(--primary-blue)' : 'var(--text-secondary)'
              }}
            >
              Inflow View
            </button>
            <button 
              onClick={() => setViewMode('Outflow')}
              className="dropdown-filter-btn"
              style={{
                borderColor: viewMode === 'Outflow' ? 'var(--primary-blue)' : 'var(--border-color)',
                backgroundColor: viewMode === 'Outflow' ? 'var(--accent-blue-bg)' : 'var(--bg-main)',
                color: viewMode === 'Outflow' ? 'var(--primary-blue)' : 'var(--text-secondary)'
              }}
            >
              Outflow View
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="kpi-row-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
        <div className="card kpi-card" style={{ minHeight: '110px' }}>
          <div>
            <div className="kpi-value-row">
              <span className="kpi-value">₹{stats.volMtd}</span>
              <span className="kpi-unit">Cr</span>
            </div>
            <div className="kpi-title" style={{ marginTop: '8px' }}>Transaction Vol (MTD)</div>
          </div>
          <div className="kpi-footer">
            <span className="kpi-change-positive">
              <ArrowUpRight size={12} /> +6.4% vs Apr
            </span>
          </div>
        </div>

        <div className="card kpi-card" style={{ minHeight: '110px' }}>
          <div>
            <div className="kpi-value-row">
              <span className="kpi-value">{stats.totalTx}</span>
              <span className="kpi-unit">Lakh</span>
            </div>
            <div className="kpi-title" style={{ marginTop: '8px' }}>Total Transactions (MTD)</div>
          </div>
          <div className="kpi-footer">
            <span className="kpi-change-positive">
              <ArrowUpRight size={12} /> +8.1% vs Apr
            </span>
          </div>
        </div>

        <div className="card kpi-card" style={{ minHeight: '110px' }}>
          <div>
            <div className="kpi-value-row">
              <span className="kpi-value">₹{stats.netInflow.toFixed(2)}</span>
              <span className="kpi-unit">Cr</span>
            </div>
            <div className="kpi-title" style={{ marginTop: '8px' }}>Net Flow MTD</div>
          </div>
          <div className="kpi-footer">
            <span className="kpi-change-positive">
              <ArrowUpRight size={12} /> Inflow Positive
            </span>
          </div>
        </div>

        <div className="card kpi-card" style={{ minHeight: '110px' }}>
          <div>
            <div className="kpi-value-row">
              <span className="kpi-value">₹{stats.totalInflow.toFixed(2)}</span>
              <span className="kpi-unit">Cr</span>
            </div>
            <div className="kpi-title" style={{ marginTop: '8px' }}>Gross Inflow MTD</div>
          </div>
          <div className="kpi-footer">
            <span className="kpi-change-positive">
              <ArrowUpRight size={12} /> +12.3% MoM
            </span>
          </div>
        </div>

        <div className="card kpi-card" style={{ minHeight: '110px' }}>
          <div>
            <div className="kpi-value-row">
              <span className="kpi-value" style={{ color: 'var(--error-red)' }}>₹{stats.totalOutflow.toFixed(2)}</span>
              <span className="kpi-unit">Cr</span>
            </div>
            <div className="kpi-title" style={{ marginTop: '8px' }}>Gross Outflow MTD</div>
          </div>
          <div className="kpi-footer">
            <span style={{ color: 'var(--success-green)', fontWeight: '600' }}>
              Ratio: 1.26x Inflow
            </span>
          </div>
        </div>
      </div>

      {/* Heatmap Card */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-title-row">
          <h3 className="card-title">Daily Transactions Heatmap (Values in ₹ Crore)</h3>
          
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Filter Category:</span>
            <select 
              className="form-select"
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              style={{ padding: '4px 10px', fontSize: '0.75rem' }}
            >
              <option value="all">All Funds</option>
              <option value="equity">Equity</option>
              <option value="debt">Debt</option>
              <option value="hybrid">Hybrid</option>
              <option value="elss">ELSS</option>
              <option value="index">Index</option>
              <option value="liquid">Liquid</option>
              <option value="sectoral">Sectoral</option>
            </select>
          </div>
        </div>
        
        {/* Heatmap Grid Wrapper */}
        <div className="heatmap-table-wrap">
          <table className="heatmap-table">
            <thead>
              <tr>
                <th className="category-col">Fund Category</th>
                {Array.from({ length: 31 }, (_, i) => {
                  const day = i + 1;
                  const isMonthEnd = [29, 30, 31].includes(day);
                  return (
                    <th key={i} className={isMonthEnd ? 'month-end-day' : ''}>
                      D{day}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {filteredData.map((row, idx) => (
                <tr key={idx}>
                  <td className="category-cell">{row.name}</td>
                  {row.vals.map((v, i) => {
                    const day = i + 1;
                    const isMonthEnd = [29, 30, 31].includes(day);
                    const { bg, text } = getCellStyle(v);
                    
                    return (
                      <td key={i} className={isMonthEnd ? 'month-end-day' : ''}>
                        <div 
                          className="heatmap-cell"
                          style={{ backgroundColor: bg, color: text }}
                          onMouseMove={handleMouseMove}
                          onMouseEnter={() => handleCellHover({ fund: row.name, day, val: v })}
                          onMouseLeave={handleCellLeave}
                        >
                          {v === 0 ? '' : v}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div style={{ 
          marginTop: '16px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          fontSize: '0.72rem',
          color: 'var(--text-secondary)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>Low Volume</span>
            <div style={{ display: 'flex', gap: '2px' }}>
              {['#F8FAFC','#F0FDF4','#DCFCE7','#BBF7D0','#86EFAC','#4ADE80','#22C55E','#16A34A','#F59E0B','#F97316','#EF4444','#B91C1C'].map(c => (
                <div key={c} style={{ width: '12px', height: '12px', backgroundColor: c, borderRadius: '1px' }}></div>
              ))}
            </div>
            <span>High Volume / Critical Spikes</span>
          </div>
          <div>
            * D29-D31 indicate month-end peak redemption/SIP auto-debits (dashed sections).
          </div>
        </div>
      </div>

      {/* Month-End Insights */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <h3 className="card-title" style={{ marginBottom: '16px' }}>Month-End Insights (29-31 May 2026)</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
          <div className="card kpi-card" style={{ minHeight: 'auto', padding: '16px', backgroundColor: 'var(--bg-main)' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-secondary)' }}>TOTAL VALUE</span>
            <span style={{ fontSize: '1.6rem', fontWeight: '800', margin: '4px 0' }}>₹284 Cr</span>
            <span style={{ fontSize: '0.72rem', color: 'var(--success-green)', fontWeight: '600' }}>▲ 48.7% vs 26-28 May</span>
          </div>
          <div className="card kpi-card" style={{ minHeight: 'auto', padding: '16px', backgroundColor: 'var(--bg-main)' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-secondary)' }}>TOTAL TRANSACTIONS</span>
            <span style={{ fontSize: '1.6rem', fontWeight: '800', margin: '4px 0' }}>2,14,682</span>
            <span style={{ fontSize: '0.72rem', color: 'var(--success-green)', fontWeight: '600' }}>▲ 51.2% vs 26-28 May</span>
          </div>
          <div className="card kpi-card" style={{ minHeight: 'auto', padding: '16px', backgroundColor: 'var(--bg-main)' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-secondary)' }}>NET INFLOW</span>
            <span style={{ fontSize: '1.6rem', fontWeight: '800', margin: '4px 0' }}>₹56 Cr</span>
            <span style={{ fontSize: '0.72rem', color: 'var(--error-red)', fontWeight: '600' }}>▼ 12.8% vs 26-28 May</span>
          </div>
        </div>
      </div>

      {/* Odd vs Even Comparison & Top Days */}
      <div className="dashboard-grid-1" style={{ marginBottom: '24px' }}>
        <div className="card">
          <h3 className="card-title" style={{ marginBottom: '16px' }}>Odd vs Even Date Comparison</h3>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>METRIC</th>
                  <th className="text-right">ODD DATES</th>
                  <th className="text-right">EVEN DATES</th>
                  <th className="text-right">% DIFF of odd and even date</th>
                  <th className="text-right">MONTH ENDING</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ fontWeight: '600' }}>Total Transaction Value</td>
                  <td className="text-right mono">₹1,534 Cr</td>
                  <td className="text-right mono">₹1,311 Cr</td>
                  <td className="text-right mono" style={{ color: 'var(--success-green)', fontWeight: '700' }}>+17.0%</td>
                  <td className="text-right mono" style={{ fontWeight: '600' }}>₹2,845 Cr</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: '600' }}>Total Transactions</td>
                  <td className="text-right mono">7,58,214</td>
                  <td className="text-right mono">6,68,368</td>
                  <td className="text-right mono" style={{ color: 'var(--success-green)', fontWeight: '700' }}>+13.4%</td>
                  <td className="text-right mono" style={{ fontWeight: '600' }}>14,26,582</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: '600' }}>Average Ticket Size</td>
                  <td className="text-right mono">₹20,234</td>
                  <td className="text-right mono">₹19,624</td>
                  <td className="text-right mono" style={{ color: 'var(--success-green)', fontWeight: '700' }}>+3.1%</td>
                  <td className="text-right mono" style={{ fontWeight: '600' }}>₹19,942</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: '600' }}>Redemption Value</td>
                  <td className="text-right mono">₹612 Cr</td>
                  <td className="text-right mono">₹646 Cr</td>
                  <td className="text-right mono" style={{ color: 'var(--error-red)', fontWeight: '700' }}>-5.3%</td>
                  <td className="text-right mono" style={{ fontWeight: '600' }}>₹1,258 Cr</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3 className="card-title" style={{ marginTop: '24px', marginBottom: '16px' }}>Investor Segment Heatmap (Age Group)</h3>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Metric</th>
                  <th className="text-center">18-30</th>
                  <th className="text-center">31-45</th>
                  <th className="text-center">46-60</th>
                  <th className="text-center">60+</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ fontWeight: '600' }}>Purchase</td>
                  <td className="text-center"><span className="status-badge" style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success-green)' }}>High</span></td>
                  <td className="text-center"><span className="status-badge" style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success-green)' }}>High</span></td>
                  <td className="text-center"><span className="status-badge" style={{ backgroundColor: 'var(--warning-bg)', color: 'var(--warning-orange)' }}>Medium</span></td>
                  <td className="text-center"><span className="status-badge" style={{ backgroundColor: 'var(--error-bg)', color: 'var(--error-red)' }}>Low</span></td>
                </tr>
                <tr>
                  <td style={{ fontWeight: '600' }}>Redemption</td>
                  <td className="text-center"><span className="status-badge" style={{ backgroundColor: 'var(--error-bg)', color: 'var(--error-red)' }}>Low</span></td>
                  <td className="text-center"><span className="status-badge" style={{ backgroundColor: 'var(--warning-bg)', color: 'var(--warning-orange)' }}>Medium</span></td>
                  <td className="text-center"><span className="status-badge" style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success-green)' }}>High</span></td>
                  <td className="text-center"><span className="status-badge" style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success-green)' }}>High</span></td>
                </tr>
                <tr>
                  <td style={{ fontWeight: '600' }}>SIP</td>
                  <td className="text-center"><span className="status-badge" style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success-green)' }}>High</span></td>
                  <td className="text-center"><span className="status-badge" style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success-green)' }}>High</span></td>
                  <td className="text-center"><span className="status-badge" style={{ backgroundColor: 'var(--warning-bg)', color: 'var(--warning-orange)' }}>Medium</span></td>
                  <td className="text-center"><span className="status-badge" style={{ backgroundColor: 'var(--error-bg)', color: 'var(--error-red)' }}>Low</span></td>
                </tr>
                <tr>
                  <td style={{ fontWeight: '600' }}>Switch In</td>
                  <td className="text-center"><span className="status-badge" style={{ backgroundColor: 'var(--warning-bg)', color: 'var(--warning-orange)' }}>Medium</span></td>
                  <td className="text-center"><span className="status-badge" style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success-green)' }}>High</span></td>
                  <td className="text-center"><span className="status-badge" style={{ backgroundColor: 'var(--warning-bg)', color: 'var(--warning-orange)' }}>Medium</span></td>
                  <td className="text-center"><span className="status-badge" style={{ backgroundColor: 'var(--error-bg)', color: 'var(--error-red)' }}>Low</span></td>
                </tr>
                <tr>
                  <td style={{ fontWeight: '600' }}>Switch Out</td>
                  <td className="text-center"><span className="status-badge" style={{ backgroundColor: 'var(--error-bg)', color: 'var(--error-red)' }}>Low</span></td>
                  <td className="text-center"><span className="status-badge" style={{ backgroundColor: 'var(--warning-bg)', color: 'var(--warning-orange)' }}>Medium</span></td>
                  <td className="text-center"><span className="status-badge" style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success-green)' }}>High</span></td>
                  <td className="text-center"><span className="status-badge" style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success-green)' }}>High</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <h3 className="card-title" style={{ marginBottom: '16px' }}>Top Transaction Days</h3>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Day</th>
                  <th className="text-right">Tx Value (₹ Cr)</th>
                  <th className="text-right">Transactions</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="mono" style={{ fontWeight: '600' }}>31 May 2026</td>
                  <td>Sun</td>
                  <td className="text-right mono">₹96 Cr</td>
                  <td className="text-right mono">72,432</td>
                </tr>
                <tr>
                  <td className="mono" style={{ fontWeight: '600' }}>30 May 2026</td>
                  <td>Sat</td>
                  <td className="text-right mono">₹78 Cr</td>
                  <td className="text-right mono">58,103</td>
                </tr>
                <tr>
                  <td className="mono" style={{ fontWeight: '600' }}>29 May 2026</td>
                  <td>Fri</td>
                  <td className="text-right mono">₹60 Cr</td>
                  <td className="text-right mono">48,147</td>
                </tr>
                <tr>
                  <td className="mono" style={{ fontWeight: '600' }}>17 May 2026</td>
                  <td>Sun</td>
                  <td className="text-right mono">₹52 Cr</td>
                  <td className="text-right mono">41,382</td>
                </tr>
                <tr>
                  <td className="mono" style={{ fontWeight: '600' }}>15 May 2026</td>
                  <td>Fri</td>
                  <td className="text-right mono">₹48 Cr</td>
                  <td className="text-right mono">38,214</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Fund Manager Held AUM & Sector Allocations */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <h3 className="card-title" style={{ marginBottom: '16px' }}>Fund Manager Held AUM & Sector Allocations</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
          {/* Held AUM Card */}
          <div className="card kpi-card" style={{ minHeight: 'auto', padding: '20px', backgroundColor: 'var(--bg-main)', borderLeft: '4px solid var(--primary-blue)', boxShadow: 'none' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-secondary)' }}>FUND MANAGER HELD AUM</span>
            <span style={{ fontSize: '2.2rem', fontWeight: '800', margin: '8px 0', color: 'var(--primary-blue)' }}>₹8,432 Cr</span>
            <div style={{ fontSize: '0.75rem', lineHeight: '1.5', color: 'var(--text-secondary)', marginTop: '8px' }}>
              <strong>Diversification Summary:</strong><br/>
              Highly diversified across 42 high-growth stocks, maintaining SEBI concentration norms within 10% sector cap rules.
            </div>
          </div>
          {/* Allocations breakdown */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h4 style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-primary)' }}>Sector &amp; Industry Allocation Breakdown</h4>
            <div className="portfolio-progress-container" style={{ gap: '8px' }}>
              <div className="progress-row">
                <div className="progress-label-row" style={{ fontSize: '0.75rem' }}>
                  <span>Finance &amp; Private Banking</span>
                  <strong className="mono">35% Allocation (₹2,951 Cr)</strong>
                </div>
                <div className="progress-track" style={{ height: '6px' }}>
                  <div className="progress-fill" style={{ width: '35%', backgroundColor: 'var(--primary-blue)' }}></div>
                </div>
              </div>
              <div className="progress-row">
                <div className="progress-label-row" style={{ fontSize: '0.75rem' }}>
                  <span>Information Technology &amp; Software</span>
                  <strong className="mono">20% Allocation (₹1,686 Cr)</strong>
                </div>
                <div className="progress-track" style={{ height: '6px' }}>
                  <div className="progress-fill" style={{ width: '20%', backgroundColor: 'var(--success-green)' }}></div>
                </div>
              </div>
              <div className="progress-row">
                <div className="progress-label-row" style={{ fontSize: '0.75rem' }}>
                  <span>Healthcare &amp; Pharmaceuticals</span>
                  <strong className="mono">15% Allocation (₹1,264 Cr)</strong>
                </div>
                <div className="progress-track" style={{ height: '6px' }}>
                  <div className="progress-fill" style={{ width: '15%', backgroundColor: '#8B5CF6' }}></div>
                </div>
              </div>
              <div className="progress-row">
                <div className="progress-label-row" style={{ fontSize: '0.75rem' }}>
                  <span>Energy &amp; Infrastructure</span>
                  <strong className="mono">12% Allocation (₹1,011 Cr)</strong>
                </div>
                <div className="progress-track" style={{ height: '6px' }}>
                  <div className="progress-fill" style={{ width: '12%', backgroundColor: 'var(--warning-orange)' }}></div>
                </div>
              </div>
              <div className="progress-row">
                <div className="progress-label-row" style={{ fontSize: '0.75rem' }}>
                  <span>Consumer &amp; Retail</span>
                  <strong className="mono">10% Allocation (₹843 Cr)</strong>
                </div>
                <div className="progress-track" style={{ height: '6px' }}>
                  <div className="progress-fill" style={{ width: '10%', backgroundColor: 'var(--error-red)' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Tooltip */}
      {hoveredCell && (
        <div 
          className="heatmap-tooltip"
          style={{ 
            display: 'block', 
            left: `${tooltipPos.x}px`, 
            top: `${tooltipPos.y}px`
          }}
        >
          <div style={{ fontWeight: '700', fontSize: '0.75rem', marginBottom: '2px' }}>{hoveredCell.fund}</div>
          <div>Day: {hoveredCell.day} of the Month</div>
          <div>Value: <span style={{ color: '#22C55E', fontWeight: '700' }}>₹{hoveredCell.val} Cr</span></div>
          <div style={{ fontSize: '0.65rem', color: '#9CA3AF', marginTop: '2px' }}>
            Type: {viewMode} Transaction
          </div>
        </div>
      )}
    </div>
  );
}
