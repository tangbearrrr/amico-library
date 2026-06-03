import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '../../lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-40',
  {
    variants: {
      variant: {
        primary: 'bg-gray-900 text-white hover:bg-gray-700 focus:ring-gray-900',
        secondary: 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 focus:ring-gray-300',
        danger: 'bg-white text-red-600 border border-red-200 hover:bg-red-50 focus:ring-red-300',
        ghost: 'text-gray-500 hover:text-gray-900 hover:bg-gray-100 focus:ring-gray-300',
      },
      size: {
        sm: 'px-3 py-1.5 text-xs gap-1.5',
        md: 'px-3.5 py-2 text-sm gap-2',
        lg: 'px-5 py-2.5 text-sm gap-2',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
)

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  children: ReactNode
  loading?: boolean
  asChild?: boolean
}

export function Button({
  variant,
  size,
  children,
  loading,
  className,
  disabled,
  asChild = false,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : 'button'
  return (
    <Comp
      {...props}
      disabled={disabled || loading}
      className={cn(buttonVariants({ variant, size }), className)}
    >
      {loading && (
        <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </Comp>
  )
}

export { buttonVariants }
