import React, { useState, useEffect, useRef } from 'react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { useChartTheme } from '../useChartTheme';
import { TrendingUp, ArrowUpRight, TrendingDown } from 'lucide-react';
import { usePlatform } from '../context/PlatformContext';
import indiaMapImg from '../assets/india_map.jpg';

export default function AUMDashboard({ autoRefresh = true }) {
  const ct = useChartTheme();
  const { allTransactions = [], funds: fundsDb = [] } = usePlatform() || {};

  // --- States ---
  const [trendPeriod, setTrendPeriod] = useState('6m');
  const [fundView, setFundView] = useState('aum'); // 'aum' or 'growth'
  const [categoryFilter, setCategoryFilter] = useState('all');
  
  const settledTxns = allTransactions.filter(t => t.status === 'SETTLED' || t.status === 'SUCCESS');
  const inflowTxns = settledTxns.filter(t => t.transaction_type === 'PURCHASE' || t.transaction_type === 'SIP_AUTO' || t.transaction_type === 'SWITCH_IN');
  const outflowTxns = settledTxns.filter(t => t.transaction_type === 'REDEMPTION' || t.transaction_type === 'SWITCH_OUT');

  const inflowSum = inflowTxns.reduce((sum, t) => sum + t.amount, 0) / 10000000; // Cr
  const outflowSum = outflowTxns.reduce((sum, t) => sum + t.amount, 0) / 10000000; // Cr
  const netFlowSum = inflowSum - outflowSum;

  // --- Helper: net flow (inflow - outflow) for a filtered subset, in Cr ---
  const calcNet = (txns) => {
    const inflow  = txns.filter(t => ['PURCHASE','SIP_AUTO','SWITCH_IN'].includes(t.transaction_type)).reduce((s, t) => s + t.amount, 0);
    const outflow = txns.filter(t => ['REDEMPTION','SWITCH_OUT'].includes(t.transaction_type)).reduce((s, t) => s + t.amount, 0);
    return (inflow - outflow) / 10000000;
  };

  // --- Helper: filter txns to a date window ---
  const inRange = (txns, from, to) => txns.filter(t => {
    const d = new Date(t.created_at);
    return d >= from && d < to;
  });

  const now          = new Date();
  const todayStart   = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yestStart    = new Date(todayStart); yestStart.setDate(yestStart.getDate() - 1);
  const d2Start      = new Date(todayStart); d2Start.setDate(d2Start.getDate() - 2);
  const d3Start      = new Date(todayStart); d3Start.setDate(d3Start.getDate() - 3);
  const d4Start      = new Date(todayStart); d4Start.setDate(d4Start.getDate() - 4);
  const d5Start      = new Date(todayStart); d5Start.setDate(d5Start.getDate() - 5);

  const thisMonthStart  = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart  = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd    = new Date(now.getFullYear(), now.getMonth(), 1); // exclusive

  const thisYearStart   = new Date(now.getFullYear(), 0, 1);
  const lastYearStart   = new Date(now.getFullYear() - 1, 0, 1);
  const lastYearEnd     = new Date(now.getFullYear(), 0, 1); // exclusive

  // --- Daily Growth: today vs yesterday ---
  const todayNet   = calcNet(inRange(settledTxns, todayStart, now));
  const yestNet    = calcNet(inRange(settledTxns, yestStart, todayStart));
  const dailyGrowth = yestNet !== 0
    ? parseFloat(((todayNet - yestNet) / Math.abs(yestNet)) * 100).toFixed(2)
    : todayNet > 0 ? 100 : 0;

  // --- Monthly Growth: this month vs last month ---
  const thisMonthNet = calcNet(inRange(settledTxns, thisMonthStart, now));
  const lastMonthNet = calcNet(inRange(settledTxns, lastMonthStart, lastMonthEnd));
  const monthlyGrowth = lastMonthNet !== 0
    ? parseFloat(((thisMonthNet - lastMonthNet) / Math.abs(lastMonthNet)) * 100).toFixed(2)
    : thisMonthNet > 0 ? 100 : 0;

  // --- Yearly Growth: this year vs last year ---
  const thisYearNet = calcNet(inRange(settledTxns, thisYearStart, now));
  const lastYearNet = calcNet(inRange(settledTxns, lastYearStart, lastYearEnd));
  const yearlyGrowth = lastYearNet !== 0
    ? parseFloat(((thisYearNet - lastYearNet) / Math.abs(lastYearNet)) * 100).toFixed(2)
    : thisYearNet > 0 ? 100 : 0;

  // --- Sparklines: last 6 days net flows for daily; per-month for monthly; per-month YoY for yearly ---
  const dailySparkline = [
    calcNet(inRange(settledTxns, d5Start, d4Start)),
    calcNet(inRange(settledTxns, d4Start, d3Start)),
    calcNet(inRange(settledTxns, d3Start, d2Start)),
    calcNet(inRange(settledTxns, d2Start, yestStart)),
    yestNet,
    todayNet,
  ];

  // Monthly sparkline: last 6 months net flows
  const monthlySparkline = Array.from({ length: 6 }, (_, i) => {
    const mStart = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const mEnd   = new Date(now.getFullYear(), now.getMonth() - (5 - i) + 1, 1);
    return parseFloat(calcNet(inRange(settledTxns, mStart, mEnd)).toFixed(2));
  });

  // Yearly sparkline: last 6 years net flows
  const yearlySparkline = Array.from({ length: 6 }, (_, i) => {
    const yStart = new Date(now.getFullYear() - (5 - i), 0, 1);
    const yEnd   = new Date(now.getFullYear() - (5 - i) + 1, 0, 1);
    return parseFloat(calcNet(inRange(settledTxns, yStart, yEnd)).toFixed(2));
  });

  const aumKpis = {
    totalAum: netFlowSum,
    dailyGrowth:   parseFloat(dailyGrowth),
    monthlyGrowth: parseFloat(monthlyGrowth),
    yearlyGrowth:  parseFloat(yearlyGrowth),
    mtdInflow: inflowSum,
    mtdOutflow: outflowSum,
    netFlow: netFlowSum,
    sparklines: {
      total:   [0, 0, 0, 0, 0, netFlowSum],
      daily:   dailySparkline,
      monthly: monthlySparkline,
      yearly:  yearlySparkline,
      inflow:  [0, 0, 0, 0, 0, inflowSum],
      outflow: [0, 0, 0, 0, 0, outflowSum],
      netflow: [0, 0, 0, 0, 0, netFlowSum]
    }
  };

  // Build fund AUM: prefer DB aum_crores, fallback to summing live transactions
  const fundAumFromTxns = {};
  inflowTxns.forEach(t => {
    if (!t.fund_id) return;
    fundAumFromTxns[t.fund_id] = (fundAumFromTxns[t.fund_id] || 0) + t.amount / 10000000;
  });

  const funds = fundsDb.map(f => {
    const dbAum = parseFloat(f.aum) || 0;
    const txnAum = parseFloat((fundAumFromTxns[f.id] || 0).toFixed(2));
    // Use DB value if meaningful (>1 Cr), otherwise use txn-derived AUM
    const finalAum = dbAum > 1 ? dbAum : txnAum;
    return {
      name: f.name || 'Unknown Fund',
      aum: finalAum,
      growth: 12.5,
      category: f.category ? f.category.charAt(0).toUpperCase() + f.category.slice(1).toLowerCase() : 'Other'
    };
  }).filter(f => f.aum > 0).slice(0, 20); // Show top 20 funds with data

  // Regions Data
  const regions = [
    { name: 'Maharashtra', aum: 4820, share: 26.1, investors: 128400 },
    { name: 'Delhi NCR', aum: 3640, share: 19.7, investors: 98200 },
    { name: 'Karnataka', aum: 2180, share: 11.8, investors: 62300 },
    { name: 'Gujarat', aum: 1920, share: 10.4, investors: 54800 },
    { name: 'Tamil Nadu', aum: 1640, share: 8.9, investors: 48600 },
    { name: 'Telangana', aum: 1240, share: 6.7, investors: 37200 },
    { name: 'West Bengal', aum: 980, share: 5.3, investors: 29400 },
    { name: 'Rajasthan', aum: 720, share: 3.9, investors: 21800 },
    { name: 'Punjab', aum: 610, share: 3.3, investors: 18300 },
    { name: 'Uttar Pradesh', aum: 540, share: 2.9, investors: 16200 }
  ];

  const canvasRefs = useRef({});

  // --- Real-time Simulation ---
  useEffect(() => {
    // Keep values static as requested
  }, [autoRefresh]);

  // --- Render Sparklines ---
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

    drawSparkline(canvasRefs.current['total'], aumKpis.sparklines.total, 'rgba(37, 99, 235, 1)');
    drawSparkline(canvasRefs.current['daily'], aumKpis.sparklines.daily, 'rgba(34, 197, 94, 1)');
    drawSparkline(canvasRefs.current['monthly'], aumKpis.sparklines.monthly, 'rgba(124, 58, 237, 1)');
    drawSparkline(canvasRefs.current['yearly'], aumKpis.sparklines.yearly, 'rgba(245, 158, 11, 1)');
    drawSparkline(canvasRefs.current['inflow'], aumKpis.sparklines.inflow, 'rgba(34, 197, 94, 1)');
    drawSparkline(canvasRefs.current['outflow'], aumKpis.sparklines.outflow, 'rgba(239, 68, 68, 1)');
    drawSparkline(canvasRefs.current['netflow'], aumKpis.sparklines.netflow, 'rgba(37, 99, 235, 1)');

  }, [aumKpis]);

  // --- Static Trend Datasets (from original data.js) ---
  const trendDatasets = {
    '6m': {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      total:  [16200, 16480, 16910, 17250, 17595, aumKpis.totalAum],
      equity: [ 9072,  9229,  9471,  9660,  9854, aumKpis.totalAum * 0.55],
      debt:   [ 5022,  5109,  5241,  5348,  5456, aumKpis.totalAum * 0.29],
      hybrid: [ 1134,  1154,  1352,  1380,  1407, aumKpis.totalAum * 0.08]
    },
    '1y': {
      labels: ['Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar','Apr','May','Jun'],
      total:  [14800,15100,15380,15720,15940,16100,16200,16480,16910,17250,17595,aumKpis.totalAum],
      equity: [ 8288, 8456, 8613, 8804, 8927, 9016, 9072, 9229, 9471, 9660, 9854, aumKpis.totalAum * 0.55],
      debt:   [ 4588, 4681, 4768, 4873, 4941, 4991, 5022, 5109, 5241, 5348, 5456, aumKpis.totalAum * 0.29],
      hybrid: [ 1036, 1057, 1077, 1100, 1116, 1127, 1134, 1154, 1352, 1380, 1407, aumKpis.totalAum * 0.08]
    },
    '3y': {
      labels: ['Jun-23','Sep-23','Dec-23','Mar-24','Jun-24','Sep-24','Dec-24','Mar-25','Jun-25','Sep-25','Dec-25','Mar-26','Jun-26'],
      total:  [10400,11200,11900,12600,13100,13800,14500,15200,15900,16500,17100,17700,aumKpis.totalAum],
      equity: [ 5720, 6160, 6545, 6930, 7205, 7590, 7975, 8360, 8745, 9075, 9405, 9735, aumKpis.totalAum * 0.55],
      debt:   [ 3328, 3584, 3808, 4032, 4192, 4416, 4640, 4864, 5088, 5280, 5472, 5664, aumKpis.totalAum * 0.29],
      hybrid: [  728,  784,  833,  882,  917,  966, 1015, 1064, 1113, 1155, 1197, 1239, aumKpis.totalAum * 0.08]
    },
    '5y': {
      labels: ['Jun-21','Dec-21','Jun-22','Dec-22','Jun-23','Dec-23','Jun-24','Dec-24','Jun-25','Dec-25','Jun-26'],
      total:  [ 7200, 8100, 9000, 9700,10400,11900,13100,14500,15900,17100,aumKpis.totalAum],
      equity: [ 3888, 4374, 4860, 5238, 5720, 6545, 7205, 7975, 8745, 9405, aumKpis.totalAum * 0.55],
      debt:   [ 2304, 2592, 2880, 3104, 3328, 3808, 4192, 4640, 5088, 5472, aumKpis.totalAum * 0.29],
      hybrid: [  504,  567,  630,  679,  728,  833,  917, 1015, 1113, 1197, aumKpis.totalAum * 0.08]
    }
  };

  const trendData = trendDatasets[trendPeriod];

  // AUM Trend line chart configs
  const lineChartData = {
    labels: trendData.labels,
    datasets: [
      {
        label: 'Total AUM',
        data: trendData.total,
        borderColor: '#2563EB',
        backgroundColor: 'rgba(37, 99, 235, 0.03)',
        borderWidth: 2.5,
        fill: true,
        tension: 0.3
      },
      {
        label: 'Equity Funds',
        data: trendData.equity,
        borderColor: '#10B981',
        borderWidth: 1.5,
        fill: false,
        tension: 0.3
      },
      {
        label: 'Debt Funds',
        data: trendData.debt,
        borderColor: '#F59E0B',
        borderWidth: 1.5,
        fill: false,
        tension: 0.3
      },
      {
        label: 'Hybrid Funds',
        data: trendData.hybrid,
        borderColor: '#8B5CF6',
        borderWidth: 1.5,
        fill: false,
        tension: 0.3
      }
    ]
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: { color: ct.legendColor, font: { size: 10, weight: '600' } }
      },
      tooltip: {
        backgroundColor: ct.tooltipBg,
        titleColor: ct.tooltipColor,
        bodyColor: '#D1D5DB',
        borderWidth: 1,
        borderColor: ct.tooltipBorder,
        callbacks: {
          label: context => ` ${context.dataset.label}: ₹${Math.round(context.raw).toLocaleString()} Cr`
        }
      }
    },
    scales: {
      y: {
        grid: { color: ct.gridColor },
        ticks: { color: ct.tickColor, font: { size: 10 } }
      },
      x: {
        grid: { display: false },
        ticks: { color: ct.tickColor, font: { size: 10 } }
      }
    }
  };

  // Monthly Flow Bar chart
  const flowBarData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Inflows',
        data: [980, 1050, 1120, 1080, 1110, aumKpis.mtdInflow],
        backgroundColor: '#3B82F6',
        borderRadius: 2
      },
      {
        label: 'Outflows',
        data: [340, 380, 410, 370, 389, aumKpis.mtdOutflow],
        backgroundColor: '#EF4444',
        borderRadius: 2
      }
    ]
  };

  const flowBarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: ct.tooltipBg,
        borderWidth: 1,
        borderColor: ct.tooltipBorder,
        callbacks: {
          label: context => ` ${context.dataset.label}: ₹${context.raw} Cr`
        }
      }
    },
    scales: {
      y: {
        grid: { color: ct.gridColor },
        ticks: { color: ct.tickColor, font: { size: 10 } }
      },
      x: {
        grid: { display: false },
        ticks: { color: ct.tickColor, font: { size: 10 } }
      }
    }
  };

  // Category donut chart
  const categoryDonutData = {
    labels: ['Equity', 'Debt', 'Hybrid', 'Index', 'Liquid'],
    datasets: [{
      data: [
        Math.round(aumKpis.totalAum * 0.55),
        Math.round(aumKpis.totalAum * 0.29),
        Math.round(aumKpis.totalAum * 0.07),
        Math.round(aumKpis.totalAum * 0.06),
        Math.round(aumKpis.totalAum * 0.03)
      ],
      backgroundColor: ['#2563EB', '#FB923C', '#A78BFA', '#2DD4BF', '#FBBF24'],
      borderWidth: 0,
      hoverOffset: 4
    }]
  };

  // Investor type donut chart
  const investorDonutData = {
    labels: ['Retail', 'HNI', 'Institutional', 'Corporate', 'NRI'],
    datasets: [{
      data: [7840, 4620, 3290, 1980, 707],
      backgroundColor: ['#2563EB', '#10B981', '#F59E0B', '#8B5CF6', '#06B6D4'],
      borderWidth: 0,
      hoverOffset: 4
    }]
  };

  const donutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: {
      legend: {
        position: 'right',
        labels: { boxWidth: 12, font: { size: 10 }, color: ct.legendColor }
      },
      tooltip: {
        backgroundColor: ct.tooltipBg,
        borderWidth: 1,
        borderColor: ct.tooltipBorder,
        callbacks: {
          label: context => {
            const dataset = context.dataset;
            const total = dataset.data.reduce((acc, val) => acc + val, 0);
            const percentage = ((context.raw / total) * 100).toFixed(1);
            return ` ${context.label}: ₹${context.raw.toLocaleString()} Cr (${percentage}%)`;
          }
        }
      }
    }
  };

  // Fund-wise AUM tracking bar chart
  const filteredFunds = categoryFilter === 'all' 
    ? funds 
    : funds.filter(f => f.category.toLowerCase() === categoryFilter.toLowerCase());

  // Sort funds by active view
  const sortedFunds = [...filteredFunds].sort((a, b) => {
    if (fundView === 'aum') return b.aum - a.aum;
    return b.growth - a.growth;
  });

  const fundBarChartData = {
    labels: sortedFunds.map(f => f.name),
    datasets: [{
      label: fundView === 'aum' ? 'AUM (₹ Crore)' : 'YoY Growth (%)',
      data: sortedFunds.map(f => fundView === 'aum' ? f.aum : f.growth),
      backgroundColor: fundView === 'aum' ? '#3B82F6' : '#10B981',
      borderRadius: 2,
      barThickness: 12
    }]
  };

  const fundBarChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: ct.tooltipBg,
        borderWidth: 1,
        borderColor: ct.tooltipBorder,
        callbacks: {
          label: context => ` ${fundView === 'aum' ? 'AUM' : 'Growth'}: ${fundView === 'aum' ? '₹' + Number(context.raw).toLocaleString() + ' Cr' : context.raw + '%'}`
        }
      }
    },
    scales: {
      x: {
        suggestedMax: sortedFunds.length > 0 
          ? Math.max(...sortedFunds.map(f => fundView === 'aum' ? f.aum : f.growth)) * 1.2 
          : 100,
        grid: { color: ct.gridColor },
        ticks: { color: ct.tickColor, font: { size: 10 } }
      },
      y: {
        grid: { display: false },
        ticks: { color: ct.tickColorBold, font: { size: 10, weight: '600' } }
      }
    }
  };

  // Calculate Region Totals
  const totalRegionAum = regions.reduce((acc, curr) => acc + curr.aum, 0);

  return (
    <div>
      {/* Page Header */}
      <div className="page-header-strip">
        <div className="page-title-area">
          <h1 className="page-title">AUM Dashboard</h1>
          <p className="page-subtitle">Detailed tracking of Assets Under Management splits and growth</p>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="kpi-row-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
        {/* KPI 1: Total AUM */}
        <div className="card kpi-card" style={{ minHeight: '130px' }}>
          <div>
            <div className="kpi-card-header">
              <div className="kpi-icon-box" style={{ backgroundColor: 'rgba(37, 99, 235, 0.08)', color: 'var(--primary-blue)', width: '30px', height: '30px' }}>
                <TrendingUp size={15} />
              </div>
              <span className="kpi-badge kpi-badge-info" style={{ fontSize: '0.6rem' }}>All-Time High</span>
            </div>
            <div className="kpi-value-row">
              <span className="kpi-value" style={{ fontSize: '1.4rem' }}>₹{Math.round(aumKpis.totalAum).toLocaleString()}</span>
              <span className="kpi-unit">Cr</span>
            </div>
            <div className="kpi-title" style={{ fontSize: '0.7rem' }}>TOTAL AUM</div>
          </div>
          <canvas ref={el => canvasRefs.current['total'] = el} className="kpi-sparkline-canvas" width="180" height="30"></canvas>
          <div className="kpi-footer">
            <span className="kpi-change-positive" style={{ fontSize: '0.68rem' }}>
              <ArrowUpRight size={10} /> +₹842 Cr MTD
            </span>
          </div>
        </div>

        {/* KPI 2: Daily Growth */}
        <div className="card kpi-card" style={{ minHeight: '130px' }}>
          <div>
            <div className="kpi-card-header">
              <div className="kpi-icon-box" style={{ backgroundColor: 'rgba(34, 197, 94, 0.08)', color: 'var(--success-green)', width: '30px', height: '30px' }}>
                <TrendingUp size={15} />
              </div>
              <span className="kpi-badge kpi-badge-success" style={{ fontSize: '0.6rem' }}>Today</span>
            </div>
            <div className="kpi-value-row">
              <span className="kpi-value" style={{ fontSize: '1.4rem', color: aumKpis.dailyGrowth >= 0 ? 'var(--success-green)' : 'var(--error-red)' }}>
                {aumKpis.dailyGrowth >= 0 ? '+' : ''}{aumKpis.dailyGrowth.toFixed(2)}%
              </span>
            </div>
            <div className="kpi-title" style={{ fontSize: '0.7rem' }}>DAILY GROWTH</div>
          </div>
          <canvas ref={el => canvasRefs.current['daily'] = el} className="kpi-sparkline-canvas" width="180" height="30"></canvas>
          <div className="kpi-footer">
            <span className="kpi-change-positive" style={{ fontSize: '0.68rem', color: aumKpis.dailyGrowth >= 0 ? 'var(--success-green)' : 'var(--error-red)' }}>
              +₹53.2 Cr today
            </span>
          </div>
        </div>

        {/* KPI 3: Monthly Growth */}
        <div className="card kpi-card" style={{ minHeight: '130px' }}>
          <div>
            <div className="kpi-card-header">
              <div className="kpi-icon-box" style={{ backgroundColor: 'rgba(124, 58, 237, 0.08)', color: '#7C3AED', width: '30px', height: '30px' }}>
                <TrendingUp size={15} />
              </div>
              <span className="kpi-badge kpi-badge-info" style={{ fontSize: '0.6rem' }}>MoM</span>
            </div>
            <div className="kpi-value-row">
              <span className="kpi-value" style={{ fontSize: '1.4rem' }}>+{aumKpis.monthlyGrowth.toFixed(2)}%</span>
            </div>
            <div className="kpi-title" style={{ fontSize: '0.7rem' }}>MONTHLY GROWTH</div>
          </div>
          <canvas ref={el => canvasRefs.current['monthly'] = el} className="kpi-sparkline-canvas" width="180" height="30"></canvas>
          <div className="kpi-footer">
            <span className="kpi-change-positive" style={{ fontSize: '0.68rem' }}>
              <ArrowUpRight size={10} /> vs last month
            </span>
          </div>
        </div>

        {/* KPI 4: Yearly Growth */}
        <div className="card kpi-card" style={{ minHeight: '130px' }}>
          <div>
            <div className="kpi-card-header">
              <div className="kpi-icon-box" style={{ backgroundColor: 'rgba(245, 158, 11, 0.08)', color: 'var(--warning-orange)', width: '30px', height: '30px' }}>
                <TrendingUp size={15} />
              </div>
              <span className="kpi-badge kpi-badge-info" style={{ fontSize: '0.6rem' }}>YoY</span>
            </div>
            <div className="kpi-value-row">
              <span className="kpi-value" style={{ fontSize: '1.4rem' }}>+{aumKpis.yearlyGrowth.toFixed(1)}%</span>
            </div>
            <div className="kpi-title" style={{ fontSize: '0.7rem' }}>YEARLY GROWTH</div>
          </div>
          <canvas ref={el => canvasRefs.current['yearly'] = el} className="kpi-sparkline-canvas" width="180" height="30"></canvas>
          <div className="kpi-footer">
            <span className="kpi-change-positive" style={{ fontSize: '0.68rem' }}>
              <ArrowUpRight size={10} /> vs FY25
            </span>
          </div>
        </div>

        {/* KPI 5: Inflow */}
        <div className="card kpi-card" style={{ minHeight: '130px' }}>
          <div>
            <div className="kpi-card-header">
              <div className="kpi-icon-box" style={{ backgroundColor: 'rgba(34, 197, 94, 0.08)', color: 'var(--success-green)', width: '30px', height: '30px' }}>
                <ArrowUpRight size={15} />
              </div>
              <span className="kpi-badge kpi-badge-success" style={{ fontSize: '0.6rem' }}>MTD</span>
            </div>
            <div className="kpi-value-row">
              <span className="kpi-value" style={{ fontSize: '1.4rem' }}>₹{aumKpis.mtdInflow.toFixed(2)}</span>
              <span className="kpi-unit">Cr</span>
            </div>
            <div className="kpi-title" style={{ fontSize: '0.7rem' }}>NET INFLOWS</div>
          </div>
          <canvas ref={el => canvasRefs.current['inflow'] = el} className="kpi-sparkline-canvas" width="180" height="30"></canvas>
          <div className="kpi-footer">
            <span className="kpi-change-positive" style={{ fontSize: '0.68rem' }}>
              <ArrowUpRight size={10} /> +12.3% MoM
            </span>
          </div>
        </div>

        {/* KPI 6: Outflow */}
        <div className="card kpi-card" style={{ minHeight: '130px' }}>
          <div>
            <div className="kpi-card-header">
              <div className="kpi-icon-box" style={{ backgroundColor: 'rgba(239, 68, 68, 0.08)', color: 'var(--error-red)', width: '30px', height: '30px' }}>
                <TrendingDown size={15} />
              </div>
              <span className="kpi-badge kpi-badge-error" style={{ fontSize: '0.6rem' }}>Controlled</span>
            </div>
            <div className="kpi-value-row">
              <span className="kpi-value" style={{ fontSize: '1.4rem', color: 'var(--error-red)' }}>₹{aumKpis.mtdOutflow.toFixed(2)}</span>
              <span className="kpi-unit">Cr</span>
            </div>
            <div className="kpi-title" style={{ fontSize: '0.7rem' }}>NET OUTFLOWS</div>
          </div>
          <canvas ref={el => canvasRefs.current['outflow'] = el} className="kpi-sparkline-canvas" width="180" height="30"></canvas>
          <div className="kpi-footer">
            <span className="kpi-change-negative" style={{ fontSize: '0.68rem' }}>
              <ArrowUpRight size={10} /> +4.1% MoM
            </span>
          </div>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="dashboard-grid-1">
        {/* Line Chart */}
        <div className="card">
          <div className="card-title-row">
            <div>
              <h3 className="card-title">AUM Trend over Time</h3>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Monthly AUM progression split by fund classification (₹ Crore)
              </div>
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              {['6m', '1y', '3y', '5y'].map(p => (
                <button 
                  key={p}
                  onClick={() => setTrendPeriod(p)}
                  className={`dropdown-filter-btn`}
                  style={{ 
                    padding: '3px 8px', 
                    fontSize: '0.7rem', 
                    borderColor: trendPeriod === p ? 'var(--primary-blue)' : 'var(--border-color)',
                    backgroundColor: trendPeriod === p ? 'var(--accent-blue-bg)' : 'var(--bg-main)',
                    color: trendPeriod === p ? 'var(--primary-blue)' : 'var(--text-secondary)'
                  }}
                >
                  {p.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          <div className="chart-wrap-container">
            <Line data={lineChartData} options={lineChartOptions} />
          </div>
        </div>

        {/* Inflow vs Outflow */}
        <div className="card">
          <div className="card-title-row">
            <div>
              <h3 className="card-title">Inflow vs Outflow</h3>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Monthly comparison comparison (₹ Crore)
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', fontSize: '0.72rem', fontWeight: '600' }}>
              <span style={{ color: '#3B82F6' }}>● Inflow</span>
              <span style={{ color: '#EF4444' }}>● Outflow</span>
            </div>
          </div>
          <div className="chart-wrap-container">
            <Bar data={flowBarData} options={flowBarOptions} />
          </div>
        </div>
      </div>

      {/* Splits Row */}
      <div className="dashboard-grid-2">
        {/* Category Split */}
        <div className="card">
          <h3 className="card-title" style={{ marginBottom: '16px' }}>AUM Split by Fund Category</h3>
          <div className="chart-wrap-small">
            <Doughnut data={categoryDonutData} options={donutOptions} />
          </div>
        </div>

        {/* Investor Split */}
        <div className="card">
          <h3 className="card-title" style={{ marginBottom: '16px' }}>AUM Split by Investor Type</h3>
          <div className="chart-wrap-small">
            <Doughnut data={investorDonutData} options={donutOptions} />
          </div>
        </div>
      </div>

      {/* Fund-wise Bar Chart */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-title-row">
          <div>
            <h3 className="card-title">Fund-wise AUM Tracking</h3>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Comprehensive performance and sizes tracking of top funds
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <select 
              className="form-select"
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              style={{ padding: '4px 10px', fontSize: '0.75rem' }}
            >
              <option value="all">All Categories</option>
              <option value="equity">Equity</option>
              <option value="debt">Debt</option>
              <option value="hybrid">Hybrid</option>
              <option value="index">Index</option>
            </select>
            
            <button 
              onClick={() => setFundView('aum')}
              className="dropdown-filter-btn"
              style={{ 
                padding: '4px 10px', 
                fontSize: '0.75rem',
                borderColor: fundView === 'aum' ? 'var(--primary-blue)' : 'var(--border-color)',
                backgroundColor: fundView === 'aum' ? 'var(--accent-blue-bg)' : 'var(--bg-main)',
                color: fundView === 'aum' ? 'var(--primary-blue)' : 'var(--text-secondary)'
              }}
            >
              By AUM
            </button>
            <button 
              onClick={() => setFundView('growth')}
              className="dropdown-filter-btn"
              style={{ 
                padding: '4px 10px', 
                fontSize: '0.75rem',
                borderColor: fundView === 'growth' ? 'var(--primary-blue)' : 'var(--border-color)',
                backgroundColor: fundView === 'growth' ? 'var(--accent-blue-bg)' : 'var(--bg-main)',
                color: fundView === 'growth' ? 'var(--primary-blue)' : 'var(--text-secondary)'
              }}
            >
              By Growth
            </button>
          </div>
        </div>
        <div style={{ height: '320px', position: 'relative' }}>
          <Bar data={fundBarChartData} options={fundBarChartOptions} />
        </div>
      </div>

      {/* Regions Map & Table */}
      <div className="card">
        <h3 className="card-title" style={{ marginBottom: '16px' }}>Top Regions by AUM Distribution</h3>
        <div className="regions-container">
          {/* Map */}
          <div className="map-wrapper">
            <img src={indiaMapImg} alt="India Map" className="map-img" />
          </div>

          {/* Table */}
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Region State</th>
                  <th className="text-right">AUM (₹ Cr.)</th>
                  <th className="text-right">Share (%)</th>
                  <th className="text-right">Active Investors</th>
                </tr>
              </thead>
              <tbody>
                {regions.map((r, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: '600' }}>{r.name}</td>
                    <td className="text-right mono">{Math.round(r.aum).toLocaleString()}</td>
                    <td className="text-right mono" style={{ fontWeight: '600', color: 'var(--primary-blue)' }}>
                      {((r.aum / totalRegionAum) * 100).toFixed(1)}%
                    </td>
                    <td className="text-right mono">{r.investors.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
