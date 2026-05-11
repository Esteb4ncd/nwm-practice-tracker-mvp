import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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

function dedupeById<T extends { id: string }>(rows: T[]) {
  return Array.from(new Map(rows.map((row) => [row.id, row])).values())
}

function readErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message
  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as { message?: unknown }).message === 'string'
  ) {
    return (error as { message: string }).message
  }
  return fallback
}

export function DashboardPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isPanelOpen, setPanelOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [rows, setRows] = useState<DashboardStudentRow[]>([])
  const [statsPayload, setStatsPayload] = useState({
    totalStudents: 0,
    stickersThisWeek: 0,
    sessionsLogged: 0,
    avgStreak: 0,
  })
  const [redemptionQueue, setRedemptionQueue] = useState<PrizeRedemption[]>([])
  const [queueLoading, setQueueLoading] = useState(false)
  const [queueError, setQueueError] = useState('')
  const { teacherId } = useTeacherAuth()

  const isSelectMode = searchParams.get('mode') === 'select'

  const loadDashboardData = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      if (!teacherId) throw new Error('No teacher session found')
      const payload = await fetchTeacherDashboardData(teacherId)
      setRows(dedupeById(payload.rows))
      setStatsPayload(payload.stats)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load dashboard data.')
      setRows([])
    } finally {
      setIsLoading(false)
    }
  }, [teacherId])

  const loadRedemptionQueue = useCallback(async () => {
    setQueueLoading(true)
    setQueueError('')
    try {
      const queue = await fetchTeacherRedemptionQueue()
      setRedemptionQueue(dedupeById(queue))
    } catch (error) {
      setQueueError(readErrorMessage(error, 'Unable to load redemption requests.'))
      setRedemptionQueue([])
    } finally {
      setQueueLoading(false)
    }
  }, [])

  useEffect(() => {
    const id = window.setTimeout(() => {
      void loadDashboardData()
      void loadRedemptionQueue()
    }, 0)
    return () => window.clearTimeout(id)
  }, [loadDashboardData, loadRedemptionQueue])

  const stats = useMemo(
    () => [
      { label: 'Total Students', value: String(statsPayload.totalStudents) },
      { label: 'Stickers This Week', value: String(statsPayload.stickersThisWeek) },
      { label: 'Sessions Logged', value: String(statsPayload.sessionsLogged) },
      { label: 'Avg. Streak', value: `${statsPayload.avgStreak} days` },
    ],
    [statsPayload],
  )

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat, index) => (
          <StatCard key={stat.label} label={stat.label} value={stat.value} index={index} />
        ))}
      </div>

      {isSelectMode ? (
        <div className="flex flex-col gap-3 rounded-xl bg-dark px-4 py-3 text-white sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-medium">{selectedIds.length} students selected</p>
          <div className="flex flex-wrap gap-2">
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
              🌟 Assign Sticker
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-white p-3">
          <Button onClick={() => setSearchParams({ mode: 'select' })}>☑ Select & Assign</Button>
          <div className="flex w-full flex-wrap gap-2 sm:w-auto">
            <Select defaultValue="all">
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Students</SelectItem>
                <SelectItem value="active">Active this week</SelectItem>
              </SelectContent>
            </Select>
            <Select defaultValue="name">
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Sort by Name</SelectItem>
                <SelectItem value="stars">Sort by Stickers</SelectItem>
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
              No students yet. Add students to your class to start assigning stickers.
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
        {queueError ? <p className="mb-2 text-sm text-error">{queueError}</p> : null}
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
                <div className="flex w-full flex-wrap gap-2 sm:w-auto">
                  <Button
                    size="sm"
                    onClick={async () => {
                      try {
                        await approvePrizeRedemption(request.id)
                        await loadRedemptionQueue()
                        await loadDashboardData()
                      } catch (error) {
                        setQueueError(readErrorMessage(error, 'Unable to approve this redemption request.'))
                      }
                    }}
                  >
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={async () => {
                      try {
                        await rejectPrizeRedemption(request.id, 'Try again after more practice steps.')
                        await loadRedemptionQueue()
                      } catch (error) {
                        setQueueError(readErrorMessage(error, 'Unable to reject this redemption request.'))
                      }
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
