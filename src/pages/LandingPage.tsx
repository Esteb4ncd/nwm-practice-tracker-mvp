import { Link } from 'react-router-dom'
import { ChevronDown, Music2, Piano, GraduationCap } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'

export function LandingPage() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="min-h-screen bg-darkDeep text-white">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-3">
          <Music2 className="h-6 w-6 text-accent" />
          <div>
            <p className="font-semibold">MusicApp</p>
            <p className="text-xs text-slate-400">NewWest Music School</p>
          </div>
        </div>

        <nav className="flex items-center gap-6 text-sm">
          <Link to="/login/instructor" className="hover:text-accent">
            For Teachers
          </Link>
          <Link to="/login/student" className="hover:text-accent">
            For Students
          </Link>
          <div className="relative">
            <Button variant="secondary" onClick={() => setIsOpen((value) => !value)} className="gap-2">
              Sign In <ChevronDown className="h-4 w-4" />
            </Button>
            {isOpen ? (
              <div className="absolute right-0 top-12 w-44 rounded-lg border border-darkMid bg-dark p-2 shadow-panel">
                <Link className="block rounded px-3 py-2 text-sm hover:bg-darkMid" to="/login/student">
                  Student Login
                </Link>
                <Link className="block rounded px-3 py-2 text-sm hover:bg-darkMid" to="/login/instructor">
                  Teacher Login
                </Link>
              </div>
            ) : null}
          </div>
        </nav>
      </header>

      <main className="mx-auto grid max-w-6xl gap-10 px-6 pb-12 pt-10 lg:grid-cols-2">
        <section>
          <h1 className="text-5xl font-semibold leading-tight">Practice makes perfect. 🎶</h1>
          <p className="mt-4 max-w-lg text-lg text-slate-300">
            Build strong practice habits with stars, levels, and progress tracking designed for young musicians.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <article className="rounded-xl border border-studentTeal bg-dark p-5">
              <Piano className="mb-3 h-6 w-6 text-studentTeal" />
              <h3 className="text-xl font-semibold">I&apos;m a Student</h3>
              <p className="mt-2 text-sm text-slate-300">Start your adventure map and earn badges daily.</p>
              <Link className="mt-4 inline-block text-studentTeal" to="/login/student">
                Student Login →
              </Link>
            </article>
            <article className="rounded-xl border border-success bg-dark p-5">
              <GraduationCap className="mb-3 h-6 w-6 text-success" />
              <h3 className="text-xl font-semibold">I&apos;m a Teacher</h3>
              <p className="mt-2 text-sm text-slate-300">Track each student and assign stickers quickly.</p>
              <Link className="mt-4 inline-block text-success" to="/login/instructor">
                Teacher Login →
              </Link>
            </article>
          </div>
        </section>

        <section className="rounded-2xl border border-darkMid bg-dark p-6">
          <p className="mb-3 text-sm text-slate-400">Student map preview</p>
          <div className="h-[360px] rounded-xl border border-darkMid bg-gradient-to-b from-darkMid to-darkDeep p-5">
            <div className="relative h-full rounded-lg border border-darkMid">
              <div className="absolute left-8 top-8 h-10 w-10 rounded-full bg-success text-center leading-10">1</div>
              <div className="absolute right-10 top-20 h-10 w-10 rounded-full bg-success text-center leading-10">2</div>
              <div className="absolute left-16 top-44 h-10 w-10 rounded-full bg-accent text-dark text-center leading-10">
                3
              </div>
              <div className="absolute right-16 top-60 h-10 w-10 rounded-full bg-slate-500 text-center leading-10">
                🔒
              </div>
            </div>
          </div>
        </section>
      </main>

      <section className="border-t border-darkMid bg-dark py-5">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-4 px-6 text-sm text-slate-300 md:grid-cols-4">
          <p>⭐ Reward System</p>
          <p>📈 Progress Tracking</p>
          <p>👨‍👩‍👧 Parent Visibility</p>
          <p>🎮 Gamification</p>
        </div>
      </section>
    </div>
  )
}
