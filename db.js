const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool(
    process.env.DATABASE_URL
        ? {
              connectionString: process.env.DATABASE_URL,
              ssl: { rejectUnauthorized: false }
          }
        : {
              host: process.env.DB_HOST,
              port: process.env.DB_PORT || 5432,
              user: process.env.DB_USER,
              password: process.env.DB_PASSWORD,
              database: process.env.DB_NAME,
              ssl: { rejectUnauthorized: false }
          }
);

// Compatibility bridge: allows using mysql2 style `pool.execute(sql, [params])` with Postgres
pool.execute = async function (sql, params = []) {
    let paramIndex = 1;
    const pgSql = sql.replace(/\?/g, () => `$${paramIndex++}`);
    const res = await pool.query(pgSql, params);
    return [res.rows, res.fields];
};

module.exports = pool;
