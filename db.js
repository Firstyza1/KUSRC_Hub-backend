const { Pool } = require('pg');
const pool = new Pool({
  user: 'admin',
  password: 'admin',
  host: 'localhost',
  port: 5434,
  database: 'kusrchub'
});

module.exports = {
  query: (text, params) => pool.query(text, params)
};