import { useState, useMemo } from 'react'
import { Client, Case, CourtLog } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Calendar,
  Plus,
  Bell,
  Trash2,
  Edit,
  Clock,
  AlertTriangle,
  Building2,
  User,
  Briefcase,
  FileDown,
  MoreVertical,
} from 'lucide-react'
import { toast } from 'sonner'
import { format, differenceInDays, addDays } from 'date-fns'
import { exportToExcel, formatCourtLogsForExport } from '@/lib/excel-export'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface CourtLogPageProps {
  clients: Client[]
  cases: Case[]
}

export function CourtLogPage({ clients, cases }: CourtLogPageProps) {
  const [courtLogs, setCourtLogs] = useState<CourtLog[]>(() => {
    const saved = localStorage.getItem('court-logs')
    return saved ? JSON.parse(saved) : []
  })

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingLog, setEditingLog] = useState<CourtLog | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')

  const [formData, setFormData] = useState({
    clientId: '',
    caseId: '',
    courtDate: '',
    courtTime: '',
    courtName: '',
    courtAddress: '',
    judgeOrPanel: '',
    purpose: '',
    notes: '',
    reminderEnabled: true,
    reminderDaysBefore: 3,
    status: 'Scheduled' as CourtLog['status'],
  })

  // Get client name by ID
  const getClientName = (clientId: string) => {
    const client = clients.find(c => c.id === clientId)
    if (!client) return 'Unknown Client'
    return client.firstName
      ? `${client.firstName} ${client.middleName || ''} ${client.lastName}`.trim()
      : client.name
  }

  // Get case by ID
  const getCaseNumber = (caseId: string) => {
    const caseItem = cases.find(c => c.id === caseId)
    return caseItem?.caseNumber || ''
  }

  // Filter and sort court logs
  const filteredLogs = useMemo(() => {
    return courtLogs
      .filter(log => {
        const matchesStatus = filterStatus === 'all' || log.status === filterStatus
        const matchesSearch =
          log.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.courtName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (log.caseNumber?.toLowerCase().includes(searchTerm.toLowerCase()))
        return matchesStatus && matchesSearch
      })
      .sort((a, b) => new Date(a.courtDate).getTime() - new Date(b.courtDate).getTime())
  }, [courtLogs, filterStatus, searchTerm])

  // Upcoming court dates (next 7 days)
  const upcomingDates = useMemo(() => {
    const today = new Date()
    const nextWeek = addDays(today, 7)
    return courtLogs.filter(log => {
      const courtDate = new Date(log.courtDate)
      return log.status === 'Scheduled' && courtDate >= today && courtDate <= nextWeek
    })
  }, [courtLogs])

  // Save to localStorage
  const saveLogs = (logs: CourtLog[]) => {
    setCourtLogs(logs)
    localStorage.setItem('court-logs', JSON.stringify(logs))
  }

  const openCreateDialog = () => {
    setEditingLog(null)
    setFormData({
      clientId: '',
      caseId: '',
      courtDate: '',
      courtTime: '',
      courtName: '',
      courtAddress: '',
      judgeOrPanel: '',
      purpose: '',
      notes: '',
      reminderEnabled: true,
      reminderDaysBefore: 3,
      status: 'Scheduled',
    })
    setIsDialogOpen(true)
  }

  const openEditDialog = (log: CourtLog) => {
    setEditingLog(log)
    setFormData({
      clientId: log.clientId,
      caseId: log.caseId || '',
      courtDate: log.courtDate,
      courtTime: log.courtTime,
      courtName: log.courtName,
      courtAddress: log.courtAddress || '',
      judgeOrPanel: log.judgeOrPanel || '',
      purpose: log.purpose,
      notes: log.notes || '',
      reminderEnabled: log.reminderEnabled,
      reminderDaysBefore: log.reminderDaysBefore,
      status: log.status,
    })
    setIsDialogOpen(true)
  }

  const handleSubmit = () => {
    if (!formData.clientId || !formData.courtDate || !formData.courtTime || !formData.courtName || !formData.purpose) {
      toast.error('Please fill in all required fields')
      return
    }

    const now = new Date().toISOString()
    const clientName = getClientName(formData.clientId)
    const caseNumber = formData.caseId ? getCaseNumber(formData.caseId) : undefined

    if (editingLog) {
      // Update existing
      const updated = courtLogs.map(log =>
        log.id === editingLog.id
          ? {
              ...log,
              ...formData,
              clientName,
              caseNumber,
              updatedAt: now,
            }
          : log
      )
      saveLogs(updated)
      toast.success('Court log updated successfully')
    } else {
      // Create new
      const newLog: CourtLog = {
        id: `court-${Date.now()}`,
        ...formData,
        clientName,
        caseNumber,
        reminderSentToLawyer: false,
        reminderSentToClient: false,
        createdAt: now,
        updatedAt: now,
      }
      saveLogs([...courtLogs, newLog])
      toast.success('Court date scheduled successfully')
    }

    setIsDialogOpen(false)
  }

  const handleDelete = (id: string) => {
    if (!confirm('Are you sure you want to delete this court log?')) return
    saveLogs(courtLogs.filter(log => log.id !== id))
    toast.success('Court log deleted')
  }

  const handleStatusChange = (id: string, status: CourtLog['status']) => {
    const updated = courtLogs.map(log =>
      log.id === id ? { ...log, status, updatedAt: new Date().toISOString() } : log
    )
    saveLogs(updated)
    toast.success(`Status updated to ${status}`)
  }

  const sendReminder = (log: CourtLog, to: 'lawyer' | 'client') => {
    const updated = courtLogs.map(l =>
      l.id === log.id
        ? {
            ...l,
            reminderSentToLawyer: to === 'lawyer' ? true : l.reminderSentToLawyer,
            reminderSentToClient: to === 'client' ? true : l.reminderSentToClient,
          }
        : l
    )
    saveLogs(updated)
    toast.success(`Reminder sent to ${to}`)
  }


  const getDaysUntil = (dateStr: string) => {
    const date = new Date(dateStr)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    date.setHours(0, 0, 0, 0)
    return differenceInDays(date, today)
  }

  // Get cases for selected client
  const clientCases = useMemo(() => {
    if (!formData.clientId) return []
    return cases.filter(c => c.clientId === formData.clientId)
  }, [formData.clientId, cases])

  // Export court logs to Excel
  const handleExportCourtLogs = () => {
    try {
      if (courtLogs.length === 0) {
        toast.error('No court logs to export')
        return
      }
      const exportData = formatCourtLogsForExport(courtLogs)
      exportToExcel(exportData, `Court_Logs_${new Date().toISOString().split('T')[0]}`, 'Court Logs')
      toast.success('Court logs exported to Excel')
    } catch (error) {
      toast.error('Failed to export court logs')
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold flex items-center gap-3">
            <Calendar className="h-8 w-8 text-primary" />
            Court Log
          </h1>
          <p className="text-muted-foreground">Track court dates and set reminders for lawyers and clients</p>
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExportCourtLogs}>
                <FileDown className="h-4 w-4 mr-2" />
                Export to Excel
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Schedule Court Date
          </Button>
        </div>
      </div>

      {/* Upcoming Court Dates Alert */}
      {upcomingDates.length > 0 && (
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
              <AlertTriangle className="h-5 w-5" />
              Upcoming Court Dates ({upcomingDates.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {upcomingDates.map(log => {
                const daysUntil = getDaysUntil(log.courtDate)
                return (
                  <div key={log.id} className="flex items-center justify-between p-2 rounded bg-amber-100 dark:bg-amber-900/30">
                    <div>
                      <span className="font-medium text-amber-900 dark:text-amber-100">{log.clientName}</span>
                      <span className="text-amber-700 dark:text-amber-300 mx-2">•</span>
                      <span className="text-amber-700 dark:text-amber-300">{log.courtName}</span>
                      <span className="text-amber-700 dark:text-amber-300 mx-2">•</span>
                      <span className="text-amber-700 dark:text-amber-300">
                        {format(new Date(log.courtDate), 'MMM dd, yyyy')} at {log.courtTime}
                      </span>
                    </div>
                    <Badge className={daysUntil === 0 ? 'bg-red-500' : daysUntil <= 2 ? 'bg-amber-500' : 'bg-blue-500'}>
                      {daysUntil === 0 ? 'Today!' : daysUntil === 1 ? 'Tomorrow' : `${daysUntil} days`}
                    </Badge>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="flex-1">
          <Input
            placeholder="Search by client name, court, or case number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="Scheduled">Scheduled</SelectItem>
            <SelectItem value="Completed">Completed</SelectItem>
            <SelectItem value="Postponed">Postponed</SelectItem>
            <SelectItem value="Cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Court Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Court Schedule</CardTitle>
          <CardDescription>All scheduled court appearances</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No court dates scheduled</p>
              <Button variant="link" onClick={openCreateDialog}>
                Schedule your first court date
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Case</TableHead>
                  <TableHead>Court Date</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Court</TableHead>
                  <TableHead>Purpose</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reminders</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map(log => {
                  const daysUntil = getDaysUntil(log.courtDate)
                  const isOverdue = daysUntil < 0 && log.status === 'Scheduled'

                  return (
                    <TableRow key={log.id} className={isOverdue ? 'bg-red-50 dark:bg-red-950/20' : ''}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{log.clientName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {log.caseNumber ? (
                          <div className="flex items-center gap-2">
                            <Briefcase className="h-4 w-4 text-muted-foreground" />
                            {log.caseNumber}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {format(new Date(log.courtDate), 'MMM dd, yyyy')}
                          {daysUntil >= 0 && log.status === 'Scheduled' && (
                            <Badge variant="outline" className="text-xs">
                              {daysUntil === 0 ? 'Today' : daysUntil === 1 ? 'Tomorrow' : `${daysUntil}d`}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          {log.courtTime}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          {log.courtName}
                        </div>
                      </TableCell>
                      <TableCell>{log.purpose}</TableCell>
                      <TableCell>
                        <Select
                          value={log.status}
                          onValueChange={(v) => handleStatusChange(log.id, v as CourtLog['status'])}
                        >
                          <SelectTrigger className="w-28">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Scheduled">Scheduled</SelectItem>
                            <SelectItem value="Completed">Completed</SelectItem>
                            <SelectItem value="Postponed">Postponed</SelectItem>
                            <SelectItem value="Cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant={log.reminderSentToLawyer ? 'secondary' : 'outline'}
                            onClick={() => sendReminder(log, 'lawyer')}
                            title="Send reminder to lawyer"
                          >
                            <Bell className="h-3 w-3 mr-1" />
                            L
                          </Button>
                          <Button
                            size="sm"
                            variant={log.reminderSentToClient ? 'secondary' : 'outline'}
                            onClick={() => sendReminder(log, 'client')}
                            title="Send reminder to client"
                          >
                            <Bell className="h-3 w-3 mr-1" />
                            C
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="ghost" onClick={() => openEditDialog(log)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleDelete(log.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingLog ? 'Edit Court Date' : 'Schedule Court Date'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Client *</Label>
              <Select
                value={formData.clientId}
                onValueChange={(v) => setFormData({ ...formData, clientId: v, caseId: '' })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map(client => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.firstName
                        ? `${client.firstName} ${client.lastName}`
                        : client.name
                      }
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formData.clientId && clientCases.length > 0 && (
              <div className="space-y-2">
                <Label>Related Case (Optional)</Label>
                <Select
                  value={formData.caseId}
                  onValueChange={(v) => setFormData({ ...formData, caseId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select case" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No case linked</SelectItem>
                    {clientCases.map(caseItem => (
                      <SelectItem key={caseItem.id} value={caseItem.id}>
                        {caseItem.caseNumber} - {caseItem.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Court Date *</Label>
                <Input
                  type="date"
                  value={formData.courtDate}
                  onChange={(e) => setFormData({ ...formData, courtDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Court Time *</Label>
                <Input
                  type="time"
                  value={formData.courtTime}
                  onChange={(e) => setFormData({ ...formData, courtTime: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Court Name *</Label>
              <Input
                value={formData.courtName}
                onChange={(e) => setFormData({ ...formData, courtName: e.target.value })}
                placeholder="e.g., Administrative Court of International Protection"
              />
            </div>

            <div className="space-y-2">
              <Label>Court Address</Label>
              <Input
                value={formData.courtAddress}
                onChange={(e) => setFormData({ ...formData, courtAddress: e.target.value })}
                placeholder="Court address"
              />
            </div>

            <div className="space-y-2">
              <Label>Judge / Panel</Label>
              <Input
                value={formData.judgeOrPanel}
                onChange={(e) => setFormData({ ...formData, judgeOrPanel: e.target.value })}
                placeholder="Judge name or panel"
              />
            </div>

            <div className="space-y-2">
              <Label>Purpose *</Label>
              <Input
                value={formData.purpose}
                onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                placeholder="e.g., Initial Hearing, Appeal, Final Decision"
              />
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes..."
                rows={3}
              />
            </div>

            <div className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable Reminders</Label>
                  <p className="text-sm text-muted-foreground">Send reminders before court date</p>
                </div>
                <Switch
                  checked={formData.reminderEnabled}
                  onCheckedChange={(v) => setFormData({ ...formData, reminderEnabled: v })}
                />
              </div>

              {formData.reminderEnabled && (
                <div className="space-y-2">
                  <Label>Remind days before</Label>
                  <Select
                    value={formData.reminderDaysBefore.toString()}
                    onValueChange={(v) => setFormData({ ...formData, reminderDaysBefore: parseInt(v) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 day before</SelectItem>
                      <SelectItem value="2">2 days before</SelectItem>
                      <SelectItem value="3">3 days before</SelectItem>
                      <SelectItem value="5">5 days before</SelectItem>
                      <SelectItem value="7">1 week before</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {editingLog && (
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(v) => setFormData({ ...formData, status: v as CourtLog['status'] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Scheduled">Scheduled</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="Postponed">Postponed</SelectItem>
                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              {editingLog ? 'Update' : 'Schedule'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

