// ============================================
// API CLIENT - Firebase Cloud Database Implementation
// Data syncs across ALL browsers and devices
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
  billingPaymentsStorage,
  billingExpensesStorage,
  billingOtherStorage,
  billingNotificationsStorage,
  asylumNotificationsStorage,
  asylumPaymentsStorage,
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

  // Auth
  async login(email: string, password: string) {
    const result = await authStorage.login(email, password)
    if (!result) {
      throw new Error('Invalid credentials')
    }
    this.setToken(result.token)
    return result
  }

  async register(name: string, email: string, password: string, role: string) {
    const result = await authStorage.register(name, email, password, role)
    if (!result) {
      throw new Error('Registration failed')
    }
    this.setToken(result.token)
    return result
  }

  async getMe() {
    const user = authStorage.getCurrentUser()
    if (!user) {
      throw new Error('Not authenticated')
    }
    return { user }
  }

  logout() {
    authStorage.logout()
    this.setToken(null)
  }

  // Users
  async getUsers() {
    return usersStorage.getAll()
  }

  async createUser(data: { name: string; email: string; password: string; role: string }) {
    return usersStorage.create(data)
  }

  async updateUser(id: string, data: any) {
    return usersStorage.update(id, data)
  }

  async deleteUser(id: string) {
    await usersStorage.delete(id)
    return { success: true }
  }

  // Clients
  async getClients(params: Record<string, any> = {}) {
    return clientsStorage.getAll(params)
  }

  async createClient(data: any) {
    return clientsStorage.create(data)
  }

  async updateClient(id: string, data: any) {
    return clientsStorage.update(id, data)
  }

  async deleteClient(id: string) {
    await clientsStorage.delete(id)
    return { success: true }
  }

  async restoreClient(id: string) {
    return clientsStorage.restore(id)
  }

  async getDeletedClients() {
    return clientsStorage.getDeleted()
  }

  async permanentDeleteClient(id: string) {
    await clientsStorage.permanentDelete(id)
    return { success: true }
  }

  // Cases
  async getCases(params: Record<string, any> = {}) {
    return casesStorage.getAll(params)
  }

  async createCase(data: any) {
    return casesStorage.create(data)
  }

  async updateCase(id: string, data: any) {
    return casesStorage.update(id, data)
  }

  async deleteCase(id: string) {
    await casesStorage.delete(id)
    return { success: true }
  }

  async restoreCase(id: string) {
    return casesStorage.restore(id)
  }

  async getDeletedCases() {
    return casesStorage.getDeleted()
  }

  async permanentDeleteCase(id: string) {
    await casesStorage.permanentDelete(id)
    return { success: true }
  }

  // Tasks
  async getTasks(params: Record<string, any> = {}) {
    return tasksStorage.getAll(params)
  }

  async createTask(data: any) {
    return tasksStorage.create(data)
  }

  async updateTask(id: string, data: any) {
    return tasksStorage.update(id, data)
  }

  async deleteTask(id: string) {
    await tasksStorage.delete(id)
    return { success: true }
  }

  // Court Logs
  async getCourtLogs(params: Record<string, any> = {}) {
    return courtLogsStorage.getAll(params)
  }

  async createCourtLog(data: any) {
    return courtLogsStorage.create(data)
  }

  async updateCourtLog(id: string, data: any) {
    return courtLogsStorage.update(id, data)
  }

  async deleteCourtLog(id: string) {
    await courtLogsStorage.delete(id)
    return { success: true }
  }

  // Appointments (alias for court logs for compatibility)
  async getAppointments(params: Record<string, any> = {}) {
    const result = await courtLogsStorage.getAll(params)
    return result.courtLogs
  }

  async createAppointment(data: any) {
    return courtLogsStorage.create(data)
  }

  // Messages
  async getMessages(params: Record<string, any> = {}) {
    return messagesStorage.getAll(params)
  }

  async createMessage(data: any) {
    return messagesStorage.create(data)
  }

  // Time Entries
  async getTimeEntries(params: Record<string, any> = {}) {
    return timeEntriesStorage.getAll(params)
  }

  async createTimeEntry(data: any) {
    return timeEntriesStorage.create(data)
  }

  async updateTimeEntry(id: string, data: any) {
    return timeEntriesStorage.update(id, data)
  }

  async deleteTimeEntry(id: string) {
    await timeEntriesStorage.delete(id)
    return { success: true }
  }

  // Invoices
  async getInvoices(params: Record<string, any> = {}) {
    return invoicesStorage.getAll(params)
  }

  async createInvoice(data: any) {
    return invoicesStorage.create(data)
  }

  async updateInvoice(id: string, data: any) {
    return invoicesStorage.update(id, data)
  }

  async deleteInvoice(id: string) {
    await invoicesStorage.delete(id)
    return { success: true }
  }

  // Dashboard
  async getDashboardStats() {
    return dashboardStorage.getStats()
  }

  // ============================================
  // BILLING APIs
  // ============================================

  // Billing Payments
  async getBillingPayments() {
    return billingPaymentsStorage.getAll()
  }

  async createBillingPayment(data: any) {
    return billingPaymentsStorage.create(data)
  }

  async updateBillingPayment(id: string, data: any) {
    return billingPaymentsStorage.update(id, data)
  }

  async deleteBillingPayment(id: string) {
    await billingPaymentsStorage.delete(id)
    return { success: true }
  }

  // Billing Expenses
  async getBillingExpenses() {
    return billingExpensesStorage.getAll()
  }

  async createBillingExpense(data: any) {
    return billingExpensesStorage.create(data)
  }

  async updateBillingExpense(id: string, data: any) {
    return billingExpensesStorage.update(id, data)
  }

  async deleteBillingExpense(id: string) {
    await billingExpensesStorage.delete(id)
    return { success: true }
  }

  // Billing Other Payments
  async getBillingOther() {
    return billingOtherStorage.getAll()
  }

  async createBillingOther(data: any) {
    return billingOtherStorage.create(data)
  }

  async updateBillingOther(id: string, data: any) {
    return billingOtherStorage.update(id, data)
  }

  async deleteBillingOther(id: string) {
    await billingOtherStorage.delete(id)
    return { success: true }
  }

  // Billing Notifications
  async getBillingNotifications() {
    return billingNotificationsStorage.getAll()
  }

  async createBillingNotification(data: any) {
    return billingNotificationsStorage.create(data)
  }

  async updateBillingNotification(id: string, data: any) {
    return billingNotificationsStorage.update(id, data)
  }

  async deleteBillingNotification(id: string) {
    await billingNotificationsStorage.delete(id)
    return { success: true }
  }

  // ============================================
  // ASYLUM APIs
  // ============================================

  // Asylum Notifications
  async getAsylumNotifications() {
    return asylumNotificationsStorage.getAll()
  }

  async createAsylumNotification(data: any) {
    return asylumNotificationsStorage.create(data)
  }

  async updateAsylumNotification(id: string, data: any) {
    return asylumNotificationsStorage.update(id, data)
  }

  async deleteAsylumNotification(id: string) {
    await asylumNotificationsStorage.delete(id)
    return { success: true }
  }

  // Asylum Payments
  async getAsylumPayments() {
    return asylumPaymentsStorage.getAll()
  }

  async createAsylumPayment(data: any) {
    return asylumPaymentsStorage.create(data)
  }

  async updateAsylumPayment(id: string, data: any) {
    return asylumPaymentsStorage.update(id, data)
  }

  async deleteAsylumPayment(id: string) {
    await asylumPaymentsStorage.delete(id)
    return { success: true }
  }

  // Health check
  async health() {
    return { status: 'ok', mode: 'firebase' }
  }
}

export const api = new ApiClient()
