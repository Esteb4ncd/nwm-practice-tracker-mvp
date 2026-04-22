import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom'
import { ToastProvider } from '@/components/ui/toast'
import { getRole, getStudentSession } from '@/lib/auth'
import { useTeacherAuth } from '@/lib/useTeacherAuth'
import { InstructorLayout } from '@/components/layout/InstructorLayout'
import { StudentLayout } from '@/components/layout/StudentLayout'
import { LandingPage } from '@/pages/LandingPage'
import { InstructorLoginPage } from '@/pages/InstructorLoginPage'
import { StudentLoginPage } from '@/pages/StudentLoginPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { StudentProfilePage } from '@/pages/StudentProfilePage'
import { StudentHomePage } from '@/pages/StudentHomePage'
import { StudentRewardsPage } from '@/pages/StudentRewardsPage'
import { StudentCharacterPage } from '@/pages/StudentCharacterPage'

function RequireTeacher({ children }: { children: React.ReactNode }) {
  const { isLoading, isAuthenticated } = useTeacherAuth()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral">
        <p className="text-sm text-textSecondary">Checking teacher session...</p>
      </div>
    )
  }

  return isAuthenticated ? children : <Navigate to="/login/instructor" replace />
}

function RequireStudent({ children }: { children: React.ReactNode }) {
  const role = getRole()
  const studentSession = getStudentSession()
  return role === 'student' && studentSession ? (
    children
  ) : (
    <Navigate to="/login/student" replace />
  )
}

export default function App() {
  return (
    <ToastProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login/instructor" element={<InstructorLoginPage />} />
          <Route path="/login/student" element={<StudentLoginPage />} />

          <Route
            element={
              <RequireTeacher>
                <InstructorLayout />
              </RequireTeacher>
            }
          >
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/students/:id" element={<StudentProfilePage />} />
          </Route>

          <Route
            element={
              <RequireStudent>
                <StudentLayout />
              </RequireStudent>
            }
          >
            <Route path="/student/home" element={<StudentHomePage />} />
            <Route path="/student/rewards" element={<StudentRewardsPage />} />
            <Route path="/student/character" element={<StudentCharacterPage />} />
          </Route>
        </Routes>
      </Router>
    </ToastProvider>
  )
}
