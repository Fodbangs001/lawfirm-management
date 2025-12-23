import { ReactNode, useRef } from 'react'
import { useAuth } from '@/lib/auth'
import {
  LayoutDashboard,
  Users,
  Briefcase,
  CheckSquare,
  Calendar,
  MessageSquare,
  Clock,
  Settings,
  LogOut,
  Menu,
  X,
  Globe,
  Gavel,
  FileDown,
  FileUp,
  ChevronDown,
  ChevronUp,
  Upload,
  UserCog,
  BarChart3,
  FolderOpen
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface LayoutProps {
  children: ReactNode
  activeView: string
  onNavigate: (view: string) => void
  onExport?: (type: 'clients' | 'cases' | 'tasks' | 'billing' | 'court-logs' | 'all') => void
  onImport?: (type: 'clients' | 'cases' | 'tasks', file: File) => void
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'clients', label: 'Clients', icon: Users },
  { id: 'cases', label: 'Cases', icon: Briefcase },
  { id: 'asylum', label: 'Asylum/Immigration', icon: Globe },
  { id: 'court-log', label: 'Court Log', icon: Gavel },
  { id: 'documents', label: 'Documents', icon: FolderOpen },
  { id: 'tasks', label: 'Tasks', icon: CheckSquare },
  { id: 'calendar', label: 'Calendar', icon: Calendar },
  { id: 'messages', label: 'Messages', icon: MessageSquare },
  { id: 'billing', label: 'Time & Billing', icon: Clock },
  { id: 'reports', label: 'Reports', icon: BarChart3 },
  { id: 'users', label: 'Users', icon: UserCog },
  { id: 'settings', label: 'Settings', icon: Settings },
]

export function Layout({ children, activeView, onNavigate, onExport, onImport }: LayoutProps) {
  const { user, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [exportMenuOpen, setExportMenuOpen] = useState(false)
  const [importMenuOpen, setImportMenuOpen] = useState(false)

  // File input refs for import
  const clientsFileRef = useRef<HTMLInputElement>(null)
  const casesFileRef = useRef<HTMLInputElement>(null)
  const tasksFileRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (type: 'clients' | 'cases' | 'tasks', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && onImport) {
      onImport(type, file)
      e.target.value = '' // Reset input
    }
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col bg-card border-r transition-all duration-300",
          sidebarOpen ? "w-64" : "w-16"
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-4 border-b">
          {sidebarOpen && (
            <div className="flex items-center gap-3">
              <img src="/LLAW.png" alt="Law Firm" className="h-8 w-8" />
              <span className="font-bold text-primary">Law Firm</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                activeView === item.id
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-secondary text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon size={20} />
              {sidebarOpen && <span>{item.label}</span>}
            </button>
          ))}

          {/* Export Excel Menu */}
          {onExport && (
            <div className="pt-2 mt-2 border-t">
              <button
                onClick={() => setExportMenuOpen(!exportMenuOpen)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                  "hover:bg-secondary text-muted-foreground hover:text-foreground"
                )}
              >
                <FileDown size={20} />
                {sidebarOpen && (
                  <>
                    <span className="flex-1 text-left">Export Excel</span>
                    {exportMenuOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </>
                )}
              </button>

              {exportMenuOpen && sidebarOpen && (
                <div className="ml-6 mt-1 space-y-1">
                  <button
                    onClick={() => onExport('clients')}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground"
                  >
                    <Users size={16} />
                    Clients
                  </button>
                  <button
                    onClick={() => onExport('cases')}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground"
                  >
                    <Briefcase size={16} />
                    Cases
                  </button>
                  <button
                    onClick={() => onExport('tasks')}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground"
                  >
                    <CheckSquare size={16} />
                    Tasks
                  </button>
                  <button
                    onClick={() => onExport('court-logs')}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground"
                  >
                    <Gavel size={16} />
                    Court Logs
                  </button>
                  <button
                    onClick={() => onExport('billing')}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground"
                  >
                    <Clock size={16} />
                    Time & Billing
                  </button>
                  <button
                    onClick={() => onExport('all')}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg hover:bg-primary/10 text-primary font-medium"
                  >
                    <FileDown size={16} />
                    Export All
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Import Excel Menu */}
          {onImport && (
            <div className="mt-1">
              <button
                onClick={() => setImportMenuOpen(!importMenuOpen)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                  "hover:bg-secondary text-muted-foreground hover:text-foreground"
                )}
              >
                <FileUp size={20} />
                {sidebarOpen && (
                  <>
                    <span className="flex-1 text-left">Import Excel</span>
                    {importMenuOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </>
                )}
              </button>

              {importMenuOpen && sidebarOpen && (
                <div className="ml-6 mt-1 space-y-1">
                  {/* Hidden file inputs */}
                  <input
                    type="file"
                    ref={clientsFileRef}
                    accept=".xlsx,.xls,.csv"
                    className="hidden"
                    onChange={(e) => handleFileChange('clients', e)}
                  />
                  <input
                    type="file"
                    ref={casesFileRef}
                    accept=".xlsx,.xls,.csv"
                    className="hidden"
                    onChange={(e) => handleFileChange('cases', e)}
                  />
                  <input
                    type="file"
                    ref={tasksFileRef}
                    accept=".xlsx,.xls,.csv"
                    className="hidden"
                    onChange={(e) => handleFileChange('tasks', e)}
                  />

                  <button
                    onClick={() => clientsFileRef.current?.click()}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground"
                  >
                    <Users size={16} />
                    Import Clients
                  </button>
                  <button
                    onClick={() => casesFileRef.current?.click()}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground"
                  >
                    <Briefcase size={16} />
                    Import Cases
                  </button>
                  <button
                    onClick={() => tasksFileRef.current?.click()}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground"
                  >
                    <CheckSquare size={16} />
                    Import Tasks
                  </button>
                  <p className="text-xs text-muted-foreground px-3 py-1">
                    Supports .xlsx, .xls, .csv
                  </p>
                </div>
              )}
            </div>
          )}
        </nav>

        {/* User */}
        <div className="p-4 border-t">
          <div className={cn("flex items-center gap-3", !sidebarOpen && "justify-center")}>
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold">
              {user?.name?.charAt(0) || 'U'}
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.role}</p>
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size={sidebarOpen ? "default" : "icon"}
            onClick={logout}
            className={cn("w-full mt-2", !sidebarOpen && "justify-center")}
          >
            <LogOut size={18} />
            {sidebarOpen && <span className="ml-2">Logout</span>}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main
        className={cn(
          "flex-1 overflow-auto transition-all duration-300",
          sidebarOpen ? "ml-64" : "ml-16"
        )}
      >
        {children}
      </main>
    </div>
  )
}

