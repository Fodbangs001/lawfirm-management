// ============================================
// FIREBASE STORAGE - Cloud Database Implementation
// Data persists across ALL browsers and devices
// ============================================

import { 
  db, 
  COLLECTIONS,
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  setDoc,
} from './firebase'
import { User, Client, Case, Task, CourtLog, Message, TimeEntry, Invoice } from './types'

// Generate unique ID
const generateId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

// ============================================
// DEFAULT SAMPLE DATA (for initial setup)
// ============================================

const DEFAULT_USERS: User[] = [
  {
    id: 'user-admin-001',
    name: 'Admin User',
    email: 'admin@lawfirm.com',
    role: 'Admin',
    status: 'active',
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'user-lawyer-001',
    name: 'John Smith',
    email: 'john@lawfirm.com',
    role: 'Lawyer',
    status: 'active',
    createdAt: '2024-01-15T00:00:00.000Z',
  },
  {
    id: 'user-lawyer-002',
    name: 'Sarah Johnson',
    email: 'sarah@lawfirm.com',
    role: 'Lawyer',
    status: 'active',
    createdAt: '2024-02-01T00:00:00.000Z',
  },
]

const DEFAULT_PASSWORDS: Record<string, string> = {
  'user-admin-001': 'admin123',
  'user-lawyer-001': 'lawyer123',
  'user-lawyer-002': 'lawyer123',
}

const DEFAULT_CLIENTS: Client[] = [
  {
    id: 'client-001',
    name: 'James Anderson',
    firstName: 'James',
    lastName: 'Anderson',
    email: 'james.anderson@email.com',
    phone: '+1-555-0101',
    type: 'Individual',
    address: '123 Main Street, New York, NY 10001',
    createdAt: '2024-03-01T00:00:00.000Z',
  },
  {
    id: 'client-002',
    name: 'Tech Solutions Inc.',
    companyName: 'Tech Solutions Inc.',
    email: 'legal@techsolutions.com',
    phone: '+1-555-0102',
    type: 'Corporate',
    address: '456 Business Ave, San Francisco, CA 94102',
    createdAt: '2024-03-15T00:00:00.000Z',
  },
  {
    id: 'client-003',
    name: 'Maria Garcia',
    firstName: 'Maria',
    lastName: 'Garcia',
    email: 'maria.garcia@email.com',
    phone: '+1-555-0103',
    type: 'Individual',
    address: '789 Oak Lane, Los Angeles, CA 90001',
    createdAt: '2024-04-01T00:00:00.000Z',
  },
]

const DEFAULT_CASES: Case[] = [
  {
    id: 'case-001',
    title: 'H1B Visa Application - James Anderson',
    caseNumber: 'CASE-2024-001',
    type: 'General',
    status: 'Open',
    clientId: 'client-001',
    assignedTo: ['user-lawyer-001'],
    description: 'H1B visa application for software engineer position',
    createdAt: '2024-03-05T00:00:00.000Z',
    updatedAt: '2024-12-20T00:00:00.000Z',
  },
  {
    id: 'case-002',
    title: 'Asylum Application - Maria Garcia',
    caseNumber: 'CASE-2024-002',
    type: 'Asylum',
    status: 'Open',
    clientId: 'client-003',
    assignedTo: ['user-lawyer-002'],
    description: 'Asylum application',
    createdAt: '2024-04-05T00:00:00.000Z',
    updatedAt: '2024-12-22T00:00:00.000Z',
  },
]

const DEFAULT_TASKS: Task[] = [
  {
    id: 'task-001',
    title: 'Prepare H1B petition documents',
    description: 'Gather and prepare all required documents',
    assignedTo: 'user-lawyer-001',
    caseId: 'case-001',
    dueDate: '2024-12-30T00:00:00.000Z',
    priority: 'High',
    status: 'In Progress',
    createdAt: '2024-12-01T00:00:00.000Z',
  },
  {
    id: 'task-002',
    title: 'Client follow-up call',
    description: 'Schedule follow-up with Maria Garcia',
    assignedTo: 'user-lawyer-002',
    caseId: 'case-002',
    dueDate: '2024-12-28T00:00:00.000Z',
    priority: 'Medium',
    status: 'Todo',
    createdAt: '2024-12-05T00:00:00.000Z',
  },
]

