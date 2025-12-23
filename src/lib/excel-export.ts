import ExcelJS from 'exceljs'

// Export data to Excel file
export async function exportToExcel(data: any[], filename: string, sheetName: string = 'Sheet1') {
  if (!data || data.length === 0) {
    throw new Error('No data to export')
  }

  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet(sheetName)

  // Add header row
  const headers = Object.keys(data[0])
  worksheet.addRow(headers)

  // Style header row
  const headerRow = worksheet.getRow(1)
  headerRow.font = { bold: true }
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  }

  // Add data rows
  data.forEach(row => {
    worksheet.addRow(headers.map(key => row[key] || ''))
  })

  // Auto-size columns
  worksheet.columns.forEach((column, index) => {
    const header = headers[index]
    let maxLength = header.length
    data.forEach(row => {
      const cellValue = String(row[header] || '')
      maxLength = Math.max(maxLength, cellValue.length)
    })
    column.width = Math.min(maxLength + 2, 50)
  })

  // Generate and download file
  const buffer = await workbook.xlsx.writeBuffer()
  downloadBuffer(buffer, `${filename}.xlsx`)
}

// Export multiple sheets to Excel
export async function exportMultipleSheetsToExcel(
  sheets: { name: string; data: any[] }[],
  filename: string
) {
  const workbook = new ExcelJS.Workbook()

  sheets.forEach(sheet => {
    if (sheet.data && sheet.data.length > 0) {
      const worksheet = workbook.addWorksheet(sheet.name)
      const headers = Object.keys(sheet.data[0])

      // Add header row
      worksheet.addRow(headers)
      const headerRow = worksheet.getRow(1)
      headerRow.font = { bold: true }
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      }

      // Add data rows
      sheet.data.forEach(row => {
        worksheet.addRow(headers.map(key => row[key] || ''))
      })

      // Auto-size columns
      worksheet.columns.forEach((column, index) => {
        const header = headers[index]
        let maxLength = header.length
        sheet.data.forEach(row => {
          const cellValue = String(row[header] || '')
          maxLength = Math.max(maxLength, cellValue.length)
        })
        column.width = Math.min(maxLength + 2, 50)
      })
    }
  })

  const buffer = await workbook.xlsx.writeBuffer()
  downloadBuffer(buffer, `${filename}.xlsx`)
}

// Helper function to download buffer as file
function downloadBuffer(buffer: ExcelJS.Buffer, filename: string) {
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// Format clients for export
export function formatClientsForExport(clients: any[]) {
  return clients.map(client => ({
    'Name': client.name || `${client.firstName || ''} ${client.middleName || ''} ${client.lastName || ''}`.trim(),
    'First Name': client.firstName || '',
    'Middle Name': client.middleName || '',
    'Last Name': client.lastName || '',
    'Type': client.type || 'Individual',
    'Email': client.email || '',
    'Phone': client.phone || '',
    'Address': client.address || '',
    'Date of Birth': client.dateOfBirth || '',
    'Place of Birth': client.placeOfBirth || '',
    'Country of Birth': client.countryOfBirth || '',
    'ARC Number': client.arcNumber || '',
    'File Number': client.fileNumber || '',
    'Notes': client.notes || '',
    'Created At': client.createdAt || '',
  }))
}

// Format cases for export
export function formatCasesForExport(cases: any[], clients: any[]) {
  return cases.map(caseItem => {
    const client = clients.find(c => c.id === caseItem.clientId)
    return {
      'Case Number': caseItem.caseNumber || '',
      'Title': caseItem.title || '',
      'Type': caseItem.type || '',
      'Status': caseItem.status || '',
      'Client Name': client?.name || `${client?.firstName || ''} ${client?.lastName || ''}`.trim() || 'Unknown',
      'Description': caseItem.description || '',
      'Created At': caseItem.createdAt || '',
      'Updated At': caseItem.updatedAt || '',
    }
  })
}

// Format payments for export
export function formatPaymentsForExport(payments: any[]) {
  return payments.map(payment => ({
    'Client Name': payment.clientName || '',
    'Amount': payment.amount || 0,
    'Amount Paid': payment.amountPaid || 0,
    'Balance': (payment.amount || 0) - (payment.amountPaid || 0),
    'Status': payment.status || '',
    'Payment Method': payment.paymentMethod || '',
    'Due Date': payment.dueDate || '',
    'Description': payment.description || '',
    'Notes': payment.notes || '',
    'Created At': payment.createdAt || '',
  }))
}

// Format court logs for export
export function formatCourtLogsForExport(courtLogs: any[]) {
  return courtLogs.map(log => ({
    'Client Name': log.clientName || '',
    'Case Number': log.caseNumber || '',
    'Court Date': log.courtDate || '',
    'Court Time': log.courtTime || '',
    'Court Name': log.courtName || '',
    'Court Address': log.courtAddress || '',
    'Judge/Panel': log.judgeOrPanel || '',
    'Purpose': log.purpose || '',
    'Status': log.status || '',
    'Reminder Enabled': log.reminderEnabled ? 'Yes' : 'No',
    'Notes': log.notes || '',
    'Created At': log.createdAt || '',
  }))
}

// Format tasks for export
export function formatTasksForExport(tasks: any[], users: any[]) {
  return tasks.map(task => {
    const assignee = users.find(u => u.id === task.assignedTo)
    return {
      'Title': task.title || '',
      'Description': task.description || '',
      'Status': task.status || '',
      'Priority': task.priority || '',
      'Assigned To': assignee?.name || 'Unassigned',
      'Due Date': task.dueDate || '',
      'Created At': task.createdAt || '',
    }
  })
}

// Format expenses for export
export function formatExpensesForExport(expenses: any[]) {
  return expenses.map(expense => ({
    'Description': expense.description || '',
    'Category': expense.category || '',
    'Amount': expense.amount || 0,
    'Date': expense.date || '',
    'Notes': expense.notes || '',
    'Created At': expense.createdAt || '',
  }))
}

// ==================== IMPORT FUNCTIONS ====================

// Read Excel file and return data as array of objects
export async function importFromExcel(file: File): Promise<any[]> {
  const workbook = new ExcelJS.Workbook()
  const buffer = await file.arrayBuffer()
  await workbook.xlsx.load(buffer)

  // Get first sheet
  const worksheet = workbook.worksheets[0]
  if (!worksheet) {
    throw new Error('No worksheet found in Excel file')
  }

  const jsonData: any[] = []
  const headers: string[] = []

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) {
      // First row is headers
      row.eachCell((cell, colNumber) => {
        headers[colNumber - 1] = String(cell.value || '')
      })
    } else {
      // Data rows
      const rowData: any = {}
      row.eachCell((cell, colNumber) => {
        const header = headers[colNumber - 1]
        if (header) {
          rowData[header] = cell.value
        }
      })
      if (Object.keys(rowData).length > 0) {
        jsonData.push(rowData)
      }
    }
  })

  return jsonData
}

