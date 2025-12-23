import { useState, useMemo, useRef } from 'react'
import { Client, Case } from '@/lib/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  FileText,
  Upload,
  Search,
  Trash2,
  Download,
  Eye,
  FolderOpen,
  Image,
  File,
  FileType,
  User,
  Filter,
} from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'

interface DocumentsPageProps {
  clients: Client[]
  cases: Case[]
}

interface Document {
  id: string
  clientId: string
  clientName: string
  caseId?: string
  caseName?: string
  fileName: string
  fileType: string
  fileSize: number
  fileData: string // Base64 encoded file data
  category: string
  description: string
  uploadedBy: string
  uploadedAt: string
  tags: string[]
}

const DOCUMENT_CATEGORIES = [
  'Identity Documents',
  'Legal Documents',
  'Court Filings',
  'Evidence',
  'Correspondence',
  'Contracts',
  'Financial Documents',
  'Medical Records',
  'Immigration Documents',
  'Witness Statements',
  'Photos/Images',
  'Other',
]

const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/gif',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
]

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export function DocumentsPage({ clients, cases }: DocumentsPageProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  // State
  const [documents, setDocuments] = useState<Document[]>(() => {
    const saved = localStorage.getItem('client-documents')
    return saved ? JSON.parse(saved) : []
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [filterClient, setFilterClient] = useState<string>('all')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [documentToDelete, setDocumentToDelete] = useState<Document | null>(null)

  // Upload form state
  const [uploadForm, setUploadForm] = useState({
    clientId: '',
    caseId: '',
    category: '',
    description: '',
    tags: '',
    file: null as File | null,
  })

  // Save documents to localStorage
  const saveDocuments = (docs: Document[]) => {
    setDocuments(docs)
    localStorage.setItem('client-documents', JSON.stringify(docs))
  }

  // Get client name by ID
  const getClientName = (clientId: string) => {
    const client = clients.find(c => c.id === clientId)
    if (!client) return 'Unknown Client'
    return client.name || `${(client as any).firstName || ''} ${(client as any).lastName || ''}`.trim()
  }

  // Get case name by ID
  const getCaseName = (caseId: string) => {
    const caseItem = cases.find(c => c.id === caseId)
    return caseItem?.title || caseItem?.caseNumber || ''
  }

  // Filter documents
  const filteredDocuments = useMemo(() => {
    return documents.filter(doc => {
      const matchesSearch =
        doc.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))

      const matchesClient = filterClient === 'all' || doc.clientId === filterClient
      const matchesCategory = filterCategory === 'all' || doc.category === filterCategory

      return matchesSearch && matchesClient && matchesCategory
    })
  }, [documents, searchTerm, filterClient, filterCategory])

  // Group documents by client
  const documentsByClient = useMemo(() => {
    const grouped: Record<string, Document[]> = {}
    filteredDocuments.forEach(doc => {
      if (!grouped[doc.clientId]) {
        grouped[doc.clientId] = []
      }
      grouped[doc.clientId].push(doc)
    })
    return grouped
  }, [filteredDocuments])

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      toast.error('Invalid file type. Allowed: PDF, PNG, JPEG, GIF, DOC, DOCX, XLS, XLSX, TXT')
      return
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.error('File size exceeds 10MB limit')
      return
    }

    setUploadForm({ ...uploadForm, file })
  }

  // Handle document upload
  const handleUpload = async () => {
    if (!uploadForm.clientId) {
      toast.error('Please select a client')
      return
    }
    if (!uploadForm.file) {
      toast.error('Please select a file')
      return
    }
    if (!uploadForm.category) {
      toast.error('Please select a category')
      return
    }

    try {
      // Convert file to base64
      const reader = new FileReader()
      reader.onload = () => {
        const base64Data = reader.result as string

        const newDocument: Document = {
          id: `doc-${Date.now()}`,
          clientId: uploadForm.clientId,
          clientName: getClientName(uploadForm.clientId),
          caseId: uploadForm.caseId || undefined,
          caseName: uploadForm.caseId ? getCaseName(uploadForm.caseId) : undefined,
          fileName: uploadForm.file!.name,
          fileType: uploadForm.file!.type,
          fileSize: uploadForm.file!.size,
          fileData: base64Data,
          category: uploadForm.category,
          description: uploadForm.description,
          uploadedBy: 'Current User',
          uploadedAt: new Date().toISOString(),
          tags: uploadForm.tags.split(',').map(t => t.trim()).filter(t => t),
        }

        saveDocuments([...documents, newDocument])
        toast.success('Document uploaded successfully')
        setIsUploadDialogOpen(false)
        resetUploadForm()
      }
      reader.readAsDataURL(uploadForm.file)
    } catch (error) {
      toast.error('Failed to upload document')
    }
  }

  // Reset upload form
  const resetUploadForm = () => {
    setUploadForm({
      clientId: '',
      caseId: '',
      category: '',
      description: '',
      tags: '',
      file: null,
    })
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Handle document view
  const handleViewDocument = (doc: Document) => {
    setSelectedDocument(doc)
    setIsViewDialogOpen(true)
  }

  // Handle document download
  const handleDownload = (doc: Document) => {
    const link = document.createElement('a')
    link.href = doc.fileData
    link.download = doc.fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Document downloaded')
  }

  // Handle document delete
  const handleDeleteConfirm = () => {
    if (!documentToDelete) return

    const updated = documents.filter(d => d.id !== documentToDelete.id)
    saveDocuments(updated)
    toast.success('Document deleted')
    setDeleteConfirmOpen(false)
    setDocumentToDelete(null)
  }

  // Get file icon based on type
  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) {
      return <Image className="h-5 w-5 text-green-500" />
    }
    if (fileType === 'application/pdf') {
      return <FileType className="h-5 w-5 text-red-500" />
    }
    if (fileType.includes('word')) {
      return <FileText className="h-5 w-5 text-blue-500" />
    }
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) {
      return <FileText className="h-5 w-5 text-green-600" />
    }
    return <File className="h-5 w-5 text-gray-500" />
  }

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  // Get cases for selected client
  const clientCases = useMemo(() => {
    if (!uploadForm.clientId) return []
    return cases.filter(c => c.clientId === uploadForm.clientId)
  }, [uploadForm.clientId, cases])

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FolderOpen className="h-8 w-8" />
            Documents & Evidence
          </h1>
          <p className="text-muted-foreground">
            Manage and archive documents for your clients
          </p>
        </div>
        <Button onClick={() => setIsUploadDialogOpen(true)}>
          <Upload className="h-4 w-4 mr-2" />
          Upload Document
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search documents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={filterClient} onValueChange={setFilterClient}>
              <SelectTrigger className="w-full md:w-[200px]">
                <User className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by client" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Clients</SelectItem>
                {clients.map(client => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name || `${(client as any).firstName} ${(client as any).lastName}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-full md:w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {DOCUMENT_CATEGORIES.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{documents.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Clients with Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Object.keys(documentsByClient).length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Evidence Files</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {documents.filter(d => d.category === 'Evidence').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Storage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatFileSize(documents.reduce((sum, d) => sum + d.fileSize, 0))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Documents List by Client */}
      {Object.keys(documentsByClient).length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No documents found</h3>
            <p className="text-muted-foreground mt-1">
              Upload documents to get started
            </p>
            <Button className="mt-4" onClick={() => setIsUploadDialogOpen(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Upload First Document
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(documentsByClient).map(([clientId, docs]) => (
            <Card key={clientId}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  {getClientName(clientId)}
                </CardTitle>
                <CardDescription>
                  {docs.length} document(s) archived
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {docs.map(doc => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {getFileIcon(doc.fileType)}
                        <div>
                          <p className="font-medium">{doc.fileName}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Badge variant="outline" className="text-xs">
                              {doc.category}
                            </Badge>
                            <span>{formatFileSize(doc.fileSize)}</span>
                            <span>•</span>
                            <span>{format(new Date(doc.uploadedAt), 'MMM d, yyyy')}</span>
                          </div>
                          {doc.caseName && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Case: {doc.caseName}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDocument(doc)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownload(doc)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setDocumentToDelete(doc)
                            setDeleteConfirmOpen(true)
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Upload Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload Document
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Client *</Label>
              <Select
                value={uploadForm.clientId}
                onValueChange={(v) => setUploadForm({ ...uploadForm, clientId: v, caseId: '' })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map(client => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name || `${(client as any).firstName} ${(client as any).lastName}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {clientCases.length > 0 && (
              <div className="space-y-2">
                <Label>Related Case (Optional)</Label>
                <Select
                  value={uploadForm.caseId}
                  onValueChange={(v) => setUploadForm({ ...uploadForm, caseId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select case (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No specific case</SelectItem>
                    {clientCases.map(c => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.caseNumber} - {c.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Category *</Label>
              <Select
                value={uploadForm.category}
                onValueChange={(v) => setUploadForm({ ...uploadForm, category: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {DOCUMENT_CATEGORIES.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>File *</Label>
              <div className="border-2 border-dashed rounded-lg p-4 text-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelect}
                  accept=".pdf,.png,.jpg,.jpeg,.gif,.webp,.doc,.docx,.xls,.xlsx,.txt"
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer flex flex-col items-center gap-2"
                >
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  {uploadForm.file ? (
                    <div>
                      <p className="font-medium">{uploadForm.file.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatFileSize(uploadForm.file.size)}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="font-medium">Click to select file</p>
                      <p className="text-sm text-muted-foreground">
                        PDF, PNG, JPEG, DOC, XLS (max 10MB)
                      </p>
                    </div>
                  )}
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={uploadForm.description}
                onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                placeholder="Brief description of the document..."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Tags (comma-separated)</Label>
              <Input
                value={uploadForm.tags}
                onChange={(e) => setUploadForm({ ...uploadForm, tags: e.target.value })}
                placeholder="e.g., passport, visa, court order"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsUploadDialogOpen(false)
              resetUploadForm()
            }}>
              Cancel
            </Button>
            <Button onClick={handleUpload}>
              <Upload className="h-4 w-4 mr-2" />
              Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Document Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedDocument && getFileIcon(selectedDocument.fileType)}
              {selectedDocument?.fileName}
            </DialogTitle>
          </DialogHeader>
          {selectedDocument && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Client:</span>
                  <p className="font-medium">{selectedDocument.clientName}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Category:</span>
                  <p className="font-medium">{selectedDocument.category}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Uploaded:</span>
                  <p className="font-medium">
                    {format(new Date(selectedDocument.uploadedAt), 'MMM d, yyyy h:mm a')}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Size:</span>
                  <p className="font-medium">{formatFileSize(selectedDocument.fileSize)}</p>
                </div>
                {selectedDocument.caseName && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Case:</span>
                    <p className="font-medium">{selectedDocument.caseName}</p>
                  </div>
                )}
                {selectedDocument.description && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Description:</span>
                    <p className="font-medium">{selectedDocument.description}</p>
                  </div>
                )}
                {selectedDocument.tags.length > 0 && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Tags:</span>
                    <div className="flex gap-1 mt-1">
                      {selectedDocument.tags.map(tag => (
                        <Badge key={tag} variant="secondary">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Preview */}
              <div className="border rounded-lg p-4 bg-muted/50">
                {selectedDocument.fileType.startsWith('image/') ? (
                  <img
                    src={selectedDocument.fileData}
                    alt={selectedDocument.fileName}
                    className="max-w-full max-h-[400px] mx-auto rounded"
                  />
                ) : selectedDocument.fileType === 'application/pdf' ? (
                  <iframe
                    src={selectedDocument.fileData}
                    className="w-full h-[500px] rounded"
                    title={selectedDocument.fileName}
                  />
                ) : (
                  <div className="text-center py-8">
                    <File className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Preview not available for this file type</p>
                    <Button className="mt-4" onClick={() => handleDownload(selectedDocument)}>
                      <Download className="h-4 w-4 mr-2" />
                      Download to View
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
            {selectedDocument && (
              <Button onClick={() => handleDownload(selectedDocument)}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{documentToDelete?.fileName}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

