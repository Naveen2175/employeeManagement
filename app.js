const express  = require('express');
const sqlite3  = require('sqlite3').verbose();
const path     = require('path');

const app  = express();
const PORT = process.env.PORT || 3001;

/* ---------- middleware ---------- */
app.use(express.json());                 // built-in body parser
app.use(express.static('public'));       // serves index.html & assets

/* ---------- database ---------- */
const db = new sqlite3.Database('./employees.db', (err) => {
  if (err) console.error('❌ DB open error:', err.message);
});

/* employees table with UNIQUE (case-insensitive) email */
db.run(`
  CREATE TABLE IF NOT EXISTS employees (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT    NOT NULL,
    email      TEXT    NOT NULL UNIQUE COLLATE NOCASE,
    gender     TEXT    NOT NULL,
    age        INTEGER NOT NULL CHECK(age BETWEEN 18 AND 65),
    department TEXT    NOT NULL
  )
`);

/* ---------- helpers ---------- */
function allFieldsPresent(obj) {
  return ['name','email','gender','age','department']
         .every(k => obj[k] !== undefined && obj[k] !== '');
}

/* ---------- routes ---------- */
app.post('/api/employees', (req, res) => {
  const { name, email, gender, age, department } = req.body;

  if (!allFieldsPresent(req.body))
    return res.status(400).json({ error: 'All fields are required.' });
  if (age < 18 || age > 65)
    return res.status(400).json({ error: 'Age must be 18–65.' });

  const stmt = db.prepare(
    `INSERT INTO employees (name, email, gender, age, department)
     VALUES (?, ?, ?, ?, ?)`
  );
  stmt.run(name, email, gender, age, department, function (err) {
    if (err) {
      if (err.code === 'SQLITE_CONSTRAINT')
        return res.status(409).json({ error: 'Email already exists.' });
      return res.status(500).json({ error: 'Failed to insert employee.' });
    }
    res.json({ id: this.lastID, name, email, gender, age, department });
  });
});

app.get('/api/employees', (_req, res) => {
  db.all('SELECT * FROM employees ORDER BY id', (err, rows) => {
    if (err)
      return res.status(500).json({ error: 'Failed to fetch employees.' });
    res.json(rows);
  });
});

app.put('/api/employees/:id', (req, res) => {
  const { id } = req.params;
  const { name, email, gender, age, department } = req.body;

  if (!allFieldsPresent(req.body))
    return res.status(400).json({ error: 'All fields are required.' });
  if (age < 18 || age > 65)
    return res.status(400).json({ error: 'Age must be 18–65.' });

  db.run(
    `UPDATE employees
       SET name = ?, email = ?, gender = ?, age = ?, department = ?
     WHERE id = ?`,
    [name, email, gender, age, department, id],
    function (err) {
      if (err) {
        if (err.code === 'SQLITE_CONSTRAINT')
          return res.status(409).json({ error: 'Email already exists.' });
        return res.status(500).json({ error: 'Failed to update employee.' });
      }
      if (this.changes === 0)
        return res.status(404).json({ error: 'Employee not found.' });
      res.json({ id, name, email, gender, age, department });
    }
  );
});

app.delete('/api/employees/:id', (req, res) => {
  db.run('DELETE FROM employees WHERE id = ?', req.params.id, function (err) {
    if (err)
      return res.status(500).json({ error: 'Failed to delete employee.' });
    if (this.changes === 0)
      return res.status(404).json({ error: 'Employee not found.' });
    res.json({ success: true });
  });
});

/* ---------- start server ---------- */
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
