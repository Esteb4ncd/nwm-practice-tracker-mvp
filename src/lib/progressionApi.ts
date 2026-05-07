import { requireSupabaseClient } from '@/lib/supabase'
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
  const supabase = requireSupabaseClient()

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
  const supabase = requireSupabaseClient()

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
  const supabase = requireSupabaseClient()

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
  const supabase = requireSupabaseClient()

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
  const supabase = requireSupabaseClient()
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
  const supabase = requireSupabaseClient()

  const { data, error } = await supabase.rpc('get_teacher_redemption_queue')
  if (error) throw error
  return (data ?? []) as PrizeRedemption[]
}

export async function approvePrizeRedemption(redemptionId: string, note?: string) {
  const supabase = requireSupabaseClient()
  const { data, error } = await supabase.rpc('approve_prize_redemption', {
    p_redemption_id: redemptionId,
    p_review_note: note ?? null,
  })
  if (error) throw error
  return data?.[0] ?? null
}

export async function rejectPrizeRedemption(redemptionId: string, note?: string) {
  const supabase = requireSupabaseClient()
  const { data, error } = await supabase.rpc('reject_prize_redemption', {
    p_redemption_id: redemptionId,
    p_review_note: note ?? null,
  })
  if (error) throw error
  return data?.[0] ?? null
}

export async function fetchStudentsByClassCode(classCode: string): Promise<Student[]> {
  const supabase = requireSupabaseClient()

  const { data, error } = await supabase.rpc('students_by_class_code', {
    class_code_input: classCode,
  })
  if (error) throw error
  return (data ?? []) as Student[]
}
