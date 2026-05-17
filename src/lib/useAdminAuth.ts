import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { checkAdminAccess } from '@/lib/adminApi'

export function useAdminAuth() {
  const [session, setSession] = useState<Session | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(Boolean(supabase))

  useEffect(() => {
    if (!supabase) return
    const client = supabase
    let active = true

    const resolveAdminAccess = async (nextSession: Session | null) => {
      setSession(nextSession)
      if (!nextSession) {
        setIsAdmin(false)
        setIsLoading(false)
        return
      }
      try {
        const allowed = await checkAdminAccess()
        if (!active) return
        setIsAdmin(allowed)
      } catch {
        if (!active) return
        setIsAdmin(false)
      } finally {
        if (active) setIsLoading(false)
      }
    }

    client.auth
      .getSession()
      .then(({ data }) => resolveAdminAccess(data.session))
      .catch(() => {
        if (!active) return
        setSession(null)
        setIsAdmin(false)
        setIsLoading(false)
      })

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, nextSession) => {
      void resolveAdminAccess(nextSession)
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  return {
    session,
    isAdmin,
    isLoading,
    isAuthenticated: Boolean(session),
    adminId: session?.user?.id ?? null,
  }
}
