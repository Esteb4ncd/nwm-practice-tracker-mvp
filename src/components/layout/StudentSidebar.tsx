import { Link, useLocation } from 'react-router-dom'
import { Music2, Map, Gift, UserRound, NotebookPen, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

const links = [
  { label: 'Map', href: '/student/home', icon: Map },
  { label: 'Rewards', href: '/student/rewards', icon: Gift },
  { label: 'Character', href: '/student/character', icon: UserRound },
  { label: 'Blog', href: '#', icon: NotebookPen },
  { label: 'About', href: '#', icon: Info },
]

export function StudentSidebar() {
  const location = useLocation()
  return (
    <aside className="w-[240px] border-r border-border bg-white">
      <div className="bg-studentTeal p-5 text-white">
        <div className="mb-1 flex items-center gap-2">
          <Music2 className="h-5 w-5" />
          <span className="font-semibold">New West Music</span>
        </div>
        <p className="text-xs text-white/85">Student Adventure Portal</p>
      </div>

      <nav className="space-y-1 p-4">
        {links.map((item) => (
          <Link
            key={item.label}
            to={item.href}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-textSecondary transition-colors',
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
