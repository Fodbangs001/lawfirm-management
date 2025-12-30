import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { Case, Client, User } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Plus, Search, Edit, Trash2, Briefcase, FileText, FileDown, MoreVertical, RotateCcw, Trash, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { exportToExcel, formatCasesForExport } from '@/lib/excel-export'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface CasesPageProps {
  cases: Case[]
  clients: Client[]
  users: User[]
  onRefresh: () => void
}

const statusColors: Record<string, string> = {
  Open: 'bg-green-500/10 text-green-600',
  Pending: 'bg-yellow-500/10 text-yellow-600',
  Closed: 'bg-gray-500/10 text-gray-600',
  'On Hold': 'bg-orange-500/10 text-orange-600',
}

export function CasesPage({ cases, clients, users, onRefresh }: CasesPageProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCase, setEditingCase] = useState<Case | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [isLoading, setIsLoading] = useState(false)
  const [showTrash, setShowTrash] = useState(false)
  const [deletedCases, setDeletedCases] = useState<Case[]>([])
  const [isTrashLoading, setIsTrashLoading] = useState(false)

  // Load deleted cases when trash view is opened
  useEffect(() => {
    if (showTrash) {
      loadDeletedCases()
    }
  }, [showTrash])

  const loadDeletedCases = async () => {
    setIsTrashLoading(true)
    try {
      const deleted = await api.getDeletedCases()
      setDeletedCases(deleted)
    } catch (error) {
      toast.error('Failed to load deleted cases')
    } finally {
      setIsTrashLoading(false)
    }
  }

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    caseNumber: '',
    type: 'General' as 'General' | 'Asylum',
    status: 'Open' as 'Open' | 'Pending' | 'Closed' | 'On Hold',
    clientId: '',
    description: '',
    assignedTo: [] as string[],
  })

  const filteredCases = cases.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.caseNumber.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getClientName = (clientId: string) => {
    const client = clients.find((c) => c.id === clientId)
    return client?.name || 'Unknown Client'
  }

  const openCreateDialog = () => {
    setEditingCase(null)
    setFormData({
      title: '',
      caseNumber: `CASE-${Date.now().toString().slice(-6)}`,
      type: 'General',
      status: 'Open',
      clientId: '',
      description: '',
      assignedTo: [],
    })
    setIsDialogOpen(true)
  }

  const openEditDialog = (caseItem: Case) => {
    setEditingCase(caseItem)
    setFormData({
      title: caseItem.title,
      caseNumber: caseItem.caseNumber,
      type: caseItem.type,
      status: caseItem.status,
      clientId: caseItem.clientId,
      description: caseItem.description || '',
      assignedTo: caseItem.assignedTo || [],
    })
    setIsDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (editingCase) {
        await api.updateCase(editingCase.id, formData)
        toast.success('Case updated successfully')
      } else {
        await api.createCase(formData)
        toast.success('Case created successfully')
      }
      setIsDialogOpen(false)
      onRefresh()
    } catch (error: any) {
      toast.error(error.message || 'Operation failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (caseItem: Case) => {
    if (!confirm(`Are you sure you want to delete "${caseItem.title}"? It will be moved to trash for 30 days.`)) return

    try {
      await api.deleteCase(caseItem.id)
      toast.success('Case moved to trash. You can restore it within 30 days.')
      onRefresh()
    } catch (error: any) {
      toast.error(error.message || 'Delete failed')
    }
  }

  const handleRestore = async (caseItem: Case) => {
    try {
      await api.restoreCase(caseItem.id)
      toast.success('Case restored successfully')
      loadDeletedCases()
      onRefresh()
    } catch (error: any) {
      toast.error(error.message || 'Restore failed')
    }
  }

  const handlePermanentDelete = async (caseItem: Case) => {
    if (!confirm(`Are you sure you want to permanently delete "${caseItem.title}"? This action cannot be undone!`)) return

    try {
      await api.permanentDeleteCase(caseItem.id)
      toast.success('Case permanently deleted')
      loadDeletedCases()
    } catch (error: any) {
      toast.error(error.message || 'Delete failed')
    }
  }

  // Calculate days remaining for deleted case
  const getDaysRemaining = (deletedAt: string) => {
    const deleted = new Date(deletedAt)
    const expiry = new Date(deleted)
    expiry.setDate(expiry.getDate() + 30)
    const now = new Date()
    const diffTime = expiry.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return Math.max(0, diffDays)
  }

  // Export cases to Excel
  const handleExportCases = () => {
    try {
      if (cases.length === 0) {
        toast.error('No cases to export')
        return
      }
      const exportData = formatCasesForExport(cases, clients)
      exportToExcel(exportData, `Cases_${new Date().toISOString().split('T')[0]}`, 'Cases')
      toast.success('Cases exported to Excel')
    } catch (error) {
      toast.error('Failed to export cases')
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{showTrash ? 'Deleted Cases' : 'Cases'}</h1>
          <p className="text-muted-foreground">
            {showTrash ? 'Restore or permanently delete cases (auto-deleted after 30 days)' : 'Manage your legal cases'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant={showTrash ? "default" : "outline"} 
            onClick={() => setShowTrash(!showTrash)}
          >
            {showTrash ? (
              <>
                <Briefcase className="mr-2 h-4 w-4" />
                View Active Cases
              </>
            ) : (
              <>
                <Trash className="mr-2 h-4 w-4" />
                View Trash ({deletedCases.length || '...'})
              </>
            )}
          </Button>
          {!showTrash && (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleExportCases}>
                    <FileDown className="h-4 w-4 mr-2" />
                    Export to Excel
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button onClick={openCreateDialog}>
                <Plus className="mr-2 h-4 w-4" />
                Add Case
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Trash View */}
      {showTrash ? (
        <div className="space-y-4">
          {isTrashLoading ? (
            <div className="text-center py-12 text-muted-foreground">Loading deleted cases...</div>
          ) : deletedCases.length === 0 ? (
            <Card className="p-12 text-center">
              <Trash className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">Trash is empty</h3>
              <p className="text-muted-foreground">Deleted cases will appear here for 30 days before being permanently removed.</p>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {deletedCases.map((caseItem: any) => (
                <Card key={caseItem.id} className="hover:shadow-lg transition-shadow border-destructive/30">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-destructive/10">
                          <Briefcase className="h-5 w-5 text-destructive" />
                        </div>
                        <div>
                          <CardTitle className="text-base line-through opacity-70">{caseItem.title}</CardTitle>
                          <p className="text-sm text-muted-foreground">{caseItem.caseNumber}</p>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 text-sm text-amber-500 mb-3">
                      <Clock className="h-4 w-4" />
                      <span>{getDaysRemaining(caseItem.deletedAt)} days remaining</span>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => handleRestore(caseItem)}>
                        <RotateCcw className="h-4 w-4 mr-1" />
                        Restore
                      </Button>
                      <Button size="sm" variant="destructive" className="flex-1" onClick={() => handlePermanentDelete(caseItem)}>
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete Forever
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Search and Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search cases..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="Open">Open</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="Closed">Closed</SelectItem>
            <SelectItem value="On Hold">On Hold</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Case List */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredCases.map((caseItem) => (
          <Card key={caseItem.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-primary/10">
                    <Briefcase className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate">{caseItem.title}</CardTitle>
                    <p className="text-sm text-muted-foreground">{caseItem.caseNumber}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEditDialog(caseItem)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(caseItem)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      statusColors[caseItem.status] || ''
                    }`}
                  >
                    {caseItem.status}
                  </span>
                  <span className="px-2 py-1 bg-secondary rounded-full text-xs">
                    {caseItem.type}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  {getClientName(caseItem.clientId)}
                </p>
                {caseItem.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {caseItem.description}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredCases.length === 0 && (
          <div className="col-span-full text-center py-12">
            <p className="text-muted-foreground">No cases found</p>
            <Button variant="link" onClick={openCreateDialog}>
              Create your first case
            </Button>
          </div>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingCase ? 'Edit Case' : 'Add New Case'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter case title"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="caseNumber">Case Number *</Label>
                <Input
                  id="caseNumber"
                  value={formData.caseNumber}
                  onChange={(e) => setFormData({ ...formData, caseNumber: e.target.value })}
                  placeholder="CASE-001"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Type *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: 'General' | 'Asylum') =>
                    setFormData({ ...formData, type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="General">General</SelectItem>
                    <SelectItem value="Asylum">Asylum</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: 'Open' | 'Pending' | 'Closed' | 'On Hold') =>
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Open">Open</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Closed">Closed</SelectItem>
                    <SelectItem value="On Hold">On Hold</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="clientId">Client *</Label>
                <Select
                  value={formData.clientId}
                  onValueChange={(value) => setFormData({ ...formData, clientId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Case description..."
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Saving...' : editingCase ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      </>
      )}
    </div>
  )
}

