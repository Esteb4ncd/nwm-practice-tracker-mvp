import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { checkAdminAccess } from '@/lib/adminApi'
import { requireSupabaseClient } from '@/lib/supabase'

export function AdminLoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    setIsLoading(true)
    try {
      const supabase = requireSupabaseClient()
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (signInError) {
        setError(signInError.message)
        return
      }

      const isAdmin = await checkAdminAccess()
      if (!isAdmin) {
        await supabase.auth.signOut({ scope: 'local' })
        setError('This account is not a master admin profile.')
        return
      }

      navigate('/admin')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in right now.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral px-4">
      <form onSubmit={onSubmit} className="w-full max-w-md rounded-xl border border-border bg-white p-6 sm:p-8">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-dark text-white">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <h1 className="text-xl font-semibold text-textPrimary sm:text-2xl">Master Admin Portal</h1>
          <p className="mt-1 text-sm text-textSecondary">Manage teachers and students without SQL.</p>
        </div>

        <div className="space-y-4">
          <Input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Admin email"
            required
          />
          <Input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password"
            required
          />

          {error ? <p className="text-sm text-error">{error}</p> : null}

          <Button className="w-full" disabled={isLoading}>
            {isLoading ? 'Signing in...' : 'Sign In as Admin'}
          </Button>
        </div>

        <div className="mt-4 space-y-1 text-center text-sm text-textMuted">
          <p>
            Teacher login?{' '}
            <Link className="text-primary" to="/login/instructor">
              Go to Teacher Portal
            </Link>
          </p>
        </div>
      </form>
    </div>
  )
}
