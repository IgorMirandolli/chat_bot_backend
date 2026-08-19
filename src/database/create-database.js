import "dotenv/config";
import mysql from "mysql2/promise";

const databaseName = process.env.DB_NAME;

if (!databaseName || !/^[a-zA-Z0-9_]+$/.test(databaseName)) {
  throw new Error("DB_NAME deve conter apenas letras, numeros e underscore.");
}

let connection;

try {
  connection = await mysql.createConnection({
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
  });

  await connection.query(
    `CREATE DATABASE IF NOT EXISTS \`${databaseName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
  );
  console.log(`Banco ${databaseName} pronto para uso.`);
} catch (error) {
  console.error(`Nao foi possivel criar o banco: ${error.message}`);
  process.exitCode = 1;
} finally {
  if (connection) {
    await connection.end();
  }
}
