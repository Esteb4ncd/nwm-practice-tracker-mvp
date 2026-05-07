import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { getStudentSession } from '@/lib/auth'
import { fetchStudentBadges, fetchStudentProgressSnapshot } from '@/lib/progressionApi'

const AVATARS = [
  { key: 'climber', icon: '🧗', label: 'Climber', unlock: 'Base avatar (always unlocked)' },
  { key: 'violin', icon: '🎻', label: 'Violin Hero', unlock: 'Unlock at 3 badges' },
  { key: 'piano', icon: '🎹', label: 'Piano Pro', unlock: 'Unlock at 6 badges' },
  { key: 'drums', icon: '🥁', label: 'Drum Master', unlock: 'Unlock after World 1 trophy' },
  { key: 'vocal', icon: '🎤', label: 'Stage Star', unlock: 'Unlock after World 2 trophy' },
] as const

function getAvatarStorageKey(studentId: string) {
  return `music-app-avatar-${studentId}`
}

export function CharacterDisplay() {
  const studentSession = getStudentSession()
  const studentId = studentSession?.studentId ?? null
  const studentShareToken = studentSession?.shareToken ?? null
  const [activeAvatarKey, setActiveAvatarKey] = useState<(typeof AVATARS)[number]['key']>(() => {
    if (!studentId) return 'climber'
    const saved = localStorage.getItem(getAvatarStorageKey(studentId)) as
      | (typeof AVATARS)[number]['key']
      | null
    return saved ?? 'climber'
  })
  const [totalBadges, setTotalBadges] = useState(0)
  const [worldBadges, setWorldBadges] = useState(0)
  const [completedLevels, setCompletedLevels] = useState(0)
  const [coinBalance, setCoinBalance] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    const loadCharacterProgress = async () => {
      setIsLoading(true)
      setError('')
      try {
        if (!studentId) throw new Error('Student session not found. Please sign in again.')
        if (!studentShareToken) {
          throw new Error('Student session expired. Please sign in again from Student Login.')
        }
        const [badgeRows, snapshot] = await Promise.all([
          fetchStudentBadges(studentId, studentShareToken),
          fetchStudentProgressSnapshot(studentId, studentShareToken),
        ])
        if (!active) return
        setTotalBadges(badgeRows.length)
        setWorldBadges(snapshot.world_badges)
        setCompletedLevels(snapshot.total_steps)
        setCoinBalance(snapshot.coin_balance)
      } catch (err) {
        if (!active) return
        setError(err instanceof Error ? err.message : 'Unable to load character progress right now.')
      } finally {
        if (active) setIsLoading(false)
      }
    }
    void loadCharacterProgress()
    return () => {
      active = false
    }
  }, [studentId, studentShareToken])

  const unlockedAvatarKeys = useMemo(() => {
    const unlocked = new Set<(typeof AVATARS)[number]['key']>(['climber'])
    if (totalBadges >= 3) unlocked.add('violin')
    if (totalBadges >= 6) unlocked.add('piano')
    if (worldBadges >= 1) unlocked.add('drums')
    if (worldBadges >= 2) unlocked.add('vocal')
    return unlocked
  }, [totalBadges, worldBadges])

  const selectedAvatarKey = unlockedAvatarKeys.has(activeAvatarKey) ? activeAvatarKey : 'climber'
  const activeAvatar = AVATARS.find((avatar) => avatar.key === selectedAvatarKey) ?? AVATARS[0]

  const onSelectAvatar = (avatarKey: (typeof AVATARS)[number]['key']) => {
    if (!studentId || !unlockedAvatarKeys.has(avatarKey)) return
    setActiveAvatarKey(avatarKey)
    localStorage.setItem(getAvatarStorageKey(studentId), avatarKey)
  }

  return (
    <section className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
      <div className="rounded-xl border border-border bg-white p-4 sm:p-6">
        <p className="text-sm text-textSecondary">My Character</p>
        <div className="mt-4 flex h-44 items-center justify-center rounded-xl bg-neutral text-6xl sm:h-48 sm:text-7xl">
          {activeAvatar.icon}
        </div>
        <p className="mt-3 text-sm font-medium text-textPrimary">{activeAvatar.label}</p>
      </div>

      <div className="rounded-xl border border-border bg-white p-4 sm:p-6">
        <p className="mb-3 text-sm font-semibold text-textPrimary">Choose Avatar Style (Badge Unlocks)</p>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {AVATARS.map((avatar) => {
            const unlocked = unlockedAvatarKeys.has(avatar.key)
            return (
            <Button
              key={avatar.key}
              variant={selectedAvatarKey === avatar.key ? 'default' : 'secondary'}
              onClick={() => onSelectAvatar(avatar.key)}
              disabled={!unlocked}
              title={unlocked ? `Select ${avatar.label}` : avatar.unlock}
            >
              {avatar.icon}
            </Button>
            )
          })}
        </div>

        <div className="mt-6 space-y-2 text-sm text-textSecondary">
          {isLoading ? <p>Loading character progression...</p> : null}
          {error ? <p className="text-error">{error}</p> : null}
          {!isLoading && !error ? (
            <>
              <p>Levels completed: {completedLevels}/65</p>
              <p>Total badges: {totalBadges}</p>
              <p>World trophies: {worldBadges}</p>
              <p>Coin balance: {coinBalance}</p>
            </>
          ) : null}
        </div>
      </div>
    </section>
  )
}
