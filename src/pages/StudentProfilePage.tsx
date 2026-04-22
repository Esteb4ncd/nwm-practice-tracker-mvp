import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { AssignPanel } from '@/components/instructor/AssignPanel'
import { hasSupabaseEnv } from '@/lib/supabase'
import { fetchTeacherStudentProfile } from '@/lib/teacherData'
import { useTeacherAuth } from '@/lib/useTeacherAuth'
import { mockRewards, mockSessions, mockStudents } from '@/lib/mockData'
import { toTitle } from '@/lib/utils'
import { colors } from '@/styles/colors'
import type { Reward, Session, Student } from '@/lib/types'

export function StudentProfilePage() {
  const { id } = useParams()
  const [isPanelOpen, setPanelOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [student, setStudent] = useState<Student | null>(null)
  const [studentRewards, setStudentRewards] = useState<Reward[]>([])
  const [studentSessions, setStudentSessions] = useState<Session[]>([])
  const { teacherId } = useTeacherAuth()

  const loadProfile = useCallback(async () => {
    if (!id) return
    setIsLoading(true)
    setError('')
    try {
      if (hasSupabaseEnv) {
        if (!teacherId) throw new Error('No teacher session found')
        const profile = await fetchTeacherStudentProfile(teacherId, id)
        setStudent(profile.student)
        setStudentRewards(profile.rewards)
        setStudentSessions(profile.sessions)
      } else {
        const mockStudent = mockStudents.find((entry) => entry.id === id) ?? mockStudents[0]
        setStudent(mockStudent)
        setStudentRewards(mockRewards.filter((reward) => reward.student_id === mockStudent.id))
        setStudentSessions(mockSessions.filter((session) => session.student_id === mockStudent.id))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load profile.')
      setStudent(null)
      setStudentRewards([])
      setStudentSessions([])
    } finally {
      setIsLoading(false)
    }
  }, [id, teacherId])

  useEffect(() => {
    void loadProfile()
  }, [loadProfile])

  const chartData = useMemo(
    () => {
      const labels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      const now = new Date()
      return Array.from({ length: 7 }).map((_, index) => {
        const dayDate = new Date(now.getTime() - (6 - index) * 24 * 60 * 60 * 1000)
        const key = dayDate.toISOString().slice(0, 10)
        const minutes = studentSessions
          .filter((session) => session.date === key)
          .reduce((sum, session) => sum + session.duration_minutes, 0)
        return {
          day: labels[dayDate.getDay()],
          minutes,
        }
      })
    },
    [studentSessions],
  )

  const streakFilled = useMemo(() => {
    const activeDates = new Set(studentSessions.map((session) => session.date))
    const now = new Date()
    return Array.from({ length: 7 }).map((_, index) => {
      const day = new Date(now.getTime() - (6 - index) * 24 * 60 * 60 * 1000)
      const key = day.toISOString().slice(0, 10)
      return activeDates.has(key)
    })
  }, [studentSessions])

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-white p-6">
        <p className="text-sm text-textSecondary">Loading student profile...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl border border-error/30 bg-white p-6">
        <p className="text-sm text-error">{error}</p>
      </div>
    )
  }

  if (!student) {
    return (
      <div className="rounded-xl border border-border bg-white p-6">
        <p className="text-sm text-textSecondary">Student not found.</p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <section className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-white p-5">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-white">
            {student.username
              .split(' ')
              .map((part) => part[0])
              .join('')}
          </div>
          <div>
            <h2 className="text-xl font-semibold text-textPrimary">{student.username}</h2>
            <p className="text-sm text-textSecondary">
              {student.instrument} · Level {student.level}
            </p>
            <p className="text-xs text-textMuted">
              Joined {new Date(student.created_at).toLocaleDateString()} · Last active {student.last_active}
            </p>
          </div>
        </div>
        <Button onClick={() => setPanelOpen(true)}>🌟 Assign Sticker</Button>
      </section>

      <div className="grid gap-5 xl:grid-cols-[1.2fr_1fr]">
        <section className="space-y-5">
          <article className="rounded-xl border border-border bg-white p-5">
            <h3 className="text-lg font-semibold text-textPrimary">Practice Streak</h3>
            <div className="mt-3 flex gap-2">
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, index) => (
                <div
                  key={day + index}
                  className={`flex h-10 w-10 items-center justify-center rounded-full text-sm ${
                    streakFilled[index] ? 'bg-success text-white' : 'bg-border text-textMuted'
                  }`}
                >
                  {day}
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-xl border border-border bg-white p-5">
            <h3 className="mb-3 text-lg font-semibold text-textPrimary">Weekly Practice</h3>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={chartData}>
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="minutes" fill={colors.primary} radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </article>

          <article className="rounded-xl border border-border bg-white p-5">
            <h3 className="mb-4 text-lg font-semibold text-textPrimary">Skill Progress</h3>
            <div className="space-y-4">
              {[
                { label: 'Rhythm', value: 78 },
                { label: 'Sight Reading', value: 62 },
                { label: 'Dynamics', value: 85 },
              ].map((skill) => (
                <div key={skill.label}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span>{skill.label}</span>
                    <span>{skill.value}%</span>
                  </div>
                  <Progress value={skill.value} />
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="space-y-5">
          <article className="rounded-xl border border-border bg-white p-5">
            <h3 className="mb-3 text-lg font-semibold text-textPrimary">Recent Rewards</h3>
            <div className="space-y-3">
              {studentRewards.length ? (
                studentRewards.map((reward) => (
                  <div key={reward.id} className="rounded-lg border border-border p-3">
                    <p className="text-sm font-medium text-textPrimary">{toTitle(reward.type)}</p>
                    <p className="text-xs text-textSecondary">{reward.note ?? 'No note added'}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-textSecondary">No rewards assigned yet.</p>
              )}
            </div>
          </article>

          <article className="rounded-xl border border-border bg-white p-5">
            <h3 className="mb-3 text-lg font-semibold text-textPrimary">Session Log</h3>
            <div className="space-y-2">
              {studentSessions.length ? (
                studentSessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between border-b border-border py-2"
                  >
                    <p className="text-sm text-textPrimary">{session.date}</p>
                    <p className="text-xs text-textSecondary">
                      {session.duration_minutes}m · {session.logged_by}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-textSecondary">No practice sessions logged yet.</p>
              )}
            </div>
          </article>
        </section>
      </div>

      <AssignPanel
        open={isPanelOpen}
        onClose={() => setPanelOpen(false)}
        studentIds={[student.id]}
        studentName={student.username}
        onAssigned={() => {
          setPanelOpen(false)
          void loadProfile()
        }}
      />
    </div>
  )
}
