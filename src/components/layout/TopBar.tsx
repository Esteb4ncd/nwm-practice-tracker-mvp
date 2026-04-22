import { Input } from '@/components/ui/input'

interface TopBarProps {
  title: string
  subtitle: string
}

export function TopBar({ title, subtitle }: TopBarProps) {
  return (
    <header className="flex h-[60px] items-center justify-between border-b border-border bg-white px-6">
      <div>
        <h1 className="text-xl font-semibold text-textPrimary">{title}</h1>
        <p className="text-xs text-textSecondary">{subtitle}</p>
      </div>

      <div className="flex items-center gap-3">
        <Input placeholder="Search students..." className="w-60" />
        <div className="flex items-center gap-2 rounded-full border border-border px-3 py-1.5">
          <div className="h-7 w-7 rounded-full bg-secondary" />
          <span className="text-sm font-medium text-textSecondary">DC</span>
        </div>
      </div>
    </header>
  )
}
