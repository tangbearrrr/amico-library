import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '../../lib/utils'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg'
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
}

export function Modal({ open, onClose, title, children, size = 'md' }: ModalProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm modal-overlay-enter" />
        <DialogPrimitive.Content
          className={cn(
            'fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2',
            'bg-white rounded-xl border border-gray-200 shadow-xl modal-panel-enter overflow-hidden',
            sizeClasses[size]
          )}
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <DialogPrimitive.Title className="text-base font-semibold text-gray-900">
              {title}
            </DialogPrimitive.Title>
            <DialogPrimitive.Close className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors">
              <X className="w-4 h-4" />
            </DialogPrimitive.Close>
          </div>
          <div className="p-5">{children}</div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

interface ConfirmModalProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmLabel?: string
  variant?: 'danger' | 'default'
}

export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  variant = 'default',
}: ConfirmModalProps) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <p className="text-sm text-gray-500 mb-5">{message}</p>
      <div className="flex gap-2.5 justify-end">
        <button
          onClick={onClose}
          className="px-3.5 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={() => {
            onConfirm()
            onClose()
          }}
          className={cn(
            'px-3.5 py-2 text-sm font-medium rounded-lg transition-colors',
            variant === 'danger'
              ? 'bg-red-600 text-white hover:bg-red-700'
              : 'bg-gray-900 text-white hover:bg-gray-700'
          )}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  )
}
