import { useMemo } from 'react'
import { Client, Case } from '@/lib/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  BarChart3,
  Users,
  Briefcase,
  Globe,
  MapPin,
  DollarSign,
  Calendar,
  TrendingUp,
  TrendingDown,
  FileText,
  Download,
  Building2,
  Gavel,
} from 'lucide-react'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/currency'
import { exportToExcel, exportMultipleSheetsToExcel } from '@/lib/excel-export'

interface ReportsPageProps {
  clients: Client[]
  cases: Case[]
  users: any[]
}

export function ReportsPage({ clients, cases }: ReportsPageProps) {
  // Load data from localStorage
  const courtLogs = useMemo(() => {
    const saved = localStorage.getItem('court-logs')
    return saved ? JSON.parse(saved) : []
  }, [])

  const payments = useMemo(() => {
    const saved = localStorage.getItem('billing-payments')
    return saved ? JSON.parse(saved) : []
  }, [])

  const expenses = useMemo(() => {
    const saved = localStorage.getItem('billing-expenses')
    return saved ? JSON.parse(saved) : []
  }, [])


  // ==================== CLIENT STATISTICS ====================
  const clientStats = useMemo(() => {
    const total = clients.length
    const individuals = clients.filter(c => c.type === 'Individual').length
    const companies = clients.filter(c => c.type === 'Corporate').length

    // By country
    const byCountry: Record<string, number> = {}
    clients.forEach(c => {
      const country = (c as any).countryOfBirth || 'Unknown'
      byCountry[country] = (byCountry[country] || 0) + 1
    })

    // By month (created)
    const byMonth: Record<string, number> = {}
    clients.forEach(c => {
      if (c.createdAt) {
        const month = new Date(c.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
        byMonth[month] = (byMonth[month] || 0) + 1
      }
    })

    return { total, individuals, companies, byCountry, byMonth }
  }, [clients])

  // ==================== CASE STATISTICS ====================
  const caseStats = useMemo(() => {
    const total = cases.length
    const open = cases.filter(c => c.status === 'Open' || c.status === 'Pending').length
    const closed = cases.filter(c => c.status === 'Closed').length
    const pending = cases.filter(c => c.status === 'On Hold').length

    // By type
    const byType: Record<string, number> = {}
    cases.forEach(c => {
      const type = c.type || 'General'
      byType[type] = (byType[type] || 0) + 1
    })

    // By status
    const byStatus: Record<string, number> = {}
    cases.forEach(c => {
      byStatus[c.status] = (byStatus[c.status] || 0) + 1
    })

    return { total, open, closed, pending, byType, byStatus }
  }, [cases])

  // ==================== BILLING STATISTICS ====================
  const billingStats = useMemo(() => {
    const totalInvoiced = payments.reduce((sum: number, p: any) => sum + (p.totalAmount || p.amount || 0), 0)
    const totalReceived = payments.reduce((sum: number, p: any) => sum + (p.paidAmount || 0), 0)
    const totalPending = totalInvoiced - totalReceived
    const totalExpenses = expenses.reduce((sum: number, e: any) => sum + (e.amount || 0), 0)
    const netProfit = totalReceived - totalExpenses

    // By client
    const byClient: Record<string, number> = {}
    payments.forEach((p: any) => {
      byClient[p.clientName] = (byClient[p.clientName] || 0) + (p.totalAmount || p.amount || 0)
    })

    // Top clients
    const topClients = Object.entries(byClient)
      .sort((a, b) => (b[1] as number) - (a[1] as number))
      .slice(0, 10)

    return { totalInvoiced, totalReceived, totalPending, totalExpenses, netProfit, byClient, topClients }
  }, [payments, expenses])

  // ==================== COURT LOG STATISTICS ====================
  const courtStats = useMemo(() => {
    const total = courtLogs.length
    const scheduled = courtLogs.filter((l: any) => l.status === 'Scheduled').length
    const completed = courtLogs.filter((l: any) => l.status === 'Completed').length
    const postponed = courtLogs.filter((l: any) => l.status === 'Postponed').length

    // By court
    const byCourt: Record<string, number> = {}
    courtLogs.forEach((l: any) => {
      byCourt[l.courtName] = (byCourt[l.courtName] || 0) + 1
    })

    // Upcoming (next 30 days)
    const today = new Date()
    const upcoming = courtLogs.filter((l: any) => {
      const courtDate = new Date(l.courtDate)
      const daysUntil = Math.ceil((courtDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      return l.status === 'Scheduled' && daysUntil >= 0 && daysUntil <= 30
    })

    return { total, scheduled, completed, postponed, byCourt, upcoming }
  }, [courtLogs])


  // ==================== EXPORT FUNCTIONS ====================
  const exportFullReport = () => {
    try {
      const sheets = [
        {
          name: 'Summary',
          data: [
            { 'Metric': 'Total Clients', 'Value': clientStats.total },
            { 'Metric': 'Individual Clients', 'Value': clientStats.individuals },
            { 'Metric': 'Company Clients', 'Value': clientStats.companies },
            { 'Metric': 'Total Cases', 'Value': caseStats.total },
            { 'Metric': 'Open Cases', 'Value': caseStats.open },
            { 'Metric': 'Closed Cases', 'Value': caseStats.closed },
            { 'Metric': 'Total Invoiced', 'Value': billingStats.totalInvoiced },
            { 'Metric': 'Total Received', 'Value': billingStats.totalReceived },
            { 'Metric': 'Total Pending', 'Value': billingStats.totalPending },
            { 'Metric': 'Total Expenses', 'Value': billingStats.totalExpenses },
            { 'Metric': 'Net Profit', 'Value': billingStats.netProfit },
            { 'Metric': 'Total Court Dates', 'Value': courtStats.total },
            { 'Metric': 'Scheduled Court Dates', 'Value': courtStats.scheduled },
          ]
        },
        {
          name: 'Clients by Country',
          data: Object.entries(clientStats.byCountry).map(([country, count]) => ({
            'Country': country,
            'Number of Clients': count
          }))
        },
        {
          name: 'Cases by Type',
          data: Object.entries(caseStats.byType).map(([type, count]) => ({
            'Case Type': type,
            'Number of Cases': count
          }))
        },
        {
          name: 'Top Clients by Revenue',
          data: billingStats.topClients.map(([client, amount]) => ({
            'Client': client,
            'Total Billed': amount
          }))
        },
        {
          name: 'Courts Used',
          data: Object.entries(courtStats.byCourt).map(([court, count]) => ({
            'Court Name': court,
            'Number of Hearings': count
          }))
        }
      ]

      exportMultipleSheetsToExcel(sheets, `Full_Report_${new Date().toISOString().split('T')[0]}`)
      toast.success('Full report exported to Excel')
    } catch (error) {
      toast.error('Failed to export report')
    }
  }

  const exportClientsByCountry = () => {
    const data = Object.entries(clientStats.byCountry)
      .sort((a, b) => (b[1] as number) - (a[1] as number))
      .map(([country, count]) => ({
        'Country': country,
        'Number of Clients': count,
        'Percentage': ((count as number / clientStats.total) * 100).toFixed(1) + '%'
      }))
    exportToExcel(data, `Clients_By_Country_${new Date().toISOString().split('T')[0]}`, 'By Country')
    toast.success('Exported clients by country')
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BarChart3 className="h-8 w-8" />
            Reports & Analytics
          </h1>
          <p className="text-muted-foreground">Comprehensive reports and statistics for your law firm</p>
        </div>
        <Button onClick={exportFullReport}>
          <Download className="h-4 w-4 mr-2" />
          Export Full Report
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Clients</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clientStats.total}</div>
            <p className="text-xs text-muted-foreground">
              {clientStats.individuals} individuals, {clientStats.companies} companies
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Cases</CardTitle>
            <Briefcase className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{caseStats.open}</div>
            <p className="text-xs text-muted-foreground">
              of {caseStats.total} total cases
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(billingStats.totalReceived)}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(billingStats.totalPending)} pending
            </p>
          </CardContent>
        </Card>

        <Card className={billingStats.netProfit >= 0 ? 'border-green-200' : 'border-red-200'}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Net Profit</CardTitle>
            {billingStats.netProfit >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${billingStats.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(billingStats.netProfit)}
            </div>
            <p className="text-xs text-muted-foreground">
              Income - Expenses
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different reports */}
      <Tabs defaultValue="clients" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="clients">Clients</TabsTrigger>
          <TabsTrigger value="cases">Cases</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="court">Court</TabsTrigger>
          <TabsTrigger value="geography">Geography</TabsTrigger>
        </TabsList>

        {/* ==================== CLIENTS TAB ==================== */}
        <TabsContent value="clients" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Client Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between py-2 border-b">
                  <span>Total Clients</span>
                  <span className="font-bold">{clientStats.total}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span>Individuals</span>
                  <span className="font-bold">{clientStats.individuals}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span>Companies/Organizations</span>
                  <span className="font-bold">{clientStats.companies}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span>Countries Represented</span>
                  <span className="font-bold">{Object.keys(clientStats.byCountry).length}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Top Countries
                </CardTitle>
                <CardDescription>Clients by country of birth</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(clientStats.byCountry)
                    .sort((a, b) => (b[1] as number) - (a[1] as number))
                    .slice(0, 8)
                    .map(([country, count]) => (
                      <div key={country} className="flex items-center justify-between">
                        <span>{country}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary"
                              style={{ width: `${((count as number) / clientStats.total) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium w-8">{count as number}</span>
                        </div>
                      </div>
                    ))}
                </div>
                <Button variant="outline" className="w-full mt-4" onClick={exportClientsByCountry}>
                  <Download className="h-4 w-4 mr-2" />
                  Export by Country
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ==================== CASES TAB ==================== */}
        <TabsContent value="cases" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Case Status Distribution
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(caseStats.byStatus).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div className="flex items-center gap-2">
                      <Badge variant={
                        status === 'Open' || status === 'Active' ? 'default' :
                        status === 'Closed' ? 'secondary' :
                        status === 'Pending' ? 'outline' : 'destructive'
                      }>
                        {status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{count as number}</span>
                      <span className="text-muted-foreground text-sm">
                        ({((count as number / caseStats.total) * 100).toFixed(0)}%)
                      </span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Cases by Type
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(caseStats.byType)
                    .sort((a, b) => (b[1] as number) - (a[1] as number))
                    .map(([type, count]) => (
                      <div key={type} className="flex items-center justify-between py-2">
                        <span>{type}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-purple-500"
                              style={{ width: `${((count as number) / caseStats.total) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium w-8">{count as number}</span>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ==================== BILLING TAB ==================== */}
        <TabsContent value="billing" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="bg-green-50 dark:bg-green-950/20 border-green-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-green-700 dark:text-green-400">Total Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">{formatCurrency(billingStats.totalReceived)}</div>
              </CardContent>
            </Card>

            <Card className="bg-amber-50 dark:bg-amber-950/20 border-amber-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-amber-700 dark:text-amber-400">Pending Payments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-amber-600">{formatCurrency(billingStats.totalPending)}</div>
              </CardContent>
            </Card>

            <Card className="bg-red-50 dark:bg-red-950/20 border-red-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-red-700 dark:text-red-400">Total Expenses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">{formatCurrency(billingStats.totalExpenses)}</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Top Clients by Revenue
              </CardTitle>
              <CardDescription>Highest paying clients</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rank</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead className="text-right">Total Billed</TableHead>
                    <TableHead className="text-right">% of Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {billingStats.topClients.map(([client, amount], index) => (
                    <TableRow key={client}>
                      <TableCell>
                        <Badge variant={index < 3 ? 'default' : 'outline'}>#{index + 1}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">{client}</TableCell>
                      <TableCell className="text-right">{formatCurrency(amount as number)}</TableCell>
                      <TableCell className="text-right">
                        {((amount as number / billingStats.totalInvoiced) * 100).toFixed(1)}%
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== COURT TAB ==================== */}
        <TabsContent value="court" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Hearings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{courtStats.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{courtStats.scheduled}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Completed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{courtStats.completed}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Postponed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-600">{courtStats.postponed}</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Hearings by Court
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(courtStats.byCourt)
                  .sort((a, b) => (b[1] as number) - (a[1] as number))
                  .map(([court, count]) => (
                    <div key={court} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div className="flex items-center gap-2">
                        <Gavel className="h-4 w-4 text-muted-foreground" />
                        <span>{court}</span>
                      </div>
                      <Badge>{count as number} hearing(s)</Badge>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          {courtStats.upcoming.length > 0 && (
            <Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
                  <Calendar className="h-5 w-5" />
                  Upcoming Hearings (Next 30 Days)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client</TableHead>
                      <TableHead>Court</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {courtStats.upcoming.map((log: any) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-medium">{log.clientName}</TableCell>
                        <TableCell>{log.courtName}</TableCell>
                        <TableCell>{new Date(log.courtDate).toLocaleDateString()}</TableCell>
                        <TableCell>{log.courtTime}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ==================== GEOGRAPHY TAB ==================== */}
        <TabsContent value="geography" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Clients by Country of Birth
              </CardTitle>
              <CardDescription>Geographic distribution of your client base</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Country</TableHead>
                    <TableHead className="text-right">Clients</TableHead>
                    <TableHead className="text-right">Percentage</TableHead>
                    <TableHead>Distribution</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(clientStats.byCountry)
                    .sort((a, b) => (b[1] as number) - (a[1] as number))
                    .map(([country, count]) => (
                      <TableRow key={country}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            {country}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">{count as number}</TableCell>
                        <TableCell className="text-right">
                          {((count as number / clientStats.total) * 100).toFixed(1)}%
                        </TableCell>
                        <TableCell>
                          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary"
                              style={{ width: `${((count as number) / clientStats.total) * 100}%` }}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
              <Button variant="outline" className="w-full mt-4" onClick={exportClientsByCountry}>
                <Download className="h-4 w-4 mr-2" />
                Export Geography Report
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

