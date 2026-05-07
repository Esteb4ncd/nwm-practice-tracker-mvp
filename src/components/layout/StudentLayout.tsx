import { Outlet } from 'react-router-dom'
import { StudentSidebar } from './StudentSidebar'

export function StudentLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-neutral lg:flex-row">
      <StudentSidebar />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6">
        <Outlet />
      </main>
    </div>
  )
}
