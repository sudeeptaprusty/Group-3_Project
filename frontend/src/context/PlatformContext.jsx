import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  authApi,
  investorsApi,
  fundsApi,
  investmentsApi,
  sipApi,
  transactionsApi,
  complianceApi,
  analyticsApi,
  auditApi,
  settingsApi,
  systemUsersApi,
} from '../services/api';
import {
  DEFAULT_FUNDS,
  mapFundFromApi,
  buildHoldingsFromTransactions,
  buildNotificationsFromAlerts,
} from '../constants/funds';

const PlatformContext = createContext();

export const PlatformProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);
  const [investments, setInvestments] = useState([]);
  const [allTransactions, setAllTransactions] = useState([]);
  const [allComplianceAlerts, setAllComplianceAlerts] = useState([]);
  const [selectedRange, setSelectedRange] = useState('01 Apr 2024 - 30 Apr 2024');
  const [auditLogs, setAuditLogs] = useState([]);
  const [investors, setInvestors] = useState([]);
  const [systemUsers, setSystemUsers] = useState([]);
  const [sipSchedules, setSipSchedules] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [aiThreshold, setAiThresholdState] = useState(95.0);
  const [activeTab, setActiveTab] = useState('home');
  const [churnPredictions, setChurnPredictions] = useState([]);
  const [funds, setFunds] = useState(DEFAULT_FUNDS);
  // No-op logger to prevent console logs from taking up memory or state
  const appendLog = () => {};

  const refreshState = async () => {
    const token = localStorage.getItem('fintrend-token');
    if (!token) {
      setUser(null);
      setInitializing(false);
      return;
    }

    try {
      // 1. Verify session token first
      const sessionRes = await authApi.getSession();
      if (!sessionRes || !sessionRes.user) {
        localStorage.removeItem('fintrend-token');
        localStorage.removeItem('fintrend-current-user');
        setUser(null);
        setInitializing(false);
        return;
      }

      const activeUser = sessionRes.user;
      setUser(activeUser);
      sessionStorage.setItem('mf_user_id', activeUser.id);
      localStorage.setItem('fintrend-current-user', JSON.stringify(activeUser));

      // 2. Fetch protected resources with fallback try-catch blocks
      const fetchSafely = async (promise, fallbackValue) => {
        try {
          const res = await promise;
          return res !== null && res !== undefined ? res : fallbackValue;
        } catch (e) {
          console.warn('Database fetch failed gracefully:', e.message);
          return fallbackValue;
        }
      };

      const [
        invData,
        txnsData,
        alertsData,
        logsData,
        sipsData,
        staffData,
        thresholdData,
        fundsData,
        churnData,
      ] = await Promise.all([
        fetchSafely(investorsApi.getAll(), []),
        fetchSafely(transactionsApi.getAll(), []),
        fetchSafely(complianceApi.getAlerts(), []),
        fetchSafely(auditApi.getAll(), []),
        fetchSafely(sipApi.getAll(), []),
        fetchSafely(systemUsersApi.getAll(), []),
        fetchSafely(settingsApi.getAiThreshold(), { threshold: 95.0 }),
        fetchSafely(fundsApi.getAll(), []),
        fetchSafely(analyticsApi.getChurnPredictions(), []),
      ]);

      if (invData) setInvestors(invData);
      if (txnsData) {
        setAllTransactions(txnsData);
        if (activeUser.role === 'INVESTOR') {
          setInvestments(buildHoldingsFromTransactions(txnsData, activeUser.id));
        } else {
          setInvestments([]);
        }
      }
      if (alertsData) {
        setAllComplianceAlerts(alertsData);
        setNotifications(buildNotificationsFromAlerts(alertsData));
      }
      if (logsData) setAuditLogs(logsData);
      if (sipsData) setSipSchedules(sipsData);
      if (staffData) setSystemUsers(staffData);
      if (thresholdData) setAiThresholdState(thresholdData.threshold);
      if (fundsData) setFunds(fundsData.map(mapFundFromApi));
      if (churnData) setChurnPredictions(churnData);

    } catch (err) {
      console.error('State refresh failed:', err.message);
    } finally {
      setInitializing(false);
    }
  };

  useEffect(() => {
    // Refresh the initial system state (fetch active users, folios, and system logs) on load
    refreshState().then(() => {
      appendLog('sys', 'Successfully synced session with SQLite database.');
    });

    // Compute the target WebSocket URL pointing to the Express server via the same host proxy
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    console.log('[WEBSOCKET] Connecting to live stream at:', wsUrl);
    let ws;

    // Recursive connect helper to initialize connection
    function connect() {
      // Create new native browser WebSocket client instance
      ws = new WebSocket(wsUrl);

      // Handle successful connection opens
      ws.onopen = () => {
        console.log('[WEBSOCKET] Stream connection established successfully.');
        appendLog('sys', 'Established active WebSocket pipeline for real-time AMC analytics.');
      };

      // Handle incoming messages streamed from the backend generator
      ws.onmessage = (event) => {
        try {
          // Parse the streamed JSON packet
          const data = JSON.parse(event.data);
          
          // Verify if it is a new transaction payload broadcasted by the mock trades generator
          if (data.type === 'NEW_TRANSACTION') {
            const { transaction, alert } = data;
            
            // Append the new transaction dynamically to the front of the global allTransactions array
            setAllTransactions((prev) => [transaction, ...prev]);
            appendLog('be', `Live Order: ${transaction.transaction_type} of ₹${(transaction.amount / 10000000).toFixed(4)} Cr in ${transaction.fund_name}.`);
            
            // Check if the backend rule validator flagged this transaction as a compliance threat
            if (alert) {
              // Append the compliance alert dynamically to the front of allComplianceAlerts array
              setAllComplianceAlerts((prev) => [alert, ...prev]);
              appendLog('ai', `AI-COMPLIANCE: ⚠️ Suspicious pattern flagged: ${alert.description}`);
            }
          } else if (data.type === 'SIP_CANCELLED') {
            setSipSchedules((prev) => prev.map(sip => 
              sip.id === data.sipId ? { ...sip, status: 'CANCELLED', updated_at: new Date().toISOString() } : sip
            ));
            appendLog('sys', `SIP schedule cancelled by investor.`);
          } else if (data.type === 'SIP_CREATED') {
            setSipSchedules((prev) => [{ id: data.sipId, status: 'ACTIVE', created_at: new Date().toISOString() }, ...prev]);
            appendLog('sys', `New SIP schedule registered by investor.`);
          }
        } catch (err) {
          console.error('[WEBSOCKET] Parse error:', err.message);
        }
      };

      ws.onclose = () => {
        console.log('[WEBSOCKET] Stream closed. Attempting reconnect in 3s...');
        setTimeout(connect, 3000);
      };

      ws.onerror = (err) => {
        console.error('[WEBSOCKET] Connection error:', err.message);
      };
    }

    connect();

    return () => {
      if (ws) ws.close();
    };
  }, []);

  useEffect(() => {
    setNotifications(buildNotificationsFromAlerts(allComplianceAlerts));
  }, [allComplianceAlerts]);

  const registerUser = async (email, fullName, dob, phone, role = 'INVESTOR', password) => {
    try {
      const res = await authApi.register({ email, fullName, dob, phone, role, password });
      if (res.ok) {
        const data = await res.json();
        if (data.user && data.user.token) {
          localStorage.setItem('fintrend-token', data.user.token);
          localStorage.setItem('fintrend-current-user', JSON.stringify(data.user));
        }
        appendLog('fe', `Registered account: ${fullName} (${email}). Status ACTIVE.`);
        await refreshState();
        return { ok: true, user: data.user };
      } else {
        let errMsg = 'Registration failed.';
        try {
          const errData = await res.json();
          errMsg = errData.error || errMsg;
        } catch {}
        return { ok: false, error: errMsg };
      }
    } catch (err) {
      console.error('Network failure during registration:', err.message);
      return { ok: false, error: err.message };
    }
  };

  const setupInvestment = async (fundId, type, amount, frequency = 'MONTHLY', sipDate = 5) => {
    if (!user) return;

    try {
      const res = await investmentsApi.create({
        userId: user.id,
        fundId,
        type,
        amount: parseFloat(amount),
        frequency,
        sipDate,
      });

      if (res.ok) {
        appendLog('fe', `Initiated order setup: ₹${parseFloat(amount).toLocaleString()} ${type} purchase.`);
        await refreshState();
        setTimeout(async () => {
          appendLog('be', 'Order settled. Units allocated at current NAV. Portfolio balance updated.');
          await refreshState();
        }, 1600);
      } else {
        const errData = await res.json();
        alert(errData.error || 'Investment placement failed.');
      }
    } catch (err) {
      console.error('Investment failed:', err.message);
    }
  };

  const manageSipSchedule = async (sipId, action) => {
    try {
      const res = await sipApi.manage(sipId, action);
      if (res.ok) {
        appendLog('be', `SIP mandate mandate id: ${sipId} updated status -> ${action}D.`);
        await refreshState();
      }
    } catch (err) {
      console.error('SIP update failed:', err.message);
    }
  };

  const rolloverSipSchedule = async (payload) => {
    try {
      const res = await sipApi.rollover(payload);
      if (res.ok) {
        appendLog('be', `SIP Rollover registered: ${payload.investorName} rolled over into ${payload.fundName} (₹${parseFloat(payload.amount).toLocaleString()}/mo).`);
        await refreshState();
        return { ok: true, data: await res.json() };
      } else {
        let errMsg = 'Rollover failed';
        try {
          const contentType = res.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const err = await res.json();
            errMsg = err.error || errMsg;
          } else {
            errMsg = `Server returned status code ${res.status} (Please restart your backend development server to load the new rollover routes).`;
          }
        } catch {
          errMsg = `Server returned status code ${res.status}.`;
        }
        return { ok: false, error: errMsg };
      }
    } catch (err) {
      console.error('SIP rollover failed:', err.message);
      return { ok: false, error: err.message };
    }
  };

  const resolveAlert = async (alertId, resolution, notes) => {
    try {
      const res = await complianceApi.resolve({ alertId, resolution, notes });
      if (res.ok) {
        appendLog('be', `AML check resolved: ${resolution}. Logs updated.`);
        await refreshState();
      }
    } catch (err) {
      console.error('Alert resolution failed:', err.message);
    }
  };

  const addSystemUser = async (fullName, email, role) => {
    try {
      const res = await systemUsersApi.create({ fullName, email, role });
      if (res.ok) {
        appendLog('be', `Privileged AMC personnel authorized: ${fullName} (${role}).`);
        await refreshState();
      }
    } catch (err) {
      console.error('Provisioning failed:', err.message);
    }
  };

  const setAiThreshold = async (threshold) => {
    try {
      const res = await settingsApi.setAiThreshold(threshold);
      if (res.ok) {
        setAiThresholdState(threshold);
        appendLog('sys', `AI Auto-Approval boundary adjusted -> ${threshold}%.`);
      }
    } catch (err) {
      console.error('Threshold tuning failed:', err.message);
    }
  };

  const runChurnAnalysis = async () => {
    appendLog('sys', 'ML-ENGINE: Commencing real-time investor churn analysis...');
    appendLog('ai', 'ML-ENGINE: Querying relational database schemas & compiling investor histories...');

    try {
      const data = await analyticsApi.getChurnPredictions();
      if (data) {
        setChurnPredictions(data);
        appendLog('ai', 'ML-ENGINE: Behavioral feature vectors extracted successfully.');
        appendLog('ai', 'ML-ENGINE: Completed feed-forward weights. Sigmoid probability gradients computed.');
        appendLog('sys', `ML-ENGINE: Prediction complete. ${data.filter((d) => d.riskCategory === 'HIGH').length} HNW folios flagged as HIGH churn risk.`);
        await refreshState();
      }
    } catch (err) {
      console.error('Churn analysis failed:', err.message);
    }
  };

  const triggerRetainerOutreach = async (userId) => {
    try {
      const res = await analyticsApi.triggerOutreach(userId);
      if (res.ok) {
        appendLog('fe', 'AMC Outreach Gateway: Authorizing proactive relationship campaign...');
        appendLog('be', 'AMC Outreach Gateway: Outbound email offer dispatched and logged to WORM ledger.');
        await runChurnAnalysis();
      }
    } catch (err) {
      console.error('Outreach failed:', err.message);
    }
  };

  const resetSandbox = async () => {
    try {
      const res = await settingsApi.reset();
      if (res.ok) {
        sessionStorage.clear();
        localStorage.clear();
        setUser(null);
        setInvestments([]);
        setAllTransactions([]);
        setAllComplianceAlerts([]);
        setSipSchedules([]);
        setNotifications([]);
        await refreshState();
      }
    } catch (err) {
      console.error('Reset failed:', err.message);
    }
  };

  // Filter helper
  const filterByDateRange = (items, rangeStr) => {
    if (!items || !rangeStr) return items;
    
    if (rangeStr === '01 Apr 2024 - 30 Apr 2024') {
      return items.filter(item => {
        const date = item.created_at || item.sent_at;
        return date && date.startsWith('2024-04');
      });
    }
    if (rangeStr === '01 May 2024 - 31 May 2024') {
      return items.filter(item => {
        const date = item.created_at || item.sent_at;
        return date && date.startsWith('2024-05');
      });
    }
    if (rangeStr === '01 Jun 2026 - 30 Jun 2026') {
      return items.filter(item => {
        const date = item.created_at || item.sent_at;
        return date && date.startsWith('2026-06');
      });
    }
    if (rangeStr === 'Year to Date (FY 2025-26)') {
      return items.filter(item => {
        const dateStr = item.created_at || item.sent_at;
        if (!dateStr) return false;
        const date = new Date(dateStr);
        const start = new Date('2025-04-01T00:00:00Z');
        const end = new Date('2026-03-31T23:59:59Z');
        return date >= start && date <= end;
      });
    }
    
    return items;
  };

  const loginUser = async (email, password) => {
    try {
      const res = await authApi.login({ email, password });
      if (res.ok) {
        const data = await res.json();
        if (data.user && data.user.token) {
          localStorage.setItem('fintrend-token', data.user.token);
          localStorage.setItem('fintrend-current-user', JSON.stringify(data.user));
        }
        await refreshState();
        return { ok: true, user: data.user };
      } else {
        let errMsg = 'Login failed';
        try {
          const errData = await res.json();
          errMsg = errData.error || errMsg;
        } catch {}
        return { ok: false, error: errMsg };
      }
    } catch (err) {
      return { ok: false, error: err.message };
    }
  };

  const logoutUser = async () => {
    try {
      if (user) {
        await authApi.logout({ userId: user.id, fullName: user.fullName, role: user.role });
      }
    } catch (e) {
      console.error('Logout logging failed:', e.message);
    }
    localStorage.removeItem('fintrend-token');
    localStorage.removeItem('fintrend-current-user');
    sessionStorage.removeItem('mf_user_id');
    setUser(null);
    setInvestments([]);
  };

  const filteredTransactions = filterByDateRange(allTransactions, selectedRange);
  const filteredComplianceAlerts = filterByDateRange(allComplianceAlerts, selectedRange);

  return (
    <PlatformContext.Provider
      value={{
        user,
        investments,
        transactions: filteredTransactions,
        complianceAlerts: filteredComplianceAlerts,
        allTransactions,
        allComplianceAlerts,
        selectedRange,
        setSelectedRange,
        auditLogs,
        investors,
        systemUsers,
        sipSchedules,
        notifications,
        setNotifications,
        aiThreshold,
        activeTab,
        setActiveTab,
        funds,
        churnPredictions,
        runChurnAnalysis,
        triggerRetainerOutreach,
        registerUser,
        setupInvestment,
        resolveAlert,
        resetSandbox,
        manageSipSchedule,
        rolloverSipSchedule,
        addSystemUser,
        setAiThreshold,
        loginUser,
        logoutUser,
        initializing,
      }}
    >
      {children}
    </PlatformContext.Provider>
  );
};

export const usePlatform = () => useContext(PlatformContext);
