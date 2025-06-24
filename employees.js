const express = require("express");
const router = express.Router();

let employees = [];
let currentId = 1;

/**
 * @swagger
 * tags:
 *   name: Employees
 *   description: Employee management
 */

/**
 * @swagger
 * /api/employees:
 *   get:
 *     summary: Get all employees
 *     tags: [Employees]
 *     responses:
 *       200:
 *         description: List of employees
 */
router.get("/", (req, res) => {
  res.json(employees);
});

/**
 * @swagger
 * /api/employees:
 *   post:
 *     summary: Create one or more employees
 *     tags: [Employees]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             oneOf:
 *               - type: object
 *                 required:
 *                   - name
 *                   - department
 *                 properties:
 *                   name:
 *                     type: string
 *                   department:
 *                     type: string
 *               - type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - name
 *                     - department
 *                   properties:
 *                     name:
 *                       type: string
 *                     department:
 *                       type: string
 *           example:
 *             - name: Priya
 *               department: HR
 *             - name: Mohan
 *               department: Finance
 *     responses:
 *       201:
 *         description: Employee(s) created
 */
router.post("/", (req, res) => {
  const data = req.body;

  if (Array.isArray(data)) {
    // Bulk insert
    const added = data.map(emp => {
      if (emp.name && emp.department) {
        const newEmp = { id: currentId++, name: emp.name, department: emp.department };
        employees.push(newEmp);
        return newEmp;
      }
    }).filter(Boolean);

    return res.status(201).json({ message: "Multiple employees created", data: added });
  } else {
    // Single insert
    const { name, department } = data;
    if (!name || !department) {
      return res.status(400).json({ message: "Name and department required" });
    }
    const newEmp = { id: currentId++, name, department };
    employees.push(newEmp);
    return res.status(201).json({ message: "Employee created", data: newEmp });
  }
});

/**
 * @swagger
 * /api/employees/{id}:
 *   put:
 *     summary: Update an employee
 *     tags: [Employees]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Employee ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               department:
 *                 type: string
 *     responses:
 *       200:
 *         description: Employee updated
 *       404:
 *         description: Employee not found
 */
router.put("/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const emp = employees.find(e => e.id === id);
  if (!emp) return res.status(404).json({ message: "Employee not found" });

  const { name, department } = req.body;
  emp.name = name || emp.name;
  emp.department = department || emp.department;

  res.json({ message: "Employee updated", data: emp });
});

/**
 * @swagger
 * /api/employees/{id}:
 *   delete:
 *     summary: Delete an employee
 *     tags: [Employees]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Employee ID
 *     responses:
 *       200:
 *         description: Employee deleted
 *       404:
 *         description: Employee not found
 */
router.delete("/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const index = employees.findIndex(e => e.id === id);
  if (index === -1) return res.status(404).json({ message: "Employee not found" });

  employees.splice(index, 1);
  res.json({ message: "Employee deleted" });
});

module.exports = router;
