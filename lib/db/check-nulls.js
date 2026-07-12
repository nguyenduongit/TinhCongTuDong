require('dotenv').config({ path: '../../.env' });
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function check() {
  const c1 = await pool.query('SELECT count(*) FROM cong_doan WHERE user_id IS NULL');
  const c2 = await pool.query('SELECT count(*) FROM san_luong WHERE user_id IS NULL');
  console.log('Null user_ids in cong_doan:', c1.rows[0].count);
  console.log('Null user_ids in san_luong:', c2.rows[0].count);
  
  if (c1.rows[0].count > 0) {
    await pool.query('UPDATE cong_doan SET user_id = 1 WHERE user_id IS NULL');
    console.log('Updated cong_doan nulls');
  }
  if (c2.rows[0].count > 0) {
    await pool.query('UPDATE san_luong SET user_id = 1 WHERE user_id IS NULL');
    console.log('Updated san_luong nulls');
  }
  process.exit(0);
}
check();
