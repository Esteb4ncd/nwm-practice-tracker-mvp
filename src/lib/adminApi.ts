import { requireSupabaseClient } from '@/lib/supabase'
import type { AdminAuthUser, AdminStudentProfile, AdminTeacherProfile } from '@/lib/types'

export async function checkAdminAccess() {
  const supabase = requireSupabaseClient()
  const { data, error } = await supabase.rpc('admin_is_current_user')
  if (error) throw error
  return Boolean(data)
}

export async function fetchAdminAuthUsers(): Promise<AdminAuthUser[]> {
  const supabase = requireSupabaseClient()
  const { data, error } = await supabase.rpc('admin_list_auth_users')
  if (error) throw error
  return (data ?? []) as AdminAuthUser[]
}

export async function fetchAdminTeachers(): Promise<AdminTeacherProfile[]> {
  const supabase = requireSupabaseClient()
  const { data, error } = await supabase.rpc('admin_list_teachers')
  if (error) throw error
  return (data ?? []) as AdminTeacherProfile[]
}

export async function fetchAdminStudents(): Promise<AdminStudentProfile[]> {
  const supabase = requireSupabaseClient()
  const { data, error } = await supabase.rpc('admin_list_students')
  if (error) throw error
  return (data ?? []) as AdminStudentProfile[]
}

export async function createTeacherProfile(
  teacherId: string,
  name: string,
  email?: string | null,
): Promise<AdminTeacherProfile | null> {
  const supabase = requireSupabaseClient()
  const { data, error } = await supabase.rpc('admin_create_teacher_profile', {
    p_teacher_id: teacherId,
    p_name: name.trim() || null,
    p_email: email?.trim() || null,
  })
  if (error) throw error
  return ((data ?? [])[0] as AdminTeacherProfile | undefined) ?? null
}

export async function createStudentProfile(
  teacherId: string,
  username: string,
  pin: string,
  classCode?: string,
): Promise<AdminStudentProfile | null> {
  const supabase = requireSupabaseClient()
  const { data, error } = await supabase.rpc('admin_create_student_profile', {
    p_teacher_id: teacherId,
    p_username: username.trim(),
    p_pin: pin.trim(),
    p_class_code: classCode?.trim().toUpperCase() || null,
  })
  if (error) throw error
  return ((data ?? [])[0] as AdminStudentProfile | undefined) ?? null
}
