import { useToast } from '@/components/ui/toast'

export function useSuccessToast() {
  const { pushToast } = useToast()

  return (title: string, description?: string) => {
    pushToast({
      title,
      description,
    })
  }
}
