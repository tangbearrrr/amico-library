import * as LabelPrimitive from '@radix-ui/react-label'
import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

const labelBase = 'block text-sm font-medium text-gray-700'
const fieldBase = 'w-full rounded-lg border px-3 py-2 text-base md:text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-colors'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

export function Input({ label, error, hint, className, id, ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
  return (
    <div className="space-y-1.5">
      {label && (
        <LabelPrimitive.Root htmlFor={inputId} className={labelBase}>
          {label}
        </LabelPrimitive.Root>
      )}
      <input
        id={inputId}
        {...props}
        className={cn(
          fieldBase,
          'placeholder:text-gray-400 disabled:bg-gray-50 disabled:text-gray-400',
          error ? 'border-red-300 focus:ring-red-500' : 'border-gray-200',
          className
        )}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
      {hint && !error && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  )
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
}

export function Select({ label, error, className, id, children, ...props }: SelectProps) {
  const selectId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
  return (
    <div className="space-y-1.5">
      {label && (
        <LabelPrimitive.Root htmlFor={selectId} className={labelBase}>
          {label}
        </LabelPrimitive.Root>
      )}
      <select
        id={selectId}
        {...props}
        className={cn(
          fieldBase,
          'disabled:bg-gray-50',
          error ? 'border-red-300' : 'border-gray-200',
          className
        )}
      >
        {children}
      </select>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
}

export function Textarea({ label, error, hint, className, id, ...props }: TextareaProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
  return (
    <div className="space-y-1.5">
      {label && (
        <LabelPrimitive.Root htmlFor={inputId} className={labelBase}>
          {label}
        </LabelPrimitive.Root>
      )}
      <textarea
        id={inputId}
        {...props}
        className={cn(
          fieldBase,
          'placeholder:text-gray-400 resize-none disabled:bg-gray-50',
          error ? 'border-red-300' : 'border-gray-200',
          className
        )}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
      {hint && !error && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  )
}
