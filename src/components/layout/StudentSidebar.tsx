import { Link, useLocation } from 'react-router-dom'
import { Music2, Map, Gift, UserRound } from 'lucide-react'
import { cn } from '@/lib/utils'

const links = [
  { label: 'Map', href: '/student/home', icon: Map },
  { label: 'Rewards', href: '/student/rewards', icon: Gift },
  { label: 'Character', href: '/student/character', icon: UserRound },
]

export function StudentSidebar() {
  const location = useLocation()
  return (
    <aside className="w-full border-b border-border bg-white lg:w-[240px] lg:border-r lg:border-b-0">
      <div className="bg-studentTeal px-4 py-3 text-white lg:p-5">
        <div className="mb-1 flex items-center gap-2">
          <Music2 className="h-5 w-5" />
          <span className="font-semibold">New West Music</span>
        </div>
        <p className="text-xs text-white/85">Student Adventure Portal</p>
      </div>

      <nav className="flex gap-2 overflow-x-auto p-3 lg:block lg:space-y-1 lg:overflow-visible lg:p-4">
        {links.map((item) => (
          <Link
            key={item.label}
            to={item.href}
            className={cn(
              'flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-xs text-textSecondary transition-colors sm:text-sm lg:gap-3',
              location.pathname === item.href && 'bg-neutral font-semibold text-textPrimary',
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  )
}
