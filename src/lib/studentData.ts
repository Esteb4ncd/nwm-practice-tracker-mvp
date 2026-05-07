import { requireSupabaseClient } from '@/lib/supabase'
import type { Reward } from '@/lib/types'

export async function fetchStudentRewards(
  studentId: string,
  shareToken?: string | null,
): Promise<Reward[]> {
  const supabase = requireSupabaseClient()

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
