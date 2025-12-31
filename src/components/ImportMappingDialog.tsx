import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { importFromExcel } from '@/lib/excel-export'
import { FileSpreadsheet, ArrowRight, AlertCircle } from 'lucide-react'

interface ImportMappingDialogProps {
  open: boolean
  onClose: () => void
  file: File | null
  importType: 'clients' | 'cases' | 'tasks'
  onImport: (mappedData: any[], mappings: Record<string, string>) => void
}

// Field definitions for each import type
const CLIENT_FIELDS = [
  { key: 'name', label: 'Full Name', required: false },
  { key: 'firstName', label: 'First Name', required: false },
  { key: 'middleName', label: 'Middle Name', required: false },
  { key: 'lastName', label: 'Last Name', required: false },
  { key: 'email', label: 'Email', required: false },
  { key: 'phone', label: 'Phone', required: false },
  { key: 'address', label: 'Address', required: false },
  { key: 'type', label: 'Client Type (Individual/Corporate)', required: false },
  { key: 'dateOfBirth', label: 'Date of Birth', required: false },
  { key: 'placeOfBirth', label: 'Place of Birth', required: false },
  { key: 'countryOfBirth', label: 'Country of Birth', required: false },
  { key: 'arcNumber', label: 'ARC Number', required: false },
  { key: 'fileNumber', label: 'File Number', required: false },
  { key: 'notes', label: 'Notes', required: false },
]

const CASE_FIELDS = [
  { key: 'title', label: 'Case Title', required: true },
  { key: 'caseNumber', label: 'Case Number', required: false },
  { key: 'clientName', label: 'Client Name', required: true },
  { key: 'type', label: 'Case Type', required: false },
  { key: 'status', label: 'Status', required: false },
  { key: 'description', label: 'Description', required: false },
]

const TASK_FIELDS = [
  { key: 'title', label: 'Task Title', required: true },
  { key: 'description', label: 'Description', required: false },
  { key: 'assignedTo', label: 'Assigned To', required: false },
  { key: 'dueDate', label: 'Due Date', required: false },
  { key: 'priority', label: 'Priority', required: false },
  { key: 'status', label: 'Status', required: false },
]

