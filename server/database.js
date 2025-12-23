import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database(path.join(__dirname, 'lawfirm.db'));

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT,
    role TEXT DEFAULT 'Staff',
    status TEXT DEFAULT 'active',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS clients (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    first_name TEXT,
    middle_name TEXT,
    last_name TEXT,
    date_of_birth TEXT,
    place_of_birth TEXT,
    country_of_birth TEXT,
    company_name TEXT,
    arc_number TEXT,
    file_number TEXT,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    address TEXT,
    type TEXT DEFAULT 'Individual',
    notes TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS cases (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    case_number TEXT NOT NULL,
    type TEXT DEFAULT 'General',
    status TEXT DEFAULT 'Open',
    client_id TEXT,
    description TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS case_assignments (
    case_id TEXT,
    user_id TEXT,
    PRIMARY KEY (case_id, user_id)
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    assigned_to TEXT,
    case_id TEXT,
    due_date TEXT,
    priority TEXT DEFAULT 'Medium',
    status TEXT DEFAULT 'Todo',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS appointments (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    case_id TEXT,
    client_id TEXT,
    location TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    subject TEXT NOT NULL,
    content TEXT NOT NULL,
    from_user_id TEXT NOT NULL,
    case_id TEXT,
    client_id TEXT,
    read INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS message_recipients (
    message_id TEXT,
    user_id TEXT,
    PRIMARY KEY (message_id, user_id)
  );

  CREATE TABLE IF NOT EXISTS time_entries (
    id TEXT PRIMARY KEY,
    case_id TEXT NOT NULL,
    client_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    date TEXT NOT NULL,
    duration REAL NOT NULL,
    description TEXT,
    hourly_rate REAL NOT NULL,
    billable INTEGER DEFAULT 1,
    invoice_id TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS invoices (
    id TEXT PRIMARY KEY,
    invoice_number TEXT NOT NULL,
    client_id TEXT NOT NULL,
    subtotal REAL NOT NULL,
    tax REAL DEFAULT 0,
    total REAL NOT NULL,
    status TEXT DEFAULT 'Draft',
    issued_date TEXT,
    due_date TEXT,
    paid_date TEXT,
    notes TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
  CREATE INDEX IF NOT EXISTS idx_cases_client ON cases(client_id);
  CREATE INDEX IF NOT EXISTS idx_tasks_assigned ON tasks(assigned_to);
`);

// Migration: Add arc_number and file_number columns if they don't exist
try {
  const columns = db.prepare("PRAGMA table_info(clients)").all();
  const columnNames = columns.map(c => c.name);

  if (!columnNames.includes('arc_number')) {
    db.exec('ALTER TABLE clients ADD COLUMN arc_number TEXT');
    console.log('✅ Added arc_number column to clients');
  }
  if (!columnNames.includes('file_number')) {
    db.exec('ALTER TABLE clients ADD COLUMN file_number TEXT');
    console.log('✅ Added file_number column to clients');
  }
} catch (e) {
  console.log('Migration check completed');
}

// Seed default users
const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
if (userCount.count === 0) {
  const hash = bcrypt.hashSync('admin123', 10);

  db.prepare(`INSERT INTO users (id, name, email, password_hash, role, status) VALUES (?, ?, ?, ?, ?, ?)`)
    .run('user-admin', 'Admin User', 'admin@lawfirm.com', hash, 'Admin', 'active');

  db.prepare(`INSERT INTO users (id, name, email, password_hash, role, status) VALUES (?, ?, ?, ?, ?, ?)`)
    .run('user-john', 'John Attorney', 'john@lawfirm.com', hash, 'Lawyer', 'active');

  db.prepare(`INSERT INTO users (id, name, email, password_hash, role, status) VALUES (?, ?, ?, ?, ?, ?)`)
    .run('user-sarah', 'Sarah Staff', 'sarah@lawfirm.com', hash, 'Staff', 'active');

  console.log('✅ Default users created (password: admin123)');
}

console.log('✅ Database initialized');

export default db;