// Parse imported clients data
export function parseImportedClients(data: any[]): any[] {
  return data.map((row, index) => ({
    id: `imported-client-${Date.now()}-${index}`,
    name: row['Name'] || `${row['First Name'] || ''} ${row['Last Name'] || ''}`.trim() || 'Unknown',
    firstName: row['First Name'] || row['FirstName'] || '',
    middleName: row['Middle Name'] || row['MiddleName'] || '',
    lastName: row['Last Name'] || row['LastName'] || '',
    type: row['Type'] || 'Individual',
    email: row['Email'] || '',
    phone: row['Phone'] || row['Phone Number'] || '',
    address: row['Address'] || '',
    dateOfBirth: row['Date of Birth'] || row['DOB'] || row['DateOfBirth'] || '',
    placeOfBirth: row['Place of Birth'] || row['PlaceOfBirth'] || '',
    countryOfBirth: row['Country of Birth'] || row['CountryOfBirth'] || row['Country'] || '',
    arcNumber: row['ARC Number'] || row['ARC No'] || row['ARCNumber'] || '',
    fileNumber: row['File Number'] || row['File No'] || row['FileNumber'] || '',
    notes: row['Notes'] || '',
    createdAt: new Date().toISOString(),
  }))
}

// Parse imported cases data
export function parseImportedCases(data: any[], clients: any[]): any[] {
  return data.map((row, index) => {
    // Try to find client by name
    const clientName = row['Client Name'] || row['Client'] || ''
    const client = clients.find(c =>
      c.name?.toLowerCase() === clientName.toLowerCase() ||
      `${c.firstName} ${c.lastName}`.toLowerCase() === clientName.toLowerCase()
    )

    return {
      id: `imported-case-${Date.now()}-${index}`,
      caseNumber: row['Case Number'] || row['CaseNumber'] || `CASE-${Date.now()}-${index}`,
      title: row['Title'] || row['Case Title'] || 'Imported Case',
      type: row['Type'] || row['Case Type'] || 'General',
      status: row['Status'] || 'Open',
      clientId: client?.id || '',
      description: row['Description'] || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  })
}

// Parse imported tasks data
export function parseImportedTasks(data: any[], users: any[]): any[] {
  return data.map((row, index) => {
    // Try to find assignee by name
    const assigneeName = row['Assigned To'] || row['Assignee'] || ''
    const assignee = users.find(u => u.name?.toLowerCase() === assigneeName.toLowerCase())

    return {
      id: `imported-task-${Date.now()}-${index}`,
      title: row['Title'] || row['Task'] || 'Imported Task',
      description: row['Description'] || '',
      status: row['Status'] || 'Pending',
      priority: row['Priority'] || 'Medium',
      assignedTo: assignee?.id || '',
      dueDate: row['Due Date'] || row['DueDate'] || '',
      createdAt: new Date().toISOString(),
    }
  })
}

