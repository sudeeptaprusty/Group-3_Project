import React, { useState, useEffect } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import { useChartTheme } from '../useChartTheme';
import {
  TrendingUp, Users, ArrowUpRight, ArrowDownRight,
  AlertTriangle, ShieldAlert, CheckCircle2, PieChart
} from 'lucide-react';
import { usePlatform } from '../context/PlatformContext';

export default function SIPTrendAnalysis({ autoRefresh = true }) {
  const ct = useChartTheme();
  const { sipSchedules = [], allTransactions = [] } = usePlatform() || {};

  const [chartPeriod, setChartPeriod] = useState('6M');
  const [selectedDate, setSelectedDate] = useState('');

  // 1. Safe case-insensitive status filtering
  const settledTxns = allTransactions.filter(t => {
    const statusStr = String(t.status || t.STATUS || '').toUpperCase();
    return statusStr === 'SETTLED' || statusStr === 'SUCCESS';
  });

  // Dynamic available months list based on transaction history
  const availableMonths = Array.from(new Set(allTransactions.map(t => {
    const d = new Date(t.created_at || t.settled_at);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[d.getMonth()]} ${d.getFullYear()}`;
  }))).sort((a, b) => {
    const [aMon, aYear] = a.split(' ');
    const [bMon, bYear] = b.split(' ');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const aDate = new Date(parseInt(aYear), months.indexOf(aMon));
    const bDate = new Date(parseInt(bYear), months.indexOf(bMon));
    return bDate - aDate;
  });

  const activeMonth = selectedDate || availableMonths[0] || 'Jun 2026';

  // Parse activeMonth for filtering
  const [selMon, selYr] = activeMonth.split(' ');
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const selMonthIdx = monthNames.indexOf(selMon);
  const selYearNum = parseInt(selYr);

  // 2. RESTORED: Filter transactions safely for the selected month
  const monthlyTxns = settledTxns.filter(t => {
    const d = new Date(t.created_at || t.settled_at);
    return d.getMonth() === selMonthIdx && d.getFullYear() === selYearNum;
  });

  // 3. Filter SIP transactions by type
  const monthlySipTxns = monthlyTxns.filter(t => t.transaction_type === 'SIP_AUTO' || t.transaction_type === 'SIP');

  // Calculate monthly metrics (Capped at Cr conversion scale)
  const sipInflows = monthlySipTxns.reduce((sum, t) => sum + Number(t.amount || 0), 0) / 10000000; // Cr
  
  // SIP AUM = Cumulative sum of all SIP transactions up to the selected month
  const historicalSipTxns = settledTxns.filter(t => {
    const d = new Date(t.created_at || t.settled_at);
    const targetDate = new Date(selYearNum, selMonthIdx + 1, 0); // end of selected month
    return d <= targetDate && (t.transaction_type === 'SIP_AUTO' || t.transaction_type === 'SIP');
  });
  const sipAum = historicalSipTxns.reduce((sum, t) => sum + Number(t.amount || 0), 0) / 10000000; // Cr

  // Active SIP schedules in that month
  const activeSips = sipSchedules.filter(s => {
    const sStatus = String(s.status || s.STATUS || '').toUpperCase();
    if (sStatus !== 'ACTIVE') return false;
    const start = new Date(s.start_date || s.created_at);
    const targetLimit = new Date(selYearNum, selMonthIdx + 1, 0);
    return start <= targetLimit;
  }).length;

  const newSips = sipSchedules.filter(s => {
    const start = new Date(s.start_date || s.created_at);
    return start.getMonth() === selMonthIdx && start.getFullYear() === selYearNum;
  }).length;

  const discontinuations = sipSchedules.filter(s => {
    const sStatus = String(s.status || s.STATUS || '').toUpperCase();
    if (sStatus !== 'CANCELLED' && sStatus !== 'COMPLETED') return false;
    const end = new Date(s.updated_at || s.end_date);
    return end.getMonth() === selMonthIdx && end.getFullYear() === selYearNum;
  }).length;

  // Stoppage ratio percentage: discontinuations / (active + discontinuations)
  const stoppageValue = activeSips + discontinuations > 0
    ? (discontinuations / (activeSips + discontinuations)) * 100
    : 0;

  // --- Real-time Simulation Loop ---
  useEffect(() => {
    // Keep static as requested
  }, [autoRefresh]);

  // Get active period labels and data based on selected chartPeriod (6M, 9M, 12M)
  const getChartData = () => {
    const monthsLimit = chartPeriod === '12M' ? 12 : (chartPeriod === '9M' ? 9 : 6);
    const labels = [];
    const data = [];

    for (let i = monthsLimit - 1; i >= 0; i--) {
      let targetMonthIdx = selMonthIdx - i;
      let targetYear = selYearNum;
      
      while (targetMonthIdx < 0) {
        targetMonthIdx += 12;
        targetYear -= 1;
      }

      labels.push(`${monthNames[targetMonthIdx]} ${targetYear}`);

      const monthTxns = settledTxns.filter(t => {
        const d = new Date(t.created_at || t.settled_at);
        return d.getMonth() === targetMonthIdx && d.getFullYear() === targetYear && (t.transaction_type === 'SIP_AUTO' || t.transaction_type === 'SIP');
      });
      const monthInflowCr = monthTxns.reduce((sum, t) => sum + Number(t.amount || 0), 0) / 10000000;
      data.push(parseFloat(monthInflowCr.toFixed(2)));
    }

    return { labels, data };
  };

  const { labels: chartLabels, data: chartData } = getChartData();

  // Line Chart Configs
  const lineChartData = {
    labels: chartLabels,
    datasets: [
      {
        label: 'SIP Inflows (₹ Crore)',
        data: chartData,
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.04)',
        borderWidth: 2.5,
        pointBackgroundColor: '#3B82F6',
        pointBorderColor: '#FFFFFF',
        pointBorderWidth: 1.5,
        pointRadius: 4,
        fill: true,
        tension: 0.35
      }
    ]
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: ct.tooltipBg,
        borderWidth: 1,
        borderColor: ct.tooltipBorder,
        callbacks: {
          label: context => ` Inflows: ₹${parseFloat(context.raw).toFixed(2)} Cr`
        }
      }
    },
    scales: {
      y: {
        min: 0,
        suggestedMax: Math.max(...chartData, 10) * 1.2,
        grid: { color: ct.gridColor },
        ticks: { color: ct.tickColor, font: { size: 10 } }
      },
      x: {
        grid: { display: false },
        ticks: { color: ct.tickColor, font: { size: 10 } }
      }
    }
  };

  // Bar Chart Configs
  const barChartData = {
    labels: ['New Registrations', 'Discontinuations'],
    datasets: [{
      data: [newSips, discontinuations],
      backgroundColor: ['#22C55E', '#EF4444'],
      borderRadius: 2,
      barThickness: 45
    }]
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: ct.tooltipBg,
        borderWidth: 1,
        borderColor: ct.tooltipBorder,
        callbacks: {
          label: context => ` ${context.label}: ${context.raw}`
        }
      }
    },
    scales: {
      y: {
        min: 0,
        suggestedMax: Math.max(newSips, discontinuations, 5) * 1.2,
        grid: { color: ct.gridColor },
        ticks: { color: ct.tickColor, font: { size: 10 } }
      },
      x: {
        grid: { display: false },
        ticks: { color: ct.tickColorBold, font: { size: 11, weight: '600' } }
      }
    }
  };

  // Gauge needle calculations
  const stoppageAngle = 180 - (stoppageValue / 120) * 180; // maps 0-120% to 180 to 0 degrees
  const stoppageAngleRad = (stoppageAngle * Math.PI) / 180;
  const needleX = 100 + 72 * Math.cos(stoppageAngleRad);
  const needleY = 100 - 72 * Math.sin(stoppageAngleRad);

  return (
    <div>
      {/* Page Header */}
      <div className="page-header-strip">
        <div className="page-title-area">
          <h1 className="page-title">SIP Trend Analysis</h1>
          <p className="page-subtitle">Track mutual fund SIP inflows, investor retention, and stoppage ratios</p>
        </div>

        <div className="header-controls">
          <select 
            className="form-select" 
            value={activeMonth} 
            onChange={(e) => setSelectedDate(e.target.value)}
          >
            {availableMonths.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
            {availableMonths.length === 0 && (
              <option value="Jun 2026">Jun 2026</option>
            )}
          </select>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="kpi-row-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
        {/* KPI 1 */}
        <div className="card kpi-card">
          <div>
            <div className="kpi-card-header">
              <div className="kpi-icon-box" style={{ backgroundColor: 'rgba(34, 197, 94, 0.08)', color: 'var(--success-green)' }}>
                <TrendingUp size={16} />
              </div>
              <span className="kpi-badge kpi-badge-success">Strong</span>
            </div>
            <div className="kpi-value-row">
              <span className="kpi-value">₹{Math.round(sipInflows).toLocaleString()}</span>
              <span className="kpi-unit">Cr</span>
            </div>
            <div className="kpi-title">SIP INFLOWS</div>
          </div>
          <div className="kpi-footer">
            <span className="kpi-change-positive">
              <ArrowUpRight size={12} /> +6.2% vs Apr
            </span>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="card kpi-card">
          <div>
            <div className="kpi-card-header">
              <div className="kpi-icon-box" style={{ backgroundColor: 'rgba(124, 58, 237, 0.08)', color: '#7C3AED' }}>
                <PieChart size={16} />
              </div>
              <span className="kpi-badge kpi-badge-info">Stable</span>
            </div>
            <div className="kpi-value-row">
              <span className="kpi-value">₹{sipAum.toFixed(2)}</span>
              <span className="kpi-unit">Lakh Cr</span>
            </div>
            <div className="kpi-title">SIP AUM</div>
          </div>
          <div className="kpi-footer">
            <span className="kpi-change-positive">
              <ArrowUpRight size={12} /> +0.8% vs Apr
            </span>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="card kpi-card">
          <div>
            <div className="kpi-card-header">
              <div className="kpi-icon-box" style={{ backgroundColor: 'rgba(37, 99, 235, 0.08)', color: 'var(--primary-blue)' }}>
                <Users size={16} />
              </div>
              <span className="kpi-badge kpi-badge-info">Growing</span>
            </div>
            <div className="kpi-value-row">
              <span className="kpi-value">{activeSips.toFixed(2)}</span>
              <span className="kpi-unit">Cr</span>
            </div>
            <div className="kpi-title">ACTIVE SIP ACCOUNTS</div>
          </div>
          <div className="kpi-footer">
            <span className="kpi-change-positive">
              <ArrowUpRight size={12} /> +1.1% vs Apr
            </span>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="card kpi-card">
          <div>
            <div className="kpi-card-header">
              <div className="kpi-icon-box" style={{ backgroundColor: 'rgba(34, 197, 94, 0.08)', color: 'var(--success-green)' }}>
                <CheckCircle2 size={16} />
              </div>
              <span className="kpi-badge kpi-badge-success">Strong</span>
            </div>
            <div className="kpi-value-row">
              <span className="kpi-value">{newSips.toFixed(2)}</span>
              <span className="kpi-unit">Lakh</span>
            </div>
            <div className="kpi-title">NEW REGISTRATIONS</div>
          </div>
          <div className="kpi-footer">
            <span className="kpi-change-positive">
              <ArrowUpRight size={12} /> +8.48% vs Apr
            </span>
          </div>
        </div>

        {/* KPI 5 */}
        <div className="card kpi-card">
          <div>
            <div className="kpi-card-header">
              <div className="kpi-icon-box" style={{ backgroundColor: 'rgba(245, 158, 11, 0.08)', color: 'var(--warning-orange)' }}>
                <AlertTriangle size={16} />
              </div>
              <span className="kpi-badge kpi-badge-warning">Elevated</span>
            </div>
            <div className="kpi-value-row">
              <span className="kpi-value">{discontinuations.toFixed(2)}</span>
              <span className="kpi-unit">Lakh</span>
            </div>
            <div className="kpi-title">DISCONTINUATIONS</div>
          </div>
          <div className="kpi-footer">
            <span className="kpi-change-negative" style={{ color: 'var(--warning-orange)' }}>
              <ArrowUpRight size={12} /> +3.1% vs Apr
            </span>
          </div>
        </div>

        {/* KPI 6 */}
        <div className="card kpi-card" style={{ border: '1.5px solid var(--error-red)' }}>
          <div>
            <div className="kpi-card-header">
              <div className="kpi-icon-box" style={{ backgroundColor: 'rgba(239, 68, 68, 0.08)', color: 'var(--error-red)' }}>
                <ShieldAlert size={16} />
              </div>
              <span className="kpi-badge kpi-badge-error">High Alert</span>
            </div>
            <div className="kpi-value-row">
              <span className="kpi-value" style={{ color: 'var(--error-red)' }}>{stoppageValue.toFixed(2)}%</span>
            </div>
            <div className="kpi-title">SIP STOPPAGE RATIO</div>
          </div>
          <div className="kpi-footer">
            <span className="kpi-change-negative">
              <ArrowDownRight size={12} /> -0.74 pp vs Apr
            </span>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="dashboard-grid-3">
        {/* Chart 1: SIP Inflow trend */}
        <div className="card" style={{ gridColumn: 'span 2' }}>
          <div className="card-title-row">
            <div>
              <h3 className="card-title">SIP Inflows Trend (Monthly)</h3>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Monthly SIP inflows progression for the selected {chartPeriod === '12M' ? '12-month' : (chartPeriod === '9M' ? '9-month' : '6-month')} period.
              </div>
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              {['6M', '9M', '12M'].map(p => (
                <button 
                  key={p}
                  onClick={() => setChartPeriod(p)}
                  className={`dropdown-filter-btn`}
                  style={{ 
                    padding: '3px 8px', 
                    fontSize: '0.7rem', 
                    borderColor: chartPeriod === p ? 'var(--primary-blue)' : 'var(--border-color)',
                    backgroundColor: chartPeriod === p ? 'var(--accent-blue-bg)' : 'var(--bg-main)',
                    color: chartPeriod === p ? 'var(--primary-blue)' : 'var(--text-secondary)'
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div className="chart-wrap-container">
            <Line data={lineChartData} options={lineChartOptions} />
          </div>
        </div>

        {/* Chart 2: Stoppage Ratio Gauge */}
        <div className="card">
          <h3 className="card-title">SIP Stoppage Ratio</h3>
          <div className="card-subtitle">(Target: &lt;80% ratio)</div>
          
          <div className="gauge-chart-container">
            <svg viewBox="0 0 200 115" className="gauge-svg-element">
              {/* Dial Arc background */}
              <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="#E5E7EB" strokeWidth="12" strokeLinecap="round" />
              
              {/* Gauge color zones */}
              <path d="M 20 100 A 80 80 0 0 1 100 20" fill="none" stroke="#22C55E" strokeWidth="12" strokeLinecap="round" />
              <path d="M 100 20 A 80 80 0 0 1 140 30.7" fill="none" stroke="#F59E0B" strokeWidth="12" strokeLinecap="round" />
              <path d="M 140 30.7 A 80 80 0 0 1 180 100" fill="none" stroke="#EF4444" strokeWidth="12" strokeLinecap="round" />
              
              {/* Dial Needle - Black in White Theme */}
              <line x1="100" y1="100" x2={needleX} y2={needleY} stroke="#111827" strokeWidth="3.2" strokeLinecap="round" />
              <circle cx="100" cy="100" r="5.5" fill="#111827" />
              
              {/* Tick labels */}
              <text x="18" y="112" fontSize="7.5" fontWeight="700" fill="#6B7280" textAnchor="middle">0%</text>
              <text x="100" y="14" fontSize="7.5" fontWeight="700" fill="#6B7280" textAnchor="middle">60%</text>
              <text x="142" y="20" fontSize="7.5" fontWeight="700" fill="#6B7280" textAnchor="middle">80%</text>
              <text x="182" y="112" fontSize="7.5" fontWeight="700" fill="#6B7280" textAnchor="middle">120%</text>
            </svg>
            
            <div className="gauge-center-text-overlay">
              <span className="gauge-score">{stoppageValue.toFixed(1)}%</span>
              <span className="gauge-label-badge" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--error-red)' }}>
                High Alert
              </span>
              <span className="gauge-caption" style={{ marginTop: '2px' }}>
                vs Apr: <strong style={{ color: 'var(--success-green)' }}>↓ 0.74 pp</strong>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2 Grid */}
      <div className="dashboard-grid-2" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', marginBottom: '24px' }}>
        {/* New vs Closed registrations */}
        <div className="card">
          <h3 className="card-title">New SIP Registrations vs Discontinuations</h3>
          <div className="card-subtitle">Comparing accounts onboarding vs cancellations (Lakhs)</div>
          
          <div className="chart-wrap-container">
            <Bar data={barChartData} options={barChartOptions} />
          </div>
          
          <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--success-green)' }}>
              Net Account Additions: +{(newSips - discontinuations).toFixed(2)} Lakh
            </span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
              Onboarding pace exceeds cancellations.
            </span>
          </div>
        </div>

        {/* Growth Category Table */}
        <div className="card">
          <h3 className="card-title">SIP Growth by Scheme Category</h3>
          <div className="card-subtitle">Detailed categorization of SIP inflows (May 2026)</div>
          
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th className="text-right">Inflow (₹ Cr)</th>
                  <th className="text-right">MoM Growth</th>
                  <th className="text-right">YoY Growth</th>
                  <th className="text-right">Share (%)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ fontWeight: '600' }}>Equity - Large Cap</td>
                  <td className="text-right mono">10,842</td>
                  <td className="text-right mono" style={{ color: 'var(--success-green)' }}>↑ 7.48%</td>
                  <td className="text-right mono" style={{ color: 'var(--success-green)' }}>↑ 18.62%</td>
                  <td className="text-right mono">35.03%</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: '600' }}>Equity - Mid Cap</td>
                  <td className="text-right mono">5,682</td>
                  <td className="text-right mono" style={{ color: 'var(--success-green)' }}>↑ 8.91%</td>
                  <td className="text-right mono" style={{ color: 'var(--success-green)' }}>↑ 24.31%</td>
                  <td className="text-right mono">18.35%</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: '600' }}>Equity - Small Cap</td>
                  <td className="text-right mono">3,876</td>
                  <td className="text-right mono" style={{ color: 'var(--success-green)' }}>↑ 9.37%</td>
                  <td className="text-right mono" style={{ color: 'var(--success-green)' }}>↑ 26.74%</td>
                  <td className="text-right mono">12.52%</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: '600' }}>Hybrid (Aggressive)</td>
                  <td className="text-right mono">3,421</td>
                  <td className="text-right mono" style={{ color: 'var(--success-green)' }}>↑ 4.12%</td>
                  <td className="text-right mono" style={{ color: 'var(--success-green)' }}>↑ 12.80%</td>
                  <td className="text-right mono">11.05%</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: '600' }}>Debt - Short Duration</td>
                  <td className="text-right mono">2,114</td>
                  <td className="text-right mono" style={{ color: 'var(--error-red)' }}>↓ 2.15%</td>
                  <td className="text-right mono" style={{ color: 'var(--success-green)' }}>↑ 3.42%</td>
                  <td className="text-right mono">6.83%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