// ============================================
// INITIALIZE DATABASE WITH SAMPLE DATA
// ============================================

async function initializeDatabase() {
  try {
    // Check if database is already initialized
    const settingsRef = doc(db, COLLECTIONS.settings, 'init')
    const settingsDoc = await getDoc(settingsRef)
    
    if (settingsDoc.exists()) {
      console.log('✅ Database already initialized')
      return
    }

    console.log('🔄 Initializing database with sample data...')

    // Add default users
    for (const user of DEFAULT_USERS) {
      await setDoc(doc(db, COLLECTIONS.users, user.id), user)
    }

    // Add default passwords
    for (const [userId, password] of Object.entries(DEFAULT_PASSWORDS)) {
      await setDoc(doc(db, COLLECTIONS.passwords, userId), { password })
    }

    // Add default clients
    for (const client of DEFAULT_CLIENTS) {
      await setDoc(doc(db, COLLECTIONS.clients, client.id), client)
    }

    // Add default cases
    for (const caseItem of DEFAULT_CASES) {
      await setDoc(doc(db, COLLECTIONS.cases, caseItem.id), caseItem)
    }

    // Add default tasks
    for (const task of DEFAULT_TASKS) {
      await setDoc(doc(db, COLLECTIONS.tasks, task.id), task)
    }

    // Mark as initialized
    await setDoc(settingsRef, { initialized: true, date: new Date().toISOString() })

    console.log('✅ Database initialized with sample data')
  } catch (error) {
    console.error('Error initializing database:', error)
  }
}

// Initialize on import
initializeDatabase()

// ============================================
// AUTH STORAGE
// ============================================

export const authStorage = {
  async login(email: string, password: string): Promise<{ user: User; token: string } | null> {
    try {
      // Find user by email
      const usersRef = collection(db, COLLECTIONS.users)
      const q = query(usersRef, where('email', '==', email))
      const snapshot = await getDocs(q)
      
      if (snapshot.empty) return null
      
      const userDoc = snapshot.docs[0]
      const user = { id: userDoc.id, ...userDoc.data() } as User
      
      if (user.status !== 'active') return null

      // Verify password
      const passwordDoc = await getDoc(doc(db, COLLECTIONS.passwords, user.id))
      if (!passwordDoc.exists()) return null
      
      const storedPassword = passwordDoc.data().password
      if (storedPassword !== password) return null

      const token = `firebase-token-${user.id}-${Date.now()}`
      
      // Store in localStorage for session persistence
      localStorage.setItem('auth_token', token)
      localStorage.setItem('lawfirm_current_user', JSON.stringify(user))
      
      return { user, token }
    } catch (error) {
      console.error('Login error:', error)
      return null
    }
  },

  async register(name: string, email: string, password: string, role: string = 'Staff'): Promise<{ user: User; token: string } | null> {
    try {
      // Check if email exists
      const usersRef = collection(db, COLLECTIONS.users)
      const q = query(usersRef, where('email', '==', email))
      const snapshot = await getDocs(q)
      
      if (!snapshot.empty) {
        throw new Error('Email already registered')
      }

      const userId = generateId('user')
      const user: User = {
        id: userId,
        name,
        email,
        role: role as User['role'],
        status: 'active',
        createdAt: new Date().toISOString(),
      }

      await setDoc(doc(db, COLLECTIONS.users, userId), user)
      await setDoc(doc(db, COLLECTIONS.passwords, userId), { password })

      const token = `firebase-token-${userId}-${Date.now()}`
      
      localStorage.setItem('auth_token', token)
      localStorage.setItem('lawfirm_current_user', JSON.stringify(user))

      return { user, token }
    } catch (error) {
      console.error('Register error:', error)
      throw error
    }
  },

  getCurrentUser(): User | null {
    const data = localStorage.getItem('lawfirm_current_user')
    return data ? JSON.parse(data) : null
  },

  logout() {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('lawfirm_current_user')
  },

  getToken(): string | null {
    return localStorage.getItem('auth_token')
  },
}

// ============================================
// USERS STORAGE
// ============================================

