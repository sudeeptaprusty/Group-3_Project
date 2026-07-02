const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const http = require('http');
const WebSocket = require('ws');
const app = require('./src/app');
const { initializeDatabase } = require('./src/config/db');
const { startGenerator } = require('./src/services/generator.js');

const PORT = process.env.PORT || 5000;

(async () => {
  try {
    await initializeDatabase(false);

    const server = http.createServer(app);
    const wss = new WebSocket.Server({ noServer: true });

server.on('upgrade', (request, socket, head) => {
  const { pathname } = new URL(request.url, `http://${request.headers.host}`);
  if (pathname === '/ws') {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  } else {
    socket.destroy();
  }
});

wss.on('connection', (ws) => {
  console.log('[WEBSOCKET] Client connected 📡');
  ws.send(JSON.stringify({ type: 'WELCOME', message: 'Connected...' }));
  
  // Heartbeat to prevent idle disconnects
  const interval = setInterval(() => ws.ping(), 30000);
  
  ws.on('pong', () => {});
  ws.on('close', () => {
    clearInterval(interval);
    console.log('[WEBSOCKET] Client disconnected 🔌');
  });
});
    if (process.env.SEED_DATABASE === 'true') {
      startGenerator(wss);
    } else {
      console.log('[GENERATOR] Seeding is disabled; skipping real-time mock transaction simulation.');
    }

    server.listen(PORT, () => {
      console.log('====================================================');
      console.log(`⚡ Aegis Zero-Admin HTTP & WS Backend running on Port: ${PORT}`);
      console.log('====================================================');
    });
  } catch (err) {
    console.error('Failed to boot server due to database initialization error:', err.message);
    process.exit(1);
  }
})();