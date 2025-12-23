import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { body, param, query, validationResult } from 'express-validator';
import db from './database.js';

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'lawfirm-secret-2024-change-in-production';

// Middleware
app.use(cors());
app.use(express.json());

// Validation middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg });
  }
  next();
};

// Auth middleware
const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(403).json({ error: 'Invalid token' });
  }
};

// ==================== AUTH ====================

app.post('/api/auth/register', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be 6+ characters'),
  body('role').optional(),
], validate, async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) return res.status(400).json({ error: 'Email already registered' });

    const hash = await bcrypt.hash(password, 10);
    const id = `user-${Date.now()}`;
    const userRole = role || 'Staff';

    db.prepare('INSERT INTO users (id, name, email, password_hash, role, status) VALUES (?, ?, ?, ?, ?, ?)')
      .run(id, name, email, hash, userRole, 'active');

    const user = db.prepare('SELECT id, name, email, role, status FROM users WHERE id = ?').get(id);
    const token = jwt.sign({ id, email, role: userRole, name }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({ user, token });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/auth/login', [
  body('email').isEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password required'),
], validate, async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    if (user.status !== 'active') return res.status(401).json({ error: 'Account inactive' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role, status: user.status },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

app.get('/api/auth/me', auth, (req, res) => {
  const user = db.prepare('SELECT id, name, email, role, status FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user });
});

// ==================== USERS ====================

app.get('/api/users', (req, res) => {
  const users = db.prepare('SELECT id, name, email, role, status, created_at FROM users ORDER BY created_at DESC').all();
  res.json(users);
});

app.post('/api/users', auth, [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be 6+ characters'),
  body('role').optional(),
], validate, async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) return res.status(400).json({ error: 'Email already registered' });

    const hash = await bcrypt.hash(password, 10);
    const id = `user-${Date.now()}`;
    const userRole = role || 'Staff';

    db.prepare('INSERT INTO users (id, name, email, password_hash, role, status) VALUES (?, ?, ?, ?, ?, ?)')
      .run(id, name, email, hash, userRole, 'active');

    const user = db.prepare('SELECT id, name, email, role, status FROM users WHERE id = ?').get(id);
    res.status(201).json(user);
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

app.put('/api/users/:id', auth, [
  param('id').notEmpty(),
  body('name').optional().trim().notEmpty(),
  body('email').optional().isEmail(),
  body('role').optional(),
], validate, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, role, password } = req.body;

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Build update query dynamically
    const updates = [];
    const params = [];

    if (name) { updates.push('name = ?'); params.push(name); }
    if (email) { updates.push('email = ?'); params.push(email); }
    if (role) { updates.push('role = ?'); params.push(role); }
    if (password) {
      const hash = await bcrypt.hash(password, 10);
      updates.push('password_hash = ?');
      params.push(hash);
    }

    if (updates.length > 0) {
      params.push(id);
      db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...params);
    }

    const updated = db.prepare('SELECT id, name, email, role, status FROM users WHERE id = ?').get(id);
    res.json(updated);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

app.delete('/api/users/:id', auth, (req, res) => {
  try {
    const { id } = req.params;

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Don't allow deleting yourself
    if (id === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    db.prepare('DELETE FROM users WHERE id = ?').run(id);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// ==================== CLIENTS ====================

app.get('/api/clients', (req, res) => {
  const { page = 1, limit = 50, search = '' } = req.query;
  const offset = (page - 1) * limit;

  let sql = 'SELECT * FROM clients WHERE 1=1';
  const params = [];

  if (search) {
    sql += ' AND (name LIKE ? OR email LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }

  const { total } = db.prepare(sql.replace('SELECT *', 'SELECT COUNT(*) as total')).get(...params);

  sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(Number(limit), Number(offset));

  const clients = db.prepare(sql).all(...params);

  // Convert snake_case to camelCase for all clients
  const formattedClients = clients.map(client => ({
    ...client,
    firstName: client.first_name,
    middleName: client.middle_name,
    lastName: client.last_name,
    dateOfBirth: client.date_of_birth,
    placeOfBirth: client.place_of_birth,
    countryOfBirth: client.country_of_birth,
    companyName: client.company_name,
    arcNumber: client.arc_number,
    fileNumber: client.file_number,
    createdAt: client.created_at
  }));

  res.json({ clients: formattedClients, pagination: { page: Number(page), limit: Number(limit), total } });
});

app.post('/api/clients', [
  body('name').notEmpty(),
  body('email').isEmail(),
  body('phone').notEmpty(),
  body('type').isIn(['Individual', 'Corporate']),
], validate, (req, res) => {
  const {
    name, email, phone, address, type, notes,
    firstName, middleName, lastName, dateOfBirth, placeOfBirth, countryOfBirth, companyName,
    arcNumber, fileNumber
  } = req.body;
  const id = `client-${Date.now()}`;

  db.prepare(`INSERT INTO clients (
    id, name, first_name, middle_name, last_name, date_of_birth, place_of_birth, country_of_birth, 
    company_name, arc_number, file_number, email, phone, address, type, notes
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(
      id, name,
      firstName || null, middleName || null, lastName || null,
      dateOfBirth || null, placeOfBirth || null, countryOfBirth || null,
      companyName || null, arcNumber || null, fileNumber || null,
      email, phone, address || null, type, notes || null
    );

  const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(id);
  // Convert snake_case to camelCase for response
  res.status(201).json({
    ...client,
    firstName: client.first_name,
    middleName: client.middle_name,
    lastName: client.last_name,
    dateOfBirth: client.date_of_birth,
    placeOfBirth: client.place_of_birth,
    countryOfBirth: client.country_of_birth,
    companyName: client.company_name,
    arcNumber: client.arc_number,
    fileNumber: client.file_number,
    createdAt: client.created_at
  });
});

app.put('/api/clients/:id', (req, res) => {
  try {
    const updates = req.body;

    // Check if client exists
    const existingClient = db.prepare('SELECT * FROM clients WHERE id = ?').get(req.params.id);
    if (!existingClient) {
      return res.status(404).json({ error: 'Client not found' });
    }

    // Map camelCase to snake_case for database
    const fieldMap = {
      firstName: 'first_name',
      middleName: 'middle_name',
      lastName: 'last_name',
      dateOfBirth: 'date_of_birth',
      placeOfBirth: 'place_of_birth',
      countryOfBirth: 'country_of_birth',
      companyName: 'company_name',
      arcNumber: 'arc_number',
      fileNumber: 'file_number'
    };

    const dbUpdates = {};
    for (const [key, value] of Object.entries(updates)) {
      const dbKey = fieldMap[key] || key;
      dbUpdates[dbKey] = value;
    }

    // If no updates, just return the existing client
    if (Object.keys(dbUpdates).length === 0) {
      const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(req.params.id);
      return res.json({
        ...client,
        firstName: client.first_name,
        middleName: client.middle_name,
        lastName: client.last_name,
        dateOfBirth: client.date_of_birth,
        placeOfBirth: client.place_of_birth,
        countryOfBirth: client.country_of_birth,
        companyName: client.company_name,
        arcNumber: client.arc_number,
        fileNumber: client.file_number,
        createdAt: client.created_at
      });
    }

    const fields = Object.keys(dbUpdates).map(k => `${k} = ?`).join(', ');
    const values = [...Object.values(dbUpdates), req.params.id];

    db.prepare(`UPDATE clients SET ${fields} WHERE id = ?`).run(...values);
    const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(req.params.id);

    // Convert snake_case to camelCase for response
    res.json({
      ...client,
      firstName: client.first_name,
      middleName: client.middle_name,
      lastName: client.last_name,
      dateOfBirth: client.date_of_birth,
      placeOfBirth: client.place_of_birth,
      countryOfBirth: client.country_of_birth,
      companyName: client.company_name,
      arcNumber: client.arc_number,
      fileNumber: client.file_number,
      createdAt: client.created_at
    });
  } catch (error) {
    console.error('Update client error:', error);
    res.status(500).json({ error: error.message || 'Failed to update client' });
  }
});

app.delete('/api/clients/:id', (req, res) => {
  db.prepare('DELETE FROM clients WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// ==================== CASES ====================

app.get('/api/cases', (req, res) => {
  const { page = 1, limit = 50, clientId, status } = req.query;
  const offset = (page - 1) * limit;

  let sql = 'SELECT * FROM cases WHERE 1=1';
  const params = [];

  if (clientId) { sql += ' AND client_id = ?'; params.push(clientId); }
  if (status) { sql += ' AND status = ?'; params.push(status); }

  const { total } = db.prepare(sql.replace('SELECT *', 'SELECT COUNT(*) as total')).get(...params);

  sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(Number(limit), Number(offset));

  const cases = db.prepare(sql).all(...params);

  // Get assignments
  const result = cases.map(c => {
    const assignedTo = db.prepare('SELECT user_id FROM case_assignments WHERE case_id = ?').all(c.id).map(a => a.user_id);
    return { ...c, assignedTo };
  });

  res.json({ cases: result, pagination: { page: Number(page), limit: Number(limit), total } });
});

app.post('/api/cases', [
  body('title').notEmpty(),
  body('caseNumber').notEmpty(),
  body('type').isIn(['General', 'Asylum']),
  body('status').isIn(['Open', 'Pending', 'Closed', 'On Hold']),
  body('clientId').notEmpty(),
], validate, (req, res) => {
  const { title, caseNumber, type, status, clientId, description, assignedTo = [] } = req.body;
  const id = `case-${Date.now()}`;

  db.prepare('INSERT INTO cases (id, title, case_number, type, status, client_id, description) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(id, title, caseNumber, type, status, clientId, description || null);

  const assignStmt = db.prepare('INSERT INTO case_assignments (case_id, user_id) VALUES (?, ?)');
  assignedTo.forEach(userId => assignStmt.run(id, userId));

  const caseData = db.prepare('SELECT * FROM cases WHERE id = ?').get(id);
  res.status(201).json({ ...caseData, assignedTo });
});

app.put('/api/cases/:id', (req, res) => {
  const { assignedTo, ...updates } = req.body;

  if (Object.keys(updates).length > 0) {
    const fields = Object.keys(updates).map(k => `${k} = ?`).join(', ');
    db.prepare(`UPDATE cases SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(...Object.values(updates), req.params.id);
  }

  if (assignedTo) {
    db.prepare('DELETE FROM case_assignments WHERE case_id = ?').run(req.params.id);
    const stmt = db.prepare('INSERT INTO case_assignments (case_id, user_id) VALUES (?, ?)');
    assignedTo.forEach(userId => stmt.run(req.params.id, userId));
  }

  const caseData = db.prepare('SELECT * FROM cases WHERE id = ?').get(req.params.id);
  const assigned = db.prepare('SELECT user_id FROM case_assignments WHERE case_id = ?').all(req.params.id).map(a => a.user_id);
  res.json({ ...caseData, assignedTo: assigned });
});

app.delete('/api/cases/:id', (req, res) => {
  db.prepare('DELETE FROM case_assignments WHERE case_id = ?').run(req.params.id);
  db.prepare('DELETE FROM cases WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// ==================== TASKS ====================

app.get('/api/tasks', (req, res) => {
  const { userId, caseId, status } = req.query;
  let sql = 'SELECT * FROM tasks WHERE 1=1';
  const params = [];

  if (userId) { sql += ' AND assigned_to = ?'; params.push(userId); }
  if (caseId) { sql += ' AND case_id = ?'; params.push(caseId); }
  if (status) { sql += ' AND status = ?'; params.push(status); }

  sql += ' ORDER BY due_date ASC';
  res.json(db.prepare(sql).all(...params));
});

app.post('/api/tasks', [
  body('title').notEmpty(),
  body('assignedTo').notEmpty(),
  body('dueDate').notEmpty(),
  body('priority').isIn(['Low', 'Medium', 'High', 'Urgent']),
  body('status').isIn(['Todo', 'In Progress', 'Completed']),
], validate, (req, res) => {
  const { title, description, assignedTo, caseId, dueDate, priority, status } = req.body;
  const id = `task-${Date.now()}`;

  db.prepare('INSERT INTO tasks (id, title, description, assigned_to, case_id, due_date, priority, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    .run(id, title, description || null, assignedTo, caseId || null, dueDate, priority, status);

  res.status(201).json(db.prepare('SELECT * FROM tasks WHERE id = ?').get(id));
});

app.put('/api/tasks/:id', (req, res) => {
  const updates = req.body;
  const fields = Object.keys(updates).map(k => `${k} = ?`).join(', ');
  db.prepare(`UPDATE tasks SET ${fields} WHERE id = ?`).run(...Object.values(updates), req.params.id);
  res.json(db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id));
});

app.delete('/api/tasks/:id', (req, res) => {
  db.prepare('DELETE FROM tasks WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// ==================== APPOINTMENTS ====================

app.get('/api/appointments', (req, res) => {
  res.json(db.prepare('SELECT * FROM appointments ORDER BY start_time ASC').all());
});

app.post('/api/appointments', [
  body('title').notEmpty(),
  body('startTime').notEmpty(),
  body('endTime').notEmpty(),
], validate, (req, res) => {
  const { title, description, startTime, endTime, caseId, clientId, location } = req.body;
  const id = `appt-${Date.now()}`;

  db.prepare('INSERT INTO appointments (id, title, description, start_time, end_time, case_id, client_id, location) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    .run(id, title, description || null, startTime, endTime, caseId || null, clientId || null, location || null);

  res.status(201).json(db.prepare('SELECT * FROM appointments WHERE id = ?').get(id));
});

// ==================== MESSAGES ====================

app.get('/api/messages', (req, res) => {
  const messages = db.prepare('SELECT * FROM messages ORDER BY created_at DESC').all();
  res.json({ messages, pagination: { total: messages.length } });
});

app.post('/api/messages', [
  body('subject').notEmpty(),
  body('content').notEmpty(),
  body('fromUserId').notEmpty(),
  body('toUserIds').isArray(),
], validate, (req, res) => {
  const { subject, content, fromUserId, toUserIds, caseId, clientId } = req.body;
  const id = `msg-${Date.now()}`;

  db.prepare('INSERT INTO messages (id, subject, content, from_user_id, case_id, client_id) VALUES (?, ?, ?, ?, ?, ?)')
    .run(id, subject, content, fromUserId, caseId || null, clientId || null);

  const stmt = db.prepare('INSERT INTO message_recipients (message_id, user_id) VALUES (?, ?)');
  toUserIds.forEach(userId => stmt.run(id, userId));

  res.status(201).json({ id, subject, content, fromUserId, toUserIds, caseId, clientId, read: false, createdAt: new Date().toISOString() });
});

// ==================== TIME ENTRIES ====================

app.get('/api/time-entries', (req, res) => {
  res.json(db.prepare('SELECT * FROM time_entries ORDER BY date DESC').all());
});

app.post('/api/time-entries', [
  body('caseId').notEmpty(),
  body('clientId').notEmpty(),
  body('userId').notEmpty(),
  body('date').notEmpty(),
  body('duration').isNumeric(),
  body('hourlyRate').isNumeric(),
], validate, (req, res) => {
  const { caseId, clientId, userId, date, duration, description, hourlyRate, billable = true } = req.body;
  const id = `time-${Date.now()}`;

  db.prepare('INSERT INTO time_entries (id, case_id, client_id, user_id, date, duration, description, hourly_rate, billable) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .run(id, caseId, clientId, userId, date, duration, description || '', hourlyRate, billable ? 1 : 0);

  res.status(201).json(db.prepare('SELECT * FROM time_entries WHERE id = ?').get(id));
});

app.put('/api/time-entries/:id', (req, res) => {
  const updates = req.body;
  const fields = Object.keys(updates).map(k => `${k} = ?`).join(', ');
  db.prepare(`UPDATE time_entries SET ${fields} WHERE id = ?`).run(...Object.values(updates), req.params.id);
  res.json(db.prepare('SELECT * FROM time_entries WHERE id = ?').get(req.params.id));
});

app.delete('/api/time-entries/:id', (req, res) => {
  db.prepare('DELETE FROM time_entries WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// ==================== INVOICES ====================

app.get('/api/invoices', (req, res) => {
  res.json(db.prepare('SELECT * FROM invoices ORDER BY created_at DESC').all());
});

app.post('/api/invoices', [
  body('clientId').notEmpty(),
  body('timeEntryIds').isArray(),
], validate, (req, res) => {
  const { clientId, timeEntryIds, subtotal, tax, total, status, issuedDate, dueDate, notes } = req.body;
  const id = `inv-${Date.now()}`;
  const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;

  db.prepare('INSERT INTO invoices (id, invoice_number, client_id, subtotal, tax, total, status, issued_date, due_date, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .run(id, invoiceNumber, clientId, subtotal, tax, total, status, issuedDate, dueDate, notes || null);

  const stmt = db.prepare('UPDATE time_entries SET invoice_id = ? WHERE id = ?');
  timeEntryIds.forEach(entryId => stmt.run(id, entryId));

  res.status(201).json({ ...db.prepare('SELECT * FROM invoices WHERE id = ?').get(id), timeEntryIds });
});

app.put('/api/invoices/:id', (req, res) => {
  const updates = req.body;
  const fields = Object.keys(updates).map(k => `${k} = ?`).join(', ');
  db.prepare(`UPDATE invoices SET ${fields} WHERE id = ?`).run(...Object.values(updates), req.params.id);
  res.json(db.prepare('SELECT * FROM invoices WHERE id = ?').get(req.params.id));
});

app.delete('/api/invoices/:id', (req, res) => {
  db.prepare('UPDATE time_entries SET invoice_id = NULL WHERE invoice_id = ?').run(req.params.id);
  db.prepare('DELETE FROM invoices WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// ==================== HEALTH ====================

app.get('/health', (req, res) => {
  const { count } = db.prepare('SELECT COUNT(*) as count FROM clients').get();
  res.json({ status: 'ok', clients: count, timestamp: new Date().toISOString() });
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 API endpoints ready`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`Port ${PORT} is in use, trying ${PORT + 1}...`);
    app.listen(PORT + 1, '0.0.0.0', () => {
      console.log(`🚀 Server running on http://localhost:${PORT + 1}`);
    });
  }
});

export default app;

