// ============================================
// LOCAL STORAGE DATABASE - Static Implementation
// ============================================

import { User, Client, Case, Task, CourtLog, Message, TimeEntry, Invoice } from './types'

const STORAGE_KEYS = {
  users: 'lawfirm_users',
  clients: 'lawfirm_clients',
  cases: 'lawfirm_cases',
  tasks: 'lawfirm_tasks',
  courtLogs: 'lawfirm_court_logs',
  messages: 'lawfirm_messages',
  timeEntries: 'lawfirm_time_entries',
  invoices: 'lawfirm_invoices',
  currentUser: 'lawfirm_current_user',
  authToken: 'auth_token',
}

// Generate unique ID
const generateId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

// Default admin user
const DEFAULT_ADMIN: User = {
  id: 'user-admin-001',
  name: 'Admin User',
  email: 'admin@lawfirm.com',
  role: 'Admin',
  status: 'active',
  createdAt: new Date().toISOString(),
}

// Password storage (simple hash for demo - in production use proper encryption)
const PASSWORDS_KEY = 'lawfirm_passwords'

function getPasswords(): Record<string, string> {
  const data = localStorage.getItem(PASSWORDS_KEY)
  return data ? JSON.parse(data) : { 'user-admin-001': 'admin123' }
}

function setPassword(userId: string, password: string) {
  const passwords = getPasswords()
  passwords[userId] = password
  localStorage.setItem(PASSWORDS_KEY, JSON.stringify(passwords))
}

function verifyPassword(userId: string, password: string): boolean {
  const passwords = getPasswords()
  return passwords[userId] === password
}

// Generic storage helpers
function getData<T>(key: string, defaultValue: T[] = []): T[] {
  const data = localStorage.getItem(key)
  if (!data) return defaultValue
  try {
    return JSON.parse(data)
  } catch {
    return defaultValue
  }
}

function setData<T>(key: string, data: T[]) {
  localStorage.setItem(key, JSON.stringify(data))
}

// Initialize default data if empty
function initializeStorage() {
  // Initialize users with default admin
  const users = getData<User>(STORAGE_KEYS.users)
  if (users.length === 0) {
    setData(STORAGE_KEYS.users, [DEFAULT_ADMIN])
    setPassword(DEFAULT_ADMIN.id, 'admin123')
  }

  // Initialize other collections as empty if not present
  if (!localStorage.getItem(STORAGE_KEYS.clients)) setData(STORAGE_KEYS.clients, [])
  if (!localStorage.getItem(STORAGE_KEYS.cases)) setData(STORAGE_KEYS.cases, [])
  if (!localStorage.getItem(STORAGE_KEYS.tasks)) setData(STORAGE_KEYS.tasks, [])
  if (!localStorage.getItem(STORAGE_KEYS.courtLogs)) setData(STORAGE_KEYS.courtLogs, [])
  if (!localStorage.getItem(STORAGE_KEYS.messages)) setData(STORAGE_KEYS.messages, [])
  if (!localStorage.getItem(STORAGE_KEYS.timeEntries)) setData(STORAGE_KEYS.timeEntries, [])
  if (!localStorage.getItem(STORAGE_KEYS.invoices)) setData(STORAGE_KEYS.invoices, [])
}

// Initialize on load
initializeStorage()

// ==================== AUTH ====================

