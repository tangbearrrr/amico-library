import { useLanguage } from '../../hooks/useLanguage'
import { cn } from '../../lib/utils'

const config = {
  sm: {
    container: 'p-[3px] gap-0',
    btnW: 'w-8',
    thumb: 'w-8',
    translate: 'translate-x-8',
    text: 'text-[11px] py-[3px]',
  },
  md: {
    container: 'p-1 gap-0',
    btnW: 'w-10',
    thumb: 'w-10',
    translate: 'translate-x-10',
    text: 'text-xs py-1',
  },
} as const

export function LanguageToggle({
  size = 'sm',
  className,
}: {
  size?: 'sm' | 'md'
  className?: string
}) {
  const { lang, toggleLang } = useLanguage()
  const c = config[size]

  return (
    <div
      role="group"
      aria-label="Language"
      className={cn(
        'relative inline-flex items-center rounded-full bg-gray-900/[0.07]',
        c.container,
        className
      )}
    >
      {/* Sliding thumb */}
      <span
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute top-[3px] bottom-[3px] left-[3px] rounded-full bg-white shadow transition-transform duration-200 ease-out',
          c.thumb,
          lang === 'th' ? c.translate : 'translate-x-0'
        )}
      />

      {(['en', 'th'] as const).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => lang !== l && toggleLang()}
          aria-pressed={lang === l}
          className={cn(
            'relative z-10 rounded-full font-semibold tracking-wider text-center uppercase transition-colors duration-150 select-none cursor-pointer',
            c.btnW,
            c.text,
            lang === l ? 'text-gray-900' : 'text-gray-400 hover:text-gray-500'
          )}
        >
          {l}
        </button>
      ))}
    </div>
  )
}
