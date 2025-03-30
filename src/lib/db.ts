import { Pool } from 'pg';

const pool = new Pool({
  connectionString: 'postgres://postgres:3a3db5e98f9db617abba97718dd04fa0@134.122.124.102:5432/nullius_erp_staging_db',
});

export default pool;