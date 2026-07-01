import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, useLocation, Navigate } from 'react-router-dom';
import { PlatformProvider, usePlatform } from './context/PlatformContext';

import ExecutiveDashboard from './components/ExecutiveDashboard';
import AUMDashboard from './components/AUMDashboard';
import SIPTrendAnalysis from './components/SIPTrendAnalysis';
import TransactionHeatmap from './components/TransactionHeatmap';
import AMLDashboard from './components/AMLDashboard';
import ComplianceAlert from './components/ComplianceAlert';
import ChurnPrediction from './components/ChurnPrediction';
import ReportGenerator from './components/ReportGenerator';
import AIAllocationAdvisor from './components/AIAllocationAdvisor';
import PerformanceBenchmarking from './components/PerformanceBenchmarking';
import Auth from './components/Auth';

import './index.css';

/* ─── Sidebar navigation items ───────────────────────────────── */
const NAV_ITEMS = [
  { path: '/', label: 'Executive Dashboard' },
  { path: '/aum', label: 'AUM Dashboard' },
  { path: '/sip', label: 'SIP Trend Analysis' },
  { path: '/heatmap', label: 'Transaction Heatmap' },
  { path: '/aml', label: 'AML Dashboard' },
  { path: '/compliance', label: 'Compliance Alerts' },
  { path: '/churn', label: 'Churn Predictor' },
  { path: '/reports', label: 'Report Generator' },
  { path: '/advisor', label: 'AI Allocation Advisor' },
  { path: '/performance', label: 'Performance & Benchmarking' }
];