export const authStorage = {
  login(email: string, password: string): { user: User; token: string } | null {
    const users = getData<User & { password?: string }>(STORAGE_KEYS.users)
    const user = users.find(u => u.email === email)
    
    if (!user) return null
    if (!verifyPassword(user.id, password)) return null
    if (user.status !== 'active') return null

    const token = `static-token-${user.id}-${Date.now()}`
    localStorage.setItem(STORAGE_KEYS.authToken, token)
    localStorage.setItem(STORAGE_KEYS.currentUser, JSON.stringify(user))
    
    return { user, token }
  },

  register(name: string, email: string, password: string, role: string = 'Staff'): { user: User; token: string } | null {
    const users = getData<User>(STORAGE_KEYS.users)
    
    if (users.find(u => u.email === email)) {
      throw new Error('Email already registered')
    }

    const user: User = {
      id: generateId('user'),
      name,
      email,
      role: role as User['role'],
      status: 'active',
      createdAt: new Date().toISOString(),
    }

    users.push(user)
    setData(STORAGE_KEYS.users, users)
    setPassword(user.id, password)

    const token = `static-token-${user.id}-${Date.now()}`
    localStorage.setItem(STORAGE_KEYS.authToken, token)
    localStorage.setItem(STORAGE_KEYS.currentUser, JSON.stringify(user))

    return { user, token }
  },

  getCurrentUser(): User | null {
    const data = localStorage.getItem(STORAGE_KEYS.currentUser)
    return data ? JSON.parse(data) : null
  },

  logout() {
    localStorage.removeItem(STORAGE_KEYS.authToken)
    localStorage.removeItem(STORAGE_KEYS.currentUser)
  },

  getToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.authToken)
  },
}

// ==================== USERS ====================

export const usersStorage = {
  getAll(): User[] {
    return getData<User>(STORAGE_KEYS.users)
  },

  getById(id: string): User | undefined {
    return getData<User>(STORAGE_KEYS.users).find(u => u.id === id)
  },

  create(data: { name: string; email: string; password: string; role: string }): User {
    const users = getData<User>(STORAGE_KEYS.users)
    
    if (users.find(u => u.email === data.email)) {
      throw new Error('Email already registered')
    }

    const user: User = {
      id: generateId('user'),
      name: data.name,
      email: data.email,
      role: data.role as User['role'],
      status: 'active',
      createdAt: new Date().toISOString(),
    }

    users.push(user)
    setData(STORAGE_KEYS.users, users)
    setPassword(user.id, data.password)

    return user
  },

  update(id: string, data: Partial<User> & { password?: string }): User {
    const users = getData<User>(STORAGE_KEYS.users)
    const index = users.findIndex(u => u.id === id)
    
    if (index === -1) throw new Error('User not found')

    const { password, ...userData } = data
    users[index] = { ...users[index], ...userData }
    setData(STORAGE_KEYS.users, users)

    if (password) {
      setPassword(id, password)
    }

    return users[index]
  },

  delete(id: string): void {
    const users = getData<User>(STORAGE_KEYS.users)
    const filtered = users.filter(u => u.id !== id)
    setData(STORAGE_KEYS.users, filtered)
  },
}

// ==================== CLIENTS ====================

export const clientsStorage = {
  getAll(params: Record<string, any> = {}): { clients: Client[]; pagination: any } {
    let clients = getData<Client>(STORAGE_KEYS.clients)
    
    // Search filter
    if (params.search) {
      const search = params.search.toLowerCase()
      clients = clients.filter(c => 
        c.name?.toLowerCase().includes(search) ||
        c.email?.toLowerCase().includes(search) ||
        c.phone?.includes(search)
      )
    }

    // Type filter
    if (params.type) {
      clients = clients.filter(c => c.type === params.type)
    }

    const total = clients.length
    const page = parseInt(params.page) || 1
    const limit = parseInt(params.limit) || 50
    const offset = (page - 1) * limit

    clients = clients.slice(offset, offset + limit)

    return {
      clients,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    }
  },

  getById(id: string): Client | undefined {
    return getData<Client>(STORAGE_KEYS.clients).find(c => c.id === id)
  },

  create(data: Partial<Client>): Client {
    const clients = getData<Client>(STORAGE_KEYS.clients)
    
    const client: Client = {
      id: generateId('client'),
      name: data.name || '',
      email: data.email || '',
      phone: data.phone || '',
      type: data.type || 'Individual',
      createdAt: new Date().toISOString(),
      ...data,
    }

    clients.push(client)
    setData(STORAGE_KEYS.clients, clients)

    return client
  },

  update(id: string, data: Partial<Client>): Client {
    const clients = getData<Client>(STORAGE_KEYS.clients)
    const index = clients.findIndex(c => c.id === id)
    
    if (index === -1) throw new Error('Client not found')

    clients[index] = { ...clients[index], ...data }
    setData(STORAGE_KEYS.clients, clients)

    return clients[index]
  },

  delete(id: string): void {
    const clients = getData<Client>(STORAGE_KEYS.clients)
    const filtered = clients.filter(c => c.id !== id)
    setData(STORAGE_KEYS.clients, filtered)
  },
}

