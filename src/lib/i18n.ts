// Language translations for the application

export type Language = 'en' | 'ar' | 'fr' | 'el'

export interface LanguageInfo {
  code: Language
  name: string
  nativeName: string
  direction: 'ltr' | 'rtl'
  flag: string
}

export const languages: LanguageInfo[] = [
  { code: 'en', name: 'English', nativeName: 'English', direction: 'ltr', flag: '🇬🇧' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', direction: 'rtl', flag: '🇸🇦' },
  { code: 'fr', name: 'French', nativeName: 'Français', direction: 'ltr', flag: '🇫🇷' },
  { code: 'el', name: 'Greek', nativeName: 'Ελληνικά', direction: 'ltr', flag: '🇬🇷' },
]

export const translations: Record<Language, Record<string, string>> = {
  en: {
    // Login Page
    'login.title': 'Law Firm Management',
    'login.subtitle': 'Sign in to access your account',
    'login.tab.login': 'Login',
    'login.tab.register': 'Register',
    'login.email': 'Email',
    'login.email.placeholder': 'Enter your email',
    'login.password': 'Password',
    'login.password.placeholder': 'Enter your password',
    'login.button': 'Sign In',
    'login.loading': 'Signing in...',
    'login.demo': 'Demo accounts:',
    'login.forgotPassword': 'Forgot password?',

    // Register
    'register.name': 'Full Name',
    'register.name.placeholder': 'Enter your full name',
    'register.email': 'Email',
    'register.email.placeholder': 'Enter your email',
    'register.password': 'Password',
    'register.password.placeholder': 'Create a password',
    'register.confirmPassword': 'Confirm Password',
    'register.confirmPassword.placeholder': 'Confirm your password',
    'register.button': 'Create Account',
    'register.loading': 'Creating account...',

    // Common
    'language': 'Language',
    'error.credentials': 'Invalid email or password',
    'error.required': 'This field is required',
    'error.email': 'Please enter a valid email',
    'error.passwordMatch': 'Passwords do not match',
    'error.passwordLength': 'Password must be at least 6 characters',
    'success.login': 'Welcome back!',
    'success.register': 'Account created successfully!',

    // Dashboard & Navigation
    'nav.dashboard': 'Dashboard',
    'nav.clients': 'Clients',
    'nav.cases': 'Cases',
    'nav.asylum': 'Asylum/Immigration',
    'nav.courtLog': 'Court Detail',
    'nav.documents': 'Documents',
    'nav.tasks': 'Tasks',
    'nav.calendar': 'Calendar',
    'nav.messages': 'Messages',
    'nav.billing': 'Time & Billing',
    'nav.reports': 'Reports',
    'nav.users': 'Users',
    'nav.settings': 'Settings',
    'nav.logout': 'Logout',
    
    // Export/Import
    'nav.exportExcel': 'Export Excel',
    'nav.importExcel': 'Import Excel',
    'nav.exportAll': 'Export All',
    
    // Common actions
    'action.add': 'Add',
    'action.edit': 'Edit',
    'action.delete': 'Delete',
    'action.save': 'Save',
    'action.cancel': 'Cancel',
    'action.search': 'Search',
    'action.refresh': 'Refresh',
    'action.close': 'Close',
  },

  ar: {
    // Login Page
    'login.title': 'إدارة مكتب المحاماة',
    'login.subtitle': 'سجل الدخول للوصول إلى حسابك',
    'login.tab.login': 'تسجيل الدخول',
    'login.tab.register': 'إنشاء حساب',
    'login.email': 'البريد الإلكتروني',
    'login.email.placeholder': 'أدخل بريدك الإلكتروني',
    'login.password': 'كلمة المرور',
    'login.password.placeholder': 'أدخل كلمة المرور',
    'login.button': 'تسجيل الدخول',
    'login.loading': 'جاري تسجيل الدخول...',
    'login.demo': 'حسابات تجريبية:',
    'login.forgotPassword': 'نسيت كلمة المرور؟',

    // Register
    'register.name': 'الاسم الكامل',
    'register.name.placeholder': 'أدخل اسمك الكامل',
    'register.email': 'البريد الإلكتروني',
    'register.email.placeholder': 'أدخل بريدك الإلكتروني',
    'register.password': 'كلمة المرور',
    'register.password.placeholder': 'أنشئ كلمة مرور',
    'register.confirmPassword': 'تأكيد كلمة المرور',
    'register.confirmPassword.placeholder': 'أكد كلمة المرور',
    'register.button': 'إنشاء حساب',
    'register.loading': 'جاري إنشاء الحساب...',

    // Common
    'language': 'اللغة',
    'error.credentials': 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
    'error.required': 'هذا الحقل مطلوب',
    'error.email': 'يرجى إدخال بريد إلكتروني صحيح',
    'error.passwordMatch': 'كلمتا المرور غير متطابقتين',
    'error.passwordLength': 'يجب أن تكون كلمة المرور 6 أحرف على الأقل',
    'success.login': 'مرحباً بعودتك!',
    'success.register': 'تم إنشاء الحساب بنجاح!',

    // Dashboard & Navigation
    'nav.dashboard': 'لوحة التحكم',
    'nav.clients': 'العملاء',
    'nav.cases': 'القضايا',
    'nav.asylum': 'اللجوء/الهجرة',
    'nav.courtLog': 'تفاصيل المحكمة',
    'nav.documents': 'المستندات',
    'nav.tasks': 'المهام',
    'nav.calendar': 'التقويم',
    'nav.messages': 'الرسائل',
    'nav.billing': 'الفواتير والمدفوعات',
    'nav.reports': 'التقارير',
    'nav.users': 'المستخدمون',
    'nav.settings': 'الإعدادات',
    'nav.logout': 'تسجيل الخروج',
    
    // Export/Import
    'nav.exportExcel': 'تصدير Excel',
    'nav.importExcel': 'استيراد Excel',
    'nav.exportAll': 'تصدير الكل',
    
    // Common actions
    'action.add': 'إضافة',
    'action.edit': 'تعديل',
    'action.delete': 'حذف',
    'action.save': 'حفظ',
    'action.cancel': 'إلغاء',
    'action.search': 'بحث',
    'action.refresh': 'تحديث',
    'action.close': 'إغلاق',
  },

  fr: {
    // Login Page
    'login.title': 'Gestion de Cabinet d\'Avocats',
    'login.subtitle': 'Connectez-vous pour accéder à votre compte',
    'login.tab.login': 'Connexion',
    'login.tab.register': 'S\'inscrire',
    'login.email': 'Email',
    'login.email.placeholder': 'Entrez votre email',
    'login.password': 'Mot de passe',
    'login.password.placeholder': 'Entrez votre mot de passe',
    'login.button': 'Se Connecter',
    'login.loading': 'Connexion en cours...',
    'login.demo': 'Comptes de démonstration:',
    'login.forgotPassword': 'Mot de passe oublié?',

    // Register
    'register.name': 'Nom Complet',
    'register.name.placeholder': 'Entrez votre nom complet',
    'register.email': 'Email',
    'register.email.placeholder': 'Entrez votre email',
    'register.password': 'Mot de passe',
    'register.password.placeholder': 'Créez un mot de passe',
    'register.confirmPassword': 'Confirmer le mot de passe',
    'register.confirmPassword.placeholder': 'Confirmez votre mot de passe',
    'register.button': 'Créer un Compte',
    'register.loading': 'Création du compte...',

    // Common
    'language': 'Langue',
    'error.credentials': 'Email ou mot de passe invalide',
    'error.required': 'Ce champ est requis',
    'error.email': 'Veuillez entrer un email valide',
    'error.passwordMatch': 'Les mots de passe ne correspondent pas',
    'error.passwordLength': 'Le mot de passe doit contenir au moins 6 caractères',
    'success.login': 'Bon retour!',
    'success.register': 'Compte créé avec succès!',

    // Dashboard & Navigation
    'nav.dashboard': 'Tableau de Bord',
    'nav.clients': 'Clients',
    'nav.cases': 'Dossiers',
    'nav.asylum': 'Asile/Immigration',
    'nav.courtLog': 'Détails du Tribunal',
    'nav.documents': 'Documents',
    'nav.tasks': 'Tâches',
    'nav.calendar': 'Calendrier',
    'nav.messages': 'Messages',
    'nav.billing': 'Facturation',
    'nav.reports': 'Rapports',
    'nav.users': 'Utilisateurs',
    'nav.settings': 'Paramètres',
    'nav.logout': 'Déconnexion',
    
    // Export/Import
    'nav.exportExcel': 'Exporter Excel',
    'nav.importExcel': 'Importer Excel',
    'nav.exportAll': 'Tout Exporter',
    
    // Common actions
    'action.add': 'Ajouter',
    'action.edit': 'Modifier',
    'action.delete': 'Supprimer',
    'action.save': 'Enregistrer',
    'action.cancel': 'Annuler',
    'action.search': 'Rechercher',
    'action.refresh': 'Actualiser',
    'action.close': 'Fermer',
  },

  el: {
    // Login Page
    'login.title': 'Διαχείριση Δικηγορικού Γραφείου',
    'login.subtitle': 'Συνδεθείτε για πρόσβαση στον λογαριασμό σας',
    'login.tab.login': 'Σύνδεση',
    'login.tab.register': 'Εγγραφή',
    'login.email': 'Email',
    'login.email.placeholder': 'Εισάγετε το email σας',
    'login.password': 'Κωδικός',
    'login.password.placeholder': 'Εισάγετε τον κωδικό σας',
    'login.button': 'Είσοδος',
    'login.loading': 'Σύνδεση...',
    'login.demo': 'Δοκιμαστικοί λογαριασμοί:',
    'login.forgotPassword': 'Ξεχάσατε τον κωδικό;',

    // Register
    'register.name': 'Ονοματεπώνυμο',
    'register.name.placeholder': 'Εισάγετε το ονοματεπώνυμό σας',
    'register.email': 'Email',
    'register.email.placeholder': 'Εισάγετε το email σας',
    'register.password': 'Κωδικός',
    'register.password.placeholder': 'Δημιουργήστε κωδικό',
    'register.confirmPassword': 'Επιβεβαίωση Κωδικού',
    'register.confirmPassword.placeholder': 'Επιβεβαιώστε τον κωδικό',
    'register.button': 'Δημιουργία Λογαριασμού',
    'register.loading': 'Δημιουργία λογαριασμού...',

    // Common
    'language': 'Γλώσσα',
    'error.credentials': 'Λάθος email ή κωδικός',
    'error.required': 'Αυτό το πεδίο είναι υποχρεωτικό',
    'error.email': 'Παρακαλώ εισάγετε έγκυρο email',
    'error.passwordMatch': 'Οι κωδικοί δεν ταιριάζουν',
    'error.passwordLength': 'Ο κωδικός πρέπει να είναι τουλάχιστον 6 χαρακτήρες',
    'success.login': 'Καλώς ήρθατε!',
    'success.register': 'Ο λογαριασμός δημιουργήθηκε επιτυχώς!',

    // Dashboard & Navigation
    'nav.dashboard': 'Πίνακας Ελέγχου',
    'nav.clients': 'Πελάτες',
    'nav.cases': 'Υποθέσεις',
    'nav.asylum': 'Άσυλο/Μετανάστευση',
    'nav.courtLog': 'Λεπτομέρειες Δικαστηρίου',
    'nav.documents': 'Έγγραφα',
    'nav.tasks': 'Εργασίες',
    'nav.calendar': 'Ημερολόγιο',
    'nav.messages': 'Μηνύματα',
    'nav.billing': 'Χρεώσεις & Πληρωμές',
    'nav.reports': 'Αναφορές',
    'nav.users': 'Χρήστες',
    'nav.settings': 'Ρυθμίσεις',
    'nav.logout': 'Αποσύνδεση',
    
    // Export/Import
    'nav.exportExcel': 'Εξαγωγή Excel',
    'nav.importExcel': 'Εισαγωγή Excel',
    'nav.exportAll': 'Εξαγωγή Όλων',
    
    // Common actions
    'action.add': 'Προσθήκη',
    'action.edit': 'Επεξεργασία',
    'action.delete': 'Διαγραφή',
    'action.save': 'Αποθήκευση',
    'action.cancel': 'Ακύρωση',
    'action.search': 'Αναζήτηση',
    'action.refresh': 'Ανανέωση',
    'action.close': 'Κλείσιμο',
  },
}

// Get current language from localStorage
export function getCurrentLanguage(): Language {
  const saved = localStorage.getItem('language')
  if (saved && ['en', 'ar', 'fr', 'el'].includes(saved)) {
    return saved as Language
  }
  return 'en'
}

// Set language
export function setLanguage(lang: Language) {
  localStorage.setItem('language', lang)
  // Update document direction for RTL languages
  const langInfo = languages.find(l => l.code === lang)
  if (langInfo) {
    document.documentElement.dir = langInfo.direction
    document.documentElement.lang = lang
  }
}

// Get translation
export function t(key: string, lang?: Language): string {
  const currentLang = lang || getCurrentLanguage()
  return translations[currentLang]?.[key] || translations.en[key] || key
}

// Get language info
export function getLanguageInfo(code: Language): LanguageInfo | undefined {
  return languages.find(l => l.code === code)
}

