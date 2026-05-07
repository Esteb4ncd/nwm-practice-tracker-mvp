import { Link, useLocation } from 'react-router-dom'
import { Music2, School, Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { signOutTeacher } from '@/lib/auth'
import { useTeacherAuth } from '@/lib/useTeacherAuth'

const navItems = [
  { icon: School, label: 'Class Dashboard', href: '/dashboard' },
  { icon: Star, label: 'Assign Stickers', href: '/dashboard?mode=select' },
]

export function Sidebar() {
  const location = useLocation()
  const { session } = useTeacherAuth()
  const teacherEmail = session?.user.email ?? 'Teacher'
  const initials = teacherEmail.slice(0, 2).toUpperCase()

  return (
    <aside className="w-full border-b border-darkMid bg-dark px-4 py-4 text-white lg:h-screen lg:w-[220px] lg:border-b-0">
      <div className="mb-4 flex items-center gap-2 lg:mb-8">
        <Music2 className="h-5 w-5 text-accent" />
        <div>
          <p className="text-base font-semibold">MusicApp</p>
          <p className="text-xs text-slate-300">Teacher Portal</p>
        </div>
      </div>

      <nav className="flex gap-1 overflow-x-auto pb-1 lg:block lg:space-y-1 lg:overflow-visible lg:pb-0">
        {navItems.map((item) => {
          const isSelectRoute = item.href.includes('mode=select')
          const isActive = isSelectRoute
            ? location.pathname === '/dashboard' && location.search.includes('mode=select')
            : location.pathname === item.href || location.pathname.startsWith('/students/')
          return (
            <Link
              key={item.label}
              to={item.href}
              className={cn(
                'flex shrink-0 items-center gap-2 rounded-full px-3 py-2 text-xs text-slate-200 sm:text-sm lg:gap-3',
                isActive && 'bg-darkMid font-semibold text-white',
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="mt-4 space-y-3 rounded-lg border border-darkMid p-3 lg:mt-auto">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-xs font-semibold">
            {initials}
          </div>
          <div>
            <p className="text-sm font-medium">{teacherEmail}</p>
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
