import { mockRewards } from '@/lib/mockData'
import { hasSupabaseEnv, supabase } from '@/lib/supabase'
import type { Reward } from '@/lib/types'

export async function fetchStudentRewards(
  studentId: string,
  shareToken?: string | null,
): Promise<Reward[]> {
  if (!hasSupabaseEnv || !supabase) {
    return mockRewards
      .filter((reward) => reward.student_id === studentId)
      .sort((a, b) => a.created_at.localeCompare(b.created_at))
  }

  const { data, error } = await supabase.rpc('get_student_reward_history', {
    p_student_id: studentId,
    p_share_token: shareToken ?? null,
  })

  if (error) {
    throw error
  }

  return (data ?? []) as Reward[]
}

export function getStickerCountFromRewards(rewards: Reward[]) {
  return rewards.length
}
