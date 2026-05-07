import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Music2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { requireSupabaseClient } from '@/lib/supabase'

export function InstructorLoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
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
      navigate('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in right now.')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral px-4">
      <form onSubmit={onSubmit} className="w-full max-w-md rounded-xl border border-border bg-white p-6 sm:p-8">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-dark text-white">
            <Music2 className="h-5 w-5" />
          </div>
          <h1 className="text-xl font-semibold text-textPrimary sm:text-2xl">MusicApp Teacher Portal</h1>
        </div>

        <div className="space-y-4">
          <Input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email"
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

          <Button className="w-full">Sign In</Button>
        </div>

        <div className="mt-4 space-y-2 text-center text-sm">
          <p className="text-textSecondary">Use Supabase Auth password reset for teacher accounts.</p>
          <p className="text-textMuted">
            For student login, use the{' '}
            <Link className="text-primary" to="/login/student">
              Student Portal →
            </Link>
          </p>
        </div>
      </form>
    </div>
  )
}
