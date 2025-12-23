import { useState } from 'react'
import { api } from '@/lib/api'
import { Client } from '@/lib/types'
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
import { Plus, Search, Edit, Trash2, User, Building, Calendar, MapPin, Globe, FileDown, MoreVertical } from 'lucide-react'
import { toast } from 'sonner'
import { countries } from '@/lib/countries'
import { exportToExcel, formatClientsForExport } from '@/lib/excel-export'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface ClientsPageProps {
  clients: Client[]
  onRefresh: () => void
}

export function ClientsPage({ clients, onRefresh }: ClientsPageProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    // Individual fields
    firstName: '',
    middleName: '',
    lastName: '',
    dateOfBirth: '',
    placeOfBirth: '',
    countryOfBirth: '',
    // Corporate field
    companyName: '',
    // Common fields
    email: '',
    phone: '',
    address: '',
    type: 'Individual' as 'Individual' | 'Corporate',
    notes: '',
  })

  // Helper to get display name
  const getDisplayName = (client: any) => {
    if (client.type === 'Corporate') {
      return client.companyName || client.name
    }
    const parts = [client.firstName, client.middleName, client.lastName].filter(Boolean)
    return parts.length > 0 ? parts.join(' ') : client.name
  }

  const filteredClients = clients.filter(
    (client) => {
      const displayName = getDisplayName(client)
      return displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email.toLowerCase().includes(searchTerm.toLowerCase())
    }
  )

  const openCreateDialog = () => {
    setEditingClient(null)
    setFormData({
      firstName: '',
      middleName: '',
      lastName: '',
      dateOfBirth: '',
      placeOfBirth: '',
      countryOfBirth: '',
      companyName: '',
      email: '',
      phone: '',
      address: '',
      type: 'Individual',
      notes: '',
    })
    setIsDialogOpen(true)
  }

  const openEditDialog = (client: any) => {
    setEditingClient(client)
    setFormData({
      firstName: client.firstName || '',
      middleName: client.middleName || '',
      lastName: client.lastName || '',
      dateOfBirth: client.dateOfBirth || '',
      placeOfBirth: client.placeOfBirth || '',
      countryOfBirth: client.countryOfBirth || '',
      companyName: client.companyName || client.name || '',
      email: client.email,
      phone: client.phone,
      address: client.address || '',
      type: client.type,
      notes: client.notes || '',
    })
    setIsDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Build the name field based on type
      let name = ''
      if (formData.type === 'Individual') {
        name = [formData.firstName, formData.middleName, formData.lastName]
          .filter(Boolean)
          .join(' ')
      } else {
        name = formData.companyName
      }

      const payload = {
        name,
        firstName: formData.type === 'Individual' ? formData.firstName : null,
        middleName: formData.type === 'Individual' ? formData.middleName : null,
        lastName: formData.type === 'Individual' ? formData.lastName : null,
        dateOfBirth: formData.type === 'Individual' ? formData.dateOfBirth : null,
        placeOfBirth: formData.type === 'Individual' ? formData.placeOfBirth : null,
        countryOfBirth: formData.type === 'Individual' ? formData.countryOfBirth : null,
        companyName: formData.type === 'Corporate' ? formData.companyName : null,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        type: formData.type,
        notes: formData.notes,
      }

      if (editingClient) {
        console.log('Updating client:', editingClient.id, payload)
        await api.updateClient(editingClient.id, payload)
        toast.success('Client updated successfully')
      } else {
        console.log('Creating client:', payload)
        await api.createClient(payload)
        toast.success('Client created successfully')
      }
      setIsDialogOpen(false)
      onRefresh()
    } catch (error: any) {
      console.error('Client operation error:', error)
      console.error('Error details:', JSON.stringify(error, null, 2))
      toast.error(error.message || 'Operation failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (client: Client) => {
    if (!confirm(`Are you sure you want to delete ${getDisplayName(client)}?`)) return

    try {
      await api.deleteClient(client.id)
      toast.success('Client deleted')
      onRefresh()
    } catch (error: any) {
      toast.error(error.message || 'Delete failed')
    }
  }

  // Export clients to Excel
  const handleExportClients = () => {
    try {
      if (clients.length === 0) {
        toast.error('No clients to export')
        return
      }
      const exportData = formatClientsForExport(clients)
      exportToExcel(exportData, `Clients_${new Date().toISOString().split('T')[0]}`, 'Clients')
      toast.success('Clients exported to Excel')
    } catch (error) {
      toast.error('Failed to export clients')
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Clients</h1>
          <p className="text-muted-foreground">Manage your client database</p>
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExportClients}>
                <FileDown className="h-4 w-4 mr-2" />
                Export to Excel
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Add Client
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search clients..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Client List */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredClients.map((client: any) => (
          <Card key={client.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-primary/10">
                    {client.type === 'Corporate' ? (
                      <Building className="h-5 w-5 text-primary" />
                    ) : (
                      <User className="h-5 w-5 text-primary" />
                    )}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{getDisplayName(client)}</CardTitle>
                    <p className="text-sm text-muted-foreground">{client.type}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEditDialog(client)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(client)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 text-sm">
                <p className="text-muted-foreground">{client.email}</p>
                <p className="text-muted-foreground">{client.phone}</p>
                {client.type === 'Individual' && client.dateOfBirth && (
                  <p className="text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    DOB: {new Date(client.dateOfBirth).toLocaleDateString()}
                  </p>
                )}
                {client.type === 'Individual' && client.countryOfBirth && (
                  <p className="text-muted-foreground flex items-center gap-1">
                    <Globe className="h-3 w-3" />
                    {client.countryOfBirth}
                  </p>
                )}
                {client.address && (
                  <p className="text-muted-foreground truncate flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {client.address}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredClients.length === 0 && (
          <div className="col-span-full text-center py-12">
            <p className="text-muted-foreground">No clients found</p>
            <Button variant="link" onClick={openCreateDialog}>
              Add your first client
            </Button>
          </div>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingClient ? 'Edit Client' : 'Add New Client'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Client Type Selection */}
            <div className="space-y-2">
              <Label htmlFor="type">Client Type *</Label>
              <Select
                value={formData.type}
                onValueChange={(value: 'Individual' | 'Corporate') =>
                  setFormData({ ...formData, type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Individual">Individual</SelectItem>
                  <SelectItem value="Corporate">Corporate</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Individual Fields */}
            {formData.type === 'Individual' && (
              <>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      placeholder="John"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="middleName">Middle Name</Label>
                    <Input
                      id="middleName"
                      value={formData.middleName}
                      onChange={(e) => setFormData({ ...formData, middleName: e.target.value })}
                      placeholder="William"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      placeholder="Doe"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Date of Birth</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="placeOfBirth">Place of Birth</Label>
                  <Input
                    id="placeOfBirth"
                    value={formData.placeOfBirth}
                    onChange={(e) => setFormData({ ...formData, placeOfBirth: e.target.value })}
                    placeholder="City, State"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="countryOfBirth">Country of Birth</Label>
                  <Select
                    value={formData.countryOfBirth}
                    onValueChange={(value) => setFormData({ ...formData, countryOfBirth: value })}
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
              </>
            )}

            {/* Corporate Fields */}
            {formData.type === 'Corporate' && (
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name *</Label>
                <Input
                  id="companyName"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  placeholder="Acme Corporation"
                  required
                />
              </div>
            )}

            {/* Common Fields */}
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="client@example.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone *</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="(555) 123-4567"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="123 Main St, City, State, ZIP"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Input
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes..."
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Saving...' : editingClient ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
