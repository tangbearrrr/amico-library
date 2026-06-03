import { cva, type VariantProps } from 'class-variance-authority'
import type { ReactNode } from 'react'
import { cn } from '../../lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
  {
    variants: {
      variant: {
        borrowed: 'bg-blue-50 text-blue-600 ring-1 ring-blue-100',
        returned: 'bg-green-50 text-green-600 ring-1 ring-green-100',
        overdue: 'bg-red-50 text-red-600 ring-1 ring-red-100',
        admin: 'bg-gray-900 text-white',
        staff: 'bg-gray-100 text-gray-600',
        default: 'bg-gray-100 text-gray-500',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

interface BadgeProps extends VariantProps<typeof badgeVariants> {
  children: ReactNode
  className?: string
}

export function Badge({ variant, children, className }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)}>
      {children}
    </span>
  )
}

export { badgeVariants }
