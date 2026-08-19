import "dotenv/config";
import knex from "knex";

let database;

function getConnectionOptions() {
  const requiredVariables = ["DB_HOST", "DB_USER", "DB_NAME"];
  const missingVariables = requiredVariables.filter(
    (variable) => !process.env[variable],
  );

  if (missingVariables.length > 0) {
    throw new Error(
      `Variaveis de banco ausentes: ${missingVariables.join(", ")}.`,
    );
  }

  return {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME,
    charset: "utf8mb4",
  };
}

export function getDatabase() {
  if (!database) {
    database = knex({
      client: "mysql2",
      connection: getConnectionOptions(),
      pool: {
        min: 0,
        max: 10,
      },
      acquireConnectionTimeout: 10_000,
    });
  }

  return database;
}

export async function destroyDatabaseConnection() {
  if (!database) {
    return;
  }

  await database.destroy();
  database = undefined;
}