/* ─── Market Ticker ──────────────────────────────────────────── */
function MarketTicker() {
  const [tickers, setTickers] = useState([
    { label: 'NIFTY 50', raw: 24887.33, prefix: '', suffix: '', changeRaw: 0.12 },
    { label: 'SENSEX', raw: 81178.39, prefix: '', suffix: '', changeRaw: -0.22 },
    { label: 'NIFTY500', raw: 22137.12, prefix: '', suffix: '', changeRaw: -0.07 },
    { label: 'MIDCAP', raw: 18651.71, prefix: '', suffix: '', changeRaw: 0.05 },
    { label: 'SMALLCAP', raw: 15127.61, prefix: '', suffix: '', changeRaw: 0.03 },
    { label: 'VIX', raw: 14.24, prefix: '', suffix: '', changeRaw: 0.03 },
    { label: '10Y G-SEC', raw: 6.81, prefix: '', suffix: '%', changeRaw: -0.01 },
    { label: 'GOLD', raw: 71843, prefix: '₹', suffix: '/10g', changeRaw: 0.04 },
  ]);

  // Simulate live data updates
  useEffect(() => {
    const updateId = setInterval(() => {
      setTickers(prev => prev.map(t => {
        if (t.label === 'Repo Rate' || t.label === 'CPI') return t;
        // Random fluctuation between -0.05% and +0.05%
        const changeFactor = (Math.random() - 0.5) * 0.001;
        const newRaw = t.raw * (1 + changeFactor);
        const newChangeRaw = t.changeRaw + (changeFactor * 100);
        return { ...t, raw: newRaw, changeRaw: newChangeRaw };
      }));
    }, 2500); // update every 2.5 seconds
    return () => clearInterval(updateId);
  }, []);

  const formatValue = (t) => {
    let formatted = t.raw.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (t.label === 'GOLD') {
      formatted = Math.round(t.raw).toLocaleString('en-IN');
    }
    return `${t.prefix}${formatted}${t.suffix}`;
  };

  const formatChange = (change) => {
    if (change === 0) return 'unchanged';
    const sign = change > 0 ? '+' : '';
    return `${sign}${change.toFixed(2)}%`;
  };

  const [offset, setOffset] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setOffset(p => (p - 1) % (tickers.length * 160)), 25);
    return () => clearInterval(id);
  }, [tickers.length]);

  return (
    <div className="market-ticker">
      <div className="ticker-label">LIVE</div>
      <div className="ticker-track" style={{ transform: `translateX(${offset}px)` }}>
        {[...tickers, ...tickers].map((t, i) => {
          const up = t.changeRaw > 0;
          const isNeutral = t.changeRaw === 0;
          return (
            <span className="ticker-item" key={i}>
              <span className="ticker-name">{t.label}</span>
              <span className="ticker-value">{formatValue(t)}</span>
              <span 
                className={isNeutral ? '' : (up ? 'ticker-up' : 'ticker-down')}
                style={isNeutral ? { color: 'var(--text-muted)', fontSize: '0.65rem', fontWeight: 600, marginLeft: '6px' } : {}}
              >
                {formatChange(t.changeRaw)}
              </span>
            </span>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Sidebar ────────────────────────────────────────────────── */
function Sidebar({ collapsed, onToggle }) {
  const [notes, setNotes] = useState(() => localStorage.getItem('fund-manager-notes') || '');

  const handleNotesChange = (e) => {
    const val = e.target.value;
    setNotes(val);
    localStorage.setItem('fund-manager-notes', val);
  };

  const handleExportNotes = () => {
    const blob = new Blob([notes], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `fund-manager-notes-${new Date().toISOString().split('T')[0]}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <aside className={`sidebar ${collapsed ? 'sidebar-collapsed' : ''}`}>
      {/* Logo */}
      <div 
        className="sidebar-logo" 
        onClick={onToggle}
        title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          padding: '16px',
          cursor: 'pointer',
          userSelect: 'none'
        }}
      >
        <img 
          src="/logo.jpg" 
          alt="FinTrend Logo" 
          style={{ 
            height: '24px', 
            width: 'auto',
            objectFit: 'contain',
            marginRight: collapsed ? '0' : '10px',
            flexShrink: 0
          }} 
        />
        {!collapsed && (
          <div className="sidebar-logo-text" style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <div className="sidebar-brand" style={{ fontSize: '0.78rem', fontWeight: '800', color: 'var(--text-primary)', lineHeight: '1.2' }}>FinTrend Analytic Platform</div>
            <div className="sidebar-tagline" style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Command Center</div>
          </div>
        )}
      </div>

      {/* Nav items */}
      <nav className="sidebar-nav">
        {NAV_ITEMS.map(item => {
          const getAbbrev = (label) => {
            if (label.includes('Executive')) return 'ED';
            if (label.includes('AUM')) return 'AD';
            if (label.includes('SIP')) return 'SA';
            if (label.includes('Heatmap')) return 'TH';
            if (label.includes('AML')) return 'AM';
            if (label.includes('Compliance')) return 'CA';
            if (label.includes('Churn')) return 'CP';
            if (label.includes('Report')) return 'RG';
            if (label.includes('Advisor')) return 'AA';
            if (label.includes('Performance')) return 'PB';
            return label.substring(0, 2).toUpperCase();
          };
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `sidebar-nav-item ${isActive ? 'sidebar-nav-item-active' : ''}`
              }
              title={collapsed ? item.label : undefined}
            >
              {collapsed ? (
                <span className="sidebar-nav-icon" style={{ fontWeight: '700', fontSize: '0.8rem', width: '22px', textAlign: 'center' }}>
                  {getAbbrev(item.label)}
                </span>
              ) : (
                <span className="sidebar-nav-label" style={{ paddingLeft: '4px' }}>{item.label}</span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Fund Manager Notes Sidebar Widget */}
      {!collapsed && (
        <div className="sidebar-notes-box">
          <div className="sidebar-notes-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>FUND MANAGER NOTES</span>
            <button 
              onClick={handleExportNotes} 
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                background: 'var(--bg-main)',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                padding: '2px 8px',
                fontSize: '0.65rem',
                fontWeight: '600',
                color: 'var(--text-secondary)',
                cursor: 'pointer'
              }}
              title="Export Notes to TXT"
            >
              ↓ Export
            </button>
          </div>
          <textarea
            value={notes}
            onChange={handleNotesChange}
            placeholder="Write a small note here..."
            className="sidebar-notes-textarea"
          />
        </div>
      )}

      {/* Footer */}
      {!collapsed && (
        <div className="sidebar-footer">
          <div className="sidebar-footer-version">FinTrend v2.5.0</div>
          <div className="sidebar-footer-copy">SEBI Reg. No. INZ000234561</div>
        </div>
      )}
    </aside>
  );
}

/* ─── Top Header ─────────────────────────────────────────────── */
function TopHeader() {
  const { logoutUser } = usePlatform();
  const location = useLocation();
  const routeLabels = {
    '/': 'Executive Dashboard',
    '/aum': 'AUM Dashboard',
    '/sip': 'SIP Trend Analysis',
    '/heatmap': 'Transaction Heatmap',
    '/aml': 'AML Dashboard',
    '/compliance': 'Compliance Alerts',
    '/churn': 'Churn Predictor',
    '/reports': 'Report Generator',
    '/advisor': 'AI Allocation Advisor',
    '/performance': 'Performance & Benchmarking',
  };
  const title = routeLabels[location.pathname] || 'FinTrend Analytics';
  const now = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <header className="top-header">
      <div className="header-left">
        <h2 className="header-page-title">{title}</h2>
        <span className="header-date">As of {now}</span>
      </div>
      <div className="header-right" style={{ display: 'flex', alignItems: 'center' }}>
        <button 
          onClick={async () => {
            await logoutUser();
            window.location.reload();
          }}
          style={{
            background: 'rgba(239, 68, 68, 0.08)',
            color: '#ef4444',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            padding: '6px 12px',
            borderRadius: '6px',
            fontSize: '0.78rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)';
          }}
        >
          <span>Log Out</span>
        </button>
      </div>
    </header>
  );
}

/* ─── App Shell Component (Orchestrates layout & page navigation) ─── */
function AppShell() {
  // Local state to track whether the navigation sidebar is collapsed
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    // Top-level container displaying the side-by-side grid template
    <div className="app-shell">
      {/* Renders the navigation sidebar, passing collapse state and toggle handler */}
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(p => !p)} />
      {/* Right-hand side main content area container that adjusts width when sidebar collapses */}
      <div className={`main-area ${sidebarCollapsed ? 'main-area-expanded' : ''}`}>
        {/* Horizontal ticker bar displaying scrolling market indexes */}
        <MarketTicker />
        {/* Top toolbar containing the current date range and active session user details */}
        <TopHeader />
        {/* Target mounting point for matched react routes */}
        <main className="content-area">
          <Routes>
            {/* Core executive analytics cockpit */}
            <Route path="/" element={<ExecutiveDashboard />} />
            {/* Assets Under Management fund categorization view */}
            <Route path="/aum" element={<AUMDashboard />} />
            {/* Monthly collections, renewals, and stoppage analytics */}
            <Route path="/sip" element={<SIPTrendAnalysis />} />
            {/* Daily transaction volumes calendar map */}
            <Route path="/heatmap" element={<TransactionHeatmap />} />
            {/* Compliance monitoring and suspicious audit logs */}
            <Route path="/aml" element={<AMLDashboard />} />
            {/* AML Alert management override panel */}
            <Route path="/compliance" element={<ComplianceAlert />} />
            {/* AI retention analytics risk engine dashboard */}
            <Route path="/churn" element={<ChurnPrediction />} />
            {/* Regulatory and compliance PDF/Excel document downloader */}
            <Route path="/reports" element={<ReportGenerator />} />
            {/* Conversational chatbot stress-testing terminal */}
            <Route path="/advisor" element={<AIAllocationAdvisor />} />
            {/* Returns, expense ratio comparisons vs NIFTY 50 benchmarks */}
            <Route path="/performance" element={<PerformanceBenchmarking />} />
          </Routes>
        </main>
        {/* Global application copyright and disclaimer footer */}
        <footer className="app-footer">
          <span>© 2026 FinTrend Analytics Platform — SEBI Registered Investment Analyst</span>
          <span>Data refreshed every 2 minutes · All figures in INR unless stated</span>
        </footer>
      </div>
    </div>
  );
}

function SplashScreen({ onComplete }) {
  const [progress, setProgress] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setFadeOut(true);
            setTimeout(onComplete, 400);
          }, 200);
          return 100;
        }
        return p + 5;
      });
    }, 70);
    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: '#000000',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 99999,
      transition: 'opacity 0.4s ease',
      opacity: fadeOut ? 0 : 1,
      fontFamily: 'Inter, sans-serif'
    }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '20px'
      }}>
        <img 
          src="/logo.jpg" 
          alt="FinTrend Logo" 
          style={{ 
            height: '120px', 
            width: 'auto',
            objectFit: 'contain'
          }} 
        />
        
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ 
            fontSize: '1.5rem', 
            fontWeight: '800', 
            color: '#FFFFFF', 
            margin: 0, 
            textTransform: 'uppercase', 
            letterSpacing: '1px' 
          }}>
            FinTrend Analytic Platform
          </h1>
          <p style={{ 
            fontSize: '0.8rem', 
            color: '#9CA3AF', 
            marginTop: '4px',
            fontWeight: '500'
          }}>
            Enterprise Compliance & Asset Management Dashboard
          </p>
        </div>

        <div style={{ 
          width: '240px', 
          height: '4px', 
          backgroundColor: '#1F2937', 
          marginTop: '12px',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ 
            height: '100%', 
            width: `${progress}%`, 
            backgroundColor: '#2962FF',
            transition: 'width 0.08s linear'
          }}></div>
        </div>
        
        <div style={{ fontSize: '0.65rem', color: '#6B7280', fontWeight: '600', letterSpacing: '0.5px' }}>
          ESTABLISHING SECURE SESSION · {progress}%
        </div>
      </div>
    </div>
  );
}

function MainAppContent() {
  const { user, initializing } = usePlatform();
  const [showSplash, setShowSplash] = useState(true);
  const location = useLocation();

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  if (initializing) {
    return (
      <div style={{
        backgroundColor: '#000000',
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#ffffff',
        fontFamily: 'Inter, sans-serif',
        fontSize: '0.85rem'
      }}>
        Validating secure session...
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Auth />} />
      <Route path="/*" element={user ? <AppShell /> : <Navigate to="/login" replace state={{ from: location }} />} />
    </Routes>
  );
}

export default function App() {
  return (
    <PlatformProvider>
      <Router>
        <MainAppContent />
      </Router>
    </PlatformProvider>
  );
}