// ==================== CASES ====================

export const casesStorage = {
  getAll(params: Record<string, any> = {}): { cases: Case[]; pagination: any } {
    let cases = getData<Case>(STORAGE_KEYS.cases)
    
    if (params.search) {
      const search = params.search.toLowerCase()
      cases = cases.filter(c => 
        c.title?.toLowerCase().includes(search) ||
        c.caseNumber?.toLowerCase().includes(search)
      )
    }

    if (params.status) {
      cases = cases.filter(c => c.status === params.status)
    }

    if (params.type) {
      cases = cases.filter(c => c.type === params.type)
    }

    if (params.clientId) {
      cases = cases.filter(c => c.clientId === params.clientId)
    }

    const total = cases.length
    const page = parseInt(params.page) || 1
    const limit = parseInt(params.limit) || 50
    const offset = (page - 1) * limit

    cases = cases.slice(offset, offset + limit)

    return {
      cases,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    }
  },

  getById(id: string): Case | undefined {
    return getData<Case>(STORAGE_KEYS.cases).find(c => c.id === id)
  },

  create(data: Partial<Case>): Case {
    const cases = getData<Case>(STORAGE_KEYS.cases)
    
    const newCase: Case = {
      id: generateId('case'),
      title: data.title || '',
      caseNumber: data.caseNumber || `CASE-${Date.now()}`,
      type: data.type || 'General',
      status: data.status || 'Open',
      clientId: data.clientId || '',
      assignedTo: data.assignedTo || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...data,
    }

    cases.push(newCase)
    setData(STORAGE_KEYS.cases, cases)

    return newCase
  },

  update(id: string, data: Partial<Case>): Case {
    const cases = getData<Case>(STORAGE_KEYS.cases)
    const index = cases.findIndex(c => c.id === id)
    
    if (index === -1) throw new Error('Case not found')

    cases[index] = { ...cases[index], ...data, updatedAt: new Date().toISOString() }
    setData(STORAGE_KEYS.cases, cases)

    return cases[index]
  },

  delete(id: string): void {
    const cases = getData<Case>(STORAGE_KEYS.cases)
    const filtered = cases.filter(c => c.id !== id)
    setData(STORAGE_KEYS.cases, filtered)
  },
}

// ==================== TASKS ====================

export const tasksStorage = {
  getAll(params: Record<string, any> = {}): Task[] {
    let tasks = getData<Task>(STORAGE_KEYS.tasks)
    
    if (params.assignedTo) {
      tasks = tasks.filter(t => t.assignedTo === params.assignedTo)
    }

    if (params.status) {
      tasks = tasks.filter(t => t.status === params.status)
    }

    if (params.caseId) {
      tasks = tasks.filter(t => t.caseId === params.caseId)
    }

    return tasks
  },

  create(data: Partial<Task>): Task {
    const tasks = getData<Task>(STORAGE_KEYS.tasks)
    
    const task: Task = {
      id: generateId('task'),
      title: data.title || '',
      assignedTo: data.assignedTo || '',
      dueDate: data.dueDate || new Date().toISOString(),
      priority: data.priority || 'Medium',
      status: data.status || 'Todo',
      createdAt: new Date().toISOString(),
      ...data,
    }

    tasks.push(task)
    setData(STORAGE_KEYS.tasks, tasks)

    return task
  },

  update(id: string, data: Partial<Task>): Task {
    const tasks = getData<Task>(STORAGE_KEYS.tasks)
    const index = tasks.findIndex(t => t.id === id)
    
    if (index === -1) throw new Error('Task not found')

    tasks[index] = { ...tasks[index], ...data }
    setData(STORAGE_KEYS.tasks, tasks)

    return tasks[index]
  },

  delete(id: string): void {
    const tasks = getData<Task>(STORAGE_KEYS.tasks)
    const filtered = tasks.filter(t => t.id !== id)
    setData(STORAGE_KEYS.tasks, filtered)
  },
}

