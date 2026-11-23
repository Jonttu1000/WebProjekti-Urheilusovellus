import "dotenv/config";
import app from "./app.js";
import pool from "./config/database.js";

const PORT = Number(process.env.PORT || 3000);

try {
  // Varmistetaan db ennen palvelimen käynnistystä
  await pool.query("SELECT 1");

  console.log("MySQL-tietokantayhteys onnistui!");

  app.listen(PORT, () => {
    console.log(
      `API käynnissä: http://localhost:${PORT}`
    );
  });
} catch (error) {
  console.error(
    "Tietokantayhteys epäonnistui:",
    error.code,
    error.message
  );

  await pool.end();
  process.exit(1);
}
