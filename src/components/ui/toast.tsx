import * as React from 'react'
import * as ToastPrimitive from '@radix-ui/react-toast'
import { AnimatePresence, motion } from 'framer-motion'
import { cn } from '@/lib/utils'

type ToastMessage = {
  id: string
  title: string
  description?: string
}

type ToastContextType = {
  pushToast: (toast: Omit<ToastMessage, 'id'>) => void
}

const ToastContext = React.createContext<ToastContextType | null>(null)

export function useToast() {
  const context = React.useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used inside ToastProvider')
  }
  return context
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastMessage[]>([])

  const pushToast = React.useCallback((toast: Omit<ToastMessage, 'id'>) => {
    setToasts((prev) => [...prev, { id: crypto.randomUUID(), ...toast }])
  }, [])

  return (
    <ToastContext.Provider value={{ pushToast }}>
      <ToastPrimitive.Provider swipeDirection="right">
        {children}
        <ToastPrimitive.Viewport className="fixed bottom-4 right-4 z-[99] flex w-96 max-w-[90vw] flex-col gap-2" />
        <AnimatePresence>
          {toasts.map((toast) => (
            <ToastPrimitive.Root
              key={toast.id}
              defaultOpen
              duration={3000}
              onOpenChange={(open) => {
                if (!open) setToasts((prev) => prev.filter((item) => item.id !== toast.id))
              }}
              asChild
            >
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className={cn(
                  'rounded-lg border border-success bg-success px-4 py-3 text-white shadow-panel',
                )}
              >
                <ToastPrimitive.Title className="text-sm font-semibold">
                  {toast.title}
                </ToastPrimitive.Title>
                {toast.description ? (
                  <ToastPrimitive.Description className="mt-1 text-xs">
                    {toast.description}
                  </ToastPrimitive.Description>
                ) : null}
              </motion.div>
            </ToastPrimitive.Root>
          ))}
        </AnimatePresence>
      </ToastPrimitive.Provider>
    </ToastContext.Provider>
  )
}
