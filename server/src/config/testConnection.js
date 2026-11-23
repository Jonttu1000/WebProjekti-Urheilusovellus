import pool from "./database.js";

try {
  const [info] = await pool.query(`
    SELECT
      DATABASE() AS database_name,
      VERSION() AS version
  `);

  console.log("Yhteys tietokantaan onnistui!");
  console.log("Tietokanta:", info[0].database_name);
  console.log("Palvelinversio:", info[0].version);

  const [tables] = await pool.query("SHOW TABLES");

  console.log("Tauluja löytyi:", tables.length);
  console.log(
    "Taulut:",
    tables.map((row) => Object.values(row)[0])
  );
} catch (error) {
  console.error("MySQL-virhe:", error.code);
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