// ==================== COURT LOGS ====================

export const courtLogsStorage = {
  getAll(params: Record<string, any> = {}): { courtLogs: CourtLog[]; pagination: any } {
    let logs = getData<CourtLog>(STORAGE_KEYS.courtLogs)
    
    if (params.clientId) {
      logs = logs.filter(l => l.clientId === params.clientId)
    }

    if (params.status) {
      logs = logs.filter(l => l.status === params.status)
    }

    const total = logs.length
    const page = parseInt(params.page) || 1
    const limit = parseInt(params.limit) || 50
    const offset = (page - 1) * limit

    logs = logs.slice(offset, offset + limit)

    return {
      courtLogs: logs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    }
  },

  create(data: Partial<CourtLog>): CourtLog {
    const logs = getData<CourtLog>(STORAGE_KEYS.courtLogs)
    
    const log: CourtLog = {
      id: generateId('court'),
      clientId: data.clientId || '',
      clientName: data.clientName || '',
      courtDate: data.courtDate || '',
      courtTime: data.courtTime || '',
      courtName: data.courtName || '',
      purpose: data.purpose || '',
      reminderEnabled: data.reminderEnabled ?? true,
      reminderDaysBefore: data.reminderDaysBefore ?? 7,
      reminderSentToLawyer: false,
      reminderSentToClient: false,
      status: data.status || 'Scheduled',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...data,
    }

    logs.push(log)
    setData(STORAGE_KEYS.courtLogs, logs)

    return log
  },

  update(id: string, data: Partial<CourtLog>): CourtLog {
    const logs = getData<CourtLog>(STORAGE_KEYS.courtLogs)
    const index = logs.findIndex(l => l.id === id)
    
    if (index === -1) throw new Error('Court log not found')

    logs[index] = { ...logs[index], ...data, updatedAt: new Date().toISOString() }
    setData(STORAGE_KEYS.courtLogs, logs)

    return logs[index]
  },

  delete(id: string): void {
    const logs = getData<CourtLog>(STORAGE_KEYS.courtLogs)
    const filtered = logs.filter(l => l.id !== id)
    setData(STORAGE_KEYS.courtLogs, filtered)
  },
}

// ==================== MESSAGES ====================

export const messagesStorage = {
  getAll(params: Record<string, any> = {}): { messages: Message[]; pagination: any } {
    let messages = getData<Message>(STORAGE_KEYS.messages)
    
    if (params.userId) {
      messages = messages.filter(m => 
        m.fromUserId === params.userId || m.toUserIds.includes(params.userId)
      )
    }

    const total = messages.length
    const page = parseInt(params.page) || 1
    const limit = parseInt(params.limit) || 50
    const offset = (page - 1) * limit

    messages = messages.slice(offset, offset + limit)

    return {
      messages,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    }
  },

  create(data: Partial<Message>): Message {
    const messages = getData<Message>(STORAGE_KEYS.messages)
    
    const message: Message = {
      id: generateId('msg'),
      subject: data.subject || '',
      content: data.content || '',
      fromUserId: data.fromUserId || '',
      toUserIds: data.toUserIds || [],
      read: false,
      createdAt: new Date().toISOString(),
      ...data,
    }

    messages.push(message)
    setData(STORAGE_KEYS.messages, messages)

    return message
  },

  markAsRead(id: string): void {
    const messages = getData<Message>(STORAGE_KEYS.messages)
    const index = messages.findIndex(m => m.id === id)
    if (index !== -1) {
      messages[index].read = true
      setData(STORAGE_KEYS.messages, messages)
    }
  },
}

// ==================== TIME ENTRIES ====================

