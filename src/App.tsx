import { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from '@/lib/auth'
import { api } from '@/lib/api'
import { LoginPage } from '@/pages/LoginPage'
import { Dashboard } from '@/pages/Dashboard'
import { ClientsPage } from '@/pages/ClientsPage'
import { CasesPage } from '@/pages/CasesPage'
import { TasksPage } from '@/pages/TasksPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { MessagesPage } from '@/pages/MessagesPage'
import { AsylumPage } from '@/pages/AsylumPage'
import { BillingPage } from '@/pages/BillingPage'
import { CourtLogPage } from '@/pages/CourtLogPage'
import { UsersPage } from '@/pages/UsersPage'
import { ReportsPage } from '@/pages/ReportsPage'
import { DocumentsPage } from '@/pages/DocumentsPage'
import { Layout } from '@/components/Layout'
import { Toaster, toast } from 'sonner'
import {
  exportToExcel,
  exportMultipleSheetsToExcel,
  formatClientsForExport,
  formatCasesForExport,
  formatTasksForExport,
  formatCourtLogsForExport,
  importFromExcel,
  parseImportedClients,
  parseImportedCases,
  parseImportedTasks,
} from '@/lib/excel-export'

function AppContent() {
  const { isAuthenticated, isLoading, user } = useAuth()
  const [activeView, setActiveView] = useState('dashboard')

  // Data state
  const [clients, setClients] = useState<any[]>([])
  const [cases, setCases] = useState<any[]>([])
  const [tasks, setTasks] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [messages, setMessages] = useState<any[]>([])

  // Load data when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadData()
    }
  }, [isAuthenticated])

  const loadData = async () => {
    try {
      const [clientsRes, casesRes, tasksRes, usersRes, messagesRes] = await Promise.all([
        api.getClients({ limit: 1000 }),
        api.getCases({ limit: 1000 }),
        api.getTasks(),
        api.getUsers(),
        api.getMessages(),
      ])
      setClients(clientsRes.clients || [])
      setCases(casesRes.cases || [])
      setTasks(tasksRes || [])
      setUsers(usersRes || [])
      setMessages(messagesRes.messages || [])
    } catch (error) {
      console.error('Failed to load data:', error)
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Not authenticated
  if (!isAuthenticated) {
    return <LoginPage />
  }

  // Handle export
  const handleExport = (type: 'clients' | 'cases' | 'tasks' | 'billing' | 'court-logs' | 'all') => {
    try {
      const dateStr = new Date().toISOString().split('T')[0]

      switch (type) {
        case 'clients':
          if (clients.length === 0) {
            toast.error('No clients to export')
            return
          }
          exportToExcel(formatClientsForExport(clients), `Clients_${dateStr}`, 'Clients')
          toast.success('Clients exported to Excel')
          break

        case 'cases':
          if (cases.length === 0) {
            toast.error('No cases to export')
            return
          }
          exportToExcel(formatCasesForExport(cases, clients), `Cases_${dateStr}`, 'Cases')
          toast.success('Cases exported to Excel')
          break

        case 'tasks':
          if (tasks.length === 0) {
            toast.error('No tasks to export')
            return
          }
          exportToExcel(formatTasksForExport(tasks, users), `Tasks_${dateStr}`, 'Tasks')
          toast.success('Tasks exported to Excel')
          break

        case 'court-logs':
          const courtLogs = JSON.parse(localStorage.getItem('court-logs') || '[]')
          if (courtLogs.length === 0) {
            toast.error('No court logs to export')
            return
          }
          exportToExcel(formatCourtLogsForExport(courtLogs), `Court_Logs_${dateStr}`, 'Court Logs')
          toast.success('Court logs exported to Excel')
          break

        case 'billing':
          const payments = JSON.parse(localStorage.getItem('billing-payments') || '[]')
          const expenses = JSON.parse(localStorage.getItem('billing-expenses') || '[]')
          const otherIncome = JSON.parse(localStorage.getItem('billing-other-payments') || '[]')

          if (payments.length === 0 && expenses.length === 0 && otherIncome.length === 0) {
            toast.error('No billing data to export')
            return
          }

          exportMultipleSheetsToExcel([
            { name: 'Payments', data: payments.map((p: any) => ({
              'Client Name': p.clientName,
              'Amount': p.amount,
              'Amount Paid': p.amountPaid,
              'Balance': p.balance,
              'Status': p.status,
              'Due Date': p.dueDate,
            }))},
            { name: 'Expenses', data: expenses.map((e: any) => ({
              'Description': e.description,
              'Category': e.category,
              'Amount': e.amount,
              'Date': e.date,
            }))},
            { name: 'Other Income', data: otherIncome.map((o: any) => ({
              'Description': o.description,
              'Category': o.category,
              'Amount': o.amount,
              'Date': o.date,
            }))},
          ], `Billing_Report_${dateStr}`)
          toast.success('Billing data exported to Excel')
          break

        case 'all':
          const allCourtLogs = JSON.parse(localStorage.getItem('court-logs') || '[]')
          const allPayments = JSON.parse(localStorage.getItem('billing-payments') || '[]')
          const allExpenses = JSON.parse(localStorage.getItem('billing-expenses') || '[]')

          exportMultipleSheetsToExcel([
            { name: 'Clients', data: formatClientsForExport(clients) },
            { name: 'Cases', data: formatCasesForExport(cases, clients) },
            { name: 'Tasks', data: formatTasksForExport(tasks, users) },
            { name: 'Court Logs', data: formatCourtLogsForExport(allCourtLogs) },
            { name: 'Payments', data: allPayments.map((p: any) => ({
              'Client Name': p.clientName,
              'Amount': p.amount,
              'Amount Paid': p.amountPaid,
              'Balance': p.balance,
              'Status': p.status,
              'Due Date': p.dueDate,
            }))},
            { name: 'Expenses', data: allExpenses.map((e: any) => ({
              'Description': e.description,
              'Category': e.category,
              'Amount': e.amount,
              'Date': e.date,
            }))},
          ], `LawFirm_Full_Export_${dateStr}`)
          toast.success('All data exported to Excel')
          break
      }
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Failed to export data')
    }
  }

  // Handle import
  const handleImport = async (type: 'clients' | 'cases' | 'tasks', file: File) => {
    try {
      toast.info(`Importing ${type} from ${file.name}...`)

      const rawData = await importFromExcel(file)

      if (!rawData || rawData.length === 0) {
        toast.error('No data found in the file')
        return
      }

      let importedCount = 0

      switch (type) {
        case 'clients':
          const parsedClients = parseImportedClients(rawData)
          // Add to server via API
          for (const client of parsedClients) {
            try {
              await api.createClient({
                name: client.name,
                firstName: client.firstName,
                middleName: client.middleName,
                lastName: client.lastName,
                type: client.type,
                email: client.email,
                phone: client.phone,
                address: client.address,
                dateOfBirth: client.dateOfBirth,
                placeOfBirth: client.placeOfBirth,
                countryOfBirth: client.countryOfBirth,
                arcNumber: client.arcNumber,
                fileNumber: client.fileNumber,
                notes: client.notes,
              })
              importedCount++
            } catch (err) {
              console.error('Failed to import client:', client.name, err)
            }
          }
          toast.success(`Imported ${importedCount} of ${parsedClients.length} clients`)
          break

        case 'cases':
          const parsedCases = parseImportedCases(rawData, clients)
          for (const caseItem of parsedCases) {
            if (!caseItem.clientId) {
              console.warn('Skipping case without client:', caseItem.title)
              continue
            }
            try {
              await api.createCase({
                title: caseItem.title,
                caseNumber: caseItem.caseNumber,
                type: caseItem.type,
                status: caseItem.status,
                clientId: caseItem.clientId,
                description: caseItem.description,
              })
              importedCount++
            } catch (err) {
              console.error('Failed to import case:', caseItem.title, err)
            }
          }
          toast.success(`Imported ${importedCount} of ${parsedCases.length} cases`)
          break

        case 'tasks':
          const parsedTasks = parseImportedTasks(rawData, users)
          for (const task of parsedTasks) {
            try {
              await api.createTask({
                title: task.title,
                description: task.description,
                status: task.status,
                priority: task.priority,
                assignedTo: task.assignedTo,
                dueDate: task.dueDate,
              })
              importedCount++
            } catch (err) {
              console.error('Failed to import task:', task.title, err)
            }
          }
          toast.success(`Imported ${importedCount} of ${parsedTasks.length} tasks`)
          break
      }

      // Reload data after import
      await loadData()

    } catch (error) {
      console.error('Import error:', error)
      toast.error('Failed to import data. Please check the file format.')
    }
  }

  // Render view
  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return (
          <Dashboard
            clientCount={clients.length}
            caseCount={cases.length}
            taskCount={tasks.length}
            pendingTasks={tasks.filter(t => t.status !== 'Completed').length}
          />
        )
      case 'clients':
        return <ClientsPage clients={clients} onRefresh={loadData} />
      case 'cases':
        return <CasesPage cases={cases} clients={clients} users={users} onRefresh={loadData} />
      case 'asylum':
        return <AsylumPage cases={cases} clients={clients} users={users} onRefresh={loadData} />
      case 'tasks':
        return <TasksPage tasks={tasks} cases={cases} users={users} onRefresh={loadData} />
      case 'calendar':
        return <PlaceholderPage title="Calendar" description="View appointments and deadlines." />
      case 'court-log':
        return <CourtLogPage clients={clients} cases={cases} />
      case 'documents':
        return <DocumentsPage clients={clients} cases={cases} />
      case 'messages':
        return <MessagesPage messages={messages} users={users} onRefresh={loadData} />
      case 'billing':
        return <BillingPage clients={clients} cases={cases} onRefresh={loadData} />
      case 'reports':
        return <ReportsPage clients={clients} cases={cases} users={users} />
      case 'users':
        return <UsersPage users={users} onRefresh={loadData} />
      case 'settings':
        return <SettingsPage />
      default:
        return <Dashboard clientCount={0} caseCount={0} taskCount={0} pendingTasks={0} />
    }
  }

  return (
    <Layout activeView={activeView} onNavigate={setActiveView} onExport={handleExport} onImport={handleImport}>
      {renderView()}
    </Layout>
  )
}

function PlaceholderPage({ title, description }: { title: string; description: string }) {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold">{title}</h1>
      <p className="text-muted-foreground mt-2">{description}</p>
      <div className="mt-8 p-12 border-2 border-dashed rounded-lg flex items-center justify-center">
        <p className="text-muted-foreground">Content coming soon...</p>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
      <Toaster position="top-right" />
    </AuthProvider>
  )
}

