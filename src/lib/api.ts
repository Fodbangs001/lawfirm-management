// ============================================
// API CLIENT - Clean Implementation
// ============================================

const API_URL = '/api'

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

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers as Record<string, string>,
    }

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    })

    if (!response.ok) {
      let errorMessage = `HTTP error ${response.status}`
      try {
        const error = await response.json()
        errorMessage = error.error || error.message || errorMessage
      } catch {
        // Could not parse JSON, use status text
        errorMessage = response.statusText || errorMessage
      }
      console.error('API Error:', response.status, errorMessage)
      throw new Error(errorMessage)
    }

    return response.json()
  }

  // Auth
  async login(email: string, password: string) {
    const data = await this.request<{ user: any; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    this.setToken(data.token)
    return data
  }

  async register(name: string, email: string, password: string, role: string) {
    const data = await this.request<{ user: any; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, role }),
    })
    this.setToken(data.token)
    return data
  }

  async getMe() {
    return this.request<{ user: any }>('/auth/me')
  }

  logout() {
    this.setToken(null)
  }

  // Clients
  async getClients(params: Record<string, any> = {}) {
    const query = new URLSearchParams(params).toString()
    return this.request<{ clients: any[]; pagination: any }>(`/clients?${query}`)
  }

  async createClient(data: any) {
    return this.request<any>('/clients', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateClient(id: string, data: any) {
    return this.request<any>(`/clients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteClient(id: string) {
    return this.request<any>(`/clients/${id}`, { method: 'DELETE' })
  }

  // Users
  async getUsers() {
    return this.request<any[]>('/users')
  }

  async createUser(data: { name: string; email: string; password: string; role: string }) {
    return this.request<any>('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateUser(id: string, data: any) {
    return this.request<any>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteUser(id: string) {
    return this.request<any>(`/users/${id}`, { method: 'DELETE' })
  }

  // Cases
  async getCases(params: Record<string, any> = {}) {
    const query = new URLSearchParams(params).toString()
    return this.request<{ cases: any[]; pagination: any }>(`/cases?${query}`)
  }

  async createCase(data: any) {
    return this.request<any>('/cases', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateCase(id: string, data: any) {
    return this.request<any>(`/cases/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteCase(id: string) {
    return this.request<any>(`/cases/${id}`, { method: 'DELETE' })
  }

  // Tasks
  async getTasks(params: Record<string, any> = {}) {
    const query = new URLSearchParams(params).toString()
    return this.request<any[]>(`/tasks?${query}`)
  }

  async createTask(data: any) {
    return this.request<any>('/tasks', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateTask(id: string, data: any) {
    return this.request<any>(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteTask(id: string) {
    return this.request<any>(`/tasks/${id}`, { method: 'DELETE' })
  }

  // Appointments
  async getAppointments(params: Record<string, any> = {}) {
    const query = new URLSearchParams(params).toString()
    return this.request<any[]>(`/appointments?${query}`)
  }

  async createAppointment(data: any) {
    return this.request<any>('/appointments', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // Messages
  async getMessages(params: Record<string, any> = {}) {
    const query = new URLSearchParams(params).toString()
    return this.request<{ messages: any[]; pagination: any }>(`/messages?${query}`)
  }

  async createMessage(data: any) {
    return this.request<any>('/messages', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // Time Entries
  async getTimeEntries(params: Record<string, any> = {}) {
    const query = new URLSearchParams(params).toString()
    return this.request<any[]>(`/time-entries?${query}`)
  }

  async createTimeEntry(data: any) {
    return this.request<any>('/time-entries', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateTimeEntry(id: string, data: any) {
    return this.request<any>(`/time-entries/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteTimeEntry(id: string) {
    return this.request<any>(`/time-entries/${id}`, { method: 'DELETE' })
  }

  // Invoices
  async getInvoices(params: Record<string, any> = {}) {
    const query = new URLSearchParams(params).toString()
    return this.request<any[]>(`/invoices?${query}`)
  }

  async createInvoice(data: any) {
    return this.request<any>('/invoices', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateInvoice(id: string, data: any) {
    return this.request<any>(`/invoices/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteInvoice(id: string) {
    return this.request<any>(`/invoices/${id}`, { method: 'DELETE' })
  }

  // Health
  async health() {
    return fetch(`${API_URL.replace('/api', '')}/health`).then(r => r.json())
  }
}

export const api = new ApiClient()

