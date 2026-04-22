import { Link, useLocation } from 'react-router-dom'
import { Music2, School, ChartColumn, Star, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { signOutTeacher } from '@/lib/auth'

const navItems = [
  { icon: School, label: 'My Class', href: '/dashboard' },
  { icon: ChartColumn, label: 'Progress', href: '/dashboard' },
  { icon: Star, label: 'Rewards', href: '/dashboard?mode=select' },
  { icon: Settings, label: 'Settings', href: '/dashboard' },
]

export function Sidebar() {
  const location = useLocation()

  return (
    <aside className="flex h-screen w-[220px] flex-col bg-dark px-4 py-5 text-white">
      <div className="mb-8 flex items-center gap-2">
        <Music2 className="h-5 w-5 text-accent" />
        <div>
          <p className="text-base font-semibold">MusicApp</p>
          <p className="text-xs text-slate-300">Teacher Portal</p>
        </div>
      </div>

      <nav className="space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href || location.pathname.startsWith('/students/')
          return (
            <Link
              key={item.label}
              to={item.href}
              className={cn(
                'flex items-center gap-3 rounded-full px-3 py-2 text-sm text-slate-200',
                isActive && 'bg-darkMid font-semibold text-white',
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="mt-auto space-y-3 rounded-lg border border-darkMid p-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-xs font-semibold">
            DC
          </div>
          <div>
            <p className="text-sm font-medium">David Cruz</p>
            <p className="text-xs text-slate-300">Instructor</p>
          </div>
        </div>
        <Button
          variant="secondary"
          className="w-full"
          onClick={async () => {
            await signOutTeacher()
            window.location.href = '/login/instructor'
          }}
        >
          Sign out
        </Button>
      </div>
    </aside>
  )
}
