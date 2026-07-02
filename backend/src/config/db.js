require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'Kfin-db',
  password: process.env.DB_PASSWORD || 'Siba@6278',
  port: process.env.DB_PORT || 5432,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  ssl: process.env.DB_HOST && process.env.DB_HOST.includes('amazonaws.com') ? { rejectUnauthorized: false } : false
});

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL client error', err);
  process.exit(-1);
});

const query = (text, params) => pool.query(text, params);
const getClient = () => pool.connect();

// Converts SQLite-style ? placeholders to PostgreSQL $1, $2, ...
function pgParams(text) {
  let i = 0;
  return text.replace(/\?/g, () => `$${++i}`);
}

// SQLite-style query adapter used throughout repositories, routes, and services
const dbQuery = {
  all: async (text, params) => {
    const res = await pool.query(pgParams(text), params);
    return res.rows;
  },
  run: async (text, params) => {
    const res = await pool.query(pgParams(text), params);
    return res.rows[0] || null;
  },
  get: async (text, params) => {
    const res = await pool.query(pgParams(text), params);
    return res.rows[0] || null;
  },
};

// Called from server.js on boot to create schema tables
async function initializeDatabase(reset = false) {
  const { initDb } = require('./initDb');
  await initDb(reset);
}

module.exports = { pool, query, getClient, dbQuery, initializeDatabase };