export const usersStorage = {
  async getAll(): Promise<User[]> {
    try {
      const snapshot = await getDocs(collection(db, COLLECTIONS.users))
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User))
    } catch (error) {
      console.error('Error getting users:', error)
      return []
    }
  },

  async getById(id: string): Promise<User | undefined> {
    try {
      const docRef = await getDoc(doc(db, COLLECTIONS.users, id))
      if (!docRef.exists()) return undefined
      return { id: docRef.id, ...docRef.data() } as User
    } catch (error) {
      console.error('Error getting user:', error)
      return undefined
    }
  },

  async create(data: { name: string; email: string; password: string; role: string }): Promise<User> {
    const userId = generateId('user')
    const user: User = {
      id: userId,
      name: data.name,
      email: data.email,
      role: data.role as User['role'],
      status: 'active',
      createdAt: new Date().toISOString(),
    }

    await setDoc(doc(db, COLLECTIONS.users, userId), user)
    await setDoc(doc(db, COLLECTIONS.passwords, userId), { password: data.password })

    return user
  },

  async update(id: string, data: Partial<User> & { password?: string }): Promise<User> {
    const { password, ...userData } = data
    
    const userRef = doc(db, COLLECTIONS.users, id)
    await updateDoc(userRef, userData)
    
    if (password) {
      await setDoc(doc(db, COLLECTIONS.passwords, id), { password })
    }

    const updated = await getDoc(userRef)
    return { id, ...updated.data() } as User
  },

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(db, COLLECTIONS.users, id))
    await deleteDoc(doc(db, COLLECTIONS.passwords, id))
  },
}

// ============================================
// CLIENTS STORAGE
// ============================================

export const clientsStorage = {
  async getAll(params: Record<string, any> = {}): Promise<{ clients: Client[]; pagination: any }> {
    try {
      const snapshot = await getDocs(collection(db, COLLECTIONS.clients))
      let clients = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Client))
      
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
        pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
      }
    } catch (error) {
      console.error('Error getting clients:', error)
      return { clients: [], pagination: { total: 0, page: 1, limit: 50, totalPages: 0 } }
    }
  },

  async getById(id: string): Promise<Client | undefined> {
    try {
      const docRef = await getDoc(doc(db, COLLECTIONS.clients, id))
      if (!docRef.exists()) return undefined
      return { id: docRef.id, ...docRef.data() } as Client
    } catch (error) {
      console.error('Error getting client:', error)
      return undefined
    }
  },

  async create(data: Partial<Client>): Promise<Client> {
    const clientId = generateId('client')
    const client: Client = {
      id: clientId,
      name: data.name || '',
      email: data.email || '',
      phone: data.phone || '',
      type: data.type || 'Individual',
      createdAt: new Date().toISOString(),
      ...data,
    }

    await setDoc(doc(db, COLLECTIONS.clients, clientId), client)
    return client
  },

  async update(id: string, data: Partial<Client>): Promise<Client> {
    const clientRef = doc(db, COLLECTIONS.clients, id)
    await updateDoc(clientRef, data)
    const updated = await getDoc(clientRef)
    return { id, ...updated.data() } as Client
  },

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(db, COLLECTIONS.clients, id))
  },
}

// ============================================
// CASES STORAGE
// ============================================

export const casesStorage = {
  async getAll(params: Record<string, any> = {}): Promise<{ cases: Case[]; pagination: any }> {
    try {
      const snapshot = await getDocs(collection(db, COLLECTIONS.cases))
      let cases = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Case))
      
      if (params.search) {
        const search = params.search.toLowerCase()
        cases = cases.filter(c => 
          c.title?.toLowerCase().includes(search) ||
          c.caseNumber?.toLowerCase().includes(search)
        )
      }

      if (params.status) cases = cases.filter(c => c.status === params.status)
      if (params.type) cases = cases.filter(c => c.type === params.type)
      if (params.clientId) cases = cases.filter(c => c.clientId === params.clientId)

      const total = cases.length
      const page = parseInt(params.page) || 1
      const limit = parseInt(params.limit) || 50
      const offset = (page - 1) * limit

      cases = cases.slice(offset, offset + limit)

      return {
        cases,
        pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
      }
    } catch (error) {
      console.error('Error getting cases:', error)
      return { cases: [], pagination: { total: 0, page: 1, limit: 50, totalPages: 0 } }
    }
  },

  async create(data: Partial<Case>): Promise<Case> {
    const caseId = generateId('case')
    const newCase: Case = {
      id: caseId,
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

    await setDoc(doc(db, COLLECTIONS.cases, caseId), newCase)
    return newCase
  },

  async update(id: string, data: Partial<Case>): Promise<Case> {
    const caseRef = doc(db, COLLECTIONS.cases, id)
    await updateDoc(caseRef, { ...data, updatedAt: new Date().toISOString() })
    const updated = await getDoc(caseRef)
    return { id, ...updated.data() } as Case
  },

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(db, COLLECTIONS.cases, id))
  },
}

