import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import {
  Settings,
  User as UserIcon,
  Shield,
  Palette,
  Moon,
  Sun,
  Monitor,
  Save,
  Eye,
  EyeOff,
  DollarSign
} from 'lucide-react'
import { toast } from 'sonner'
import { currencies } from '@/lib/currency'

export function SettingsPage() {
  const { user } = useAuth()

  // Theme state
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(() => {
    return (localStorage.getItem('theme') as 'light' | 'dark' | 'system') || 'system'
  })


  // Profile state
  const [profile, setProfile] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
  })

  // Password state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPasswords, setShowPasswords] = useState(false)

  // General settings
  const [autoSave, setAutoSave] = useState(true)
  const [compactView, setCompactView] = useState(false)
  const [defaultView, setDefaultView] = useState('dashboard')
  const [itemsPerPage, setItemsPerPage] = useState('25')
  const [currency, setCurrency] = useState(() => {
    return localStorage.getItem('currency') || 'USD'
  })


  const handleCurrencyChange = (newCurrency: string) => {
    setCurrency(newCurrency)
    localStorage.setItem('currency', newCurrency)
    toast.success(`Currency changed to ${newCurrency}`)
  }

  // Apply theme
  useEffect(() => {
    const root = document.documentElement

    const applyTheme = (isDark: boolean) => {
      if (isDark) {
        root.classList.add('dark')
        root.style.colorScheme = 'dark'
      } else {
        root.classList.remove('dark')
        root.style.colorScheme = 'light'
      }
    }

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      applyTheme(mediaQuery.matches)

      // Listen for system theme changes
      const handleChange = (e: MediaQueryListEvent) => {
        applyTheme(e.matches)
      }
      mediaQuery.addEventListener('change', handleChange)

      localStorage.setItem('theme', theme)
      return () => mediaQuery.removeEventListener('change', handleChange)
    } else if (theme === 'dark') {
      applyTheme(true)
    } else {
      applyTheme(false)
    }

    localStorage.setItem('theme', theme)
  }, [theme])

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme)
    toast.success(`Theme changed to ${newTheme}`)
  }

  const handleProfileUpdate = () => {
    toast.success('Profile updated successfully')
  }

  const handlePasswordChange = () => {
    if (!currentPassword) {
      toast.error('Please enter your current password')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match')
      return
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    // In a real app, you'd call an API here
    toast.success('Password updated successfully')
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
  }


  const handleGeneralSave = () => {
    toast.success('General settings saved')
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Settings className="h-8 w-8" />
          Settings
        </h1>
        <p className="text-muted-foreground">Manage your application preferences and account settings</p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="theme">Theme</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                General Settings
              </CardTitle>
              <CardDescription>Configure general application settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto-save</Label>
                  <p className="text-sm text-muted-foreground">Automatically save changes</p>
                </div>
                <Switch checked={autoSave} onCheckedChange={setAutoSave} />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Compact View</Label>
                  <p className="text-sm text-muted-foreground">Show more data in less space</p>
                </div>
                <Switch checked={compactView} onCheckedChange={setCompactView} />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Default View</Label>
                <Select value={defaultView} onValueChange={setDefaultView}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dashboard">Dashboard</SelectItem>
                    <SelectItem value="clients">Clients</SelectItem>
                    <SelectItem value="cases">Cases</SelectItem>
                    <SelectItem value="calendar">Calendar</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Items per page</Label>
                <Select value={itemsPerPage} onValueChange={setItemsPerPage}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Currency
                </Label>
                <p className="text-sm text-muted-foreground">
                  Select the currency used for billing and payments
                </p>
                <Select value={currency} onValueChange={handleCurrencyChange}>
                  <SelectTrigger>
                    <SelectValue>
                      {currencies.find(c => c.code === currency)?.symbol} {currency} - {currencies.find(c => c.code === currency)?.name}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {currencies.map((curr) => (
                      <SelectItem key={curr.code} value={curr.code}>
                        <span className="flex items-center gap-2">
                          <span className="w-6 text-center font-medium">{curr.symbol}</span>
                          <span>{curr.code}</span>
                          <span className="text-muted-foreground">- {curr.name}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <Button onClick={handleGeneralSave}>
                <Save className="mr-2 h-4 w-4" />
                Save Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Profile Settings */}
        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserIcon className="h-5 w-5" />
                Profile Settings
              </CardTitle>
              <CardDescription>Update your personal information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-2xl font-bold">
                  {user?.name?.split(' ').map((n: string) => n[0]).join('') || 'U'}
                </div>
                <div>
                  <Button variant="outline" size="sm">Change Avatar</Button>
                  <p className="text-xs text-muted-foreground mt-1">JPG, PNG or GIF (max. 2MB)</p>
                </div>
              </div>

              <Separator />

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="profile-name">Full Name</Label>
                  <Input
                    id="profile-name"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="profile-email">Email</Label>
                  <Input
                    id="profile-email"
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="profile-phone">Phone</Label>
                  <Input
                    id="profile-phone"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="profile-role">Role</Label>
                  <Input
                    id="profile-role"
                    value={user?.role || 'Staff'}
                    disabled
                    className="bg-muted"
                  />
                </div>
              </div>

              <Separator />

              <Button onClick={handleProfileUpdate}>
                <Save className="mr-2 h-4 w-4" />
                Save Profile
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Theme Settings */}
        <TabsContent value="theme" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Theme Settings
              </CardTitle>
              <CardDescription>Customize the appearance of your application</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Label>Theme Mode</Label>
                <div className="grid grid-cols-3 gap-4">
                  <Card
                    className={`cursor-pointer border-2 transition-all hover:shadow-md ${
                      theme === 'light' ? 'border-primary bg-primary/5' : 'border-border'
                    }`}
                    onClick={() => handleThemeChange('light')}
                  >
                    <CardContent className="p-6 flex flex-col items-center gap-2">
                      <Sun className="h-8 w-8" />
                      <span className="font-medium">Light</span>
                    </CardContent>
                  </Card>
                  <Card
                    className={`cursor-pointer border-2 transition-all hover:shadow-md ${
                      theme === 'dark' ? 'border-primary bg-primary/5' : 'border-border'
                    }`}
                    onClick={() => handleThemeChange('dark')}
                  >
                    <CardContent className="p-6 flex flex-col items-center gap-2">
                      <Moon className="h-8 w-8" />
                      <span className="font-medium">Dark</span>
                    </CardContent>
                  </Card>
                  <Card
                    className={`cursor-pointer border-2 transition-all hover:shadow-md ${
                      theme === 'system' ? 'border-primary bg-primary/5' : 'border-border'
                    }`}
                    onClick={() => handleThemeChange('system')}
                  >
                    <CardContent className="p-6 flex flex-col items-center gap-2">
                      <Monitor className="h-8 w-8" />
                      <span className="font-medium">System</span>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <Label>Accent Colors</Label>
                <div className="grid grid-cols-8 gap-2">
                  {[
                    { color: 'bg-amber-500', name: 'Gold' },
                    { color: 'bg-blue-500', name: 'Blue' },
                    { color: 'bg-green-500', name: 'Green' },
                    { color: 'bg-orange-500', name: 'Orange' },
                    { color: 'bg-red-500', name: 'Red' },
                    { color: 'bg-purple-500', name: 'Purple' },
                    { color: 'bg-pink-500', name: 'Pink' },
                    { color: 'bg-gray-500', name: 'Gray' }
                  ].map((item) => (
                    <Button
                      key={item.name}
                      variant="outline"
                      size="icon"
                      className={`w-10 h-10 rounded-full ${item.color} border-0 hover:scale-110 transition-transform`}
                      onClick={() => toast.success(`${item.name} accent applied`)}
                      title={item.name}
                    />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Settings
              </CardTitle>
              <CardDescription>Manage your account security and privacy</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-semibold">Change Password</h3>
                <div className="grid gap-4 max-w-md">
                  <div className="space-y-2">
                    <Label htmlFor="current-password">Current Password</Label>
                    <div className="relative">
                      <Input
                        id="current-password"
                        type={showPasswords ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input
                      id="new-password"
                      type={showPasswords ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm New Password</Label>
                    <Input
                      id="confirm-password"
                      type={showPasswords ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                    {confirmPassword && newPassword !== confirmPassword && (
                      <p className="text-sm text-destructive">Passwords do not match</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowPasswords(!showPasswords)}
                    >
                      {showPasswords ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
                      {showPasswords ? 'Hide' : 'Show'} passwords
                    </Button>
                  </div>
                  <Button onClick={handlePasswordChange} className="w-fit">
                    Update Password
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Two-Factor Authentication</Label>
                  <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
                </div>
                <Switch />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Session Timeout</Label>
                <Select defaultValue="30">
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="never">Never</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">Automatically log out after inactivity</p>
              </div>

              <Separator />

              <div className="space-y-2">
                <h3 className="font-semibold">Active Sessions</h3>
                <div className="border rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium">Current Session</p>
                    <p className="text-sm text-muted-foreground">Windows - Chrome • Last active: Now</p>
                  </div>
                  <Button variant="outline" size="sm" disabled>Current</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

