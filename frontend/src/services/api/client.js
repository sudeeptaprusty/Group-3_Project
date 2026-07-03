const API_BASE = '/api';

async function request(path, options = {}) {
  const token = localStorage.getItem('fintrend-token');
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  // If unauthorized and not logging in/registering/getting session, log out user
  if (
    response.status === 401 && 
    !path.includes('/auth/login') && 
    !path.includes('/auth/register') &&
    !path.includes('/auth/session')
  ) {
    localStorage.removeItem('fintrend-token');
    localStorage.removeItem('fintrend-current-user');
    sessionStorage.removeItem('mf_user_id');
    window.location.reload();
  }

  return response;
}

async function getJson(path) {
  const response = await request(path);
  if (!response.ok) return null;
  return response.json();
}

async function postJson(path, body) {
  return request(path, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export { request, getJson, postJson };