// ============================================
// TASKS STORAGE
// ============================================

export const tasksStorage = {
  async getAll(params: Record<string, any> = {}): Promise<Task[]> {
    try {
      const snapshot = await getDocs(collection(db, COLLECTIONS.tasks))
      let tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task))
      
      if (params.assignedTo) tasks = tasks.filter(t => t.assignedTo === params.assignedTo)
      if (params.status) tasks = tasks.filter(t => t.status === params.status)
      if (params.caseId) tasks = tasks.filter(t => t.caseId === params.caseId)

      return tasks
    } catch (error) {
      console.error('Error getting tasks:', error)
      return []
    }
  },

  async create(data: Partial<Task>): Promise<Task> {
    const taskId = generateId('task')
    const task: Task = {
      id: taskId,
      title: data.title || '',
      assignedTo: data.assignedTo || '',
      dueDate: data.dueDate || new Date().toISOString(),
      priority: data.priority || 'Medium',
      status: data.status || 'Todo',
      createdAt: new Date().toISOString(),
      ...data,
    }

    await setDoc(doc(db, COLLECTIONS.tasks, taskId), task)
    return task
  },

  async update(id: string, data: Partial<Task>): Promise<Task> {
    const taskRef = doc(db, COLLECTIONS.tasks, id)
    await updateDoc(taskRef, data)
    const updated = await getDoc(taskRef)
    return { id, ...updated.data() } as Task
  },

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(db, COLLECTIONS.tasks, id))
  },
}

// ============================================
// COURT LOGS STORAGE
// ============================================

export const courtLogsStorage = {
  async getAll(params: Record<string, any> = {}): Promise<{ courtLogs: CourtLog[]; pagination: any }> {
    try {
      const snapshot = await getDocs(collection(db, COLLECTIONS.courtLogs))
      let logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CourtLog))
      
      if (params.clientId) logs = logs.filter(l => l.clientId === params.clientId)
      if (params.status) logs = logs.filter(l => l.status === params.status)

      const total = logs.length
      const page = parseInt(params.page) || 1
      const limit = parseInt(params.limit) || 50
      const offset = (page - 1) * limit

      logs = logs.slice(offset, offset + limit)

      return {
        courtLogs: logs,
        pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
      }
    } catch (error) {
      console.error('Error getting court logs:', error)
      return { courtLogs: [], pagination: { total: 0, page: 1, limit: 50, totalPages: 0 } }
    }
  },

  async create(data: Partial<CourtLog>): Promise<CourtLog> {
    const logId = generateId('court')
    const log: CourtLog = {
      id: logId,
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

    await setDoc(doc(db, COLLECTIONS.courtLogs, logId), log)
    return log
  },

  async update(id: string, data: Partial<CourtLog>): Promise<CourtLog> {
    const logRef = doc(db, COLLECTIONS.courtLogs, id)
    await updateDoc(logRef, { ...data, updatedAt: new Date().toISOString() })
    const updated = await getDoc(logRef)
    return { id, ...updated.data() } as CourtLog
  },

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(db, COLLECTIONS.courtLogs, id))
  },
}

// ============================================
// MESSAGES STORAGE
// ============================================

export const messagesStorage = {
  async getAll(params: Record<string, any> = {}): Promise<{ messages: Message[]; pagination: any }> {
    try {
      const snapshot = await getDocs(collection(db, COLLECTIONS.messages))
      let messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message))
      
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
        pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
      }
    } catch (error) {
      console.error('Error getting messages:', error)
      return { messages: [], pagination: { total: 0, page: 1, limit: 50, totalPages: 0 } }
    }
  },

  async create(data: Partial<Message>): Promise<Message> {
    const msgId = generateId('msg')
    const message: Message = {
      id: msgId,
      subject: data.subject || '',
      content: data.content || '',
      fromUserId: data.fromUserId || '',
      toUserIds: data.toUserIds || [],
      read: false,
      createdAt: new Date().toISOString(),
      ...data,
    }

    await setDoc(doc(db, COLLECTIONS.messages, msgId), message)
    return message
  },

  async markAsRead(id: string): Promise<void> {
    await updateDoc(doc(db, COLLECTIONS.messages, id), { read: true })
  },
}

