import { useState } from 'react'
import { api } from '@/lib/api'
import { Task, Case, User } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
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
import { Plus, Search, Edit, Trash2, CheckSquare, Clock, AlertCircle, FileDown, MoreVertical } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { exportToExcel, formatTasksForExport } from '@/lib/excel-export'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface TasksPageProps {
  tasks: Task[]
  cases: Case[]
  users: User[]
  onRefresh: () => void
}

const priorityColors: Record<string, string> = {
  Low: 'bg-gray-500/10 text-gray-600',
  Medium: 'bg-blue-500/10 text-blue-600',
  High: 'bg-orange-500/10 text-orange-600',
  Urgent: 'bg-red-500/10 text-red-600',
}

const statusColors: Record<string, string> = {
  Todo: 'bg-gray-500/10 text-gray-600',
  'In Progress': 'bg-blue-500/10 text-blue-600',
  Completed: 'bg-green-500/10 text-green-600',
}

export function TasksPage({ tasks, cases, users, onRefresh }: TasksPageProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [isLoading, setIsLoading] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assignedTo: '',
    caseId: '',
    dueDate: '',
    priority: 'Medium' as 'Low' | 'Medium' | 'High' | 'Urgent',
    status: 'Todo' as 'Todo' | 'In Progress' | 'Completed',
  })

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getUserName = (userId: string) => {
    const user = users.find((u) => u.id === userId)
    return user?.name || 'Unassigned'
  }

  const getCaseTitle = (caseId?: string) => {
    if (!caseId) return null
    const c = cases.find((cs) => cs.id === caseId)
    return c?.title || 'Unknown Case'
  }

  const openCreateDialog = () => {
    setEditingTask(null)
    setFormData({
      title: '',
      description: '',
      assignedTo: users[0]?.id || '',
      caseId: '',
      dueDate: format(new Date(), 'yyyy-MM-dd'),
      priority: 'Medium',
      status: 'Todo',
    })
    setIsDialogOpen(true)
  }

  const openEditDialog = (task: Task) => {
    setEditingTask(task)
    setFormData({
      title: task.title,
      description: task.description || '',
      assignedTo: task.assignedTo,
      caseId: task.caseId || '',
      dueDate: task.dueDate.split('T')[0],
      priority: task.priority,
      status: task.status,
    })
    setIsDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const payload = {
        ...formData,
        caseId: formData.caseId || null,
      }

      if (editingTask) {
        await api.updateTask(editingTask.id, payload)
        toast.success('Task updated successfully')
      } else {
        await api.createTask(payload)
        toast.success('Task created successfully')
      }
      setIsDialogOpen(false)
      onRefresh()
    } catch (error: any) {
      toast.error(error.message || 'Operation failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (task: Task) => {
    if (!confirm(`Are you sure you want to delete "${task.title}"?`)) return

    try {
      await api.deleteTask(task.id)
      toast.success('Task deleted')
      onRefresh()
    } catch (error: any) {
      toast.error(error.message || 'Delete failed')
    }
  }

  const toggleStatus = async (task: Task) => {
    const newStatus = task.status === 'Completed' ? 'Todo' : 'Completed'
    try {
      await api.updateTask(task.id, { status: newStatus })
      toast.success(`Task marked as ${newStatus}`)
      onRefresh()
    } catch (error: any) {
      toast.error('Failed to update task')
    }
  }

  // Export tasks to Excel
  const handleExportTasks = () => {
    try {
      if (tasks.length === 0) {
        toast.error('No tasks to export')
        return
      }
      const exportData = formatTasksForExport(tasks, users)
      exportToExcel(exportData, `Tasks_${new Date().toISOString().split('T')[0]}`, 'Tasks')
      toast.success('Tasks exported to Excel')
    } catch (error) {
      toast.error('Failed to export tasks')
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tasks</h1>
          <p className="text-muted-foreground">Manage your tasks and to-dos</p>
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExportTasks}>
                <FileDown className="h-4 w-4 mr-2" />
                Export to Excel
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Add Task
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
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
            <SelectItem value="Todo">Todo</SelectItem>
            <SelectItem value="In Progress">In Progress</SelectItem>
            <SelectItem value="Completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {filteredTasks.map((task) => (
          <Card key={task.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => toggleStatus(task)}
                  className={`p-2 rounded-full transition-colors ${
                    task.status === 'Completed'
                      ? 'bg-green-500/20 text-green-600'
                      : 'bg-secondary hover:bg-secondary/80'
                  }`}
                >
                  <CheckSquare className="h-5 w-5" />
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3
                      className={`font-medium ${
                        task.status === 'Completed' ? 'line-through text-muted-foreground' : ''
                      }`}
                    >
                      {task.title}
                    </h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${priorityColors[task.priority]}`}>
                      {task.priority}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${statusColors[task.status]}`}>
                      {task.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {format(new Date(task.dueDate), 'MMM d, yyyy')}
                    </span>
                    <span>Assigned to: {getUserName(task.assignedTo)}</span>
                    {getCaseTitle(task.caseId) && (
                      <span>Case: {getCaseTitle(task.caseId)}</span>
                    )}
                  </div>
                </div>

                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => openEditDialog(task)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(task)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredTasks.length === 0 && (
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No tasks found</p>
            <Button variant="link" onClick={openCreateDialog}>
              Create your first task
            </Button>
          </div>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingTask ? 'Edit Task' : 'Add New Task'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter task title"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Task description..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="assignedTo">Assign To *</Label>
                <Select
                  value={formData.assignedTo}
                  onValueChange={(value) => setFormData({ ...formData, assignedTo: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select user" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date *</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priority">Priority *</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value: 'Low' | 'Medium' | 'High' | 'Urgent') =>
                    setFormData({ ...formData, priority: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: 'Todo' | 'In Progress' | 'Completed') =>
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Todo">Todo</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="caseId">Related Case (Optional)</Label>
              <Select
                value={formData.caseId}
                onValueChange={(value) => setFormData({ ...formData, caseId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select case (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {cases.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Saving...' : editingTask ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

