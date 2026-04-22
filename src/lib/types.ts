export type RewardType = 'star' | 'practice' | 'achievement' | 'effort'

export interface Student {
  id: string
  teacher_id: string
  username: string
  pin_hash: string | null
  class_code: string | null
  share_token?: string
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
  coins?: number
  completedSteps?: number
}

export interface ProgressSnapshotRow {
  student_id: string
  total_steps: number
  current_world_id: number
  current_world_step: number
  unlocked_world_id: number
  coin_balance: number
  milestone_badges: number
  world_badges: number
  total_badges: number
}

export interface StudentBadge {
  id: string
  student_id: string
  badge_key: string
  badge_type: 'milestone' | 'world'
  world_id: number
  step_number: number
  badge_label: string
  created_at: string
}

export interface PrizeCatalogItem {
  id: string
  teacher_id: string
  title: string
  description: string | null
  coin_cost: number
  is_active: boolean
  created_at: string
}

export interface PrizeRedemption {
  id: string
  student_id: string
  prize_id: string
  teacher_id: string
  status: 'requested' | 'approved' | 'rejected'
  request_note: string | null
  review_note: string | null
  requested_at: string
  reviewed_at: string | null
  reviewed_by: string | null
  prize_title?: string
  prize_coin_cost?: number
  student_username?: string
}