export function ImportMappingDialog({
  open,
  onClose,
  file,
  importType,
  onImport,
}: ImportMappingDialogProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rawData, setRawData] = useState<any[]>([])
  const [fileHeaders, setFileHeaders] = useState<string[]>([])
  const [mappings, setMappings] = useState<Record<string, string>>({})

  // Get field definitions based on import type
  const getFields = () => {
    switch (importType) {
      case 'clients':
        return CLIENT_FIELDS
      case 'cases':
        return CASE_FIELDS
      case 'tasks':
        return TASK_FIELDS
      default:
        return []
    }
  }

  const fields = getFields()

  // Load file and extract headers when dialog opens
  useEffect(() => {
    if (open && file) {
      loadFileData()
    } else {
      // Reset state when dialog closes
      setRawData([])
      setFileHeaders([])
      setMappings({})
      setError(null)
    }
  }, [open, file])

  const loadFileData = async () => {
    if (!file) return

    setLoading(true)
    setError(null)

    try {
      const data = await importFromExcel(file)
      
      if (!data || data.length === 0) {
        setError('No data found in the file')
        setLoading(false)
        return
      }

      setRawData(data)

      // Extract unique headers from all rows
      const headers = new Set<string>()
      data.forEach(row => {
        Object.keys(row).forEach(key => headers.add(key))
      })
      const headerArray = Array.from(headers)
      setFileHeaders(headerArray)

      // Auto-map fields based on header names
      const autoMappings: Record<string, string> = {}
      fields.forEach(field => {
        const matchingHeader = headerArray.find(header => {
          const headerLower = header.toLowerCase().replace(/[_\s-]/g, '')
          const fieldLower = field.key.toLowerCase()
          const labelLower = field.label.toLowerCase().replace(/[_\s-]/g, '')
          
          return (
            headerLower === fieldLower ||
            headerLower === labelLower ||
            headerLower.includes(fieldLower) ||
            fieldLower.includes(headerLower)
          )
        })
        
        if (matchingHeader) {
          autoMappings[field.key] = matchingHeader
        }
      })
      
      setMappings(autoMappings)
    } catch (err) {
      console.error('Error loading file:', err)
      setError(err instanceof Error ? err.message : 'Failed to read file')
    } finally {
      setLoading(false)
    }
  }

  const handleMappingChange = (fieldKey: string, headerValue: string) => {
    setMappings(prev => ({
      ...prev,
      [fieldKey]: headerValue === '__none__' ? '' : headerValue,
    }))
  }

  const handleImport = () => {
    // Apply mappings to raw data
    const mappedData = rawData.map((row, index) => {
      const mapped: any = {
        id: `imported-${importType}-${Date.now()}-${index}`,
        createdAt: new Date().toISOString(),
      }

      fields.forEach(field => {
        const sourceHeader = mappings[field.key]
        if (sourceHeader && row[sourceHeader] !== undefined) {
          mapped[field.key] = row[sourceHeader]
        } else {
          mapped[field.key] = ''
        }
      })

      // For clients: generate full name if not mapped directly
      if (importType === 'clients' && !mapped.name) {
        const parts = [mapped.firstName, mapped.middleName, mapped.lastName].filter(Boolean)
        mapped.name = parts.join(' ') || 'Unknown'
      }

      return mapped
    })

    onImport(mappedData, mappings)
    onClose()
  }

  // Check if required fields are mapped
  const requiredFieldsMapped = fields
    .filter(f => f.required)
    .every(f => mappings[f.key])

  // Get preview data (first 3 rows)
  const previewData = rawData.slice(0, 3)

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Map Import Columns - {importType.charAt(0).toUpperCase() + importType.slice(1)}
          </DialogTitle>
          <DialogDescription>
            Select which columns from your file correspond to each field. Required fields are marked with *.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-3">Reading file...</span>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-12 text-destructive">
            <AlertCircle className="h-5 w-5 mr-2" />
            {error}
          </div>
        ) : (
          <>
            {/* File Info */}
            <div className="bg-muted/50 rounded-lg p-3 mb-4">
              <p className="text-sm">
                <strong>File:</strong> {file?.name}
              </p>
              <p className="text-sm">
                <strong>Rows found:</strong> {rawData.length}
              </p>
              <p className="text-sm">
                <strong>Columns found:</strong> {fileHeaders.join(', ')}
              </p>
            </div>

            {/* Column Mapping */}
            <div className="space-y-4">
              <h3 className="font-semibold">Column Mapping</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {fields.map(field => (
                  <div key={field.key} className="flex items-center gap-3">
                    <div className="w-40 flex-shrink-0">
                      <Label className="text-sm">
                        {field.label}
                        {field.required && <span className="text-destructive ml-1">*</span>}
                      </Label>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <Select
                      value={mappings[field.key] || '__none__'}
                      onValueChange={(value) => handleMappingChange(field.key, value)}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select column..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">-- Not Mapped --</SelectItem>
                        {fileHeaders.map(header => (
                          <SelectItem key={header} value={header}>
                            {header}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </div>

            {/* Preview */}
            {previewData.length > 0 && (
              <div className="mt-6">
                <h3 className="font-semibold mb-2">Preview (First {previewData.length} rows)</h3>
                <div className="overflow-x-auto border rounded-lg">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        {fields.slice(0, 6).map(field => (
                          <th key={field.key} className="px-3 py-2 text-left font-medium">
                            {field.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.map((row, idx) => (
                        <tr key={idx} className="border-t">
                          {fields.slice(0, 6).map(field => {
                            const sourceHeader = mappings[field.key]
                            const value = sourceHeader ? row[sourceHeader] : ''
                            return (
                              <td key={field.key} className="px-3 py-2 truncate max-w-[150px]">
                                {value || <span className="text-muted-foreground">-</span>}
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={loading || !!error || rawData.length === 0 || !requiredFieldsMapped}
          >
            Import {rawData.length} Records
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
