import { Label } from '@/components/ui/label'
import { RadioGroupItem } from '@/components/ui/radio-group'
import { cn } from '@/lib/utils'
import type { RewardType } from '@/lib/types'

interface StickerOptionProps {
  value: RewardType
  label: string
  icon: string
  selected: boolean
}

export function StickerOption({ value, label, icon, selected }: StickerOptionProps) {
  return (
    <Label
      htmlFor={`sticker-${value}`}
      className={cn(
        'flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3 transition-colors',
        selected && 'border-primary bg-blue-50',
      )}
    >
      <RadioGroupItem id={`sticker-${value}`} value={value} />
      <span className="text-base">{icon}</span>
      <span className="font-medium text-textPrimary">{label}</span>
    </Label>
  )
}
