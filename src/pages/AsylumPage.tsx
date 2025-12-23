import { useState, useMemo } from 'react'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { Case, Client, User } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
  Briefcase,
  UserPlus,
  Bell,
  DollarSign,
  AlertTriangle,
  Copy,
  Save,
  FileText,
  Trash2,
  Globe,
  Download
} from 'lucide-react'
import { toast } from 'sonner'
import { countries } from '@/lib/countries'
import { format } from 'date-fns'
import jsPDF from 'jspdf'

interface AsylumPageProps {
  cases: Case[]
  clients: Client[]
  users: User[]
  onRefresh: () => void
}

interface SavedNotification {
  id: string
  caseId: string
  clientName: string
  subject: string
  body: string
  channel: 'Email' | 'SMS' | 'Phone'
  createdAt: string
}

interface PaymentReminder {
  id: string
  caseId: string
  clientName: string
  amountDue: number
  dueDate: string
  status: 'Pending' | 'Sent' | 'Paid'
  notes?: string
  createdAt: string
}

const NOTIFICATION_TEMPLATE = (
  clientName: string,
  appealNumber: string,
  returnDate: string,
  signer: string,
  arcNumber?: string
) => `In relation to the above subject please note that Mrs. ${clientName}${arcNumber ? `, ARC NO. ${arcNumber}` : ''} has filed the Recourse No. ${appealNumber} at the Administrative Court of International Protection.
The case is fixed on the ${returnDate} for Trial.
Mrs. ${clientName} is an Asylum Seeker until the Court issues its final decision.`

