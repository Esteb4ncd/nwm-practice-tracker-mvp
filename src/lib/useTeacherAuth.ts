import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { getRole } from '@/lib/auth'
import { hasSupabaseEnv, supabase } from '@/lib/supabase'

export function useTeacherAuth() {
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const isFallbackTeacher = !hasSupabaseEnv && getRole() === 'teacher'

  useEffect(() => {
    if (!hasSupabaseEnv || !supabase) {
      setSession(null)
      setIsLoading(false)
      return
    }

    let active = true
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      setSession(data.session)
      setIsLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setIsLoading(false)
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  return {
    session,
    isLoading,
    isAuthenticated: Boolean(session) || isFallbackTeacher,
    teacherId: session?.user?.id ?? null,
  }
}
