import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import zh from './locales/zh'
import en from './locales/en'

type Lang = 'zh' | 'en'
type Translations = typeof zh

const translations: Record<Lang, Translations> = { zh, en }

interface LanguageContextValue {
  lang: Lang
  setLang: (lang: Lang) => void
  t: (key: keyof Translations, params?: Record<string, string | number>) => string
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    const saved = localStorage.getItem('lang')
    return saved === 'en' || saved === 'zh' ? saved : 'zh'
  })

  const setLang = useCallback((newLang: Lang) => {
    setLangState(newLang)
    localStorage.setItem('lang', newLang)
  }, [])

  const t = useCallback((key: keyof Translations, params?: Record<string, string | number>) => {
    let text = translations[lang][key] || key
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v))
      }
    }
    return text
  }, [lang])

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider')
  return ctx
}
