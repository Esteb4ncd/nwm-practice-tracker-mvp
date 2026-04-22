import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { MapView } from '@/components/student/MapView'
import { getStudentSession } from '@/lib/auth'
import { mockStudents } from '@/lib/mockData'
import { fetchStudentRewards, getStickerCountFromRewards } from '@/lib/studentData'
import { getProgressSnapshotFromStickers, TOTAL_STEPS } from '@/lib/progression'
import type { Reward } from '@/lib/types'

export function StudentHomePage() {
  const [activeLevel, setActiveLevel] = useState(1)
  const [rewards, setRewards] = useState<Reward[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCelebration, setShowCelebration] = useState(false)
  const studentSession = getStudentSession()
  const student =
    mockStudents.find((entry) => entry.id === studentSession?.studentId) ?? mockStudents[0]
  const previousStickerCountRef = useRef(0)

  useEffect(() => {
    let active = true
    const loadRewards = async () => {
      setIsLoading(true)
      setError('')
      try {
        const rows = await fetchStudentRewards(student.id)
        if (!active) return
        const stickerCount = getStickerCountFromRewards(rows)
        if (stickerCount > previousStickerCountRef.current && previousStickerCountRef.current > 0) {
          setShowCelebration(true)
          window.setTimeout(() => setShowCelebration(false), 1200)
        }
        previousStickerCountRef.current = stickerCount
        setRewards(rows)
      } catch {
        if (!active) return
        setError('Unable to load reward progress right now.')
      } finally {
        if (active) setIsLoading(false)
      }
    }

    void loadRewards()
    return () => {
      active = false
    }
  }, [student.id])

  const progress = useMemo(() => {
    const stickerCount = getStickerCountFromRewards(rewards)
    return getProgressSnapshotFromStickers(stickerCount)
  }, [rewards])

  useEffect(() => {
    if (activeLevel > progress.unlockedWorldId) {
      setActiveLevel(progress.unlockedWorldId)
    }
  }, [activeLevel, progress.unlockedWorldId])

  const currentWorldProgress = progress.worldProgress.find((world) => world.worldId === activeLevel)

  return (
    <div className="space-y-5">
      <section className="flex items-center gap-4 rounded-xl border border-border bg-white p-5">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-studentTeal text-2xl">
          🎵
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-textPrimary">Hi {student.username}!</h1>
          <p className="text-sm text-textSecondary">
            You&apos;re on level {progress.currentWorldId}. Keep climbing to checkpoint{' '}
            {Math.min(
              currentWorldProgress?.totalSteps ?? 1,
              progress.currentStep - ((currentWorldProgress?.startStep ?? 1) - 1),
            )}
            !
          </p>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-xl border border-border bg-white p-4">
          <p className="text-xs text-textMuted">Completed Steps</p>
          <p className="text-2xl font-semibold text-textPrimary">
            {progress.completedSteps}/{TOTAL_STEPS}
          </p>
        </article>
        <article className="rounded-xl border border-border bg-white p-4">
          <p className="text-xs text-textMuted">Coins</p>
          <p className="text-2xl font-semibold text-textPrimary">{progress.totalCoins}</p>
        </article>
        <article className="rounded-xl border border-border bg-white p-4">
          <p className="text-xs text-textMuted">Milestone Badges</p>
          <p className="text-2xl font-semibold text-textPrimary">{progress.milestoneBadgesEarned}</p>
        </article>
        <article className="rounded-xl border border-border bg-white p-4">
          <p className="text-xs text-textMuted">World Trophies</p>
          <p className="text-2xl font-semibold text-textPrimary">{progress.worldBadgesEarned}</p>
        </article>
      </section>

      {isLoading ? <p className="text-sm text-textSecondary">Loading checkpoint progress...</p> : null}
      {error ? <p className="text-sm text-error">{error}</p> : null}

      <MapView
        worldId={activeLevel}
        onWorldChange={setActiveLevel}
        progress={progress}
        recentlyUnlockedStep={showCelebration ? progress.completedSteps : null}
      />

      {showCelebration ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-8 left-1/2 z-50 -translate-x-1/2 rounded-full bg-success px-4 py-2 text-sm font-semibold text-white shadow-panel"
        >
          Nice! +10 coins and 1 checkpoint cleared
        </motion.div>
      ) : null}
    </div>
  )
}