// ============================================
// TIME ENTRIES STORAGE
// ============================================

export const timeEntriesStorage = {
  async getAll(params: Record<string, any> = {}): Promise<TimeEntry[]> {
    try {
      const snapshot = await getDocs(collection(db, COLLECTIONS.timeEntries))
      let entries = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TimeEntry))
      
      if (params.caseId) entries = entries.filter(e => e.caseId === params.caseId)
      if (params.clientId) entries = entries.filter(e => e.clientId === params.clientId)
      if (params.userId) entries = entries.filter(e => e.userId === params.userId)

      return entries
    } catch (error) {
      console.error('Error getting time entries:', error)
      return []
    }
  },

  async create(data: Partial<TimeEntry>): Promise<TimeEntry> {
    const entryId = generateId('time')
    const entry: TimeEntry = {
      id: entryId,
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

    await setDoc(doc(db, COLLECTIONS.timeEntries, entryId), entry)
    return entry
  },

  async update(id: string, data: Partial<TimeEntry>): Promise<TimeEntry> {
    const entryRef = doc(db, COLLECTIONS.timeEntries, id)
    await updateDoc(entryRef, data)
    const updated = await getDoc(entryRef)
    return { id, ...updated.data() } as TimeEntry
  },

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(db, COLLECTIONS.timeEntries, id))
  },
}

// ============================================
// INVOICES STORAGE
// ============================================

export const invoicesStorage = {
  async getAll(params: Record<string, any> = {}): Promise<Invoice[]> {
    try {
      const snapshot = await getDocs(collection(db, COLLECTIONS.invoices))
      let invoices = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Invoice))
      
      if (params.clientId) invoices = invoices.filter(i => i.clientId === params.clientId)
      if (params.status) invoices = invoices.filter(i => i.status === params.status)

      return invoices
    } catch (error) {
      console.error('Error getting invoices:', error)
      return []
    }
  },

  async create(data: Partial<Invoice>): Promise<Invoice> {
    const invId = generateId('inv')
    const invoice: Invoice = {
      id: invId,
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

    await setDoc(doc(db, COLLECTIONS.invoices, invId), invoice)
    return invoice
  },

  async update(id: string, data: Partial<Invoice>): Promise<Invoice> {
    const invRef = doc(db, COLLECTIONS.invoices, id)
    await updateDoc(invRef, data)
    const updated = await getDoc(invRef)
    return { id, ...updated.data() } as Invoice
  },

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(db, COLLECTIONS.invoices, id))
  },
}

// ============================================
// DASHBOARD STATS
// ============================================

export const dashboardStorage = {
  async getStats() {
    try {
      const [clientsSnap, casesSnap, tasksSnap, invoicesSnap] = await Promise.all([
        getDocs(collection(db, COLLECTIONS.clients)),
        getDocs(collection(db, COLLECTIONS.cases)),
        getDocs(collection(db, COLLECTIONS.tasks)),
        getDocs(collection(db, COLLECTIONS.invoices)),
      ])

      const cases = casesSnap.docs.map(d => ({ id: d.id, ...d.data() } as Case))
      const tasks = tasksSnap.docs.map(d => ({ id: d.id, ...d.data() } as Task))
      const invoices = invoicesSnap.docs.map(d => ({ id: d.id, ...d.data() } as Invoice))

      return {
        totalClients: clientsSnap.size,
        activeCases: cases.filter(c => c.status === 'Open' || c.status === 'Pending').length,
        pendingTasks: tasks.filter(t => t.status !== 'Completed').length,
        unpaidInvoices: invoices.filter(i => i.status !== 'Paid').length,
        recentCases: cases.slice(-5).reverse(),
        upcomingTasks: tasks
          .filter(t => t.status !== 'Completed')
          .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
          .slice(0, 5),
      }
    } catch (error) {
      console.error('Error getting dashboard stats:', error)
      return {
        totalClients: 0,
        activeCases: 0,
        pendingTasks: 0,
        unpaidInvoices: 0,
        recentCases: [],
        upcomingTasks: [],
      }
    }
  },
}
