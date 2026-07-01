import React, { useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  TrendingUp,
  Landmark,
  Award,
  Sparkles,
  Wallet,
  Trophy,
  ChevronRight,
  Info,
  AlertTriangle
} from 'lucide-react';
import { useChartTheme } from '../useChartTheme';

export default function PerformanceBenchmarking() {
  const ct = useChartTheme();
  const [timePeriod, setTimePeriod] = useState('3M');

  // Hardcoded historical data for the Line chart to match periods
  const datasetsByPeriod = {
    '1M': {
      labels: ['01 Jun', '05 Jun', '10 Jun', '15 Jun', '20 Jun', '25 Jun', '27 Jun'],
      portfolio: [8.5, 9.8, 11.2, 10.4, 12.8, 13.9, 14.28],
      benchmark: [7.2, 8.1, 9.4, 8.8, 10.5, 11.1, 11.52],
      blueTop: '25%',
      greyTop: '45%'
    },
    '3M': {
      // Matches the exact X-axis in the screenshot and user prompt
      labels: ['01 May', '11 May', '21 May', '31 May', '10 Jun', '20 Jun', '27 Jun'],
      portfolio: [1.2, 4.5, 3.8, 7.6, 9.4, 12.1, 14.28],
      benchmark: [0.5, 2.8, 2.1, 5.2, 7.1, 9.5, 11.52],
      blueTop: '25%',
      greyTop: '41%'
    },
    '6M': {
      labels: ['Jan 2026', 'Feb 2026', 'Mar 2026', 'Apr 2026', 'May 2026', 'Jun 2026'],
      portfolio: [-2.1, 1.5, 4.8, 9.2, 11.6, 14.28],
      benchmark: [-3.5, 0.1, 2.9, 7.0, 9.1, 11.52],
      blueTop: '25%',
      greyTop: '43%'
    },
    '1Y': {
      labels: ['Jul 2025', 'Sep 2025', 'Nov 2025', 'Jan 2026', 'Mar 2026', 'May 2026', 'Jun 2026'],
      portfolio: [-4.2, -1.0, 3.5, 6.8, 10.1, 12.9, 14.28],
      benchmark: [-5.0, -2.5, 1.2, 4.5, 7.8, 10.1, 11.52],
      blueTop: '25%',
      greyTop: '45%'
    }
  };

  const activeData = datasetsByPeriod[timePeriod];

  const lineChartData = {
    labels: activeData.labels,
    datasets: [
      {
        label: 'Your Portfolio',
        data: activeData.portfolio,
        borderColor: '#2962FF',
        backgroundColor: 'rgba(41, 98, 255, 0.03)',
        borderWidth: 3,
        pointBackgroundColor: '#2962FF',
        pointBorderColor: '#FFFFFF',
        pointBorderWidth: 1.5,
        pointRadius: 4,
        fill: true,
        tension: 0.3
      },
      {
        label: 'Benchmark (NIFTY 50 TRI)',
        data: activeData.benchmark,
        borderColor: '#9CA3AF',
        backgroundColor: 'rgba(156, 163, 175, 0.01)',
        borderWidth: 2.5,
        pointBackgroundColor: '#9CA3AF',
        pointBorderColor: '#FFFFFF',
        pointBorderWidth: 1.5,
        pointRadius: 4,
        fill: false,
        tension: 0.3
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
          label: context => ` ${context.dataset.label}: ${context.raw.toFixed(2)}%`
        }
      }
    },
    scales: {
      y: {
        min: -5,
        max: 20,
        grid: { color: ct.gridColor },
        ticks: { 
          color: ct.tickColor, 
          font: { size: 10 },
          callback: (value) => `${value}%`
        }
      },
      x: {
        grid: { display: false },
        ticks: { color: ct.tickColor, font: { size: 10 } }
      }
    }
  };

  return (
    <div style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Page Header */}
      <div className="page-header-strip">
        <div className="page-title-area">
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
            <span>FinTrend Analytic Platform</span>
            <ChevronRight size={10} />
            <span style={{ fontWeight: '600', color: 'var(--primary-blue)' }}>Performance & Benchmarking</span>
          </div>
          <h1 className="page-title">Performance & Benchmarking</h1>
          <p className="page-subtitle">Evaluate portfolio performance against benchmarks</p>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        {/* KPI 1 */}
        <div className="card kpi-card" style={{ minHeight: '110px' }}>
          <div>
            <div className="kpi-card-header" style={{ justifyContent: 'space-between', display: 'flex', alignItems: 'flex-start' }}>
              <div className="kpi-title" style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '700' }}>
                Portfolio Return (XIRR)
              </div>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: 'rgba(23, 163, 74, 0.08)',
                color: '#17A34A',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <TrendingUp size={16} />
              </div>
            </div>
            <div className="kpi-value-row" style={{ marginTop: '8px' }}>
              <span className="kpi-value" style={{ fontSize: '1.5rem', fontWeight: '800', color: '#17A34A' }}>14.28%</span>
            </div>
          </div>
          <div className="kpi-footer" style={{ marginTop: '12px', fontSize: '0.7rem', color: '#17A34A', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600' }}>
            ▲ 1.92% vs prev. period
          </div>
        </div>

        {/* KPI 2 */}
        <div className="card kpi-card" style={{ minHeight: '110px' }}>
          <div>
            <div className="kpi-card-header" style={{ justifyContent: 'space-between', display: 'flex', alignItems: 'flex-start' }}>
              <div className="kpi-title" style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '700' }}>
                Benchmark Return
              </div>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: 'rgba(41, 98, 255, 0.08)',
                color: '#2962FF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Landmark size={16} />
              </div>
            </div>
            <div className="kpi-value-row" style={{ marginTop: '8px' }}>
              <span className="kpi-value" style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-primary)' }}>11.52%</span>
            </div>
          </div>
          <div className="kpi-footer" style={{ marginTop: '12px', fontSize: '0.7rem', color: '#17A34A', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600' }}>
            ▲ 1.15%
          </div>
        </div>

        {/* KPI 3 */}
        <div className="card kpi-card" style={{ minHeight: '110px' }}>
          <div>
            <div className="kpi-card-header" style={{ justifyContent: 'space-between', display: 'flex', alignItems: 'flex-start' }}>
              <div className="kpi-title" style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '700' }}>
                Alpha
              </div>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: 'rgba(23, 163, 74, 0.08)',
                color: '#17A34A',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Award size={16} />
              </div>
            </div>
            <div className="kpi-value-row" style={{ marginTop: '8px' }}>
              <span className="kpi-value" style={{ fontSize: '1.5rem', fontWeight: '800', color: '#17A34A' }}>2.76%</span>
            </div>
          </div>
          <div className="kpi-footer" style={{ marginTop: '12px', fontSize: '0.7rem', color: '#17A34A', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600' }}>
            ▲ 0.77%
          </div>
        </div>

        {/* KPI 4 */}
        <div className="card kpi-card" style={{ minHeight: '110px' }}>
          <div>
            <div className="kpi-card-header" style={{ justifyContent: 'space-between', display: 'flex', alignItems: 'flex-start' }}>
              <div className="kpi-title" style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '700' }}>
                Sharpe Ratio
              </div>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: 'rgba(139, 92, 246, 0.08)',
                color: '#8B5CF6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Sparkles size={16} />
              </div>
            </div>
            <div className="kpi-value-row" style={{ marginTop: '8px' }}>
              <span className="kpi-value" style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-primary)' }}>1.32</span>
            </div>
          </div>
          <div className="kpi-footer" style={{ marginTop: '12px', fontSize: '0.7rem', color: '#17A34A', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600' }}>
            ▲ 0.08
          </div>
        </div>

        {/* KPI 5 */}
        <div className="card kpi-card" style={{ minHeight: '110px' }}>
          <div>
            <div className="kpi-card-header" style={{ justifyContent: 'space-between', display: 'flex', alignItems: 'flex-start' }}>
              <div className="kpi-title" style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '700' }}>
                Total AUM
              </div>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: 'rgba(41, 98, 255, 0.08)',
                color: '#2962FF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Wallet size={16} />
              </div>
            </div>
            <div className="kpi-value-row" style={{ marginTop: '8px' }}>
              <span className="kpi-value" style={{ fontSize: '1.3rem', fontWeight: '800', color: 'var(--text-primary)' }}>₹2.89 Lakh Cr</span>
            </div>
          </div>
          <div className="kpi-footer" style={{ marginTop: '12px', fontSize: '0.7rem', color: '#17A34A', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600' }}>
            ▲ 2.35% vs prev. period
          </div>
        </div>

        {/* KPI 6 */}
        <div className="card kpi-card" style={{ minHeight: '110px' }}>
          <div>
            <div className="kpi-card-header" style={{ justifyContent: 'space-between', display: 'flex', alignItems: 'flex-start' }}>
              <div className="kpi-title" style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '700' }}>
                Portfolio Rank
              </div>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: 'rgba(245, 158, 11, 0.08)',
                color: '#F59E0B',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Trophy size={16} />
              </div>
            </div>
            <div className="kpi-value-row" style={{ marginTop: '8px' }}>
              <span className="kpi-value" style={{ fontSize: '1.5rem', fontWeight: '800', color: '#F59E0B' }}>5 / 24</span>
            </div>
          </div>
          <div className="kpi-footer" style={{ marginTop: '12px', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            In Large Cap Category
          </div>
        </div>
      </div>

      {/* Main Analytics Section (65% / 35% Split) */}
      <div className="dashboard-grid-3" style={{ marginBottom: '24px' }}>
        {/* Left Panel (65% Width) */}
        <div className="card" style={{ gridColumn: 'span 2' }}>
          <div className="card-title-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <h3 className="card-title" style={{ margin: 0 }}>Portfolio vs Benchmark Performance</h3>
              <Info size={14} style={{ color: 'var(--text-muted)', cursor: 'pointer' }} title="Comparison chart of portfolio returns vs standard benchmark index" />
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              {['1M', '3M', '6M', '1Y'].map(period => (
                <button
                  key={period}
                  onClick={() => setTimePeriod(period)}
                  className="dropdown-filter-btn"
                  style={{
                    padding: '4px 10px',
                    fontSize: '0.72rem',
                    fontWeight: '700',
                    border: '1.5px solid var(--border-color)',
                    backgroundColor: timePeriod === period ? '#2962FF' : 'var(--bg-main)',
                    color: timePeriod === period ? '#FFFFFF' : 'var(--text-secondary)'
                  }}
                >
                  {period}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', fontSize: '0.72rem', fontWeight: '600' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#2962FF' }}>
              <span style={{ width: '12px', height: '3px', backgroundColor: '#2962FF', display: 'inline-block' }}></span>
              Your Portfolio
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#9CA3AF' }}>
              <span style={{ width: '12px', height: '3px', backgroundColor: '#9CA3AF', display: 'inline-block' }}></span>
              Benchmark (NIFTY 50 TRI)
            </span>
          </div>

          {/* Interactive Line Chart with Ending Labels */}
          <div style={{ position: 'relative', height: '300px', width: '100%' }}>
            <Line data={lineChartData} options={lineChartOptions} />
            
            {/* Absolute positioned ending value boxes to match image */}
            <div style={{
              position: 'absolute',
              right: '4px',
              top: activeData.blueTop,
              backgroundColor: '#2962FF',
              color: '#FFFFFF',
              fontSize: '0.72rem',
              fontWeight: '800',
              padding: '3px 8px',
              border: '1.5px solid #FFFFFF',
              boxShadow: 'var(--shadow-sm)'
            }}>
              14.28%
            </div>
            <div style={{
              position: 'absolute',
              right: '4px',
              top: activeData.greyTop,
              backgroundColor: '#9CA3AF',
              color: '#FFFFFF',
              fontSize: '0.72rem',
              fontWeight: '800',
              padding: '3px 8px',
              border: '1.5px solid #FFFFFF',
              boxShadow: 'var(--shadow-sm)'
            }}>
              11.52%
            </div>
          </div>

          <div className="kpi-footer" style={{ marginTop: '16px', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            Returns are annualized for periods &gt;1 Year
          </div>
        </div>

        {/* Right Panel (35% Width) */}
        <div className="card">
          <h3 className="card-title" style={{ marginBottom: '16px' }}>Performance Summary</h3>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Metric</th>
                  <th className="text-right">Your Portfolio</th>
                  <th className="text-right">Benchmark</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ fontWeight: '600' }}>Return (3M)</td>
                  <td className="text-right mono" style={{ color: '#17A34A', fontWeight: '700' }}>14.28%</td>
                  <td className="text-right mono">11.52%</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: '600' }}>Return (1Y)</td>
                  <td className="text-right mono" style={{ color: '#17A34A', fontWeight: '700' }}>17.65%</td>
                  <td className="text-right mono">13.24%</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: '600' }}>Alpha (3M)</td>
                  <td className="text-right mono" style={{ color: '#17A34A', fontWeight: '700' }}>2.76%</td>
                  <td className="text-right mono" style={{ color: 'var(--text-muted)' }}>—</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: '600' }}>Sharpe Ratio</td>
                  <td className="text-right mono" style={{ fontWeight: '600' }}>1.32</td>
                  <td className="text-right mono">1.05</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: '600' }}>Max Drawdown</td>
                  <td className="text-right mono" style={{ color: '#17A34A', fontWeight: '700' }}>-8.62%</td>
                  <td className="text-right mono" style={{ color: '#17A34A', fontWeight: '700' }}>-12.34%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Bottom Section (Three Equal Cards Grid) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '24px',
        marginBottom: '24px'
      }}>
        {/* Card 1: FinAI Performance Insights */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <h3 className="card-title">FinAI Performance Insights</h3>
          
          <div style={{
            backgroundColor: 'rgba(23, 163, 74, 0.08)',
            borderLeft: '4px solid #17A34A',
            padding: '12px 16px'
          }}>
            <div style={{ fontSize: '0.62rem', color: '#17A34A', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Performance Status
            </div>
            <div style={{ fontSize: '0.9rem', color: '#17A34A', fontWeight: '800', marginTop: '2px' }}>
              Outperforming Benchmark
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <div style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '8px', textTransform: 'uppercase' }}>Why?</div>
              <ul style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', paddingLeft: '14px', margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <li>Strong Large Cap allocation</li>
                <li>Balanced portfolio diversification</li>
                <li>Stable liquidity position</li>
              </ul>
            </div>
            <div>
              <div style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '8px', textTransform: 'uppercase' }}>Recommended Action</div>
              <ul style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', paddingLeft: '14px', margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <li>Maintain current allocation</li>
                <li>Increase Healthcare exposure by 2%</li>
                <li>Monitor Mid Cap volatility</li>
              </ul>
            </div>
          </div>

          <div style={{ marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', fontWeight: '700', marginBottom: '6px' }}>
              <span>Confidence Score</span>
              <span style={{ color: '#17A34A' }}>94%</span>
            </div>
            <div style={{ height: '6px', backgroundColor: 'var(--border-color)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: '94%', backgroundColor: '#17A34A' }}></div>
            </div>
          </div>
        </div>

        {/* Card 2: Top 5 Performing Schemes */}
        <div className="card">
          <h3 className="card-title" style={{ marginBottom: '16px' }}>Top 5 Performing Schemes</h3>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Scheme Name</th>
                  <th>Category</th>
                  <th className="text-right">Return (3M)</th>
                  <th className="text-right">Benchmark Diff.</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ fontWeight: '600' }}>Flexi Cap Fund</td>
                  <td>Flexi Cap</td>
                  <td className="text-right mono" style={{ color: '#17A34A', fontWeight: '700' }}>16.85%</td>
                  <td className="text-right mono" style={{ color: '#17A34A', fontWeight: '700' }}>+4.33%</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: '600' }}>Large Cap Fund</td>
                  <td>Large Cap</td>
                  <td className="text-right mono" style={{ color: '#17A34A', fontWeight: '700' }}>15.42%</td>
                  <td className="text-right mono" style={{ color: '#17A34A', fontWeight: '700' }}>+3.90%</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: '600' }}>Balanced Advantage</td>
                  <td>Balanced Advantage</td>
                  <td className="text-right mono" style={{ color: '#17A34A', fontWeight: '700' }}>14.03%</td>
                  <td className="text-right mono" style={{ color: '#17A34A', fontWeight: '700' }}>+2.51%</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: '600' }}>Multi Asset Fund</td>
                  <td>Multi Asset</td>
                  <td className="text-right mono" style={{ color: '#17A34A', fontWeight: '700' }}>12.98%</td>
                  <td className="text-right mono" style={{ color: '#17A34A', fontWeight: '700' }}>+1.46%</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: '600' }}>Mid Cap Fund</td>
                  <td>Mid Cap</td>
                  <td className="text-right mono" style={{ color: '#17A34A', fontWeight: '700' }}>12.15%</td>
                  <td className="text-right mono" style={{ color: '#17A34A', fontWeight: '700' }}>+0.63%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Card 3: Underperforming Schemes */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <h3 className="card-title" style={{ marginBottom: '16px' }}>Underperforming Schemes</h3>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Scheme Name</th>
                  <th>Category</th>
                  <th className="text-right">Return (3M)</th>
                  <th className="text-right">Benchmark Diff.</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ fontWeight: '600' }}>Small Cap Fund</td>
                  <td>Small Cap</td>
                  <td className="text-right mono" style={{ color: 'var(--error-red)', fontWeight: '700' }}>4.25%</td>
                  <td className="text-right mono" style={{ color: 'var(--error-red)', fontWeight: '700' }}>-7.27%</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: '600' }}>Thematic Tech Fund</td>
                  <td>Thematic</td>
                  <td className="text-right mono" style={{ color: 'var(--error-red)', fontWeight: '700' }}>5.12%</td>
                  <td className="text-right mono" style={{ color: 'var(--error-red)', fontWeight: '700' }}>-6.40%</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: '600' }}>Infrastructure Fund</td>
                  <td>Sectoral</td>
                  <td className="text-right mono" style={{ color: 'var(--error-red)', fontWeight: '700' }}>6.35%</td>
                  <td className="text-right mono" style={{ color: 'var(--error-red)', fontWeight: '700' }}>-3.52%</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div style={{
            backgroundColor: 'rgba(239, 68, 68, 0.08)',
            borderLeft: '4px solid var(--error-red)',
            padding: '10px 14px',
            fontSize: '0.72rem',
            color: 'var(--error-red)',
            fontWeight: '600',
            marginTop: 'auto',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px'
          }}>
            <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: '1px' }} />
            <div>
              <strong style={{ textTransform: 'uppercase', fontSize: '0.62rem', display: 'block', marginBottom: '2px' }}>AI Suggestion</strong>
              Reduce exposure to Small Cap and Thematic funds due to higher volatility and weak momentum.
            </div>
          </div>
        </div>
      </div>

      {/* Footer Info Strip */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.68rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)', paddingTop: '12px', marginTop: '12px' }}>
        <span>ⓘ Past performance may or may not be sustained in future.</span>
        <span>Data as on 27 Jun 2026</span>
      </div>
    </div>
  );
}