export const timeEntriesStorage = {
  getAll(params: Record<string, any> = {}): TimeEntry[] {
    let entries = getData<TimeEntry>(STORAGE_KEYS.timeEntries)
    
    if (params.caseId) {
      entries = entries.filter(e => e.caseId === params.caseId)
    }

    if (params.clientId) {
      entries = entries.filter(e => e.clientId === params.clientId)
    }

    if (params.userId) {
      entries = entries.filter(e => e.userId === params.userId)
    }

    return entries
  },

  create(data: Partial<TimeEntry>): TimeEntry {
    const entries = getData<TimeEntry>(STORAGE_KEYS.timeEntries)
    
    const entry: TimeEntry = {
      id: generateId('time'),
      caseId: data.caseId || '',
      clientId: data.clientId || '',
      userId: data.userId || '',
      date: data.date || new Date().toISOString().split('T')[0],
      duration: data.duration || 0,
      description: data.description || '',
      hourlyRate: data.hourlyRate || 0,
      billable: data.billable ?? true,
      createdAt: new Date().toISOString(),
      ...data,
    }

    entries.push(entry)
    setData(STORAGE_KEYS.timeEntries, entries)

    return entry
  },

  update(id: string, data: Partial<TimeEntry>): TimeEntry {
    const entries = getData<TimeEntry>(STORAGE_KEYS.timeEntries)
    const index = entries.findIndex(e => e.id === id)
    
    if (index === -1) throw new Error('Time entry not found')

    entries[index] = { ...entries[index], ...data }
    setData(STORAGE_KEYS.timeEntries, entries)

    return entries[index]
  },

  delete(id: string): void {
    const entries = getData<TimeEntry>(STORAGE_KEYS.timeEntries)
    const filtered = entries.filter(e => e.id !== id)
    setData(STORAGE_KEYS.timeEntries, filtered)
  },
}

// ==================== INVOICES ====================

export const invoicesStorage = {
  getAll(params: Record<string, any> = {}): Invoice[] {
    let invoices = getData<Invoice>(STORAGE_KEYS.invoices)
    
    if (params.clientId) {
      invoices = invoices.filter(i => i.clientId === params.clientId)
    }

    if (params.status) {
      invoices = invoices.filter(i => i.status === params.status)
    }

    return invoices
  },

  create(data: Partial<Invoice>): Invoice {
    const invoices = getData<Invoice>(STORAGE_KEYS.invoices)
    
    const invoice: Invoice = {
      id: generateId('inv'),
      invoiceNumber: data.invoiceNumber || `INV-${Date.now()}`,
      clientId: data.clientId || '',
      timeEntryIds: data.timeEntryIds || [],
      subtotal: data.subtotal || 0,
      tax: data.tax || 0,
      total: data.total || 0,
      status: data.status || 'Draft',
      issuedDate: data.issuedDate || new Date().toISOString().split('T')[0],
      dueDate: data.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      ...data,
    }

    invoices.push(invoice)
    setData(STORAGE_KEYS.invoices, invoices)

    return invoice
  },

  update(id: string, data: Partial<Invoice>): Invoice {
    const invoices = getData<Invoice>(STORAGE_KEYS.invoices)
    const index = invoices.findIndex(i => i.id === id)
    
    if (index === -1) throw new Error('Invoice not found')

    invoices[index] = { ...invoices[index], ...data }
    setData(STORAGE_KEYS.invoices, invoices)

    return invoices[index]
  },

  delete(id: string): void {
    const invoices = getData<Invoice>(STORAGE_KEYS.invoices)
    const filtered = invoices.filter(i => i.id !== id)
    setData(STORAGE_KEYS.invoices, filtered)
  },
}

// ==================== DASHBOARD STATS ====================

export const dashboardStorage = {
  getStats() {
    const clients = getData<Client>(STORAGE_KEYS.clients)
    const cases = getData<Case>(STORAGE_KEYS.cases)
    const tasks = getData<Task>(STORAGE_KEYS.tasks)
    const invoices = getData<Invoice>(STORAGE_KEYS.invoices)

    return {
      totalClients: clients.length,
      activeCases: cases.filter(c => c.status === 'Open' || c.status === 'Pending').length,
      pendingTasks: tasks.filter(t => t.status !== 'Completed').length,
      unpaidInvoices: invoices.filter(i => i.status !== 'Paid').length,
      recentCases: cases.slice(-5).reverse(),
      upcomingTasks: tasks
        .filter(t => t.status !== 'Completed')
        .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
        .slice(0, 5),
    }
  },
}
