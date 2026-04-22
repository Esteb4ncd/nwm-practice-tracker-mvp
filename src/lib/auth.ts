import bcrypt from 'bcryptjs'
import { supabase } from './supabase'

export type AppRole = 'teacher' | 'student'

const ROLE_KEY = 'music-app-role'
const STUDENT_SESSION_KEY = 'music-app-student-session'

export function setRole(role: AppRole) {
  localStorage.setItem(ROLE_KEY, role)
}

export function getRole(): AppRole | null {
  const role = localStorage.getItem(ROLE_KEY)
  return role === 'teacher' || role === 'student' ? role : null
}

export function clearRole() {
  localStorage.removeItem(ROLE_KEY)
  localStorage.removeItem(STUDENT_SESSION_KEY)
}

export async function signOutTeacher() {
  if (supabase) {
    await supabase.auth.signOut()
  }
  clearRole()
}

export async function verifyPin(pin: string, pinHash: string | null) {
  if (!pinHash) return false
  if (pinHash.startsWith('$2')) {
    return bcrypt.compare(pin, pinHash)
  }
  return pin === pinHash
}

export function saveStudentSession(studentId: string, classCode: string) {
  localStorage.setItem(
    STUDENT_SESSION_KEY,
    JSON.stringify({
      studentId,
      classCode,
    }),
  )
  setRole('student')
}

export function getStudentSession(): {
  studentId: string
  classCode: string
} | null {
  const session = localStorage.getItem(STUDENT_SESSION_KEY)
  if (!session) return null
  try {
    return JSON.parse(session) as { studentId: string; classCode: string }
  } catch {
    return null
  }
}
