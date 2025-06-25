/* ==========  Express + SQLite backend  ========== */
const express  = require('express');
const sqlite3  = require('sqlite3').verbose();
const path     = require('path');

const app  = express();
const PORT = process.env.PORT || 3001;

/* ---------- middleware ---------- */
app.use(express.json());
app.use(express.static('public'));   // serves index.html & assets

/* ---------- database ---------- */
const db = new sqlite3.Database('./employees.db', err => {
  if (err) console.error('❌ DB open error:', err.message);
});

/* employees table with UNIQUE e-mail (case-insensitive) */
db.run(`
  CREATE TABLE IF NOT EXISTS employees (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT    NOT NULL,
    email      TEXT    NOT NULL UNIQUE COLLATE NOCASE,
    gender     TEXT    NOT NULL CHECK (gender IN ('Male','Female')),
    age        INTEGER NOT NULL CHECK (age BETWEEN 18 AND 65),
    department TEXT    NOT NULL
  )
`);

/* ---------- helpers ---------- */
const NAME_RE = /^[A-Za-z][A-Za-z .'-]{1,48}$/;      // 2-50 chars, letters only
const DEPT_RE = NAME_RE;                             // same rule as name
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function allFieldsPresent(o) {
  return ['name','email','gender','age','department']
         .every(k => o[k] !== undefined && o[k] !== '');
}
function fieldValid({ name, email, gender, age, department }) {
  if (!NAME_RE.test(name))                  return 'Name must contain letters only (2-50).';
  if (!DEPT_RE.test(department))            return 'Department: letters only (2-50).';
  if (!EMAIL_RE.test(email))                return 'Invalid e-mail address.';
  if (!['Male','Female'].includes(gender))  return 'Gender must be Male or Female.';
  if (age < 18 || age > 65)                 return 'Age must be between 18 and 65.';
  return null;
}

/* ---------- routes ---------- */
app.post('/api/employees', (req, res) => {
  const errMsg = !allFieldsPresent(req.body) ? 'All fields are required.' :
                 fieldValid(req.body);
  if (errMsg) return res.status(400).json({ error: errMsg });

  const { name, email, gender, age, department } = req.body;
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
    res.json({ id: this.lastID, ...req.body });
  });
});

app.get('/api/employees', (_req, res) => {
  db.all('SELECT * FROM employees ORDER BY id', (err, rows) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch employees.' });
    res.json(rows);
  });
});

app.put('/api/employees/:id', (req, res) => {
  const errMsg = !allFieldsPresent(req.body) ? 'All fields are required.' :
                 fieldValid(req.body);
  if (errMsg) return res.status(400).json({ error: errMsg });

  const { id } = req.params;
  const { name, email, gender, age, department } = req.body;

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
      res.json({ id: Number(id), ...req.body });
    }
  );
});

app.delete('/api/employees/:id', (req, res) => {
  db.run('DELETE FROM employees WHERE id = ?', req.params.id, function (err) {
    if (err) return res.status(500).json({ error: 'Failed to delete employee.' });
    if (this.changes === 0)
      return res.status(404).json({ error: 'Employee not found.' });
    res.json({ success: true });
  });
});

/* ---------- start server ---------- */
app.listen(PORT, () => {
  console.log(`✅  Server running at http://localhost:${PORT}`);
});
