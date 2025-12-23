const express = require('express');
const path = require('path');
const cors = require('cors');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'lawfirm-secret-2024-production';

// In-memory database for Hostinger (no native modules needed)
const db = {
  users: [],
  clients: [],
  cases: [],
  tasks: [],
  messages: [],
  payments: [],
  expenses: [],
  courtDates: [],
  documents: []
};

// Initialize default users
const hashPassword = (password) => {
  return crypto.createHash('sha256').update(password + JWT_SECRET).digest('hex');
};

// Add default admin users
db.users.push({
  id: crypto.randomUUID(),
  name: 'Admin User',
  email: 'admin@lawfirm.com',
  password_hash: hashPassword('admin123'),
  role: 'Admin',
  status: 'active',
  created_at: new Date().toISOString()
});

db.users.push({
  id: crypto.randomUUID(),
  name: 'John Doe',
  email: 'john@lawfirm.com',
  password_hash: hashPassword('admin123'),
  role: 'Staff',
  status: 'active',
  created_at: new Date().toISOString()
});

// Simple JWT implementation
const createToken = (payload) => {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify({ ...payload, exp: Date.now() + 86400000 })).toString('base64url');
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${signature}`;
};

const verifyToken = (token) => {
  try {
    const [header, body, signature] = token.split('.');
    const expectedSig = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
    if (signature !== expectedSig) return null;
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString());
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
};

// Middleware
app.use(cors());
app.use(express.json());

// Auth middleware
const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  const payload = verifyToken(token);
  if (!payload) return res.status(403).json({ error: 'Invalid token' });
  req.user = payload;
  next();
};

// ==================== AUTH ROUTES ====================

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const user = db.users.find(u => u.email === email);
  if (!user || user.password_hash !== hashPassword(password)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  const token = createToken({ id: user.id, email: user.email, role: user.role });
  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role }
  });
});

app.post('/api/auth/register', (req, res) => {
  const { name, email, password, role } = req.body;
  if (db.users.find(u => u.email === email)) {
    return res.status(400).json({ error: 'Email already registered' });
  }
  const user = {
    id: crypto.randomUUID(),
    name,
    email,
    password_hash: hashPassword(password),
    role: role || 'Staff',
    status: 'active',
    created_at: new Date().toISOString()
  };
  db.users.push(user);
  const token = createToken({ id: user.id, email: user.email, role: user.role });
  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role }
  });
});

app.get('/api/auth/me', auth, (req, res) => {
  const user = db.users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
});

// ==================== USERS ROUTES ====================

app.get('/api/users', auth, (req, res) => {
  res.json(db.users.map(u => ({ id: u.id, name: u.name, email: u.email, role: u.role, status: u.status })));
});

app.post('/api/users', auth, (req, res) => {
  const { name, email, password, role } = req.body;
  if (db.users.find(u => u.email === email)) {
    return res.status(400).json({ error: 'Email already exists' });
  }
  const user = {
    id: crypto.randomUUID(),
    name,
    email,
    password_hash: hashPassword(password),
    role: role || 'Staff',
    status: 'active',
    created_at: new Date().toISOString()
  };
  db.users.push(user);
  res.json({ id: user.id, name: user.name, email: user.email, role: user.role, status: user.status });
});

app.put('/api/users/:id', auth, (req, res) => {
  const user = db.users.find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  Object.assign(user, req.body);
  if (req.body.password) user.password_hash = hashPassword(req.body.password);
  res.json({ id: user.id, name: user.name, email: user.email, role: user.role, status: user.status });
});

app.delete('/api/users/:id', auth, (req, res) => {
  const index = db.users.findIndex(u => u.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'User not found' });
  db.users.splice(index, 1);
  res.json({ success: true });
});

// ==================== CLIENTS ROUTES ====================

app.get('/api/clients', auth, (req, res) => {
  res.json(db.clients);
});

app.post('/api/clients', auth, (req, res) => {
  const client = {
    id: crypto.randomUUID(),
    ...req.body,
    created_at: new Date().toISOString()
  };
  db.clients.push(client);
  res.json(client);
});

app.put('/api/clients/:id', auth, (req, res) => {
  const client = db.clients.find(c => c.id === req.params.id);
  if (!client) return res.status(404).json({ error: 'Client not found' });
  Object.assign(client, req.body);
  res.json(client);
});

app.delete('/api/clients/:id', auth, (req, res) => {
  const index = db.clients.findIndex(c => c.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Client not found' });
  db.clients.splice(index, 1);
  res.json({ success: true });
});

// ==================== CASES ROUTES ====================

app.get('/api/cases', auth, (req, res) => {
  res.json(db.cases);
});

app.post('/api/cases', auth, (req, res) => {
  const caseItem = {
    id: crypto.randomUUID(),
    ...req.body,
    created_at: new Date().toISOString()
  };
  db.cases.push(caseItem);
  res.json(caseItem);
});

app.put('/api/cases/:id', auth, (req, res) => {
  const caseItem = db.cases.find(c => c.id === req.params.id);
  if (!caseItem) return res.status(404).json({ error: 'Case not found' });
  Object.assign(caseItem, req.body);
  res.json(caseItem);
});

app.delete('/api/cases/:id', auth, (req, res) => {
  const index = db.cases.findIndex(c => c.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Case not found' });
  db.cases.splice(index, 1);
  res.json({ success: true });
});

// ==================== TASKS ROUTES ====================

app.get('/api/tasks', auth, (req, res) => {
  res.json(db.tasks);
});

app.post('/api/tasks', auth, (req, res) => {
  const task = {
    id: crypto.randomUUID(),
    ...req.body,
    created_at: new Date().toISOString()
  };
  db.tasks.push(task);
  res.json(task);
});

app.put('/api/tasks/:id', auth, (req, res) => {
  const task = db.tasks.find(t => t.id === req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  Object.assign(task, req.body);
  res.json(task);
});

app.delete('/api/tasks/:id', auth, (req, res) => {
  const index = db.tasks.findIndex(t => t.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Task not found' });
  db.tasks.splice(index, 1);
  res.json({ success: true });
});

// ==================== MESSAGES ROUTES ====================

app.get('/api/messages', auth, (req, res) => {
  res.json(db.messages);
});

app.post('/api/messages', auth, (req, res) => {
  const message = {
    id: crypto.randomUUID(),
    ...req.body,
    sender_id: req.user.id,
    created_at: new Date().toISOString()
  };
  db.messages.push(message);
  res.json(message);
});

app.put('/api/messages/:id/read', auth, (req, res) => {
  const message = db.messages.find(m => m.id === req.params.id);
  if (!message) return res.status(404).json({ error: 'Message not found' });
  message.read = true;
  res.json(message);
});

app.delete('/api/messages/:id', auth, (req, res) => {
  const index = db.messages.findIndex(m => m.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Message not found' });
  db.messages.splice(index, 1);
  res.json({ success: true });
});

// ==================== PAYMENTS ROUTES ====================

app.get('/api/payments', auth, (req, res) => {
  res.json(db.payments);
});

app.post('/api/payments', auth, (req, res) => {
  const payment = {
    id: crypto.randomUUID(),
    ...req.body,
    created_at: new Date().toISOString()
  };
  db.payments.push(payment);
  res.json(payment);
});

app.put('/api/payments/:id', auth, (req, res) => {
  const payment = db.payments.find(p => p.id === req.params.id);
  if (!payment) return res.status(404).json({ error: 'Payment not found' });
  Object.assign(payment, req.body);
  res.json(payment);
});

app.delete('/api/payments/:id', auth, (req, res) => {
  const index = db.payments.findIndex(p => p.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Payment not found' });
  db.payments.splice(index, 1);
  res.json({ success: true });
});

// ==================== EXPENSES ROUTES ====================

app.get('/api/expenses', auth, (req, res) => {
  res.json(db.expenses);
});

app.post('/api/expenses', auth, (req, res) => {
  const expense = {
    id: crypto.randomUUID(),
    ...req.body,
    created_at: new Date().toISOString()
  };
  db.expenses.push(expense);
  res.json(expense);
});

app.put('/api/expenses/:id', auth, (req, res) => {
  const expense = db.expenses.find(e => e.id === req.params.id);
  if (!expense) return res.status(404).json({ error: 'Expense not found' });
  Object.assign(expense, req.body);
  res.json(expense);
});

app.delete('/api/expenses/:id', auth, (req, res) => {
  const index = db.expenses.findIndex(e => e.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Expense not found' });
  db.expenses.splice(index, 1);
  res.json({ success: true });
});

// ==================== COURT DATES ROUTES ====================

app.get('/api/court-dates', auth, (req, res) => {
  res.json(db.courtDates);
});

app.post('/api/court-dates', auth, (req, res) => {
  const courtDate = {
    id: crypto.randomUUID(),
    ...req.body,
    created_at: new Date().toISOString()
  };
  db.courtDates.push(courtDate);
  res.json(courtDate);
});

app.put('/api/court-dates/:id', auth, (req, res) => {
  const courtDate = db.courtDates.find(c => c.id === req.params.id);
  if (!courtDate) return res.status(404).json({ error: 'Court date not found' });
  Object.assign(courtDate, req.body);
  res.json(courtDate);
});

app.delete('/api/court-dates/:id', auth, (req, res) => {
  const index = db.courtDates.findIndex(c => c.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Court date not found' });
  db.courtDates.splice(index, 1);
  res.json({ success: true });
});

// ==================== DOCUMENTS ROUTES ====================

app.get('/api/documents', auth, (req, res) => {
  res.json(db.documents);
});

app.post('/api/documents', auth, (req, res) => {
  const document = {
    id: crypto.randomUUID(),
    ...req.body,
    uploaded_by: req.user.id,
    created_at: new Date().toISOString()
  };
  db.documents.push(document);
  res.json(document);
});

app.delete('/api/documents/:id', auth, (req, res) => {
  const index = db.documents.findIndex(d => d.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Document not found' });
  db.documents.splice(index, 1);
  res.json({ success: true });
});

// ==================== DASHBOARD STATS ====================

app.get('/api/stats', auth, (req, res) => {
  const totalRevenue = db.payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
  const totalExpenses = db.expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);

  res.json({
    totalClients: db.clients.length,
    activeCases: db.cases.filter(c => c.status === 'active' || c.status === 'open').length,
    pendingTasks: db.tasks.filter(t => t.status === 'pending' || t.status === 'in-progress').length,
    totalRevenue,
    totalExpenses,
    netIncome: totalRevenue - totalExpenses,
    upcomingCourtDates: db.courtDates.filter(c => new Date(c.date) >= new Date()).length,
    unreadMessages: db.messages.filter(m => !m.read).length
  });
});

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// Handle SPA routing - serve index.html for all non-API routes
app.use((req, res, next) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  } else {
    next();
  }
});

app.listen(PORT, () => {
  console.log(`✅ Law Firm Server running on port ${PORT}`);
  console.log(`📧 Demo accounts:`);
  console.log(`   - admin@lawfirm.com / admin123`);
  console.log(`   - john@lawfirm.com / admin123`);
});

