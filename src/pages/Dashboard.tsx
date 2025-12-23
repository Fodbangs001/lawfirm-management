import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Briefcase, CheckSquare, Clock } from 'lucide-react'

interface DashboardProps {
  clientCount: number
  caseCount: number
  taskCount: number
  pendingTasks: number
}

export function Dashboard({ clientCount, caseCount, taskCount, pendingTasks }: DashboardProps) {
  const stats = [
    { label: 'Total Clients', value: clientCount, icon: Users, color: 'text-blue-500' },
    { label: 'Active Cases', value: caseCount, icon: Briefcase, color: 'text-green-500' },
    { label: 'Total Tasks', value: taskCount, icon: CheckSquare, color: 'text-purple-500' },
    { label: 'Pending Tasks', value: pendingTasks, icon: Clock, color: 'text-orange-500' },
  ]

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here's an overview of your firm.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">No recent activity to display.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Deadlines</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">No upcoming deadlines.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

