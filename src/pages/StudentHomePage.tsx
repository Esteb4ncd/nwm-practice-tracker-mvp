import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { MapView } from '@/components/student/MapView'
import { getStudentSession } from '@/lib/auth'
import { fetchStudentRewards, getStickerCountFromRewards } from '@/lib/studentData'
import { fetchStudentProgressSnapshot } from '@/lib/progressionApi'
import { getProgressSnapshotFromStickers, TOTAL_STEPS } from '@/lib/progression'
import type { ProgressSnapshotRow, Reward } from '@/lib/types'

export function StudentHomePage() {
  const [activeLevel, setActiveLevel] = useState(1)
  const [rewards, setRewards] = useState<Reward[]>([])
  const [snapshot, setSnapshot] = useState<ProgressSnapshotRow | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCelebration, setShowCelebration] = useState(false)
  const studentSession = getStudentSession()
  const activeStudentId = studentSession?.studentId ?? null
  const studentShareToken = studentSession?.shareToken ?? null
  const displayName = studentSession?.username ?? 'Student'
  const previousStickerCountRef = useRef(0)

  useEffect(() => {
    let active = true
    const loadRewards = async () => {
      setIsLoading(true)
      setError('')
      try {
        if (!activeStudentId) {
          throw new Error('Student session not found. Please sign in again.')
        }
        if (!studentShareToken) {
          throw new Error('Student session expired. Please sign in again from Student Login.')
        }
        const [rows, progressSnapshot] = await Promise.all([
          fetchStudentRewards(activeStudentId, studentShareToken),
          fetchStudentProgressSnapshot(activeStudentId, studentShareToken),
        ])
        if (!active) return
        const stickerCount = getStickerCountFromRewards(rows)
        if (stickerCount > previousStickerCountRef.current && previousStickerCountRef.current > 0) {
          setShowCelebration(true)
          window.setTimeout(() => setShowCelebration(false), 1200)
        }
        previousStickerCountRef.current = stickerCount
        setRewards(rows)
        setSnapshot(progressSnapshot)
      } catch (err) {
        if (!active) return
        setError(err instanceof Error ? err.message : 'Unable to load reward progress right now.')
      } finally {
        if (active) setIsLoading(false)
      }
    }

    void loadRewards()
    return () => {
      active = false
    }
  }, [activeStudentId, studentShareToken])

  const progress = useMemo(() => {
    if (snapshot) {
      return getProgressSnapshotFromStickers(snapshot.total_steps)
    }
    const stickerCount = getStickerCountFromRewards(rewards)
    return getProgressSnapshotFromStickers(stickerCount)
  }, [rewards, snapshot])

  const effectiveActiveLevel = Math.min(activeLevel, progress.unlockedWorldId)
  const handleWorldChange = (worldId: number) => {
    setActiveLevel(Math.min(worldId, progress.unlockedWorldId))
  }

  const currentWorldProgress = progress.worldProgress.find(
    (world) => world.worldId === effectiveActiveLevel,
  )

  return (
    <div className="space-y-5">
      <section className="flex items-center gap-4 rounded-xl border border-border bg-white p-4 sm:p-5">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-studentTeal text-2xl">
          🎵
        </div>
        <div>
          <h1 className="text-xl font-semibold text-textPrimary sm:text-2xl">Hi {displayName}!</h1>
          <p className="text-sm text-textSecondary">
            You&apos;re in world {progress.currentWorldId}. Keep climbing to level{' '}
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
          <p className="text-xs text-textMuted">Completed Levels</p>
          <p className="text-xl font-semibold text-textPrimary sm:text-2xl">
            {progress.completedSteps}/{TOTAL_STEPS}
          </p>
        </article>
        <article className="rounded-xl border border-border bg-white p-4">
          <p className="text-xs text-textMuted">Coins</p>
          <p className="text-xl font-semibold text-textPrimary sm:text-2xl">{progress.totalCoins}</p>
        </article>
        <article className="rounded-xl border border-border bg-white p-4">
          <p className="text-xs text-textMuted">Milestone Badges</p>
          <p className="text-xl font-semibold text-textPrimary sm:text-2xl">
            {progress.milestoneBadgesEarned}
          </p>
        </article>
        <article className="rounded-xl border border-border bg-white p-4">
          <p className="text-xs text-textMuted">World Trophies</p>
          <p className="text-xl font-semibold text-textPrimary sm:text-2xl">{progress.worldBadgesEarned}</p>
        </article>
      </section>

      {isLoading ? <p className="text-sm text-textSecondary">Loading world progress...</p> : null}
      {error ? <p className="text-sm text-error">{error}</p> : null}

      <MapView
        worldId={effectiveActiveLevel}
        onWorldChange={handleWorldChange}
        progress={progress}
        recentlyUnlockedStep={showCelebration ? progress.completedSteps : null}
      />

      {showCelebration ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-5 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-full bg-success px-4 py-2 text-center text-sm font-semibold text-white shadow-panel"
        >
          Nice! +10 coins and 1 level cleared
        </motion.div>
      ) : null}
    </div>
  )
}
