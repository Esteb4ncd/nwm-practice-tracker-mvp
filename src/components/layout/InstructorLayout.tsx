import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'

const pageMeta: Record<string, { title: string; subtitle: string }> = {
  '/dashboard': {
    title: 'Class Dashboard',
    subtitle: 'Track student momentum and assign rewards',
  },
}

export function InstructorLayout() {
  const location = useLocation()
  const meta = location.pathname.startsWith('/students/')
    ? {
        title: 'Student Profile',
        subtitle: 'Review progress, sessions and reward history',
      }
    : pageMeta[location.pathname] ?? {
        title: 'Teacher Portal',
        subtitle: 'Manage your class and reward progress',
      }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex min-h-screen flex-1 flex-col overflow-hidden bg-neutral">
        <TopBar title={meta.title} subtitle={meta.subtitle} />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
