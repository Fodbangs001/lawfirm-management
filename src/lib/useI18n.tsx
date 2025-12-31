import { useState, useEffect, useCallback } from 'react'
import { Language, getCurrentLanguage, setLanguage as setLang, t as translate, languages, getLanguageInfo } from './i18n'

// Custom event for language changes
const LANGUAGE_CHANGE_EVENT = 'app:language-changed'

// Hook to use translations with auto-update on language change
export function useT() {
  const [language, setLanguage] = useState<Language>(getCurrentLanguage())

  useEffect(() => {
    const handleLanguageChange = () => {
      setLanguage(getCurrentLanguage())
    }

    window.addEventListener(LANGUAGE_CHANGE_EVENT, handleLanguageChange)
    return () => window.removeEventListener(LANGUAGE_CHANGE_EVENT, handleLanguageChange)
  }, [])

  const t = useCallback((key: string): string => {
    return translate(key, language)
  }, [language])

  return t
}

// Hook to manage language selection
export function useLanguage() {
  const [language, setLanguageState] = useState<Language>(getCurrentLanguage())

  useEffect(() => {
    const handleLanguageChange = () => {
      setLanguageState(getCurrentLanguage())
    }

    window.addEventListener(LANGUAGE_CHANGE_EVENT, handleLanguageChange)
    return () => window.removeEventListener(LANGUAGE_CHANGE_EVENT, handleLanguageChange)
  }, [])

  const changeLanguage = useCallback((lang: Language) => {
    setLang(lang)
    setLanguageState(lang)
    window.dispatchEvent(new CustomEvent(LANGUAGE_CHANGE_EVENT))
  }, [])

  return {
    language,
    changeLanguage,
    languages,
    getLanguageInfo,
  }
}

export type { Language }
export { languages, getLanguageInfo }
