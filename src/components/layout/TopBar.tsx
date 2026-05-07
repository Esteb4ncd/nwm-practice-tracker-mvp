import { useTeacherAuth } from '@/lib/useTeacherAuth'

interface TopBarProps {
  title: string
  subtitle: string
}

export function TopBar({ title, subtitle }: TopBarProps) {
  const { session } = useTeacherAuth()
  const teacherEmail = session?.user.email ?? 'Teacher'

  return (
    <header className="flex min-h-[64px] flex-wrap items-center justify-between gap-3 border-b border-border bg-white px-4 py-3 sm:px-6">
      <div>
        <h1 className="text-lg font-semibold text-textPrimary sm:text-xl">{title}</h1>
        <p className="hidden text-xs text-textSecondary sm:block">{subtitle}</p>
      </div>

      <div className="flex max-w-full items-center gap-2 rounded-full border border-border px-3 py-1.5">
        <div className="h-7 w-7 rounded-full bg-secondary" />
        <span className="max-w-[150px] truncate text-xs font-medium text-textSecondary sm:max-w-[220px] sm:text-sm">
          {teacherEmail}
        </span>
      </div>
    </header>
  )
}
