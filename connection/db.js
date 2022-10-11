const { Pool } = require("pg");

const dbPool = new Pool({
  database: "personal",
  port: 5432,
  user: "postgres",
  password: "getas123",
});
module.exports = dbPool;
