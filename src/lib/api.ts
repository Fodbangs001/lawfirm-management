// ============================================
// API CLIENT - Static localStorage Implementation
// ============================================

import {
  authStorage,
  usersStorage,
  clientsStorage,
  casesStorage,
  tasksStorage,
  courtLogsStorage,
  messagesStorage,
  timeEntriesStorage,
  invoicesStorage,
  dashboardStorage,
} from './storage'

class ApiClient {
  private token: string | null = null

  constructor() {
    this.token = localStorage.getItem('auth_token')
  }

  setToken(token: string | null) {
    this.token = token
    if (token) {
      localStorage.setItem('auth_token', token)
    } else {
      localStorage.removeItem('auth_token')
    }
  }

  // Simulate async behavior for compatibility
  private async delay<T>(fn: () => T): Promise<T> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          resolve(fn())
        } catch (error) {
          reject(error)
        }
      }, 50) // Small delay to simulate network
    })
  }

  // Auth
  async login(email: string, password: string) {
    return this.delay(() => {
      const result = authStorage.login(email, password)
      if (!result) {
        throw new Error('Invalid credentials')
      }
      this.setToken(result.token)
      return result
    })
  }

  async register(name: string, email: string, password: string, role: string) {
    return this.delay(() => {
      const result = authStorage.register(name, email, password, role)
      if (!result) {
        throw new Error('Registration failed')
      }
      this.setToken(result.token)
      return result
    })
  }

  async getMe() {
    return this.delay(() => {
      const user = authStorage.getCurrentUser()
      if (!user) {
        throw new Error('Not authenticated')
      }
      return { user }
    })
  }

  logout() {
    authStorage.logout()
    this.setToken(null)
  }

  // Users
  async getUsers() {
    return this.delay(() => usersStorage.getAll())
  }

  async createUser(data: { name: string; email: string; password: string; role: string }) {
    return this.delay(() => usersStorage.create(data))
  }

  async updateUser(id: string, data: any) {
    return this.delay(() => usersStorage.update(id, data))
  }

  async deleteUser(id: string) {
    return this.delay(() => {
      usersStorage.delete(id)
      return { success: true }
    })
  }

  // Clients
  async getClients(params: Record<string, any> = {}) {
    return this.delay(() => clientsStorage.getAll(params))
  }

  async createClient(data: any) {
    return this.delay(() => clientsStorage.create(data))
  }

  async updateClient(id: string, data: any) {
    return this.delay(() => clientsStorage.update(id, data))
  }

  async deleteClient(id: string) {
    return this.delay(() => {
      clientsStorage.delete(id)
      return { success: true }
    })
  }

  // Cases
  async getCases(params: Record<string, any> = {}) {
    return this.delay(() => casesStorage.getAll(params))
  }

  async createCase(data: any) {
    return this.delay(() => casesStorage.create(data))
  }

  async updateCase(id: string, data: any) {
    return this.delay(() => casesStorage.update(id, data))
  }

  async deleteCase(id: string) {
    return this.delay(() => {
      casesStorage.delete(id)
      return { success: true }
    })
  }

  // Tasks
  async getTasks(params: Record<string, any> = {}) {
    return this.delay(() => tasksStorage.getAll(params))
  }

  async createTask(data: any) {
    return this.delay(() => tasksStorage.create(data))
  }

  async updateTask(id: string, data: any) {
    return this.delay(() => tasksStorage.update(id, data))
  }

  async deleteTask(id: string) {
    return this.delay(() => {
      tasksStorage.delete(id)
      return { success: true }
    })
  }

  // Court Logs
  async getCourtLogs(params: Record<string, any> = {}) {
    return this.delay(() => courtLogsStorage.getAll(params))
  }

  async createCourtLog(data: any) {
    return this.delay(() => courtLogsStorage.create(data))
  }

  async updateCourtLog(id: string, data: any) {
    return this.delay(() => courtLogsStorage.update(id, data))
  }

  async deleteCourtLog(id: string) {
    return this.delay(() => {
      courtLogsStorage.delete(id)
      return { success: true }
    })
  }

  // Appointments (alias for court logs for compatibility)
  async getAppointments(params: Record<string, any> = {}) {
    return this.delay(() => courtLogsStorage.getAll(params).courtLogs)
  }

  async createAppointment(data: any) {
    return this.delay(() => courtLogsStorage.create(data))
  }

  // Messages
  async getMessages(params: Record<string, any> = {}) {
    return this.delay(() => messagesStorage.getAll(params))
  }

  async createMessage(data: any) {
    return this.delay(() => messagesStorage.create(data))
  }

  // Time Entries
  async getTimeEntries(params: Record<string, any> = {}) {
    return this.delay(() => timeEntriesStorage.getAll(params))
  }

  async createTimeEntry(data: any) {
    return this.delay(() => timeEntriesStorage.create(data))
  }

  async updateTimeEntry(id: string, data: any) {
    return this.delay(() => timeEntriesStorage.update(id, data))
  }

  async deleteTimeEntry(id: string) {
    return this.delay(() => {
      timeEntriesStorage.delete(id)
      return { success: true }
    })
  }

  // Invoices
  async getInvoices(params: Record<string, any> = {}) {
    return this.delay(() => invoicesStorage.getAll(params))
  }

  async createInvoice(data: any) {
    return this.delay(() => invoicesStorage.create(data))
  }

  async updateInvoice(id: string, data: any) {
    return this.delay(() => invoicesStorage.update(id, data))
  }

  async deleteInvoice(id: string) {
    return this.delay(() => {
      invoicesStorage.delete(id)
      return { success: true }
    })
  }

  // Dashboard
  async getDashboardStats() {
    return this.delay(() => dashboardStorage.getStats())
  }

  // Health check (always healthy for static)
  async health() {
    return { status: 'ok', mode: 'static' }
  }
}

export const api = new ApiClient()
