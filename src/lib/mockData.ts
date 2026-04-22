import type { DashboardStudentRow, Reward, Session, Student } from './types'

const teacherId = 'teacher-demo'

export const mockStudents: Student[] = [
  {
    id: 'student-a',
    teacher_id: teacherId,
    username: 'Ava Chen',
    pin_hash: '1234',
    class_code: 'NWMS2026',
    share_token: 'share-student-a',
    level: 2,
    created_at: '2025-09-12T08:00:00.000Z',
    instrument: 'Piano',
    last_active: '2026-04-16',
  },
  {
    id: 'student-b',
    teacher_id: teacherId,
    username: 'Eli Park',
    pin_hash: '2345',
    class_code: 'NWMS2026',
    share_token: 'share-student-b',
    level: 1,
    created_at: '2025-11-01T08:00:00.000Z',
    instrument: 'Violin',
    last_active: '2026-04-14',
  },
  {
    id: 'student-c',
    teacher_id: teacherId,
    username: 'Maya Singh',
    pin_hash: '3456',
    class_code: 'NWMS2026',
    share_token: 'share-student-c',
    level: 3,
    created_at: '2025-08-19T08:00:00.000Z',
    instrument: 'Voice',
    last_active: '2026-04-18',
  },
]

export const mockSessions: Session[] = [
  {
    id: 's1',
    student_id: 'student-a',
    date: '2026-04-12',
    duration_minutes: 30,
    logged_by: 'teacher',
    created_at: '2026-04-12T08:00:00.000Z',
  },
  {
    id: 's2',
    student_id: 'student-a',
    date: '2026-04-14',
    duration_minutes: 45,
    logged_by: 'parent',
    created_at: '2026-04-14T08:00:00.000Z',
  },
  {
    id: 's3',
    student_id: 'student-b',
    date: '2026-04-13',
    duration_minutes: 20,
    logged_by: 'student',
    created_at: '2026-04-13T08:00:00.000Z',
  },
  {
    id: 's4',
    student_id: 'student-c',
    date: '2026-04-17',
    duration_minutes: 60,
    logged_by: 'teacher',
    created_at: '2026-04-17T08:00:00.000Z',
  },
]

export const mockRewards: Reward[] = [
  {
    id: 'r1',
    student_id: 'student-a',
    type: 'star',
    assigned_by: teacherId,
    note: 'Great scales today',
    created_at: '2026-04-14T10:00:00.000Z',
  },
  {
    id: 'r2',
    student_id: 'student-a',
    type: 'practice',
    assigned_by: teacherId,
    note: null,
    created_at: '2026-04-16T10:00:00.000Z',
  },
  {
    id: 'r3',
    student_id: 'student-b',
    type: 'effort',
    assigned_by: teacherId,
    note: 'Strong rhythm effort!',
    created_at: '2026-04-13T10:00:00.000Z',
  },
  {
    id: 'r4',
    student_id: 'student-c',
    type: 'achievement',
    assigned_by: teacherId,
    note: 'Level up unlocked',
    created_at: '2026-04-18T10:00:00.000Z',
  },
]

export const mockDashboardRows: DashboardStudentRow[] = mockStudents.map(
  (student) => {
    const stars = mockRewards.filter((reward) => reward.student_id === student.id).length
    const streak = Math.max(
      1,
      mockSessions.filter((session) => session.student_id === student.id).length + 1,
    )
    return {
      id: student.id,
      name: student.username,
      stars,
      streak,
      lastActive: student.last_active ?? 'N/A',
      instrument: student.instrument ?? 'Music',
      level: `Level ${student.level}`,
    }
  },
)
