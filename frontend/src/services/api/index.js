import { getJson, postJson } from './client';

export const authApi = {
  register: (payload) => postJson('/auth/register', payload),
  login: (payload) => postJson('/auth/login', payload),
  getSession: () => getJson('/auth/session'),
  logout: (payload) => postJson('/auth/logout', payload),
};

export const investorsApi = {
  getAll: () => getJson('/investors'),
};

export const fundsApi = {
  getAll: () => getJson('/funds'),
};

export const investmentsApi = {
  create: (payload) => postJson('/investments', payload),
};

export const sipApi = {
  getAll: () => getJson('/sip-schedules'),
  manage: (sipId, action) => postJson(`/sip-schedules/${sipId}/manage`, { action }),
  rollover: (payload) => postJson('/sip-schedules/rollover', payload),
};

export const transactionsApi = {
  getAll: () => getJson('/transactions'),
};

export const complianceApi = {
  getAlerts: () => getJson('/compliance/alerts'),
  resolve: (payload) => postJson('/compliance/resolve', payload),
};

export const analyticsApi = {
  getChurnPredictions: () => getJson('/analytics/churn-prediction'),
  triggerOutreach: (userId) => postJson('/analytics/outreach', { userId }),
};

export const auditApi = {
  getAll: () => getJson('/audit-logs'),
};

export const settingsApi = {
  getAiThreshold: () => getJson('/settings/ai-threshold'),
  setAiThreshold: (threshold) => postJson('/settings/ai-threshold', { threshold }),
  reset: () => postJson('/settings/reset'),
};

export const systemUsersApi = {
  getAll: () => getJson('/users/system'),
  create: (payload) => postJson('/users/system', payload),
};

export const aiApi = {
  chat: (payload) => postJson('/ai/chat', payload),
};

