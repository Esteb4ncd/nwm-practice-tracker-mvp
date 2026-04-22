import { useEffect, useMemo, useState } from 'react'
import { RewardCard } from '@/components/student/RewardCard'
import { mockStudents } from '@/lib/mockData'
import { getStudentSession } from '@/lib/auth'
import { fetchStudentRewards, getStickerCountFromRewards } from '@/lib/studentData'
import {
  fetchPrizeCatalog,
  fetchStudentBadges,
  fetchStudentProgressSnapshot,
  requestPrizeRedemption,
} from '@/lib/progressionApi'
import { getProgressSnapshotFromStickers, TOTAL_STEPS, WORLDS } from '@/lib/progression'
import type { PrizeCatalogItem, Reward, StudentBadge } from '@/lib/types'

export function StudentRewardsPage() {
  const studentSession = getStudentSession()
  const studentId = studentSession?.studentId ?? mockStudents[0].id
  const [rewards, setRewards] = useState<Reward[]>([])
  const [prizes, setPrizes] = useState<PrizeCatalogItem[]>([])
  const [badges, setBadges] = useState<StudentBadge[]>([])
  const [stepsFromServer, setStepsFromServer] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [redeemNotice, setRedeemNotice] = useState('')

  useEffect(() => {
    let active = true
    const loadRewards = async () => {
      setIsLoading(true)
      setError('')
      try {
        const [rows, prizeRows, badgeRows, snapshot] = await Promise.all([
          fetchStudentRewards(studentId, studentSession?.shareToken ?? null),
          fetchPrizeCatalog(studentId, studentSession?.shareToken ?? null),
          fetchStudentBadges(studentId, studentSession?.shareToken ?? null),
          fetchStudentProgressSnapshot(studentId, studentSession?.shareToken ?? null),
        ])
        if (active) setRewards(rows)
        if (active) setPrizes(prizeRows)
        if (active) setBadges(badgeRows)
        if (active) setStepsFromServer(snapshot.total_steps)
      } catch {
        if (active) setError('Unable to load rewards right now.')
      } finally {
        if (active) setIsLoading(false)
      }
    }
    void loadRewards()
    return () => {
      active = false
    }
  }, [studentId, studentSession?.shareToken])

  const progress = useMemo(() => {
    return getProgressSnapshotFromStickers(
      stepsFromServer ?? getStickerCountFromRewards(rewards),
    )
  }, [rewards, stepsFromServer])

  return (
    <div className="space-y-5">
      <section className="grid gap-3 md:grid-cols-3">
        <article className="rounded-xl border border-border bg-white p-4">
          <p className="text-sm text-textSecondary">Coins (spend on real rewards)</p>
          <p className="text-2xl font-semibold text-textPrimary">{progress.totalCoins}</p>
          <p className="text-xs text-textMuted">
            {progress.baseCoins} base + {progress.worldBonusCoins} world bonus
          </p>
        </article>
        <article className="rounded-xl border border-border bg-white p-4">
          <p className="text-sm text-textSecondary">Badges (avatar unlock track)</p>
          <p className="text-2xl font-semibold text-textPrimary">{progress.totalBadgesEarned}</p>
          <p className="text-xs text-textMuted">
            {progress.milestoneBadgesEarned} milestone + {progress.worldBadgesEarned} world trophies
          </p>
        </article>
        <article className="rounded-xl border border-border bg-white p-4">
          <p className="text-sm text-textSecondary">Checkpoints cleared</p>
          <p className="text-2xl font-semibold text-textPrimary">
            {progress.completedSteps}/{TOTAL_STEPS}
          </p>
          <p className="text-xs text-textMuted">1 sticker = 1 completed step</p>
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-xl border border-border bg-white p-4">
          <h3 className="text-base font-semibold text-textPrimary">Badge Milestones by World</h3>
          <div className="mt-3 space-y-2">
            {WORLDS.map((world) => (
              <div key={world.id} className="flex items-center justify-between text-sm">
                <p className="text-textSecondary">
                  {world.label} ({world.steps} steps)
                </p>
                <p className="font-medium text-textPrimary">
                  {progress.worldProgress.find((entry) => entry.worldId === world.id)?.milestoneBadges ?? 0}/
                  {progress.badgeMomentsPerWorld[world.id] - 1} + Trophy
                </p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-textMuted">
            Total badge moments across all worlds: {progress.totalBadgeMoments}
          </p>
        </article>

        <article className="rounded-xl border border-border bg-white p-4">
          <h3 className="text-base font-semibold text-textPrimary">Prize Economy</h3>
          <div className="mt-3 space-y-3 text-sm text-textSecondary">
            <p>Complete 1 step = 10 coins</p>
            <p>Complete a world = +30 bonus coins</p>
            <p>Example reward: Candy = 30 coins</p>
            <p>Use coins for real-world prizes and badges for avatar styles/accessories.</p>
          </div>
        </article>
      </section>

      <section className="rounded-xl border border-border bg-white p-4">
        <h3 className="mb-3 text-base font-semibold text-textPrimary">Redeem Coins</h3>
        <div className="grid gap-3 md:grid-cols-2">
          {prizes.map((prize) => (
            <article key={prize.id} className="rounded-lg border border-border p-3">
              <p className="font-medium text-textPrimary">{prize.title}</p>
              <p className="text-xs text-textSecondary">{prize.description ?? 'Teacher reward item'}</p>
              <p className="mt-2 text-sm font-semibold text-primary">{prize.coin_cost} coins</p>
              <button
                className="mt-3 rounded-md bg-dark px-3 py-1.5 text-xs font-medium text-white disabled:opacity-40"
                disabled={progress.totalCoins < prize.coin_cost}
                onClick={async () => {
                  try {
                    await requestPrizeRedemption(
                      studentId,
                      prize.id,
                      studentSession?.shareToken ?? null,
                      'Student requested from rewards page.',
                    )
                    setRedeemNotice(`Requested ${prize.title}. Waiting for teacher approval.`)
                  } catch {
                    setRedeemNotice('Unable to request redemption right now.')
                  }
                }}
              >
                Request redemption
              </button>
            </article>
          ))}
        </div>
        {redeemNotice ? <p className="mt-3 text-sm text-success">{redeemNotice}</p> : null}
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {rewards.map((reward) => (
          <RewardCard key={reward.id} reward={reward} />
        ))}
      </section>

      <section className="rounded-xl border border-border bg-white p-4">
        <h3 className="mb-3 text-base font-semibold text-textPrimary">Badge History</h3>
        <div className="grid gap-2 sm:grid-cols-2">
          {badges.map((badge) => (
            <div key={badge.id} className="rounded-lg border border-border p-3">
              <p className="text-sm font-medium text-textPrimary">{badge.badge_label}</p>
              <p className="text-xs text-textSecondary">
                {badge.badge_type === 'world' ? 'World trophy' : 'Milestone badge'} · World {badge.world_id}
              </p>
            </div>
          ))}
        </div>
      </section>

      {isLoading ? <p className="text-sm text-textSecondary">Loading rewards...</p> : null}
      {error ? <p className="text-sm text-error">{error}</p> : null}
    </div>
  )
}
