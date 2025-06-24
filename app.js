const express = require("express");
const bodyParser = require("body-parser");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(bodyParser.json());
app.use(express.static("public"));

const db = new sqlite3.Database("./employees.db");

db.run(`
  CREATE TABLE IF NOT EXISTS employees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    department TEXT NOT NULL
  )
`);

app.post("/api/employees", (req, res) => {
  const { name, department } = req.body;
  if (!name || !department) {
    return res.status(400).json({ error: "Name and department are required." });
  }
  const stmt = db.prepare("INSERT INTO employees (name, department) VALUES (?, ?)");
  stmt.run(name, department, function (err) {
    if (err) return res.status(500).json({ error: "Failed to insert employee." });
    res.json({ id: this.lastID, name, department });
  });
});

app.get("/api/employees", (req, res) => {
  db.all("SELECT * FROM employees", (err, rows) => {
    if (err) return res.status(500).json({ error: "Failed to fetch employees." });
    res.json(rows);
  });
});

app.put("/api/employees/:id", (req, res) => {
  const { id } = req.params;
  const { name, department } = req.body;
  if (!name || !department) {
    return res.status(400).json({ error: "Name and department are required." });
  }
  db.run(
    "UPDATE employees SET name = ?, department = ? WHERE id = ?",
    [name, department, id],
    function (err) {
      if (err) return res.status(500).json({ error: "Failed to update employee." });
      if (this.changes === 0) return res.status(404).json({ error: "Employee not found." });
      res.json({ id, name, department });
    }
  );
});

app.delete("/api/employees/:id", (req, res) => {
  const { id } = req.params;
  db.run("DELETE FROM employees WHERE id = ?", id, function (err) {
    if (err) return res.status(500).json({ error: "Failed to delete employee." });
    if (this.changes === 0) return res.status(404).json({ error: "Employee not found." });
    res.json({ success: true });
  });
});

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
