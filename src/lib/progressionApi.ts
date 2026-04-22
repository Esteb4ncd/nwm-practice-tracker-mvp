import { mockRewards, mockStudents } from '@/lib/mockData'
import { hasSupabaseEnv, supabase } from '@/lib/supabase'
import { getProgressSnapshotFromStickers } from '@/lib/progression'
import type {
  PrizeCatalogItem,
  PrizeRedemption,
  ProgressSnapshotRow,
  StudentBadge,
  Student,
} from '@/lib/types'

type AwardStickerResponse = {
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

export async function awardSticker(
  studentId: string,
  stickerType: string,
  note: string | null,
): Promise<AwardStickerResponse | null> {
  if (!hasSupabaseEnv || !supabase) return null

  const { data, error } = await supabase.rpc('award_sticker', {
    p_student_id: studentId,
    p_sticker_type: stickerType,
    p_note: note,
  })

  if (error) throw error
  return (data?.[0] as AwardStickerResponse | undefined) ?? null
}

export async function fetchStudentProgressSnapshot(
  studentId: string,
  shareToken?: string | null,
): Promise<ProgressSnapshotRow> {
  if (!hasSupabaseEnv || !supabase) {
    const stickerCount = mockRewards.filter((reward) => reward.student_id === studentId).length
    const snapshot = getProgressSnapshotFromStickers(stickerCount)
    return {
      student_id: studentId,
      total_steps: snapshot.completedSteps,
      current_world_id: snapshot.currentWorldId,
      current_world_step: Math.max(
        1,
        snapshot.currentStep -
          (snapshot.worldProgress.find((item) => item.worldId === snapshot.currentWorldId)?.startStep ??
            1) +
          1,
      ),
      unlocked_world_id: snapshot.unlockedWorldId,
      coin_balance: snapshot.totalCoins,
      milestone_badges: snapshot.milestoneBadgesEarned,
      world_badges: snapshot.worldBadgesEarned,
      total_badges: snapshot.totalBadgesEarned,
    }
  }

  const { data, error } = await supabase.rpc('get_student_progress_snapshot', {
    p_student_id: studentId,
    p_share_token: shareToken ?? null,
  })
  if (error) throw error
  return data[0] as ProgressSnapshotRow
}

export async function fetchStudentBadges(
  studentId: string,
  shareToken?: string | null,
): Promise<StudentBadge[]> {
  if (!hasSupabaseEnv || !supabase) {
    const snapshot = getProgressSnapshotFromStickers(
      mockRewards.filter((reward) => reward.student_id === studentId).length,
    )
    return snapshot.earnedBadges.map((badge, index) => ({
      id: `mock-badge-${index}`,
      student_id: studentId,
      badge_key: badge.id,
      badge_type: badge.type,
      world_id: badge.worldId,
      step_number: badge.atStep,
      badge_label: badge.label,
      created_at: new Date().toISOString(),
    }))
  }

  const { data, error } = await supabase.rpc('get_student_badges', {
    p_student_id: studentId,
    p_share_token: shareToken ?? null,
  })
  if (error) throw error
  return (data ?? []) as StudentBadge[]
}

export async function fetchPrizeCatalog(
  studentId: string,
  shareToken?: string | null,
): Promise<PrizeCatalogItem[]> {
  if (!hasSupabaseEnv || !supabase) {
    const student = mockStudents.find((item) => item.id === studentId)
    return [
      {
        id: 'mock-prize-candy',
        teacher_id: student?.teacher_id ?? 'teacher-demo',
        title: 'Candy',
        description: 'Teacher-approved treat',
        coin_cost: 30,
        is_active: true,
        created_at: new Date().toISOString(),
      },
      {
        id: 'mock-prize-stickers',
        teacher_id: student?.teacher_id ?? 'teacher-demo',
        title: 'Sticker Pack',
        description: 'Pick from the reward box',
        coin_cost: 60,
        is_active: true,
        created_at: new Date().toISOString(),
      },
    ]
  }

  const { data, error } = await supabase.rpc('get_prize_catalog', {
    p_student_id: studentId,
    p_share_token: shareToken ?? null,
  })
  if (error) throw error
  return (data ?? []) as PrizeCatalogItem[]
}

export async function requestPrizeRedemption(
  studentId: string,
  prizeId: string,
  shareToken?: string | null,
  note?: string,
) {
  if (!hasSupabaseEnv || !supabase) return null
  const { data, error } = await supabase.rpc('request_prize_redemption', {
    p_student_id: studentId,
    p_prize_id: prizeId,
    p_share_token: shareToken ?? null,
    p_request_note: note ?? null,
  })
  if (error) throw error
  return data?.[0] ?? null
}

export async function fetchTeacherRedemptionQueue(): Promise<PrizeRedemption[]> {
  if (!hasSupabaseEnv || !supabase) return []

  const { data, error } = await supabase.rpc('get_teacher_redemption_queue')
  if (error) throw error
  return (data ?? []) as PrizeRedemption[]
}

export async function approvePrizeRedemption(redemptionId: string, note?: string) {
  if (!hasSupabaseEnv || !supabase) return null
  const { data, error } = await supabase.rpc('approve_prize_redemption', {
    p_redemption_id: redemptionId,
    p_review_note: note ?? null,
  })
  if (error) throw error
  return data?.[0] ?? null
}

export async function rejectPrizeRedemption(redemptionId: string, note?: string) {
  if (!hasSupabaseEnv || !supabase) return null
  const { data, error } = await supabase.rpc('reject_prize_redemption', {
    p_redemption_id: redemptionId,
    p_review_note: note ?? null,
  })
  if (error) throw error
  return data?.[0] ?? null
}

export async function fetchStudentsByClassCode(classCode: string): Promise<Student[]> {
  if (!hasSupabaseEnv || !supabase) {
    return mockStudents.filter((student) => student.class_code === classCode)
  }

  const { data, error } = await supabase.rpc('students_by_class_code', {
    class_code_input: classCode,
  })
  if (error) throw error
  return (data ?? []) as Student[]
}
