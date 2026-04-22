import { supabase } from '@/lib/supabase'
import type {
  DashboardStudentRow,
  ProgressSnapshotRow,
  Reward,
  Session,
  Student,
  StudentBadge,
} from '@/lib/types'

type DashboardPayload = {
  stats: {
    totalStudents: number
    starsThisWeek: number
    sessionsLogged: number
    avgStreak: number
  }
  rows: DashboardStudentRow[]
}

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000

function getConsecutiveStreak(sessionDates: string[]) {
  if (!sessionDates.length) return 0
  const unique = new Set(sessionDates)
  let cursor = new Date()
  let streak = 0
  for (let i = 0; i < 30; i += 1) {
    const yyyy = cursor.getUTCFullYear()
    const mm = String(cursor.getUTCMonth() + 1).padStart(2, '0')
    const dd = String(cursor.getUTCDate()).padStart(2, '0')
    const key = `${yyyy}-${mm}-${dd}`
    if (unique.has(key)) {
      streak += 1
      cursor = new Date(cursor.getTime() - 24 * 60 * 60 * 1000)
      continue
    }
    if (i === 0) {
      cursor = new Date(cursor.getTime() - 24 * 60 * 60 * 1000)
      continue
    }
    break
  }
  return streak
}

export async function fetchTeacherDashboardData(teacherId: string): Promise<DashboardPayload> {
  if (!supabase) {
    throw new Error('Supabase is not configured.')
  }

  const { data: students, error: studentsError } = await supabase
    .from('students')
    .select('id, teacher_id, username, pin_hash, class_code, share_token, level, created_at')
    .eq('teacher_id', teacherId)

  if (studentsError) throw studentsError

  const typedStudents = (students ?? []) as Student[]
  const studentIds = typedStudents.map((student) => student.id)

  if (!studentIds.length) {
    return {
      stats: {
        totalStudents: 0,
        starsThisWeek: 0,
        sessionsLogged: 0,
        avgStreak: 0,
      },
      rows: [],
    }
  }

  const [
    { data: rewards, error: rewardsError },
    { data: sessions, error: sessionsError },
    { data: progressRows, error: progressError },
    { data: coinLedgerRows, error: coinLedgerError },
  ] = await Promise.all([
    supabase
      .from('rewards')
      .select('id, student_id, type, assigned_by, note, created_at')
      .in('student_id', studentIds),
    supabase
      .from('sessions')
      .select('id, student_id, date, duration_minutes, logged_by, created_at')
      .in('student_id', studentIds),
    supabase
      .from('student_progress')
      .select(
        'student_id,total_steps,current_world_id,current_world_step,unlocked_world_id,milestone_badges,world_badges,total_badges',
      )
      .in('student_id', studentIds),
    supabase
      .from('student_coin_ledger')
      .select('student_id, amount')
      .in('student_id', studentIds),
  ])

  if (rewardsError) throw rewardsError
  if (sessionsError) throw sessionsError
  if (progressError) throw progressError
  if (coinLedgerError) throw coinLedgerError

  const typedRewards = (rewards ?? []) as Reward[]
  const typedSessions = (sessions ?? []) as Session[]
  const typedProgressRows = (progressRows ?? []) as ProgressSnapshotRow[]
  const coinByStudentId = (coinLedgerRows ?? []).reduce<Record<string, number>>((acc, row) => {
    const coinRow = row as { student_id: string; amount: number }
    acc[coinRow.student_id] = (acc[coinRow.student_id] ?? 0) + coinRow.amount
    return acc
  }, {})
  const weekStart = Date.now() - ONE_WEEK_MS

  const streaks = typedStudents.map((student) => {
    const dates = typedSessions
      .filter((session) => session.student_id === student.id)
      .map((session) => session.date)
    return getConsecutiveStreak(dates)
  })

  const rows: DashboardStudentRow[] = typedStudents.map((student) => {
    const studentRewards = typedRewards.filter((reward) => reward.student_id === student.id)
    const progress = typedProgressRows.find((row) => row.student_id === student.id)
    const studentSessions = typedSessions
      .filter((session) => session.student_id === student.id)
      .sort((a, b) => b.date.localeCompare(a.date))
    return {
      id: student.id,
      name: student.username,
      stars: studentRewards.length,
      streak: Math.min(5, getConsecutiveStreak(studentSessions.map((item) => item.date))),
      lastActive: studentSessions[0]?.date ?? 'No sessions',
      instrument: 'Music',
      level: progress
        ? `World ${progress.current_world_id} • Step ${progress.current_world_step}`
        : `Level ${student.level}`,
      coins: coinByStudentId[student.id] ?? 0,
      completedSteps: progress?.total_steps ?? studentRewards.length,
    }
  })

  const avgStreak =
    streaks.length > 0 ? Math.round(streaks.reduce((sum, val) => sum + val, 0) / streaks.length) : 0

  return {
    stats: {
      totalStudents: typedStudents.length,
      starsThisWeek: typedRewards.filter(
        (reward) => new Date(reward.created_at).getTime() >= weekStart,
      ).length,
      sessionsLogged: typedSessions.length,
      avgStreak,
    },
    rows,
  }
}

export async function fetchTeacherStudentProfile(teacherId: string, studentId: string) {
  if (!supabase) {
    throw new Error('Supabase is not configured.')
  }

  const { data: student, error: studentError } = await supabase
    .from('students')
    .select('id, teacher_id, username, pin_hash, class_code, share_token, level, created_at')
    .eq('teacher_id', teacherId)
    .eq('id', studentId)
    .maybeSingle()

  if (studentError) throw studentError
  if (!student) throw new Error('Student not found.')

  const [
    { data: rewards, error: rewardsError },
    { data: sessions, error: sessionsError },
    { data: progressSnapshot, error: progressError },
    { data: badges, error: badgesError },
  ] = await Promise.all([
      supabase
        .from('rewards')
        .select('id, student_id, type, assigned_by, note, created_at')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false }),
      supabase
        .from('sessions')
        .select('id, student_id, date, duration_minutes, logged_by, created_at')
        .eq('student_id', studentId)
        .order('date', { ascending: false }),
      supabase.rpc('get_student_progress_snapshot', {
        p_student_id: studentId,
        p_share_token: null,
      }),
      supabase.rpc('get_student_badges', {
        p_student_id: studentId,
        p_share_token: null,
      }),
    ])

  if (rewardsError) throw rewardsError
  if (sessionsError) throw sessionsError
  if (progressError) throw progressError
  if (badgesError) throw badgesError

  return {
    student: student as Student,
    rewards: (rewards ?? []) as Reward[],
    sessions: (sessions ?? []) as Session[],
    progress: ((progressSnapshot ?? [])[0] ?? null) as ProgressSnapshotRow | null,
    badges: (badges ?? []) as StudentBadge[],
  }
}
