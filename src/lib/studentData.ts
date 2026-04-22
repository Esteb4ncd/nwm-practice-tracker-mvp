import { mockRewards } from '@/lib/mockData'
import { hasSupabaseEnv, supabase } from '@/lib/supabase'
import type { Reward } from '@/lib/types'

export async function fetchStudentRewards(studentId: string): Promise<Reward[]> {
  if (!hasSupabaseEnv || !supabase) {
    return mockRewards
      .filter((reward) => reward.student_id === studentId)
      .sort((a, b) => a.created_at.localeCompare(b.created_at))
  }

  const { data, error } = await supabase
    .from('rewards')
    .select('id, student_id, type, assigned_by, note, created_at')
    .eq('student_id', studentId)
    .order('created_at', { ascending: true })

  if (error) {
    throw error
  }

  return (data ?? []) as Reward[]
}

export function getStickerCountFromRewards(rewards: Reward[]) {
  return rewards.length
}
