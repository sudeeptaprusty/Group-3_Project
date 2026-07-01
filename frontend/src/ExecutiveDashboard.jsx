import React, { useState, useEffect, useRef } from 'react';
import { Bar } from 'react-chartjs-2';
import { useChartTheme } from '../useChartTheme';
import {
  TrendingUp, Users, ArrowUpRight, ArrowDownRight,
  TrendingDown, Sparkles, Bell
} from 'lucide-react';
import { usePlatform } from '../context/PlatformContext';

export default function ExecutiveDashboard() {
  const ct = useChartTheme();
  const { allTransactions = [], sipSchedules = [], investors = [], funds = [] } = usePlatform() || {};

  // --- States ---
  const [autoRefresh] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [tickerSelect, setTickerSelect] = useState('All Tickers');
  const [schemeSelect, setSchemeSelect] = useState('All Schemes');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Simulated Market Data
  const [marketData, setMarketData] = useState({
    nifty50: { value: 24856.35, change: 0.68, history: [24700, 24720, 24780, 24750, 24810, 24830, 24856.35] },
    sensex: { value: 81356.12, change: 0.72, history: [80900, 81050, 81100, 81020, 81200, 81280, 81356.12] },
    nifty500: { value: 22153.45, change: 0.81, history: [22000, 22030, 22090, 22060, 22110, 22130, 22153.45] },
    midcap: { value: 18642.90, change: 0.91, history: [18500, 18520, 18580, 18540, 18600, 18620, 18642.90] },
    smallcap: { value: 15123.75, change: 1.35, history: [14900, 14950, 15020, 14990, 15060, 15100, 15123.75] },
    vix: { value: 14.24, change: 1.35, history: [14.0, 14.1, 13.9, 14.2, 14.0, 14.15, 14.24] },
    gsec: { value: 6.82, change: -0.03, history: [6.85, 6.84, 6.83, 6.84, 6.83, 6.82, 6.82] },
    usdinr: { value: 83.17, change: -0.12, history: [83.3, 83.25, 83.22, 83.20, 83.18, 83.19, 83.17] }
  });

  // Calculate live database values
  const activeInvestorsCount = investors.length;
  const activeSipsCount = sipSchedules.filter(s => s.status === 'ACTIVE').length;

  const settledTxns = allTransactions.filter(t => t.status === 'SETTLED' || t.status === 'SUCCESS');
  const inflowTxns = settledTxns.filter(t => t.transaction_type === 'PURCHASE' || t.transaction_type === 'SIP_AUTO' || t.transaction_type === 'SWITCH_IN');
  const outflowTxns = settledTxns.filter(t => t.transaction_type === 'REDEMPTION' || t.transaction_type === 'SWITCH_OUT');

  const inflowSum = inflowTxns.reduce((sum, t) => sum + t.amount, 0) / 10000000; // Cr
  const outflowSum = outflowTxns.reduce((sum, t) => sum + t.amount, 0) / 10000000; // Cr
  const netFlowSum = inflowSum - outflowSum;

  const kpis = {
    aum: { value: netFlowSum, changeVal: 0, changePct: 0, history: [0, 0, 0, 0, 0, netFlowSum] },
    flow: { value: netFlowSum, changeVal: 0, changePct: 0, history: [0, 0, 0, 0, 0, netFlowSum] },
    sip: { value: activeSipsCount, changeVal: 0, changePct: 0, history: [0, 0, 0, 0, 0, activeSipsCount] },
    investors: { value: activeInvestorsCount, changeVal: 0, changePct: 0, history: [0, 0, 0, 0, 0, activeInvestorsCount] },
    redemptions: { value: outflowSum, changeVal: 0, changePct: 0, history: [0, 0, 0, 0, 0, outflowSum] },
    risk: { score: 0, trend: 'Stable', history: [0, 0, 0, 0, 0, 0] }
  };

  const cashFlow = { inflow: inflowSum, outflow: outflowSum, net: netFlowSum };

  const [portfolio, setPortfolio] = useState({ largeCap: 0, midCap: 0, smallCap: 0, hybrid: 0, debt: 0 });
  const [schemes, setSchemes] = useState([]);

  useEffect(() => {
    if (funds && funds.length > 0) {
      setSchemes(funds.map(f => ({
        name: f.name,
        aum: f.aum,
        returnYtd: 12.5,
        benchmark: 11.8,
        alpha: 0.7,
        type: f.category.charAt(0).toUpperCase() + f.category.slice(1).toLowerCase()
      })));

      const totalAum = funds.reduce((sum, f) => sum + f.aum, 0);
      if (totalAum > 0) {
        const large = funds.filter(f => f.category === 'EQUITY' && f.risk === 'HIGH').reduce((sum, f) => sum + f.aum, 0);
        const mid = funds.filter(f => f.category === 'EQUITY' && f.risk === 'VERY_HIGH').reduce((sum, f) => sum + f.aum, 0);
        const debt = funds.filter(f => f.category === 'DEBT').reduce((sum, f) => sum + f.aum, 0);
        const hybrid = funds.filter(f => f.category === 'HYBRID').reduce((sum, f) => sum + f.aum, 0);
        
        setPortfolio({
          largeCap: parseFloat(((large / totalAum) * 100).toFixed(1)) || 20,
          midCap: parseFloat(((mid / totalAum) * 100).toFixed(1)) || 15,
          smallCap: 10,
          hybrid: parseFloat(((hybrid / totalAum) * 100).toFixed(1)) || 12,
          debt: parseFloat(((debt / totalAum) * 100).toFixed(1)) || 8
        });
      }
    } else {
      setSchemes([]);
      setPortfolio({ largeCap: 0, midCap: 0, smallCap: 0, hybrid: 0, debt: 0 });
    }
  }, [funds]);

  const riskCompliance = [
    { metric: 'SIP Stoppage Ratio', value: '0.00%', status: 'low', trend: 'stable' },
    { metric: 'Large Redemptions Alert', value: '0', status: 'low', trend: 'stable' },
    { metric: 'Compliance Exceptions', value: '0', status: 'low', trend: 'stable' },
    { metric: 'Concentration Risk', value: 'Low', status: 'low', trend: 'stable' },
    { metric: 'Liquidity Risk', value: 'Low', status: 'low', trend: 'stable' }
  ];

  // Canvas ref map for sparklines
  const sparklineRefs = useRef({});

  // --- Real-time Simulation Loop ---
  useEffect(() => {
    if (!autoRefresh) return;

    const rnd = (min, max) => Math.random() * (max - min) + min;

    const interval = setInterval(() => {
      // 1. Update Market Overview Tickers
      setMarketData(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(key => {
          const item = next[key];
          const fluctuation = (Math.random() - 0.49) * 0.12;
          const newVal = item.value * (1 + fluctuation / 100);
          const history = [...item.history, newVal];
          if (history.length > 8) history.shift();
          
          next[key] = {
            value: newVal,
            change: ((newVal - history[0]) / history[0]) * 100,
            history
          };
        });
        return next;
      });



      // 4. Update Portfolio Bars
      setPortfolio(prev => ({
        largeCap: Math.max(10, prev.largeCap + rnd(-0.15, 0.15)),
        midCap: Math.max(10, prev.midCap + rnd(-0.12, 0.12)),
        smallCap: Math.max(5, prev.smallCap + rnd(-0.1, 0.1)),
        hybrid: Math.max(5, prev.hybrid + rnd(-0.08, 0.08)),
        debt: Math.max(2, prev.debt + rnd(-0.05, 0.05))
      }));

      // 5. Update Top Schemes Table
      setSchemes(prev => prev.map(s => {
        const aumChange = Math.round((Math.random() - 0.45) * 30);
        const ytdChange = rnd(-0.05, 0.06);
        return {
          ...s,
          aum: s.aum + aumChange,
          returnYtd: s.returnYtd + ytdChange,
          alpha: s.returnYtd + ytdChange - s.benchmark
        };
      }));

      // Inject notification randomly with low probability (3% chance)
      if (Math.random() < 0.03) {
        const templates = [
          { type: 'critical', title: 'High Concentration Risk detected', body: 'Equity concentration in Top 5 schemes crossed 40% threshold.', time: 'Just now' },
          { type: 'warning', title: 'Compliance Check Initiated', body: 'SEBI portfolio allocation compliance check ran successfully.', time: 'Just now' },
          { type: 'info', title: 'New Subscriptions Milestone', body: 'Daily SIP registrations exceeded 5,000 count.', time: 'Just now' },
          { type: 'critical', title: 'Redemption Peak Warning', body: 'Redemptions in Hybrid schemes increased by 15% MoM.', time: 'Just now' }
        ];
        const selected = templates[Math.floor(Math.random() * templates.length)];
        setNotifications(prev => [selected, ...prev.slice(0, 7)]);
      }

    }, 2000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  // --- Render Sparklines on Canvas ---
  useEffect(() => {
    const drawSparkline = (canvas, history, color) => {
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const width = canvas.width;
      const height = canvas.height;
      
      ctx.clearRect(0, 0, width, height);
      if (!history || history.length < 2) return;
      
      const min = Math.min(...history);
      const max = Math.max(...history);
      const range = max - min === 0 ? 1 : max - min;
      
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.8;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      for (let i = 0; i < history.length; i++) {
        const x = (i / (history.length - 1)) * (width - 4) + 2;
        const y = height - ((history[i] - min) / range) * (height - 6) - 3;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Shadow gradient fill
      ctx.lineTo((width - 4) + 2, height);
      ctx.lineTo(2, height);
      ctx.closePath();
      const grad = ctx.createLinearGradient(0, 0, 0, height);
      grad.addColorStop(0, color.replace('1)', '0.08)'));
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.fill();
    };

    // Draw card sparklines
    drawSparkline(sparklineRefs.current['aum'], kpis.aum.history, 'rgba(37, 99, 235, 1)');
    drawSparkline(sparklineRefs.current['flow'], kpis.flow.history, 'rgba(34, 197, 94, 1)');
    drawSparkline(sparklineRefs.current['sip'], kpis.sip.history, 'rgba(124, 58, 237, 1)');
    drawSparkline(sparklineRefs.current['investors'], kpis.investors.history, 'rgba(245, 158, 11, 1)');
    drawSparkline(sparklineRefs.current['redemptions'], kpis.redemptions.history, 'rgba(239, 68, 68, 1)');

  }, [kpis]);

  // Cash Flow Chart Options
  const barChartData = {
    labels: ['Inflow', 'Outflow', 'Net Flow'],
    datasets: [{
      label: 'Amount (₹ Crore)',
      data: [cashFlow.inflow, cashFlow.outflow, cashFlow.net],
      backgroundColor: ['#22C55E', '#EF4444', '#3B82F6'],
      borderRadius: 2,
      barThickness: 40
    }]
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: ct.tooltipBg,
        titleColor: ct.tooltipColor,
        bodyColor: '#D1D5DB',
        borderWidth: 1,
        borderColor: ct.tooltipBorder,
        padding: 10
      }
    },
    scales: {
      y: {
        grid: { color: ct.gridColor },
        ticks: { color: ct.tickColor, font: { size: 10 } }
      },
      x: {
        grid: { display: false },
        ticks: { color: ct.tickColorBold, font: { size: 11, weight: '600' } }
      }
    }
  };

  // Filter tickers
  const activeTickers = Object.entries(marketData).filter(([key]) => {
    if (tickerSelect === 'All Tickers') return true;
    if (tickerSelect === 'Indices') return ['nifty50', 'sensex', 'nifty500', 'midcap', 'smallcap'].includes(key);
    if (tickerSelect === 'Macro') return ['vix', 'gsec', 'usdinr'].includes(key);
    return true;
  });

  // Filter schemes
  const filteredSchemes = schemes.filter(s => {
    const matchesSelect = schemeSelect === 'All Schemes' || s.type === schemeSelect;
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSelect && matchesSearch;
  });

  return (
    <div>
      {/* Page header strip */}
      <div className="page-header-strip">
        <div className="page-title-area">
          <h1 className="page-title">Executive Dashboard</h1>
          <p className="page-subtitle">Interactive fund metrics overview &amp; live market tickers</p>
        </div>
        
        <div className="header-controls">
          <div className="dropdown-filter-btn" onClick={() => setIsNotifOpen(!isNotifOpen)}>
            <Bell size={15} />
            Notifications ({notifications.length})
          </div>
        </div>
      </div>

      {/* Tickers bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-secondary)' }}>
          MARKET OVERVIEW TICKERS
        </div>
        <select 
          className="form-select" 
          value={tickerSelect} 
          onChange={(e) => setTickerSelect(e.target.value)}
          style={{ padding: '4px 10px', fontSize: '0.75rem' }}
        >
          <option value="All Tickers">All Tickers</option>
          <option value="Indices">Indices Only</option>
          <option value="Macro">Macro &amp; Forex</option>
        </select>
      </div>

      {/* Tickers Scroll Row */}
      <div style={{ 
        display: 'flex', 
        gap: '12px', 
        overflowX: 'auto', 
        paddingBottom: '12px', 
        marginBottom: '24px',
        scrollbarWidth: 'thin'
      }}>
        {activeTickers.map(([key, data]) => {
          const isUp = data.change >= 0;
          return (
            <div 
              key={key} 
              className="card" 
              style={{ 
                flex: '0 0 165px', 
                padding: '10px 14px', 
                minHeight: '75px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                  {key === 'usdinr' ? 'USD/INR' : key === 'gsec' ? '10Y G-Sec' : key}
                </span>
                <span style={{ 
                  fontSize: '0.68rem', 
                  fontWeight: '700', 
                  color: isUp ? 'var(--success-green)' : 'var(--error-red)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1px'
                }}>
                  {isUp ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                  {Math.abs(data.change).toFixed(2)}%
                </span>
              </div>
              <div style={{ fontSize: '0.98rem', fontWeight: '800', color: 'var(--text-primary)', marginTop: '4px' }}>
                {key === 'gsec' ? `${data.value.toFixed(2)}%` : data.value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              </div>
            </div>
          );
        })}
      </div>

      {/* KPI Cards Row */}
      <div className="kpi-row-grid">
        {/* KPI 1: AUM */}
        <div className="card kpi-card">
          <div>
            <div className="kpi-card-header">
              <div className="kpi-icon-box" style={{ backgroundColor: 'rgba(37, 99, 235, 0.08)', color: 'var(--primary-blue)' }}>
                <TrendingUp size={18} />
              </div>
              <span className="kpi-badge kpi-badge-info">AUM Milestone</span>
            </div>
            <div className="kpi-value-row">
              <span className="kpi-value">₹{kpis.aum.value.toFixed(2)}</span>
              <span className="kpi-unit">Lakh Cr</span>
            </div>
            <div className="kpi-title">TOTAL AUM</div>
          </div>
          <canvas ref={el => sparklineRefs.current['aum'] = el} className="kpi-sparkline-canvas" width="220" height="32"></canvas>
          <div className="kpi-footer">
            <span className="kpi-change-positive">
              <ArrowUpRight size={12} /> +₹{kpis.aum.changeVal} Cr (+{kpis.aum.changePct.toFixed(2)}%)
            </span>
          </div>
        </div>

        {/* KPI 2: Net Flows */}
        <div className="card kpi-card">
          <div>
            <div className="kpi-card-header">
              <div className="kpi-icon-box" style={{ backgroundColor: 'rgba(34, 197, 94, 0.08)', color: 'var(--success-green)' }}>
                <Sparkles size={18} />
              </div>
              <span className="kpi-badge kpi-badge-success">Strong</span>
            </div>
            <div className="kpi-value-row">
              <span className="kpi-value">₹{kpis.flow.value.toFixed(2)}</span>
              <span className="kpi-unit">Cr</span>
            </div>
            <div className="kpi-title">NET FLOW (MTD)</div>
          </div>
          <canvas ref={el => sparklineRefs.current['flow'] = el} className="kpi-sparkline-canvas" width="220" height="32"></canvas>
          <div className="kpi-footer">
            <span className="kpi-change-positive">
              <ArrowUpRight size={12} /> +{kpis.flow.changePct.toFixed(1)}% vs base
            </span>
          </div>
        </div>

        {/* KPI 3: Active SIP */}
        <div className="card kpi-card">
          <div>
            <div className="kpi-card-header">
              <div className="kpi-icon-box" style={{ backgroundColor: 'rgba(124, 58, 237, 0.08)', color: '#7C3AED' }}>
                <TrendingUp size={18} />
              </div>
              <span className="kpi-badge kpi-badge-info">Active</span>
            </div>
            <div className="kpi-value-row">
              <span className="kpi-value">{kpis.sip.value.toFixed(1)}</span>
              <span className="kpi-unit">Lakh</span>
            </div>
            <div className="kpi-title">ACTIVE SIPS</div>
          </div>
          <canvas ref={el => sparklineRefs.current['sip'] = el} className="kpi-sparkline-canvas" width="220" height="32"></canvas>
          <div className="kpi-footer">
            <span className="kpi-change-positive">
              <ArrowUpRight size={12} /> +{kpis.sip.changeVal.toLocaleString()} accounts
            </span>
          </div>
        </div>

        {/* KPI 4: New Investors */}
        <div className="card kpi-card">
          <div>
            <div className="kpi-card-header">
              <div className="kpi-icon-box" style={{ backgroundColor: 'rgba(245, 158, 11, 0.08)', color: 'var(--warning-orange)' }}>
                <Users size={18} />
              </div>
              <span className="kpi-badge kpi-badge-warning">Record</span>
            </div>
            <div className="kpi-value-row">
              <span className="kpi-value">{kpis.investors.value.toLocaleString()}</span>
              <span className="kpi-unit">Users</span>
            </div>
            <div className="kpi-title">NEW INVESTORS</div>
          </div>
          <canvas ref={el => sparklineRefs.current['investors'] = el} className="kpi-sparkline-canvas" width="220" height="32"></canvas>
          <div className="kpi-footer">
            <span className="kpi-change-positive">
              <ArrowUpRight size={12} /> +{kpis.investors.changePct.toFixed(1)}% MoM
            </span>
          </div>
        </div>

        {/* KPI 5: Redemptions */}
        <div className="card kpi-card">
          <div>
            <div className="kpi-card-header">
              <div className="kpi-icon-box" style={{ backgroundColor: 'rgba(239, 68, 68, 0.08)', color: 'var(--error-red)' }}>
                <TrendingDown size={18} />
              </div>
              <span className="kpi-badge kpi-badge-error">Controlled</span>
            </div>
            <div className="kpi-value-row">
              <span className="kpi-value">₹{kpis.redemptions.value.toFixed(2)}</span>
              <span className="kpi-unit">Cr</span>
            </div>
            <div className="kpi-title">REDEMPTIONS MTD</div>
          </div>
          <canvas ref={el => sparklineRefs.current['redemptions'] = el} className="kpi-sparkline-canvas" width="220" height="32"></canvas>
          <div className="kpi-footer">
            <span style={{ color: 'var(--success-green)', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '2px' }}>
              <ArrowDownRight size={12} /> -33% vs May
            </span>
          </div>
        </div>
      </div>

      {/* Main Charts & Info sections */}
      <div className="dashboard-grid-1">
        {/* Left Column: Cash Flow Chart */}
        <div className="card">
          <div className="card-title-row">
            <div>
              <h3 className="card-title">Today's Inflow vs Outflow</h3>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Real-time capital movement metrics (₹ Crore)
              </div>
            </div>
            <div style={{ display: 'flex', gap: '16px', fontSize: '0.72rem', fontWeight: '600' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#22C55E' }}>
                Inflow: ₹{cashFlow.inflow} Cr
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#EF4444' }}>
                Outflow: ₹{cashFlow.outflow} Cr
              </span>
            </div>
          </div>
          <div className="chart-wrap-container">
            <Bar data={barChartData} options={barChartOptions} />
          </div>
        </div>

        {/* Right Column: Portfolio Allocation */}
        <div className="card">
          <h3 className="card-title" style={{ marginBottom: '16px' }}>Portfolio Distribution</h3>
          <div className="card-subtitle">By Fund Category Allocation</div>
          
          <div className="portfolio-progress-container">
            <div className="progress-row">
              <div className="progress-label-row">
                <span>Large Cap Funds</span>
                <span className="mono">{portfolio.largeCap.toFixed(1)}%</span>
              </div>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${portfolio.largeCap}%`, backgroundColor: '#3B82F6' }}></div>
              </div>
            </div>

            <div className="progress-row">
              <div className="progress-label-row">
                <span>Mid Cap Funds</span>
                <span className="mono">{portfolio.midCap.toFixed(1)}%</span>
              </div>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${portfolio.midCap}%`, backgroundColor: '#10B981' }}></div>
              </div>
            </div>

            <div className="progress-row">
              <div className="progress-label-row">
                <span>Small Cap Funds</span>
                <span className="mono">{portfolio.smallCap.toFixed(1)}%</span>
              </div>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${portfolio.smallCap}%`, backgroundColor: '#F59E0B' }}></div>
              </div>
            </div>

            <div className="progress-row">
              <div className="progress-label-row">
                <span>Hybrid Equity Funds</span>
                <span className="mono">{portfolio.hybrid.toFixed(1)}%</span>
              </div>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${portfolio.hybrid}%`, backgroundColor: '#8B5CF6' }}></div>
              </div>
            </div>

            <div className="progress-row">
              <div className="progress-label-row">
                <span>Debt/Liquid Funds</span>
                <span className="mono">{portfolio.debt.toFixed(1)}%</span>
              </div>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${portfolio.debt}%`, backgroundColor: '#64748B' }}></div>
              </div>
            </div>
          </div>

          <div style={{ 
            marginTop: '20px', 
            padding: '12px', 
            borderRadius: 'var(--border-radius)', 
            backgroundColor: 'var(--bg-section)',
            fontSize: '0.72rem',
            lineHeight: '1.4',
            color: 'var(--text-secondary)',
            borderLeft: '3px solid var(--primary-blue)'
          }}>
            <strong>Insight:</strong> Equity exposure remains strong at ~57%, driven by steady retail inflows from monthly SIP registrations.
          </div>
        </div>
      </div>

      {/* Grid 2: Schemes Table + Risk Compliance */}
      <div className="dashboard-grid-1">
        {/* Top Schemes */}
        <div className="card">
          <div className="card-title-row">
            <h3 className="card-title">Top Schemes Performance</h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input 
                type="text" 
                placeholder="Search schemes..." 
                className="form-input"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ padding: '4px 10px', fontSize: '0.75rem', width: '130px' }}
              />
              <select 
                className="form-select" 
                value={schemeSelect} 
                onChange={(e) => setSchemeSelect(e.target.value)}
                style={{ padding: '4px 10px', fontSize: '0.75rem' }}
              >
                <option value="All Schemes">All Schemes</option>
                <option value="Equity">Equity</option>
                <option value="Hybrid">Hybrid</option>
              </select>
            </div>
          </div>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Scheme Name</th>
                  <th className="text-right">AUM (₹ Cr)</th>
                  <th className="text-right">Return YTD</th>
                  <th className="text-right">Benchmark YTD</th>
                  <th className="text-right">Alpha</th>
                </tr>
              </thead>
              <tbody>
                {filteredSchemes.map((s, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: '600' }}>
                      <span className="status-indicator-dot" style={{ 
                        backgroundColor: idx === 0 ? '#3B82F6' : idx === 1 ? '#10B981' : idx === 2 ? '#F59E0B' : idx === 3 ? '#8B5CF6' : '#EC4899'
                      }}></span>
                      {s.name}
                    </td>
                    <td className="text-right mono">{Math.round(s.aum).toLocaleString()}</td>
                    <td className="text-right mono" style={{ color: 'var(--success-green)', fontWeight: '600' }}>
                      +{s.returnYtd.toFixed(1)}%
                    </td>
                    <td className="text-right mono">{s.benchmark.toFixed(1)}%</td>
                    <td className="text-right mono" style={{ color: 'var(--success-green)', fontWeight: '700' }}>
                      +{s.alpha.toFixed(1)}%
                    </td>
                  </tr>
                ))}
                {filteredSchemes.length === 0 && (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)' }}>
                      No schemes found matching the filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Risk & Compliance Summary */}
        <div className="card">
          <h3 className="card-title" style={{ marginBottom: '16px' }}>Risk &amp; Compliance Monitor</h3>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Metric / Alert Area</th>
                  <th>Value</th>
                  <th>Trend</th>
                </tr>
              </thead>
              <tbody>
                {riskCompliance.map((r, idx) => {
                  let badgeClass = 'status-badge status-low';
                  if (r.status === 'high') badgeClass = 'status-badge status-high';
                  else if (r.status === 'medium') badgeClass = 'status-badge status-medium';

                  return (
                    <tr key={idx}>
                      <td style={{ fontWeight: '500' }}>{r.metric}</td>
                      <td>
                        <span className={badgeClass}>{r.value}</span>
                      </td>
                      <td className="mono" style={{ 
                        fontWeight: '700',
                        color: r.trend === 'up' ? 'var(--error-red)' : r.trend === 'down' ? 'var(--success-green)' : 'var(--text-secondary)'
                      }}>
                        {r.trend === 'up' ? '▲' : r.trend === 'down' ? '▼' : '▬'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Notifications Slide Panel */}
      <div className={`notif-side-panel ${isNotifOpen ? 'open' : ''}`}>
        <div className="notif-panel-header">
          <h3 style={{ fontSize: '0.98rem', fontWeight: '700', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Bell size={18} /> Compliance &amp; Operations Feed
          </h3>
          <button 
            onClick={() => setIsNotifOpen(false)}
            style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--text-secondary)' }}
          >
            &times;
          </button>
        </div>
        <div className="notif-panel-body">
          {notifications.map((n, idx) => (
            <div key={idx} className={`alert-feed-item ${n.type}`}>
              <div className="alert-feed-icon">
                {n.type === 'critical' ? '🚨' : n.type === 'warning' ? '⚠️' : 'ℹ️'}
              </div>
              <div className="alert-feed-details">
                <div className="alert-feed-title">{n.title}</div>
                <div className="alert-feed-desc">{n.body}</div>
                <div className="alert-feed-time">{n.time}</div>
              </div>
            </div>
          ))}
          {notifications.length === 0 && (
            <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '40px 0' }}>
              No notifications at this time.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
