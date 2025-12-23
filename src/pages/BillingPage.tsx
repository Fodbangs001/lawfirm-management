import { useState, useMemo } from 'react'
import { useAuth } from '@/lib/auth'
import { Client, Case } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DollarSign,
  CreditCard,
  Receipt,
  TrendingUp,
  TrendingDown,
  Plus,
  Trash2,
  Bell,
  User,
  FileText,
  Calculator,
  Wallet,
  PiggyBank,
  ArrowUpRight,
  ArrowDownRight,
  FileDown,
  MoreVertical
} from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { exportToExcel, formatPaymentsForExport, formatExpensesForExport, exportMultipleSheetsToExcel } from '@/lib/excel-export'
import { formatCurrency, getCurrencySymbol } from '@/lib/currency'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface BillingPageProps {
  clients: Client[]
  cases: Case[]
  onRefresh: () => void
}

// Types
interface Payment {
  id: string
  clientId: string
  clientName: string
  caseId?: string
  caseName?: string
  totalAmount: number
  paidAmount: number
  balance: number
  status: 'Pending' | 'Partial' | 'Paid' | 'Overdue'
  dueDate: string
  description: string
  payments: PartialPayment[]
  createdAt: string
}

interface PartialPayment {
  id: string
  amount: number
  date: string
  method: 'Cash' | 'Card' | 'Bank Transfer' | 'Check' | 'Other'
  notes?: string
}

interface Expense {
  id: string
  category: string
  amount: number
  date: string
  description: string
  vendor?: string
  receipt?: string
  createdAt: string
}

interface OtherPayment {
  id: string
  type: 'Income' | 'Expense'
  category: string
  amount: number
  date: string
  description: string
  reference?: string
  createdAt: string
}

interface PaymentNotification {
  id: string
  clientId: string
  clientName: string
  paymentId: string
  amount: number
  dueDate: string
  message: string
  status: 'Pending' | 'Sent' | 'Read'
  createdAt: string
}

const EXPENSE_CATEGORIES = [
  'Office Rent',
  'Utilities',
  'Office Supplies',
  'Software & Subscriptions',
  'Professional Services',
  'Travel',
  'Marketing',
  'Insurance',
  'Taxes',
  'Salaries',
  'Legal Research',
  'Court Fees',
  'Other'
]

const PAYMENT_METHODS = ['Cash', 'Card', 'Bank Transfer', 'Check', 'Other']

