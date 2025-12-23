// ============================================
// TYPE DEFINITIONS
// ============================================

export type UserRole = 'Admin' | 'Lawyer' | 'Paralegal' | 'Staff'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  status?: 'active' | 'inactive'
  avatarUrl?: string
  createdAt: string
}

export interface Client {
  id: string
  name: string
  firstName?: string
  middleName?: string
  lastName?: string
  dateOfBirth?: string
  placeOfBirth?: string
  countryOfBirth?: string
  companyName?: string
  arcNumber?: string
  fileNumber?: string
  email: string
  phone: string
  address?: string
  type: 'Individual' | 'Corporate'
  notes?: string
  createdAt: string
}

export interface Case {
  id: string
  title: string
  caseNumber: string
  type: 'General' | 'Asylum'
  status: 'Open' | 'Pending' | 'Closed' | 'On Hold'
  clientId: string
  assignedTo: string[]
  description?: string
  createdAt: string
  updatedAt: string
}

export interface CourtLog {
  id: string
  clientId: string
  clientName: string
  caseId?: string
  caseNumber?: string
  courtDate: string
  courtTime: string
  courtName: string
  courtAddress?: string
  judgeOrPanel?: string
  purpose: string
  notes?: string
  reminderEnabled: boolean
  reminderDaysBefore: number
  reminderSentToLawyer: boolean
  reminderSentToClient: boolean
  status: 'Scheduled' | 'Completed' | 'Postponed' | 'Cancelled'
  createdAt: string
  updatedAt: string
}

export interface Task {
  id: string
  title: string
  description?: string
  assignedTo: string
  caseId?: string
  dueDate: string
  priority: 'Low' | 'Medium' | 'High' | 'Urgent'
  status: 'Todo' | 'In Progress' | 'Completed'
  createdAt: string
}

export interface Appointment {
  id: string
  title: string
  description?: string
  startTime: string
  endTime: string
  caseId?: string
  clientId?: string
  attendees: string[]
  location?: string
  createdAt: string
}

export interface Message {
  id: string
  subject: string
  content: string
  fromUserId: string
  toUserIds: string[]
  caseId?: string
  clientId?: string
  read: boolean
  createdAt: string
}

export interface TimeEntry {
  id: string
  caseId: string
  clientId: string
  userId: string
  date: string
  duration: number
  description: string
  hourlyRate: number
  billable: boolean
  invoiceId?: string
  createdAt: string
}

export interface Invoice {
  id: string
  invoiceNumber: string
  clientId: string
  timeEntryIds: string[]
  subtotal: number
  tax: number
  total: number
  status: 'Draft' | 'Sent' | 'Paid' | 'Overdue'
  issuedDate: string
  dueDate: string
  paidDate?: string
  notes?: string
  createdAt: string
}

export interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
}

