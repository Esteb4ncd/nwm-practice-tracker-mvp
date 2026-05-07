import { Link } from 'react-router-dom'
import { Music2, Piano, GraduationCap, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function LandingPage() {
  return (
    <div className="min-h-screen bg-neutral text-textPrimary">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-white p-2 shadow-sm">
            <Music2 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-textPrimary">NewWest Practice Tracker</p>
            <p className="text-xs text-textSecondary">NewWest Music School</p>
          </div>
        </div>

        <nav className="flex items-center gap-3 text-sm">
          <Link to="/login/instructor" className="rounded-md px-3 py-1.5 hover:bg-white">
            For Teachers
          </Link>
          <Link to="/login/student" className="rounded-md px-3 py-1.5 hover:bg-white">
            For Students
          </Link>
          <Button asChild>
            <Link to="/login/instructor">Open Portal</Link>
          </Button>
        </nav>
      </header>

      <main className="mx-auto grid max-w-6xl items-start gap-8 px-6 pb-14 pt-8 lg:grid-cols-[1.2fr_1fr]">
        <section className="rounded-3xl border border-border bg-white p-8 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">Student Growth Dashboard</p>
          <h1 className="mt-3 text-4xl font-semibold leading-tight text-textPrimary">
            Practice tracking made simple for teachers and students.
          </h1>
          <p className="mt-4 max-w-xl text-base text-textSecondary">
            Assign stickers, unlock progression checkpoints, and manage prize redemptions from one shared system.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild>
              <Link to="/login/instructor">Teacher Login</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link to="/login/student">Student Login</Link>
            </Button>
          </div>

          <div className="mt-8 grid gap-2 text-sm text-textSecondary">
            {[
              'Live Supabase-backed student progression',
              'Teacher reward assignment and redemption approvals',
              'Student map, rewards, and character progress views',
            ].map((item) => (
              <p key={item} className="flex items-center gap-2">
                <Check className="h-4 w-4 text-success" />
                {item}
              </p>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-border bg-white p-6 shadow-sm">
          <p className="text-sm text-textSecondary">Portal Access</p>
          <div className="mt-4 space-y-3">
            <article className="rounded-xl border border-border p-4">
              <div className="mb-2 flex items-center gap-2">
                <Piano className="h-5 w-5 text-studentTeal" />
                <h3 className="font-semibold text-textPrimary">Student Portal</h3>
              </div>
              <p className="text-sm text-textSecondary">
                Practice map, checkpoint milestones, coin economy, and rewards redemption.
              </p>
            </article>
            <article className="rounded-xl border border-border p-4">
              <div className="mb-2 flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-textPrimary">Teacher Portal</h3>
              </div>
              <p className="text-sm text-textSecondary">
                Class dashboard, student profiles, sticker assignment, and redemption approvals.
              </p>
            </article>
          </div>
        </section>
      </main>

      <section className="border-t border-border bg-white py-5">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 text-sm text-textSecondary">
          <p>Built for NewWest Music School</p>
          <p>Supabase + Vercel deployment ready</p>
        </div>
      </section>
    </div>
  )
}
