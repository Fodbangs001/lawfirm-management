import { ReactNode, useRef } from 'react'
import { useAuth } from '@/lib/auth'
import { useT } from '@/lib/useI18n'
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
  { id: 'dashboard', labelKey: 'nav.dashboard', icon: LayoutDashboard },
  { id: 'clients', labelKey: 'nav.clients', icon: Users },
  { id: 'cases', labelKey: 'nav.cases', icon: Briefcase },
  { id: 'asylum', labelKey: 'nav.asylum', icon: Globe },
  { id: 'court-log', labelKey: 'nav.courtLog', icon: Gavel },
  { id: 'documents', labelKey: 'nav.documents', icon: FolderOpen },
  { id: 'tasks', labelKey: 'nav.tasks', icon: CheckSquare },
  { id: 'calendar', labelKey: 'nav.calendar', icon: Calendar },
  { id: 'messages', labelKey: 'nav.messages', icon: MessageSquare },
  { id: 'billing', labelKey: 'nav.billing', icon: Clock },
  { id: 'reports', labelKey: 'nav.reports', icon: BarChart3 },
  { id: 'users', labelKey: 'nav.users', icon: UserCog },
  { id: 'settings', labelKey: 'nav.settings', icon: Settings },
]

// WhatsApp Icon Component
const WhatsAppIcon = ({ size = 24 }: { size?: number }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
)

// WhatsApp Support Button Component
function WhatsAppSupportButton() {
  const phoneNumber = '35794401613'
  const message = 'Hello! I need support with the Law Firm Management System.'
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 bg-[#25D366] hover:bg-[#20BD5A] text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 group"
      title="Chat with us on WhatsApp"
    >
      <WhatsAppIcon size={28} />
      
      {/* Tooltip */}
      <span className="absolute right-16 bg-gray-900 text-white text-sm px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap pointer-events-none">
        Need Help? Chat with us!
      </span>
      
      {/* Pulse animation */}
      <span className="absolute w-full h-full rounded-full bg-[#25D366] animate-ping opacity-30"></span>
    </a>
  )
}

export function Layout({ children, activeView, onNavigate, onExport, onImport }: LayoutProps) {
  const { user, logout } = useAuth()
  const t = useT()
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
              {sidebarOpen && <span>{t(item.labelKey)}</span>}
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
                    <span className="flex-1 text-left">{t('nav.exportExcel')}</span>
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
                    {t('nav.clients')}
                  </button>
                  <button
                    onClick={() => onExport('cases')}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground"
                  >
                    <Briefcase size={16} />
                    {t('nav.cases')}
                  </button>
                  <button
                    onClick={() => onExport('tasks')}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground"
                  >
                    <CheckSquare size={16} />
                    {t('nav.tasks')}
                  </button>
                  <button
                    onClick={() => onExport('court-logs')}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground"
                  >
                    <Gavel size={16} />
                    {t('nav.courtLog')}
                  </button>
                  <button
                    onClick={() => onExport('billing')}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground"
                  >
                    <Clock size={16} />
                    {t('nav.billing')}
                  </button>
                  <button
                    onClick={() => onExport('all')}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg hover:bg-primary/10 text-primary font-medium"
                  >
                    <FileDown size={16} />
                    {t('nav.exportAll')}
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
                    <span className="flex-1 text-left">{t('nav.importExcel')}</span>
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
                    {t('nav.clients')}
                  </button>
                  <button
                    onClick={() => casesFileRef.current?.click()}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground"
                  >
                    <Briefcase size={16} />
                    {t('nav.cases')}
                  </button>
                  <button
                    onClick={() => tasksFileRef.current?.click()}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground"
                  >
                    <CheckSquare size={16} />
                    {t('nav.tasks')}
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
            {sidebarOpen && <span className="ml-2">{t('nav.logout')}</span>}
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

      {/* WhatsApp Support Button */}
      <WhatsAppSupportButton />
    </div>
  )
}