export function AsylumPage({ cases, clients, users, onRefresh }: AsylumPageProps) {
  const { user: currentUser } = useAuth()

  // Filter asylum cases
  const asylumCases = useMemo(
    () => cases.filter((c) => c.type === 'Asylum'),
    [cases]
  )

  // Filter clients linked to asylum cases
  const asylumClients = useMemo(() => {
    const asylumClientIds = new Set(asylumCases.map(c => c.clientId))
    return clients.filter(client => asylumClientIds.has(client.id))
  }, [clients, asylumCases])

  // State
  const [selectedCaseId, setSelectedCaseId] = useState<string>('')
  const [selectedClientId, setSelectedClientId] = useState<string>('')  // For direct client selection
  const [isAddClientDialogOpen, setIsAddClientDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Notification state
  const [appealNumber, setAppealNumber] = useState('')
  const [arcNumber, setArcNumber] = useState('')
  const [fileNumber, setFileNumber] = useState('')
  const [returnDate, setReturnDate] = useState('')
  const [channel, setChannel] = useState<'Email' | 'SMS' | 'Phone'>('Email')
  const [subject, setSubject] = useState('Asylum Case Notification')
  const [notificationBody, setNotificationBody] = useState('')
  const [savedNotifications, setSavedNotifications] = useState<SavedNotification[]>(() => {
    const saved = localStorage.getItem('asylum-notifications')
    return saved ? JSON.parse(saved) : []
  })

  // Payment state
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentDueDate, setPaymentDueDate] = useState('')
  const [paymentNotes, setPaymentNotes] = useState('')
  const [paymentReminders, setPaymentReminders] = useState<PaymentReminder[]>(() => {
    const saved = localStorage.getItem('asylum-payments')
    return saved ? JSON.parse(saved) : []
  })

  // New client form state
  const [newClient, setNewClient] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    dateOfBirth: '',
    placeOfBirth: '',
    countryOfBirth: '',
    arcNumber: '',
    fileNumber: '',
    notes: '',
  })

  // Get selected case and client
  const selectedCase = asylumCases.find((c) => c.id === selectedCaseId)
  const selectedClient = selectedCase
    ? clients.find((c) => c.id === selectedCase.clientId)
    : null

  // Get directly selected client (for notifications - can work without a case)
  const directSelectedClient = selectedClientId
    ? clients.find((c) => c.id === selectedClientId)
    : null

  // The active client for notifications - prefer direct selection, fallback to case-based
  const activeNotificationClient = directSelectedClient || selectedClient

  // Auto-populate ARC and File numbers from client profile when case is selected
  const handleCaseSelect = (caseId: string) => {
    setSelectedCaseId(caseId)
    const caseItem = asylumCases.find((c) => c.id === caseId)
    if (caseItem) {
      const client = clients.find((c) => c.id === caseItem.clientId) as any
      if (client) {
        // Auto-fill from client profile
        setSelectedClientId(client.id)
        setArcNumber(client.arcNumber || '')
        setFileNumber(client.fileNumber || '')
      }
    }
  }

  // Handle direct client selection for notifications
  const handleClientSelect = (clientId: string) => {
    setSelectedClientId(clientId)
    const client = clients.find((c) => c.id === clientId) as any
    if (client) {
      setArcNumber(client.arcNumber || '')
      setFileNumber(client.fileNumber || '')
    }
  }

  // Get client display name
  const getClientDisplayName = (client: any) => {
    if (client?.firstName) {
      return `${client.firstName} ${client.middleName || ''} ${client.lastName}`.trim()
    }
    return client?.name || 'Unknown Client'
  }

  // Generate notification
  const generateNotification = () => {
    if (!activeNotificationClient) {
      toast.error('Please select a client first')
      return
    }
    if (!appealNumber || !returnDate) {
      toast.error('Please enter appeal number and return date')
      return
    }

    const clientName = getClientDisplayName(activeNotificationClient)
    const formattedDate = format(new Date(returnDate), 'dd/MM/yyyy')
    const clientArcNumber = arcNumber || (activeNotificationClient as any).arcNumber || ''
    const body = NOTIFICATION_TEMPLATE(
      clientName,
      appealNumber,
      formattedDate,
      currentUser?.name || 'Admin',
      clientArcNumber
    )
    setSubject(`Administrative Court of International Protection Application No. ${appealNumber} between ${clientName} The Republic of Cyprus, the Asylum Service`)
    setNotificationBody(body)
    toast.success('Notification generated')
  }

  // Copy notification
  const copyNotification = async () => {
    if (!notificationBody) {
      toast.error('Nothing to copy')
      return
    }
    await navigator.clipboard.writeText(notificationBody)
    toast.success('Copied to clipboard')
  }

  // Download PDF with letterhead
  // Load logo for PDF
  const loadLogoForPDF = (): Promise<string | null> => {
    return new Promise((resolve) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = img.width
        canvas.height = img.height
        const ctx = canvas.getContext('2d')
        ctx?.drawImage(img, 0, 0)
        resolve(canvas.toDataURL('image/png'))
      }
      img.onerror = () => resolve(null)
      img.src = '/LLAW.png'
    })
  }

  const downloadPDF = async () => {
    if (!activeNotificationClient || !notificationBody) {
      toast.error('Please generate a notification first')
      return
    }

    // Load logo
    const logoData = await loadLogoForPDF()

    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    const margin = 20
    const contentWidth = pageWidth - 2 * margin
    let yPosition = 15

    // ===== LETTERHEAD WITH LOGOS =====
    const logoSize = 22

    // Add logos on both sides
    if (logoData) {
      // Left Logo
      doc.addImage(logoData, 'PNG', margin, yPosition, logoSize, logoSize)
      // Right Logo
      doc.addImage(logoData, 'PNG', pageWidth - margin - logoSize, yPosition, logoSize, logoSize)
    } else {
      // Fallback: Draw placeholder circles
      doc.setFillColor(139, 109, 59)
      doc.circle(margin + logoSize/2, yPosition + logoSize/2, logoSize/2, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text('LAW', margin + logoSize/2, yPosition + logoSize/2 + 1, { align: 'center' })

      doc.setFillColor(139, 109, 59)
      doc.circle(pageWidth - margin - logoSize/2, yPosition + logoSize/2, logoSize/2, 'F')
      doc.text('LAW', pageWidth - margin - logoSize/2, yPosition + logoSize/2 + 1, { align: 'center' })
    }

    // Company Name (centered between logos)
    doc.setTextColor(139, 109, 59) // Gold color
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('AL TAHER BENETIS & ASSOCIATES LLC', pageWidth / 2, yPosition + 8, { align: 'center' })

    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text('ATTORNEYS AT LAW', pageWidth / 2, yPosition + 14, { align: 'center' })

    yPosition += logoSize + 5

    // Address
    doc.setFontSize(8)
    doc.setTextColor(60, 60, 60)
    doc.text('Geogas Tower, Kallipoleos 3 - Office 302, Nicosia 1055, Cyprus', pageWidth / 2, yPosition, { align: 'center' })
    yPosition += 4
    doc.text('Tel: +35799989093 | Email: altaherbenetislaw@gmail.com', pageWidth / 2, yPosition, { align: 'center' })
    yPosition += 6

    // Horizontal line
    doc.setDrawColor(139, 109, 59)
    doc.setLineWidth(0.5)
    doc.line(margin, yPosition, pageWidth - margin, yPosition)
    yPosition += 12

    // ===== NOTIFICATION TITLE =====
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(0, 0, 0)
    doc.text('NOTIFICATION', pageWidth / 2, yPosition, { align: 'center' })
    yPosition += 12

    // ===== DATE & REFERENCE =====
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`Date: ${new Date().toLocaleDateString('en-GB')}`, margin, yPosition)
    yPosition += 6
    doc.text(`Reference: ${appealNumber}`, margin, yPosition)
    yPosition += 6
    if (arcNumber) {
      doc.text(`ARC No: ${arcNumber}`, margin, yPosition)
      yPosition += 6
    }
    yPosition += 6

    // ===== SUBJECT =====
    doc.setFont('helvetica', 'bold')
    doc.text('RE:', margin, yPosition)
    doc.setFont('helvetica', 'normal')
    const subjectLines = doc.splitTextToSize(subject, contentWidth - 10)
    doc.text(subjectLines, margin + 10, yPosition)
    yPosition += subjectLines.length * 5 + 10

    // ===== MESSAGE BODY =====
    doc.setFontSize(10)
    const messageLines = doc.splitTextToSize(notificationBody, contentWidth)
    doc.text(messageLines, margin, yPosition)
    yPosition += messageLines.length * 5 + 15

    // ===== SIGNATURE =====
    doc.setFont('helvetica', 'normal')
    doc.text('Best regards,', margin, yPosition)
    yPosition += 12
    doc.setFont('helvetica', 'bold')
    doc.text(currentUser?.name || 'Admin', margin, yPosition)
    yPosition += 5
    doc.setFont('helvetica', 'normal')
    doc.text('AL TAHER BENETIS & ASSOCIATES LLC', margin, yPosition)
    yPosition += 5
    doc.text('Attorneys at Law', margin, yPosition)

    // ===== FOOTER =====
    const footerY = 280
    doc.setDrawColor(139, 109, 59)
    doc.setLineWidth(0.3)
    doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5)
    doc.setFontSize(8)
    doc.setTextColor(100, 100, 100)
    doc.text('This document is issued by AL TAHER BENETIS & ASSOCIATES LLC.', pageWidth / 2, footerY, { align: 'center' })
    doc.text('Confidential and Privileged Communication.', pageWidth / 2, footerY + 4, { align: 'center' })

    // Get client name for filename
    const clientName = getClientDisplayName(activeNotificationClient).replace(/\s+/g, '_')

    // Save PDF
    doc.save(`Notification_${clientName}_${appealNumber.replace(/\//g, '-')}.pdf`)
    toast.success('PDF downloaded successfully')
  }

  // Save notification
  const saveNotification = () => {
    if (!activeNotificationClient || !notificationBody) {
      toast.error('Please generate a notification first')
      return
    }

    const notification: SavedNotification = {
      id: `notif-${Date.now()}`,
      caseId: selectedCase?.id || '',
      clientName: getClientDisplayName(activeNotificationClient),
      subject,
      body: notificationBody,
      channel,
      createdAt: new Date().toISOString(),
    }

    const updated = [...savedNotifications, notification]
    setSavedNotifications(updated)
    localStorage.setItem('asylum-notifications', JSON.stringify(updated))
    toast.success('Notification saved')
  }

  // Delete notification
  const deleteNotification = (id: string) => {
    const updated = savedNotifications.filter((n) => n.id !== id)
    setSavedNotifications(updated)
    localStorage.setItem('asylum-notifications', JSON.stringify(updated))
    toast.success('Notification deleted')
  }

  // Create payment reminder
  const createPaymentReminder = () => {
    if (!selectedCase || !paymentAmount || !paymentDueDate) {
      toast.error('Please select a case and fill in payment details')
      return
    }

    const reminder: PaymentReminder = {
      id: `pay-${Date.now()}`,
      caseId: selectedCase.id,
      clientName: selectedClient?.name || 'Unknown',
      amountDue: parseFloat(paymentAmount),
      dueDate: paymentDueDate,
      status: 'Pending',
      notes: paymentNotes,
      createdAt: new Date().toISOString(),
    }

    const updated = [...paymentReminders, reminder]
    setPaymentReminders(updated)
    localStorage.setItem('asylum-payments', JSON.stringify(updated))
    setPaymentAmount('')
    setPaymentDueDate('')
    setPaymentNotes('')
    toast.success('Payment reminder created')
  }

  // Update payment status
  const updatePaymentStatus = (id: string, status: 'Pending' | 'Sent' | 'Paid') => {
    const updated = paymentReminders.map((r) =>
      r.id === id ? { ...r, status } : r
    )
    setPaymentReminders(updated)
    localStorage.setItem('asylum-payments', JSON.stringify(updated))
    toast.success(`Status updated to ${status}`)
  }

  // Delete payment reminder
  const deletePaymentReminder = (id: string) => {
    const updated = paymentReminders.filter((r) => r.id !== id)
    setPaymentReminders(updated)
    localStorage.setItem('asylum-payments', JSON.stringify(updated))
    toast.success('Reminder deleted')
  }

  // Add new asylum client
  const handleAddClient = async () => {
    if (!newClient.firstName || !newClient.lastName || !newClient.email || !newClient.phone) {
      toast.error('Please fill in all required fields')
      return
    }

    setIsLoading(true)
    try {
      const name = [newClient.firstName, newClient.middleName, newClient.lastName]
        .filter(Boolean)
        .join(' ')

      await api.createClient({
        name,
        firstName: newClient.firstName,
        middleName: newClient.middleName,
        lastName: newClient.lastName,
        email: newClient.email,
        phone: newClient.phone,
        address: newClient.address,
        dateOfBirth: newClient.dateOfBirth,
        placeOfBirth: newClient.placeOfBirth,
        countryOfBirth: newClient.countryOfBirth,
        arcNumber: newClient.arcNumber,
        fileNumber: newClient.fileNumber,
        type: 'Individual',
        notes: `[Asylum Client] ${newClient.notes}`.trim(),
      })

      toast.success('Asylum client added successfully')
      setIsAddClientDialogOpen(false)
      setNewClient({
        firstName: '',
        middleName: '',
        lastName: '',
        email: '',
        phone: '',
        address: '',
        dateOfBirth: '',
        placeOfBirth: '',
        countryOfBirth: '',
        arcNumber: '',
        fileNumber: '',
        notes: '',
      })
      onRefresh()
    } catch (error: any) {
      toast.error(error.message || 'Failed to add client')
    } finally {
      setIsLoading(false)
    }
  }

  // Filter notifications for selected case
  const caseNotifications = savedNotifications.filter(
    (n) => n.caseId === selectedCaseId
  )

  // Filter reminders for selected case
  const caseReminders = paymentReminders.filter(
    (r) => r.caseId === selectedCaseId
  )

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Globe className="h-8 w-8" />
            Asylum & Immigration
          </h1>
          <p className="text-muted-foreground">
            Manage asylum clients, cases, notifications, and payments
          </p>
        </div>
        <Button onClick={() => setIsAddClientDialogOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Add Asylum Client
        </Button>
      </div>

      <Tabs defaultValue="cases" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="cases" className="gap-2">
            <Briefcase className="h-4 w-4" />
            Cases
          </TabsTrigger>
          <TabsTrigger value="clients" className="gap-2">
            <UserPlus className="h-4 w-4" />
            Clients
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="payments" className="gap-2">
            <DollarSign className="h-4 w-4" />
            Payments
          </TabsTrigger>
        </TabsList>

        {/* Cases Tab */}
        <TabsContent value="cases" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Asylum Cases Overview</CardTitle>
              <CardDescription>View and manage all asylum/immigration cases</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {asylumCases.length === 0 ? (
                <div className="text-center py-8">
                  <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
                  <p className="text-lg font-medium">No asylum cases found</p>
                  <p className="text-sm text-muted-foreground">
                    Create an asylum case from the Cases section (set type to "Asylum")
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label>Select Case</Label>
                    <Select value={selectedCaseId} onValueChange={handleCaseSelect}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a case" />
                      </SelectTrigger>
                      <SelectContent>
                        {asylumCases.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.title} - {c.caseNumber}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedCase && (
                    <div className="grid gap-4 md:grid-cols-2 rounded-lg bg-amber-900 p-4 text-white">
                      <div>
                        <p className="text-sm text-amber-200">Client</p>
                        <p className="font-semibold">{getClientDisplayName(selectedClient)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-amber-200">Status</p>
                        <Badge className="bg-amber-600">{selectedCase.status}</Badge>
                      </div>
                      <div>
                        <p className="text-sm text-amber-200">Case Number</p>
                        <p className="font-semibold">{selectedCase.caseNumber}</p>
                      </div>
                      <div>
                        <p className="text-sm text-amber-200">Type</p>
                        <p className="font-semibold">{selectedCase.type}</p>
                      </div>
                      {(selectedClient as any)?.arcNumber && (
                        <div>
                          <p className="text-sm text-amber-200">ARC Number</p>
                          <p className="font-semibold">{(selectedClient as any).arcNumber}</p>
                        </div>
                      )}
                      {(selectedClient as any)?.fileNumber && (
                        <div>
                          <p className="text-sm text-amber-200">File Number</p>
                          <p className="font-semibold">{(selectedClient as any).fileNumber}</p>
                        </div>
                      )}
                    </div>
                  )}

                  <Separator />

                  <div className="space-y-2">
                    {asylumCases.map((c) => {
                      const client = clients.find((cl) => cl.id === c.clientId)
                      return (
                        <Card
                          key={c.id}
                          className={`cursor-pointer transition-all ${
                            c.id === selectedCaseId ? 'ring-2 ring-primary' : ''
                          }`}
                          onClick={() => handleCaseSelect(c.id)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium">{c.title}</p>
                                <p className="text-sm text-muted-foreground">
                                  {getClientDisplayName(client)} • {c.caseNumber}
                                </p>
                              </div>
                              <Badge variant={c.status === 'Open' ? 'default' : 'secondary'}>
                                {c.status}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Clients Tab */}
        <TabsContent value="clients" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Asylum/Immigration Clients</CardTitle>
              <CardDescription>Clients associated with asylum cases</CardDescription>
            </CardHeader>
            <CardContent>
              {asylumClients.length === 0 ? (
                <div className="text-center py-8">
                  <UserPlus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No asylum clients yet</p>
                  <Button
                    variant="link"
                    onClick={() => setIsAddClientDialogOpen(true)}
                  >
                    Add your first asylum client
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {asylumClients.map((client: any) => (
                    <Card key={client.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">
                              {client.firstName
                                ? `${client.firstName} ${client.middleName || ''} ${client.lastName}`.trim()
                                : client.name
                              }
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {client.email} • {client.phone}
                            </p>
                            {(client.arcNumber || client.fileNumber) && (
                              <p className="text-sm text-muted-foreground">
                                {client.arcNumber && <span className="mr-3">ARC: {client.arcNumber}</span>}
                                {client.fileNumber && <span>File: {client.fileNumber}</span>}
                              </p>
                            )}
                            {client.countryOfBirth && (
                              <p className="text-sm text-muted-foreground flex items-center gap-1">
                                <Globe className="h-3 w-3" />
                                {client.countryOfBirth}
                              </p>
                            )}
                          </div>
                          <Badge variant="secondary">{client.type}</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Compose Notification</CardTitle>
              <CardDescription>Send updates to clients regarding their asylum case</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Client Selection */}
              <div className="space-y-2">
                <Label>Select Client *</Label>
                <Select value={selectedClientId} onValueChange={handleClientSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {getClientDisplayName(client)}
                        {(client as any).arcNumber && ` (ARC: ${(client as any).arcNumber})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {activeNotificationClient && (
                <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                  <h4 className="font-medium mb-2">Client Profile</h4>
                  <div className="grid gap-2 md:grid-cols-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">Name:</span>
                      <span className="ml-2 font-medium">{getClientDisplayName(activeNotificationClient)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Email:</span>
                      <span className="ml-2">{activeNotificationClient.email}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Phone:</span>
                      <span className="ml-2">{activeNotificationClient.phone}</span>
                    </div>
                    {(activeNotificationClient as any).dateOfBirth && (
                      <div>
                        <span className="text-muted-foreground">D.O.B:</span>
                        <span className="ml-2">{(activeNotificationClient as any).dateOfBirth}</span>
                      </div>
                    )}
                    {(activeNotificationClient as any).countryOfBirth && (
                      <div>
                        <span className="text-muted-foreground">Country:</span>
                        <span className="ml-2">{(activeNotificationClient as any).countryOfBirth}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>ARC Number {arcNumber && <span className="text-xs text-muted-foreground">(from profile)</span>}</Label>
                  <Input
                    value={arcNumber}
                    onChange={(e) => setArcNumber(e.target.value)}
                    placeholder="e.g., 0581852366"
                  />
                </div>
                <div className="space-y-2">
                  <Label>File Number {fileNumber && <span className="text-xs text-muted-foreground">(from profile)</span>}</Label>
                  <Input
                    value={fileNumber}
                    onChange={(e) => setFileNumber(e.target.value)}
                    placeholder="e.g., FILE-2024-001"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Appeal Number *</Label>
                  <Input
                    value={appealNumber}
                    onChange={(e) => setAppealNumber(e.target.value)}
                    placeholder="e.g., 2271/25"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Return Date *</Label>
                  <Input
                    type="date"
                    value={returnDate}
                    onChange={(e) => setReturnDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Delivery Channel</Label>
                <Select value={channel} onValueChange={(v) => setChannel(v as typeof channel)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Email">Email</SelectItem>
                    <SelectItem value="SMS">SMS</SelectItem>
                    <SelectItem value="Phone">Phone</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Subject</Label>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Enter subject"
                />
              </div>

              <div className="space-y-2">
                <Label>Message</Label>
                <Textarea
                  rows={10}
                  value={notificationBody}
                  onChange={(e) => setNotificationBody(e.target.value)}
                  placeholder="Fill in the Appeal Number and Return Date, then click 'Generate Notification'"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <Button onClick={generateNotification} disabled={!selectedClientId}>
                  <FileText className="mr-2 h-4 w-4" />
                  Generate Notification
                </Button>
                <Button onClick={copyNotification} variant="outline" disabled={!notificationBody}>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy
                </Button>
                <Button onClick={downloadPDF} variant="outline" disabled={!notificationBody}>
                  <Download className="mr-2 h-4 w-4" />
                  Download PDF
                </Button>
                <Button onClick={saveNotification} variant="outline" disabled={!notificationBody}>
                  <Save className="mr-2 h-4 w-4" />
                  Save
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notification History</CardTitle>
            </CardHeader>
            <CardContent>
              {caseNotifications.length === 0 ? (
                <p className="text-sm text-muted-foreground">No notifications saved for this case</p>
              ) : (
                <div className="space-y-2">
                  {caseNotifications.map((n) => (
                    <Card key={n.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{n.subject}</p>
                            <p className="text-sm text-muted-foreground">
                              {n.clientName} • {n.channel} • {format(new Date(n.createdAt), 'MMM d, yyyy')}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteNotification(n.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Create Payment Reminder</CardTitle>
              <CardDescription>Create payment reminders for clients</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!selectedCaseId && (
                <div className="p-4 bg-amber-100 dark:bg-amber-900/20 rounded-lg text-amber-800 dark:text-amber-200 text-sm">
                  Please select a case from the Cases tab first
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Amount ($)</Label>
                  <Input
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Due Date</Label>
                  <Input
                    type="date"
                    value={paymentDueDate}
                    onChange={(e) => setPaymentDueDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  rows={3}
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="Additional notes about this payment"
                />
              </div>

              <Button onClick={createPaymentReminder} disabled={!selectedCaseId}>
                <DollarSign className="mr-2 h-4 w-4" />
                Create Reminder
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment Reminders</CardTitle>
            </CardHeader>
            <CardContent>
              {caseReminders.length === 0 ? (
                <p className="text-sm text-muted-foreground">No payment reminders for this case</p>
              ) : (
                <div className="space-y-2">
                  {caseReminders.map((r) => (
                    <Card key={r.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">${r.amountDue.toFixed(2)}</p>
                            <p className="text-sm text-muted-foreground">
                              Due: {format(new Date(r.dueDate), 'MMM d, yyyy')}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Select
                              value={r.status}
                              onValueChange={(v) => updatePaymentStatus(r.id, v as typeof r.status)}
                            >
                              <SelectTrigger className="w-28">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Pending">Pending</SelectItem>
                                <SelectItem value="Sent">Sent</SelectItem>
                                <SelectItem value="Paid">Paid</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deletePaymentReminder(r.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Privacy Notice */}
      <Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/20">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            <div>
              <CardTitle className="text-amber-900 dark:text-amber-100">Privacy Notice</CardTitle>
              <CardDescription className="text-amber-800 dark:text-amber-200">
                Ensure all communications comply with client confidentiality requirements
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Add Client Dialog */}
      <Dialog open={isAddClientDialogOpen} onOpenChange={setIsAddClientDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Asylum/Immigration Client</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>First Name *</Label>
                <Input
                  value={newClient.firstName}
                  onChange={(e) => setNewClient({ ...newClient, firstName: e.target.value })}
                  placeholder="John"
                />
              </div>
              <div className="space-y-2">
                <Label>Middle Name</Label>
                <Input
                  value={newClient.middleName}
                  onChange={(e) => setNewClient({ ...newClient, middleName: e.target.value })}
                  placeholder="William"
                />
              </div>
              <div className="space-y-2">
                <Label>Last Name *</Label>
                <Input
                  value={newClient.lastName}
                  onChange={(e) => setNewClient({ ...newClient, lastName: e.target.value })}
                  placeholder="Doe"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={newClient.email}
                  onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                  placeholder="client@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Phone *</Label>
                <Input
                  value={newClient.phone}
                  onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
                  placeholder="+1 (555) 000-0000"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Date of Birth</Label>
              <Input
                type="date"
                value={newClient.dateOfBirth}
                onChange={(e) => setNewClient({ ...newClient, dateOfBirth: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Place of Birth</Label>
              <Input
                value={newClient.placeOfBirth}
                onChange={(e) => setNewClient({ ...newClient, placeOfBirth: e.target.value })}
                placeholder="City, State"
              />
            </div>

            <div className="space-y-2">
              <Label>Country of Birth</Label>
              <Select
                value={newClient.countryOfBirth}
                onValueChange={(v) => setNewClient({ ...newClient, countryOfBirth: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent className="max-h-[200px]">
                  {countries.map((country) => (
                    <SelectItem key={country} value={country}>
                      {country}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>ARC Number</Label>
                <Input
                  value={newClient.arcNumber}
                  onChange={(e) => setNewClient({ ...newClient, arcNumber: e.target.value })}
                  placeholder="e.g., ARC-2024-001"
                />
              </div>
              <div className="space-y-2">
                <Label>File Number</Label>
                <Input
                  value={newClient.fileNumber}
                  onChange={(e) => setNewClient({ ...newClient, fileNumber: e.target.value })}
                  placeholder="e.g., FILE-2024-001"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Address</Label>
              <Input
                value={newClient.address}
                onChange={(e) => setNewClient({ ...newClient, address: e.target.value })}
                placeholder="123 Main St, City, State"
              />
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                rows={3}
                value={newClient.notes}
                onChange={(e) => setNewClient({ ...newClient, notes: e.target.value })}
                placeholder="Additional notes about this client..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddClientDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddClient} disabled={isLoading}>
              {isLoading ? 'Adding...' : 'Add Client'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

