import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

export function useTeacherAuth() {
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(Boolean(supabase))

  useEffect(() => {
    if (!supabase) return
    const client = supabase

    let active = true
    client.auth
      .getSession()
      .then(async ({ data, error }) => {
        if (!active) return
        if (error) {
          // Recover from stale local auth state (for example, invalid refresh token).
          await client.auth.signOut({ scope: 'local' })
          setSession(null)
          setIsLoading(false)
          return
        }
        setSession(data.session)
        setIsLoading(false)
      })
      .catch(async () => {
        if (!active) return
        await client.auth.signOut({ scope: 'local' })
        setSession(null)
        setIsLoading(false)
      })

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, nextSession) => {
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
    isAuthenticated: Boolean(session),
    teacherId: session?.user?.id ?? null,
  }
}
