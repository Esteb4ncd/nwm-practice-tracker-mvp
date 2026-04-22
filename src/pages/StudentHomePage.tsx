import { useMemo, useState } from 'react'
import { MapView } from '@/components/student/MapView'
import { getStudentSession } from '@/lib/auth'
import { mockRewards, mockSessions, mockStudents } from '@/lib/mockData'

export function StudentHomePage() {
  const [activeLevel, setActiveLevel] = useState(1)
  const studentSession = getStudentSession()
  const student =
    mockStudents.find((entry) => entry.id === studentSession?.studentId) ?? mockStudents[0]

  const completedCount = useMemo(() => {
    const sessions = mockSessions.filter((session) => session.student_id === student.id).length
    const rewards = mockRewards.filter((reward) => reward.student_id === student.id).length
    return Math.min(6, Math.floor((sessions + rewards) / 2))
  }, [student.id])

  return (
    <div className="space-y-5">
      <section className="flex items-center gap-4 rounded-xl border border-border bg-white p-5">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-studentTeal text-2xl">
          🎵
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-textPrimary">Hi {student.username}!</h1>
          <p className="text-sm text-textSecondary">
            You&apos;re on level {activeLevel}. Keep Climbing!
          </p>
        </div>
      </section>

      <MapView level={activeLevel} onLevelChange={setActiveLevel} completedCount={completedCount} />
    </div>
  )
}
