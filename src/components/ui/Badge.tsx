import type { ReactNode } from 'react'

type BadgeVariant = 'borrowed' | 'returned' | 'overdue' | 'admin' | 'staff' | 'default'

interface BadgeProps {
  variant?: BadgeVariant
  children: ReactNode
}

const variantClasses: Record<BadgeVariant, string> = {
  borrowed: 'bg-blue-50 text-blue-600 ring-1 ring-blue-100',
  returned: 'bg-green-50 text-green-600 ring-1 ring-green-100',
  overdue: 'bg-red-50 text-red-600 ring-1 ring-red-100',
  admin: 'bg-gray-900 text-white',
  staff: 'bg-gray-100 text-gray-600',
  default: 'bg-gray-100 text-gray-500',
}

export function Badge({ variant = 'default', children }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variantClasses[variant]}`}
    >
      {children}
    </span>
  )
}
