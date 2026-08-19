require("dotenv").config();

const connection = {
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "cinematch",
  charset: "utf8mb4",
};

module.exports = {
  development: {
    client: "mysql2",
    connection,
    pool: {
      min: 0,
      max: 10,
    },
    migrations: {
      directory: "./src/database/migrations",
      extension: "js",
    },
    seeds: {
      directory: "./src/database/seeds",
      extension: "js",
    },
  },
};
