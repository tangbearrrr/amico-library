import { createContext, useContext, useState } from 'react'
import { translations, type Lang, type Translations } from '../lib/translations'

interface LanguageContextValue {
  lang: Lang
  t: Translations
  locale: string
  toggleLang: () => void
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>(() => {
    return (localStorage.getItem('lang') as Lang) ?? 'en'
  })

  const toggleLang = () => {
    const next: Lang = lang === 'en' ? 'th' : 'en'
    setLang(next)
    localStorage.setItem('lang', next)
  }

  return (
    <LanguageContext.Provider value={{ lang, t: translations[lang], locale: lang === 'en' ? 'en-US' : 'th-TH', toggleLang }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider')
  return ctx
}