export function BillingPage({ clients, cases, onRefresh }: BillingPageProps) {
  const { user: currentUser } = useAuth()

  // State for payments
  const [payments, setPayments] = useState<Payment[]>(() => {
    const saved = localStorage.getItem('billing-payments')
    return saved ? JSON.parse(saved) : []
  })

  // State for expenses
  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem('billing-expenses')
    return saved ? JSON.parse(saved) : []
  })

  // State for other payments
  const [otherPayments, setOtherPayments] = useState<OtherPayment[]>(() => {
    const saved = localStorage.getItem('billing-other')
    return saved ? JSON.parse(saved) : []
  })

  // State for notifications
  const [notifications, setNotifications] = useState<PaymentNotification[]>(() => {
    const saved = localStorage.getItem('billing-notifications')
    return saved ? JSON.parse(saved) : []
  })

  // Dialog states
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false)
  const [isPartialPaymentDialogOpen, setIsPartialPaymentDialogOpen] = useState(false)
  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false)
  const [isOtherPaymentDialogOpen, setIsOtherPaymentDialogOpen] = useState(false)
  const [isNotificationDialogOpen, setIsNotificationDialogOpen] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)

  // Form states
  const [newPayment, setNewPayment] = useState({
    clientId: '',
    caseId: '',
    totalAmount: '',
    dueDate: '',
    description: '',
  })

  const [newPartialPayment, setNewPartialPayment] = useState({
    amount: '',
    method: 'Cash' as const,
    notes: '',
  })

  const [newExpense, setNewExpense] = useState({
    category: '',
    amount: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    description: '',
    vendor: '',
  })

  const [newOtherPayment, setNewOtherPayment] = useState({
    type: 'Income' as 'Income' | 'Expense',
    category: '',
    amount: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    description: '',
    reference: '',
  })

  const [notificationMessage, setNotificationMessage] = useState('')

  // Save to localStorage
  const savePayments = (data: Payment[]) => {
    setPayments(data)
    localStorage.setItem('billing-payments', JSON.stringify(data))
  }

  const saveExpenses = (data: Expense[]) => {
    setExpenses(data)
    localStorage.setItem('billing-expenses', JSON.stringify(data))
  }

  const saveOtherPayments = (data: OtherPayment[]) => {
    setOtherPayments(data)
    localStorage.setItem('billing-other', JSON.stringify(data))
  }

  const saveNotifications = (data: PaymentNotification[]) => {
    setNotifications(data)
    localStorage.setItem('billing-notifications', JSON.stringify(data))
  }

  // Calculate totals
  const totals = useMemo(() => {
    const totalInvoiced = payments.reduce((sum, p) => sum + p.totalAmount, 0)
    const totalReceived = payments.reduce((sum, p) => sum + p.paidAmount, 0)
    const totalPending = payments.reduce((sum, p) => sum + p.balance, 0)
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)
    const otherIncome = otherPayments.filter(p => p.type === 'Income').reduce((sum, p) => sum + p.amount, 0)
    const otherExpense = otherPayments.filter(p => p.type === 'Expense').reduce((sum, p) => sum + p.amount, 0)

    const totalIncome = totalReceived + otherIncome
    const totalExpenseAll = totalExpenses + otherExpense
    const netBalance = totalIncome - totalExpenseAll

    return {
      totalInvoiced,
      totalReceived,
      totalPending,
      totalExpenses,
      otherIncome,
      otherExpense,
      totalIncome,
      totalExpenseAll,
      netBalance
    }
  }, [payments, expenses, otherPayments])

  // Get client name
  const getClientName = (clientId: string) => {
    const client = clients.find(c => c.id === clientId)
    if (!client) return 'Unknown Client'
    return (client as any).firstName
      ? `${(client as any).firstName} ${(client as any).lastName}`
      : client.name
  }

  // Get case title
  const getCaseTitle = (caseId?: string) => {
    if (!caseId) return ''
    const caseItem = cases.find(c => c.id === caseId)
    return caseItem?.title || ''
  }

  // Create payment
  const handleCreatePayment = () => {
    if (!newPayment.clientId || !newPayment.totalAmount || !newPayment.dueDate) {
      toast.error('Please fill in all required fields')
      return
    }

    const payment: Payment = {
      id: `pay-${Date.now()}`,
      clientId: newPayment.clientId,
      clientName: getClientName(newPayment.clientId),
      caseId: newPayment.caseId || undefined,
      caseName: getCaseTitle(newPayment.caseId),
      totalAmount: parseFloat(newPayment.totalAmount),
      paidAmount: 0,
      balance: parseFloat(newPayment.totalAmount),
      status: 'Pending',
      dueDate: newPayment.dueDate,
      description: newPayment.description,
      payments: [],
      createdAt: new Date().toISOString(),
    }

    savePayments([...payments, payment])
    setIsPaymentDialogOpen(false)
    setNewPayment({ clientId: '', caseId: '', totalAmount: '', dueDate: '', description: '' })
    toast.success('Payment created successfully')
  }

  // Add partial payment
  const handleAddPartialPayment = () => {
    if (!selectedPayment || !newPartialPayment.amount) {
      toast.error('Please enter payment amount')
      return
    }

    const amount = parseFloat(newPartialPayment.amount)
    if (amount > selectedPayment.balance) {
      toast.error('Payment amount exceeds balance')
      return
    }

    const partial: PartialPayment = {
      id: `partial-${Date.now()}`,
      amount,
      date: format(new Date(), 'yyyy-MM-dd'),
      method: newPartialPayment.method,
      notes: newPartialPayment.notes,
    }

    const newPaidAmount = selectedPayment.paidAmount + amount
    const newBalance = selectedPayment.totalAmount - newPaidAmount
    const newStatus = newBalance === 0 ? 'Paid' : 'Partial'

    const updated = payments.map(p =>
      p.id === selectedPayment.id
        ? { ...p, paidAmount: newPaidAmount, balance: newBalance, status: newStatus as any, payments: [...p.payments, partial] }
        : p
    )

    savePayments(updated)
    setIsPartialPaymentDialogOpen(false)
    setNewPartialPayment({ amount: '', method: 'Cash', notes: '' })
    setSelectedPayment(null)
    toast.success('Payment recorded successfully')
  }

  // Create expense
  const handleCreateExpense = () => {
    if (!newExpense.category || !newExpense.amount || !newExpense.date) {
      toast.error('Please fill in all required fields')
      return
    }

    const expense: Expense = {
      id: `exp-${Date.now()}`,
      category: newExpense.category,
      amount: parseFloat(newExpense.amount),
      date: newExpense.date,
      description: newExpense.description,
      vendor: newExpense.vendor,
      createdAt: new Date().toISOString(),
    }

    saveExpenses([...expenses, expense])
    setIsExpenseDialogOpen(false)
    setNewExpense({ category: '', amount: '', date: format(new Date(), 'yyyy-MM-dd'), description: '', vendor: '' })
    toast.success('Expense added successfully')
  }

  // Create other payment
  const handleCreateOtherPayment = () => {
    if (!newOtherPayment.category || !newOtherPayment.amount || !newOtherPayment.date) {
      toast.error('Please fill in all required fields')
      return
    }

    const other: OtherPayment = {
      id: `other-${Date.now()}`,
      type: newOtherPayment.type,
      category: newOtherPayment.category,
      amount: parseFloat(newOtherPayment.amount),
      date: newOtherPayment.date,
      description: newOtherPayment.description,
      reference: newOtherPayment.reference,
      createdAt: new Date().toISOString(),
    }

    saveOtherPayments([...otherPayments, other])
    setIsOtherPaymentDialogOpen(false)
    setNewOtherPayment({ type: 'Income', category: '', amount: '', date: format(new Date(), 'yyyy-MM-dd'), description: '', reference: '' })
    toast.success('Payment added successfully')
  }

  // Send notification
  const handleSendNotification = () => {
    if (!selectedPayment || !notificationMessage) {
      toast.error('Please enter notification message')
      return
    }

    const notification: PaymentNotification = {
      id: `notif-${Date.now()}`,
      clientId: selectedPayment.clientId,
      clientName: selectedPayment.clientName,
      paymentId: selectedPayment.id,
      amount: selectedPayment.balance,
      dueDate: selectedPayment.dueDate,
      message: notificationMessage,
      status: 'Sent',
      createdAt: new Date().toISOString(),
    }

    saveNotifications([...notifications, notification])
    setIsNotificationDialogOpen(false)
    setNotificationMessage('')
    setSelectedPayment(null)
    toast.success('Notification sent to ' + selectedPayment.clientName)
  }

  // Delete functions
  const deletePayment = (id: string) => {
    savePayments(payments.filter(p => p.id !== id))
    toast.success('Payment deleted')
  }

  const deleteExpense = (id: string) => {
    saveExpenses(expenses.filter(e => e.id !== id))
    toast.success('Expense deleted')
  }

  const deleteOtherPayment = (id: string) => {
    saveOtherPayments(otherPayments.filter(p => p.id !== id))
    toast.success('Payment deleted')
  }

  // Open partial payment dialog
  const openPartialPayment = (payment: Payment) => {
    setSelectedPayment(payment)
    setIsPartialPaymentDialogOpen(true)
  }

  // Open notification dialog
  const openNotification = (payment: Payment) => {
    setSelectedPayment(payment)
    setNotificationMessage(`Dear ${payment.clientName},\n\nThis is a reminder that you have an outstanding balance of ${formatCurrency(payment.balance)} due on ${format(new Date(payment.dueDate), 'MMMM d, yyyy')}.\n\nPlease make your payment at your earliest convenience.\n\nThank you,\n${currentUser?.name || 'Law Firm'}`)
    setIsNotificationDialogOpen(true)
  }

  // Export billing data to Excel
  const handleExportBilling = () => {
    try {
      const paymentsData = payments.map(p => ({
        'Client Name': p.clientName,
        'Total Amount': p.totalAmount,
        'Paid Amount': p.paidAmount,
        'Balance': p.balance,
        'Status': p.status,
        'Due Date': p.dueDate,
        'Description': p.description,
        'Created At': p.createdAt,
      }))

      const expensesData = expenses.map(e => ({
        'Description': e.description,
        'Category': e.category,
        'Amount': e.amount,
        'Date': e.date,
        'Vendor': e.vendor || '',
        'Created At': e.createdAt,
      }))

      const otherIncomeData = otherPayments.map(p => ({
        'Description': p.description,
        'Type': p.type,
        'Category': p.category,
        'Amount': p.amount,
        'Date': p.date,
        'Reference': p.reference || '',
        'Created At': p.createdAt,
      }))

      exportMultipleSheetsToExcel([
        { name: 'Payments', data: paymentsData },
        { name: 'Expenses', data: expensesData },
        { name: 'Other Income', data: otherIncomeData },
      ], `Billing_Report_${new Date().toISOString().split('T')[0]}`)

      toast.success('Billing data exported to Excel')
    } catch (error) {
      toast.error('Failed to export billing data')
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <DollarSign className="h-8 w-8" />
            Time & Billing
          </h1>
          <p className="text-muted-foreground">
            Manage payments, expenses, and financial records
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleExportBilling}>
              <FileDown className="h-4 w-4 mr-2" />
              Export to Excel
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totals.totalIncome)}</div>
            <p className="text-xs text-muted-foreground">Received payments + other income</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(totals.totalExpenseAll)}</div>
            <p className="text-xs text-muted-foreground">Firm expenses + other expenses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Payments</CardTitle>
            <Wallet className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{formatCurrency(totals.totalPending)}</div>
            <p className="text-xs text-muted-foreground">Outstanding client balances</p>
          </CardContent>
        </Card>

        <Card className={totals.netBalance >= 0 ? 'border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/20' : 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/20'}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Net Balance</CardTitle>
            <Calculator className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totals.netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(Math.abs(totals.netBalance))}
              {totals.netBalance < 0 && ' (Loss)'}
            </div>
            <p className="text-xs text-muted-foreground">Income - Expenses</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="payments" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="payments" className="gap-2">
            <CreditCard className="h-4 w-4" />
            Payments
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="expenses" className="gap-2">
            <Receipt className="h-4 w-4" />
            Expenses
          </TabsTrigger>
          <TabsTrigger value="other" className="gap-2">
            <PiggyBank className="h-4 w-4" />
            Other
          </TabsTrigger>
          <TabsTrigger value="balance" className="gap-2">
            <FileText className="h-4 w-4" />
            Balance Sheet
          </TabsTrigger>
        </TabsList>

        {/* Payments Tab */}
        <TabsContent value="payments" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Client Payments</h2>
            <Button onClick={() => setIsPaymentDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Payment
            </Button>
          </div>

          {payments.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No payments recorded yet</p>
                <Button variant="link" onClick={() => setIsPaymentDialogOpen(true)}>
                  Create your first payment
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {payments.map((payment) => (
                <Card key={payment.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-full bg-primary/10">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold">{payment.clientName}</p>
                          {payment.caseName && (
                            <p className="text-sm text-muted-foreground">Case: {payment.caseName}</p>
                          )}
                          <p className="text-sm text-muted-foreground">{payment.description}</p>
                          <div className="flex items-center gap-4 mt-2 text-sm">
                            <span>Total: <strong>{formatCurrency(payment.totalAmount)}</strong></span>
                            <span className="text-green-600">Paid: {formatCurrency(payment.paidAmount)}</span>
                            <span className="text-amber-600">Balance: {formatCurrency(payment.balance)}</span>
                          </div>
                          {payment.payments.length > 0 && (
                            <div className="mt-2 text-xs text-muted-foreground">
                              {payment.payments.length} partial payment(s) recorded
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge variant={
                          payment.status === 'Paid' ? 'default' :
                          payment.status === 'Partial' ? 'secondary' :
                          payment.status === 'Overdue' ? 'destructive' : 'outline'
                        }>
                          {payment.status}
                        </Badge>
                        <p className="text-xs text-muted-foreground">
                          Due: {format(new Date(payment.dueDate), 'MMM d, yyyy')}
                        </p>
                        <div className="flex gap-1">
                          {payment.status !== 'Paid' && (
                            <>
                              <Button size="sm" variant="outline" onClick={() => openPartialPayment(payment)}>
                                <DollarSign className="h-3 w-3 mr-1" />
                                Pay
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => openNotification(payment)}>
                                <Bell className="h-3 w-3" />
                              </Button>
                            </>
                          )}
                          <Button size="sm" variant="ghost" onClick={() => deletePayment(payment.id)}>
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-4">
          <h2 className="text-xl font-semibold">Payment Notifications</h2>

          {notifications.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No notifications sent yet</p>
                <p className="text-sm text-muted-foreground">Send payment reminders from the Payments tab</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {notifications.map((notif) => (
                <Card key={notif.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-primary" />
                          <p className="font-semibold">{notif.clientName}</p>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Amount: {formatCurrency(notif.amount)} • Due: {format(new Date(notif.dueDate), 'MMM d, yyyy')}
                        </p>
                        <p className="text-sm mt-2 whitespace-pre-wrap line-clamp-2">{notif.message}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge variant={notif.status === 'Sent' ? 'default' : 'secondary'}>
                          {notif.status}
                        </Badge>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(notif.createdAt), 'MMM d, yyyy h:mm a')}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Expenses Tab */}
        <TabsContent value="expenses" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Firm Expenses</h2>
            <Button onClick={() => setIsExpenseDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Expense
            </Button>
          </div>

          {expenses.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No expenses recorded yet</p>
                <Button variant="link" onClick={() => setIsExpenseDialogOpen(true)}>
                  Add your first expense
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {expenses.map((expense) => (
                <Card key={expense.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-red-100 dark:bg-red-900/20">
                          <ArrowDownRight className="h-5 w-5 text-red-600" />
                        </div>
                        <div>
                          <p className="font-semibold">{expense.category}</p>
                          <p className="text-sm text-muted-foreground">{expense.description}</p>
                          {expense.vendor && (
                            <p className="text-xs text-muted-foreground">Vendor: {expense.vendor}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-semibold text-red-600">-{formatCurrency(expense.amount)}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(expense.date), 'MMM d, yyyy')}
                          </p>
                        </div>
                        <Button size="sm" variant="ghost" onClick={() => deleteExpense(expense.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Other Payments Tab */}
        <TabsContent value="other" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Other Payments</h2>
            <Button onClick={() => setIsOtherPaymentDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Payment
            </Button>
          </div>

          {otherPayments.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <PiggyBank className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No other payments recorded yet</p>
                <Button variant="link" onClick={() => setIsOtherPaymentDialogOpen(true)}>
                  Add a payment
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {otherPayments.map((payment) => (
                <Card key={payment.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${
                          payment.type === 'Income' 
                            ? 'bg-green-100 dark:bg-green-900/20' 
                            : 'bg-red-100 dark:bg-red-900/20'
                        }`}>
                          {payment.type === 'Income' ? (
                            <ArrowUpRight className="h-5 w-5 text-green-600" />
                          ) : (
                            <ArrowDownRight className="h-5 w-5 text-red-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold">{payment.category}</p>
                          <p className="text-sm text-muted-foreground">{payment.description}</p>
                          {payment.reference && (
                            <p className="text-xs text-muted-foreground">Ref: {payment.reference}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className={`font-semibold ${payment.type === 'Income' ? 'text-green-600' : 'text-red-600'}`}>
                            {payment.type === 'Income' ? '+' : '-'}{formatCurrency(payment.amount)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(payment.date), 'MMM d, yyyy')}
                          </p>
                        </div>
                        <Button size="sm" variant="ghost" onClick={() => deleteOtherPayment(payment.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Balance Sheet Tab */}
        <TabsContent value="balance" className="space-y-4">
          <h2 className="text-xl font-semibold">Balance Sheet</h2>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Income Section */}
            <Card>
              <CardHeader className="bg-green-50 dark:bg-green-900/20">
                <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
                  <TrendingUp className="h-5 w-5" />
                  Income
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                <div className="flex justify-between py-2 border-b">
                  <span>Client Payments Received</span>
                  <span className="font-semibold">{formatCurrency(totals.totalReceived)}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span>Other Income</span>
                  <span className="font-semibold">{formatCurrency(totals.otherIncome)}</span>
                </div>
                <Separator />
                <div className="flex justify-between py-2 text-lg font-bold text-green-600">
                  <span>Total Income</span>
                  <span>{formatCurrency(totals.totalIncome)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Expenses Section */}
            <Card>
              <CardHeader className="bg-red-50 dark:bg-red-900/20">
                <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-400">
                  <TrendingDown className="h-5 w-5" />
                  Expenses
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                <div className="flex justify-between py-2 border-b">
                  <span>Firm Expenses</span>
                  <span className="font-semibold">{formatCurrency(totals.totalExpenses)}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span>Other Expenses</span>
                  <span className="font-semibold">{formatCurrency(totals.otherExpense)}</span>
                </div>
                <Separator />
                <div className="flex justify-between py-2 text-lg font-bold text-red-600">
                  <span>Total Expenses</span>
                  <span>{formatCurrency(totals.totalExpenseAll)}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Net Balance */}
          <Card className={totals.netBalance >= 0 ? 'border-green-300 bg-green-50 dark:border-green-800 dark:bg-green-950/30' : 'border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/30'}>
            <CardContent className="py-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Calculator className="h-8 w-8" />
                  <div>
                    <p className="text-lg font-semibold">Net Balance</p>
                    <p className="text-sm text-muted-foreground">Total Income - Total Expenses</p>
                  </div>
                </div>
                <div className={`text-3xl font-bold ${totals.netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {totals.netBalance >= 0 ? '+' : '-'}{formatCurrency(Math.abs(totals.netBalance))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pending Summary */}
          <Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/20">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Wallet className="h-6 w-6 text-amber-600" />
                  <div>
                    <p className="font-semibold text-amber-900 dark:text-amber-100">Outstanding Receivables</p>
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                      {payments.filter(p => p.status !== 'Paid').length} client(s) with pending payments
                    </p>
                  </div>
                </div>
                <div className="text-2xl font-bold text-amber-600">
                  {formatCurrency(totals.totalPending)}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* New Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {clients.length === 0 ? (
              <div className="p-4 bg-amber-100 dark:bg-amber-900/20 rounded-lg text-amber-800 dark:text-amber-200 text-sm">
                No clients found. Please add a client first from the Clients page.
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>Client *</Label>
                  <Select value={newPayment.clientId} onValueChange={(v) => setNewPayment({ ...newPayment, clientId: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {getClientName(client.id)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Case (Optional)</Label>
                  <Select
                    value={newPayment.caseId || "none"}
                    onValueChange={(v) => setNewPayment({ ...newPayment, caseId: v === "none" ? "" : v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select case" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No case</SelectItem>
                      {cases.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.title} - {c.caseNumber}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Total Amount *</Label>
                    <Input
                      type="number"
                      value={newPayment.totalAmount}
                      onChange={(e) => setNewPayment({ ...newPayment, totalAmount: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Due Date *</Label>
                    <Input
                      type="date"
                      value={newPayment.dueDate}
                      onChange={(e) => setNewPayment({ ...newPayment, dueDate: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={newPayment.description}
                    onChange={(e) => setNewPayment({ ...newPayment, description: e.target.value })}
                    placeholder="Payment description..."
                  />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreatePayment} disabled={clients.length === 0}>Create Payment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Partial Payment Dialog */}
      <Dialog open={isPartialPaymentDialogOpen} onOpenChange={setIsPartialPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
          </DialogHeader>
          {selectedPayment && (
            <div className="space-y-4">
              <div className="p-3 bg-muted rounded-lg">
                <p className="font-semibold">{selectedPayment.clientName}</p>
                <p className="text-sm text-muted-foreground">
                  Balance: {formatCurrency(selectedPayment.balance)} of {formatCurrency(selectedPayment.totalAmount)}
                </p>
              </div>
              <div className="space-y-2">
                <Label>Payment Amount *</Label>
                <Input
                  type="number"
                  value={newPartialPayment.amount}
                  onChange={(e) => setNewPartialPayment({ ...newPartialPayment, amount: e.target.value })}
                  placeholder="0.00"
                  max={selectedPayment.balance}
                />
              </div>
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Select value={newPartialPayment.method} onValueChange={(v) => setNewPartialPayment({ ...newPartialPayment, method: v as any })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map((method) => (
                      <SelectItem key={method} value={method}>{method}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Input
                  value={newPartialPayment.notes}
                  onChange={(e) => setNewPartialPayment({ ...newPartialPayment, notes: e.target.value })}
                  placeholder="Payment notes..."
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPartialPaymentDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddPartialPayment}>Record Payment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Expense Dialog */}
      <Dialog open={isExpenseDialogOpen} onOpenChange={setIsExpenseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Expense</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Category *</Label>
              <Select value={newExpense.category} onValueChange={(v) => setNewExpense({ ...newExpense, category: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Amount *</Label>
                <Input
                  type="number"
                  value={newExpense.amount}
                  onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label>Date *</Label>
                <Input
                  type="date"
                  value={newExpense.date}
                  onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Vendor</Label>
              <Input
                value={newExpense.vendor}
                onChange={(e) => setNewExpense({ ...newExpense, vendor: e.target.value })}
                placeholder="Vendor name..."
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={newExpense.description}
                onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                placeholder="Expense description..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsExpenseDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateExpense}>Add Expense</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Other Payment Dialog */}
      <Dialog open={isOtherPaymentDialogOpen} onOpenChange={setIsOtherPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Other Payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Type *</Label>
              <Select value={newOtherPayment.type} onValueChange={(v) => setNewOtherPayment({ ...newOtherPayment, type: v as any })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Income">Income</SelectItem>
                  <SelectItem value="Expense">Expense</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Category *</Label>
              <Input
                value={newOtherPayment.category}
                onChange={(e) => setNewOtherPayment({ ...newOtherPayment, category: e.target.value })}
                placeholder="e.g., Consulting, Refund, Interest..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Amount *</Label>
                <Input
                  type="number"
                  value={newOtherPayment.amount}
                  onChange={(e) => setNewOtherPayment({ ...newOtherPayment, amount: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label>Date *</Label>
                <Input
                  type="date"
                  value={newOtherPayment.date}
                  onChange={(e) => setNewOtherPayment({ ...newOtherPayment, date: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Reference</Label>
              <Input
                value={newOtherPayment.reference}
                onChange={(e) => setNewOtherPayment({ ...newOtherPayment, reference: e.target.value })}
                placeholder="Reference number..."
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={newOtherPayment.description}
                onChange={(e) => setNewOtherPayment({ ...newOtherPayment, description: e.target.value })}
                placeholder="Payment description..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOtherPaymentDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateOtherPayment}>Add Payment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Notification Dialog */}
      <Dialog open={isNotificationDialogOpen} onOpenChange={setIsNotificationDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Send Payment Notification</DialogTitle>
          </DialogHeader>
          {selectedPayment && (
            <div className="space-y-4">
              <div className="p-3 bg-muted rounded-lg">
                <p className="font-semibold">{selectedPayment.clientName}</p>
                <p className="text-sm text-muted-foreground">
                  Balance Due: ${selectedPayment.balance.toFixed(2)} • Due: {format(new Date(selectedPayment.dueDate), 'MMM d, yyyy')}
                </p>
              </div>
              <div className="space-y-2">
                <Label>Message</Label>
                <Textarea
                  rows={8}
                  value={notificationMessage}
                  onChange={(e) => setNotificationMessage(e.target.value)}
                  placeholder="Enter notification message..."
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNotificationDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSendNotification}>
              <Bell className="mr-2 h-4 w-4" />
              Send Notification
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

