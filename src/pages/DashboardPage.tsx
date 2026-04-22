import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { hasSupabaseEnv } from '@/lib/supabase'
import { mockDashboardRows, mockRewards, mockSessions, mockStudents } from '@/lib/mockData'
import { fetchTeacherDashboardData } from '@/lib/teacherData'
import {
  approvePrizeRedemption,
  fetchTeacherRedemptionQueue,
  rejectPrizeRedemption,
} from '@/lib/progressionApi'
import { useTeacherAuth } from '@/lib/useTeacherAuth'
import { StatCard } from '@/components/instructor/StatCard'
import { StudentTable } from '@/components/instructor/StudentTable'
import { AssignPanel } from '@/components/instructor/AssignPanel'
import type { DashboardStudentRow, PrizeRedemption } from '@/lib/types'

export function DashboardPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isPanelOpen, setPanelOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [rows, setRows] = useState<DashboardStudentRow[]>([])
  const [statsPayload, setStatsPayload] = useState({
    totalStudents: 0,
    starsThisWeek: 0,
    sessionsLogged: 0,
    avgStreak: 0,
  })
  const [redemptionQueue, setRedemptionQueue] = useState<PrizeRedemption[]>([])
  const [queueLoading, setQueueLoading] = useState(false)
  const { teacherId } = useTeacherAuth()

  const isSelectMode = searchParams.get('mode') === 'select'

  const loadDashboardData = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      if (hasSupabaseEnv) {
        if (!teacherId) throw new Error('No teacher session found')
        const payload = await fetchTeacherDashboardData(teacherId)
        setRows(payload.rows)
        setStatsPayload(payload.stats)
      } else {
        setRows(mockDashboardRows)
        setStatsPayload({
          totalStudents: mockStudents.length,
          starsThisWeek: mockRewards.length,
          sessionsLogged: mockSessions.length,
          avgStreak: 4,
        })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load dashboard data.')
      setRows([])
    } finally {
      setIsLoading(false)
    }
  }, [teacherId])

  const loadRedemptionQueue = useCallback(async () => {
    if (!hasSupabaseEnv) {
      setRedemptionQueue([])
      return
    }
    setQueueLoading(true)
    try {
      const queue = await fetchTeacherRedemptionQueue()
      setRedemptionQueue(queue)
    } catch {
      setRedemptionQueue([])
    } finally {
      setQueueLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadDashboardData()
    void loadRedemptionQueue()
  }, [loadDashboardData, loadRedemptionQueue])

  const stats = useMemo(
    () => [
      { label: 'Total Students', value: String(statsPayload.totalStudents) },
      { label: 'Stars This Week', value: String(statsPayload.starsThisWeek) },
      { label: 'Sessions Logged', value: String(statsPayload.sessionsLogged) },
      { label: 'Avg. Streak', value: `${statsPayload.avgStreak} days` },
    ],
    [statsPayload],
  )

  return (
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat, index) => (
          <StatCard key={stat.label} label={stat.label} value={stat.value} index={index} />
        ))}
      </div>

      {isSelectMode ? (
        <div className="flex items-center justify-between rounded-xl bg-dark px-4 py-3 text-white">
          <p className="text-sm font-medium">{selectedIds.length} students selected</p>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                setSelectedIds([])
                setSearchParams({})
              }}
            >
              Cancel
            </Button>
            <Button onClick={() => setPanelOpen(true)} disabled={!selectedIds.length}>
              🌟 Assign Reward
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-white p-3">
          <Button onClick={() => setSearchParams({ mode: 'select' })}>☑ Select & Assign</Button>
          <div className="flex gap-2">
            <Select defaultValue="all">
              <SelectTrigger>
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Students</SelectItem>
                <SelectItem value="active">Active this week</SelectItem>
              </SelectContent>
            </Select>
            <Select defaultValue="name">
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Sort by Name</SelectItem>
                <SelectItem value="stars">Sort by Stars</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="rounded-xl border border-border bg-white p-6">
          <p className="text-sm text-textSecondary">Loading class dashboard...</p>
        </div>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-error/30 bg-white p-6">
          <p className="text-sm text-error">{error}</p>
        </div>
      ) : null}

      {!isLoading && !error ? (
        rows.length ? (
          <StudentTable
            rows={rows}
            isSelectMode={isSelectMode}
            selectedIds={selectedIds}
            onToggleAll={() =>
              setSelectedIds((prev) => (prev.length === rows.length ? [] : rows.map((row) => row.id)))
            }
            onToggleStudent={(studentId) =>
              setSelectedIds((prev) =>
                prev.includes(studentId)
                  ? prev.filter((value) => value !== studentId)
                  : [...prev, studentId],
              )
            }
          />
        ) : (
          <div className="rounded-xl border border-border bg-white p-6">
            <p className="text-sm text-textSecondary">
              No students yet. Add students to your class to start assigning rewards.
            </p>
          </div>
        )
      ) : null}

      <AssignPanel
        open={isPanelOpen}
        onClose={() => setPanelOpen(false)}
        studentIds={selectedIds}
        onAssigned={() => {
          setPanelOpen(false)
          void loadDashboardData()
        }}
      />

      <section className="rounded-xl border border-border bg-white p-4">
        <h3 className="mb-3 text-lg font-semibold text-textPrimary">Prize Redemption Queue</h3>
        {queueLoading ? <p className="text-sm text-textSecondary">Loading requests...</p> : null}
        {!queueLoading && !redemptionQueue.length ? (
          <p className="text-sm text-textSecondary">No pending redemptions.</p>
        ) : null}
        <div className="space-y-3">
          {redemptionQueue.map((request) => (
            <article
              key={request.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-3"
            >
              <div>
                <p className="font-medium text-textPrimary">
                  {request.student_username ?? 'Student'} requested {request.prize_title}
                </p>
                <p className="text-xs text-textSecondary">
                  Cost: {request.prize_coin_cost} coins • Status: {request.status}
                </p>
              </div>
              {request.status === 'requested' ? (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={async () => {
                      await approvePrizeRedemption(request.id)
                      await loadRedemptionQueue()
                      await loadDashboardData()
                    }}
                  >
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={async () => {
                      await rejectPrizeRedemption(request.id, 'Try again after more practice steps.')
                      await loadRedemptionQueue()
                    }}
                  >
                    Reject
                  </Button>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
