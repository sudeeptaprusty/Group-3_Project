export const DEFAULT_FUNDS = [
  { id: 'fnd-1', code: '500120', name: 'GrowTech Bluechip Equity Fund', category: 'EQUITY', risk: 'HIGH', nav: 84.32, aum: 4820.50, return1y: 12.4, return3y: 18.4, return5y: 22.1, sharpe: 1.85, expense: 0.012, manager: 'Sarah Jenkins', min_investment: 500, min_sip_amount: 500, exit_load_percent: 1.0, exit_load_period_days: 365 },
  { id: 'fnd-2', code: '500125', name: 'Apex Dynamic Debt Fund', category: 'DEBT', risk: 'LOW', nav: 24.15, aum: 2150.80, return1y: 6.2, return3y: 7.8, return5y: 8.5, sharpe: 2.10, expense: 0.008, manager: 'Robert Chen', min_investment: 1000, min_sip_amount: 1000, exit_load_percent: 0.0, exit_load_period_days: 0 },
  { id: 'fnd-3', code: '500130', name: 'Vanguard Hybrid Balanced Fund', category: 'HYBRID', risk: 'MODERATE', nav: 46.80, aum: 3120.40, return1y: 9.8, return3y: 12.5, return5y: 15.2, sharpe: 1.65, expense: 0.015, manager: 'Amit Patel', min_investment: 500, min_sip_amount: 500, exit_load_percent: 1.0, exit_load_period_days: 180 },
  { id: 'fnd-4', code: '500135', name: 'Sovereign Liquid Cash Fund', category: 'LIQUID', risk: 'LOW', nav: 12.45, aum: 6420.10, return1y: 4.8, return3y: 5.2, return5y: 5.8, sharpe: 2.45, expense: 0.005, manager: 'Robert Chen', min_investment: 5000, min_sip_amount: 5000, exit_load_percent: 0.0, exit_load_period_days: 0 },
  { id: 'fnd-5', code: '500140', name: 'GreenEnergy Sectoral ESG Fund', category: 'SECTORAL', risk: 'VERY_HIGH', nav: 56.90, aum: 1240.20, return1y: 16.5, return3y: 24.6, return5y: 28.3, sharpe: 1.45, expense: 0.018, manager: 'Sarah Jenkins', min_investment: 500, min_sip_amount: 500, exit_load_percent: 2.0, exit_load_period_days: 730 },
];

const FUND_PERFORMANCE = {
  'fnd-1': { return1y: 12.4, return3y: 18.4, return5y: 22.1, sharpe: 1.85 },
  'fnd-2': { return1y: 6.2, return3y: 7.8, return5y: 8.5, sharpe: 2.10 },
  'fnd-3': { return1y: 9.8, return3y: 12.5, return5y: 15.2, sharpe: 1.65 },
  'fnd-4': { return1y: 4.8, return3y: 5.2, return5y: 5.8, sharpe: 2.45 },
  'fnd-5': { return1y: 16.5, return3y: 24.6, return5y: 28.3, sharpe: 1.45 },
};

const NAV_BY_FUND = {
  'fnd-1': 84.32,
  'fnd-2': 24.15,
  'fnd-3': 46.80,
  'fnd-4': 12.45,
  'fnd-5': 56.90,
};

export function mapFundFromApi(fund) {
  const perf = FUND_PERFORMANCE[fund.id] || {};
  return {
    id: fund.id,
    code: fund.fund_code,
    name: fund.fund_name,
    category: fund.category,
    risk: fund.risk_level,
    nav: fund.current_nav,
    aum: fund.aum_crores,
    return1y: perf.return1y ?? 0,
    return3y: perf.return3y ?? 0,
    return5y: perf.return5y ?? 0,
    sharpe: perf.sharpe ?? 0,
    expense: fund.expense_ratio,
    manager: fund.fund_manager_id,
    min_investment: fund.min_investment,
    min_sip_amount: fund.min_sip_amount,
    exit_load_percent: fund.exit_load_percent ?? 0,
    exit_load_period_days: fund.exit_load_period_days ?? 0,
  };
}

export function getNavForFund(fundId) {
  return NAV_BY_FUND[fundId] ?? 0;
}

export function buildHoldingsFromTransactions(transactions, userId) {
  const userTxns = transactions.filter((t) => t.user_id === userId && t.status === 'SETTLED');
  const holdings = {};

  userTxns.forEach((t) => {
    if (!holdings[t.fund_id]) {
      holdings[t.fund_id] = {
        id: t.investment_id,
        fund_id: t.fund_id,
        fund_name: t.fund_name,
        investment_type: t.transaction_type === 'SIP_AUTO' ? 'SIP' : 'LUMPSUM',
        amount: 0,
        total_units: 0,
        current_value: 0,
      };
    }
    holdings[t.fund_id].amount += t.amount;
    holdings[t.fund_id].total_units += t.units || 0;
  });

  return Object.values(holdings).map((h) => ({
    ...h,
    current_value: parseFloat((h.total_units * getNavForFund(h.fund_id)).toFixed(2)),
  }));
}

export function buildNotificationsFromAlerts(alerts) {
  return alerts.map((alt) => ({
    id: alt.id,
    type: 'COMPLIANCE_ALERT',
    title: alt.alert_type.replace('_', ' '),
    body: alt.description,
    read: alt.status === 'RESOLVED',
    sent_at: alt.created_at,
  }));
}
