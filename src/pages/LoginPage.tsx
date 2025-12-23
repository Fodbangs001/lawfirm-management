import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { AlertCircle, Loader2, Eye, EyeOff, Globe } from 'lucide-react'
import { Language, languages, getCurrentLanguage, setLanguage, t } from '@/lib/i18n'

export function LoginPage() {
  const { login, register } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [currentLang, setCurrentLang] = useState<Language>(getCurrentLanguage())

  // Login form
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  // Register form
  const [regName, setRegName] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regConfirmPassword, setRegConfirmPassword] = useState('')
  const [regRole, setRegRole] = useState('Staff')

  // Apply language direction on mount and change
  useEffect(() => {
    const langInfo = languages.find(l => l.code === currentLang)
    if (langInfo) {
      document.documentElement.dir = langInfo.direction
      document.documentElement.lang = currentLang
    }
  }, [currentLang])

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang)
    setCurrentLang(lang)
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    const result = await login(loginEmail, loginPassword)
    if (!result.success) {
      setError(t('error.credentials', currentLang))
    }
    setIsLoading(false)
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (regPassword !== regConfirmPassword) {
      setError(t('error.passwordMatch', currentLang))
      return
    }

    if (regPassword.length < 6) {
      setError(t('error.passwordLength', currentLang))
      return
    }

    setIsLoading(true)
    const result = await register(regName, regEmail, regPassword, regRole)
    if (!result.success) {
      setError(result.error || 'Registration failed')
    }
    setIsLoading(false)
  }

  const currentLangInfo = languages.find(l => l.code === currentLang)

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      {/* Language Selector - Top Right */}
      <div className="absolute top-4 right-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2 bg-white/10 border-white/20 text-white hover:bg-white/20">
              <Globe className="h-4 w-4" />
              <span className="text-lg">{currentLangInfo?.flag}</span>
              <span className="hidden sm:inline">{currentLangInfo?.nativeName}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {languages.map((lang) => (
              <DropdownMenuItem
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={`gap-3 cursor-pointer ${currentLang === lang.code ? 'bg-primary/10' : ''}`}
              >
                <span className="text-xl">{lang.flag}</span>
                <div className="flex flex-col">
                  <span className="font-medium">{lang.nativeName}</span>
                  <span className="text-xs text-muted-foreground">{lang.name}</span>
                </div>
                {currentLang === lang.code && (
                  <span className="ml-auto text-primary">✓</span>
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-20 h-20 flex items-center justify-center">
            <img src="/LLAW.png" alt="Law Firm" className="w-full h-full object-contain" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">{t('login.title', currentLang)}</CardTitle>
            <CardDescription>{t('login.subtitle', currentLang)}</CardDescription>
          </div>
        </CardHeader>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mx-4" style={{ width: 'calc(100% - 2rem)' }}>
            <TabsTrigger value="login">{t('login.tab.login', currentLang)}</TabsTrigger>
            <TabsTrigger value="register">{t('login.tab.register', currentLang)}</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <form onSubmit={handleLogin}>
              <CardContent className="space-y-4">
                {error && (
                  <div className="flex items-center gap-2 p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                    <AlertCircle className="h-4 w-4" />
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">{t('login.email', currentLang)}</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder={t('login.email.placeholder', currentLang)}
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                    disabled={isLoading}
                    dir="ltr"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">{t('login.password', currentLang)}</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                      disabled={isLoading}
                      dir="ltr"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="text-sm text-muted-foreground">
                  <p>{t('login.demo', currentLang)}</p>
                  <ul className="list-disc list-inside text-xs mt-1" dir="ltr">
                    <li>admin@lawfirm.com / admin123</li>
                    <li>john@lawfirm.com / admin123</li>
                  </ul>
                </div>
              </CardContent>

              <CardFooter>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {isLoading ? t('login.loading', currentLang) : t('login.button', currentLang)}
                </Button>
              </CardFooter>
            </form>
          </TabsContent>

          <TabsContent value="register">
            <form onSubmit={handleRegister}>
              <CardContent className="space-y-4">
                {error && (
                  <div className="flex items-center gap-2 p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                    <AlertCircle className="h-4 w-4" />
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="reg-name">{t('register.name', currentLang)}</Label>
                  <Input
                    id="reg-name"
                    type="text"
                    placeholder={t('register.name.placeholder', currentLang)}
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reg-email">{t('register.email', currentLang)}</Label>
                  <Input
                    id="reg-email"
                    type="email"
                    placeholder={t('register.email.placeholder', currentLang)}
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    required
                    disabled={isLoading}
                    dir="ltr"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reg-role">Role</Label>
                  <select
                    id="reg-role"
                    value={regRole}
                    onChange={(e) => setRegRole(e.target.value)}
                    disabled={isLoading}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="Staff">Staff</option>
                    <option value="Paralegal">Paralegal</option>
                    <option value="Lawyer">Attorney</option>
                    <option value="Admin">Administrator</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reg-password">{t('register.password', currentLang)}</Label>
                  <Input
                    id="reg-password"
                    type="password"
                    placeholder={t('register.password.placeholder', currentLang)}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    dir="ltr"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reg-confirm">{t('register.confirmPassword', currentLang)}</Label>
                  <Input
                    id="reg-confirm"
                    type="password"
                    placeholder={t('register.confirmPassword.placeholder', currentLang)}
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    dir="ltr"
                  />
                </div>
              </CardContent>

              <CardFooter>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {isLoading ? t('register.loading', currentLang) : t('register.button', currentLang)}
                </Button>
              </CardFooter>
            </form>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  )
}

