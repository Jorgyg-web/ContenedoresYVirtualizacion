import express from "express";
import morgan from "morgan";
import pkg from "pg";

const { Pool } = pkg;

const app = express();
const PORT = process.env.PORT || 8080;

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 5432),
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB
});

app.use(express.json());
app.use(morgan("combined")); // logging mínimo

// Helpers de validación
const isString = v => typeof v === "string" && v.trim().length > 0;
const parseId = id => {
  const n = Number(id);
  return Number.isInteger(n) && n > 0 ? n : null;
};

// GET /students - lista todos
app.get("/students", async (_req, res, next) => {
  try {
    const { rows } = await pool.query("SELECT id, name, email FROM students ORDER BY id");
    res.json(rows);
  } catch (e) { next(e); }
});

// GET /students/:id - obtiene uno
app.get("/students/:id", async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ error: "id inválido" });

    const { rows } = await pool.query("SELECT id, name, email FROM students WHERE id=$1", [id]);
    if (rows.length === 0) return res.status(404).json({ error: "Entidad no encontrada" });
    res.json(rows[0]);
  } catch (e) { next(e); }
});

// POST /students - crea uno
app.post("/students", async (req, res, next) => {
  try {
    const { name, email } = req.body || {};
    if (!isString(name) || !isString(email)) {
      return res.status(400).json({ error: "Campos inválidos: name y email (string)" });
    }
    const { rows } = await pool.query(
      "INSERT INTO students(name, email) VALUES ($1,$2) RETURNING id, name, email",
      [name.trim(), email.trim()]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    // conflicto por email duplicado => 400
    if (e.code === "23505") return res.status(400).json({ error: "email ya existe" });
    next(e);
  }
});

// DELETE /students/:id - borra uno
app.delete("/students/:id", async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ error: "id inválido" });

    const { rowCount } = await pool.query("DELETE FROM students WHERE id=$1", [id]);
    if (rowCount === 0) return res.status(404).json({ error: "Entidad no encontrada" });
    res.status(204).end();
  } catch (e) { next(e); }
});

// Middleware de errores (500 por defecto)
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Error interno" });
});

app.listen(PORT, () => {
  console.log(`API escuchando en http://localhost:${PORT}`);
});
