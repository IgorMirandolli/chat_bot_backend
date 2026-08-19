import "dotenv/config";
import {
  destroyDatabaseConnection,
  getDatabase,
} from "./connection.js";

try {
  const database = getDatabase();
  await database.raw("SELECT 1 AS connection_test");
  console.log("Conexao com o MySQL realizada com sucesso.");
} catch (error) {
  console.error(`Falha ao conectar com o MySQL: ${error.message}`);
  process.exitCode = 1;
} finally {
  await destroyDatabaseConnection();
}
