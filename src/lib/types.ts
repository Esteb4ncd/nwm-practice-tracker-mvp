export type RewardType = 'star' | 'practice' | 'achievement' | 'effort'

export interface Student {
  id: string
  teacher_id: string
  username: string
  pin_hash: string | null
  class_code: string | null
  level: number
  created_at: string
  instrument?: string
  last_active?: string
}

export interface Reward {
  id: string
  student_id: string
  type: RewardType
  assigned_by: string
  note: string | null
  created_at: string
}

export interface Session {
  id: string
  student_id: string
  date: string
  duration_minutes: number
  logged_by: 'teacher' | 'parent' | 'student'
  created_at: string
}

export interface DashboardStudentRow {
  id: string
  name: string
  stars: number
  streak: number
  lastActive: string
  instrument: string
  level: string
}
