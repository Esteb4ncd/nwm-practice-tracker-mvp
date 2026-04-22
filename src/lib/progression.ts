export const STEP_COIN_REWARD = 10
export const WORLD_COMPLETION_BONUS = 30

export const WORLDS = [
  {
    id: 1,
    key: 'mountain-1',
    label: 'Level 1',
    subtitle: 'Starting Mountain',
    difficulty: 'Easy',
    steps: 15,
    theme: 'forest' as const,
  },
  {
    id: 2,
    key: 'mountain-2',
    label: 'Level 2',
    subtitle: 'Middle Climb',
    difficulty: 'Medium',
    steps: 20,
    theme: 'canyon' as const,
  },
  {
    id: 3,
    key: 'mountain-3',
    label: 'Level 3',
    subtitle: 'Final Ascent',
    difficulty: 'Advanced',
    steps: 30,
    theme: 'summit' as const,
  },
] as const

export const TOTAL_STEPS = WORLDS.reduce((sum, world) => sum + world.steps, 0)
export const BADGE_INTERVAL = 5

export type WorldId = (typeof WORLDS)[number]['id']

type WorldProgress = {
  worldId: WorldId
  completedSteps: number
  totalSteps: number
  unlocked: boolean
  worldComplete: boolean
  startStep: number
  endStep: number
  milestoneBadges: number
}

export type ProgressBadge = {
  id: string
  label: string
  type: 'milestone' | 'world'
  worldId: WorldId
  atStep: number
}

export type ProgressSnapshot = {
  completedSteps: number
  currentStep: number
  currentWorldId: WorldId
  unlockedWorldId: WorldId
  worldProgress: WorldProgress[]
  milestoneBadgesEarned: number
  worldBadgesEarned: number
  totalBadgesEarned: number
  badgeMomentsPerWorld: Record<number, number>
  totalBadgeMoments: number
  baseCoins: number
  worldBonusCoins: number
  totalCoins: number
  earnedBadges: ProgressBadge[]
}

const cumulativeWorldSteps = WORLDS.map((_, index) =>
  WORLDS.slice(0, index + 1).reduce((sum, world) => sum + world.steps, 0),
)

function clampStepCount(stepCount: number) {
  return Math.max(0, Math.min(stepCount, TOTAL_STEPS))
}

function getWorldIdForStep(step: number): WorldId {
  const safeStep = Math.max(1, Math.min(step, TOTAL_STEPS))
  for (let index = 0; index < cumulativeWorldSteps.length; index += 1) {
    if (safeStep <= cumulativeWorldSteps[index]) return WORLDS[index].id
  }
  return 3
}

export function getProgressSnapshotFromStickers(stickerCount: number): ProgressSnapshot {
  const completedSteps = clampStepCount(stickerCount)
  const currentStep = Math.min(TOTAL_STEPS, completedSteps + 1)
  const currentWorldId = getWorldIdForStep(currentStep)

  const worldProgress: WorldProgress[] = []
  let previousWorldEnd = 0
  let unlockedWorldId: WorldId = 1
  let milestoneBadgesEarned = 0
  let worldBadgesEarned = 0
  const earnedBadges: ProgressBadge[] = []

  for (const world of WORLDS) {
    const startStep = previousWorldEnd + 1
    const endStep = previousWorldEnd + world.steps
    const completedInWorld = Math.max(0, Math.min(world.steps, completedSteps - previousWorldEnd))
    const milestoneBadges = Math.floor(completedInWorld / BADGE_INTERVAL)
    const worldComplete = completedInWorld === world.steps
    const unlocked = world.id <= unlockedWorldId

    worldProgress.push({
      worldId: world.id,
      completedSteps: completedInWorld,
      totalSteps: world.steps,
      unlocked,
      worldComplete,
      startStep,
      endStep,
      milestoneBadges,
    })

    for (let i = 1; i <= milestoneBadges; i += 1) {
      earnedBadges.push({
        id: `milestone-${world.id}-${i * BADGE_INTERVAL}`,
        label: `${world.label} • ${i * BADGE_INTERVAL} Steps`,
        type: 'milestone',
        worldId: world.id,
        atStep: startStep + i * BADGE_INTERVAL - 1,
      })
    }

    if (worldComplete) {
      worldBadgesEarned += 1
      earnedBadges.push({
        id: `world-${world.id}-complete`,
        label: `${world.label} Completion Trophy`,
        type: 'world',
        worldId: world.id,
        atStep: endStep,
      })
      if (world.id === 1) unlockedWorldId = 2
      if (world.id === 2) unlockedWorldId = 3
    }

    milestoneBadgesEarned += milestoneBadges
    previousWorldEnd = endStep
  }

  const badgeMomentsPerWorld = worldProgress.reduce<Record<number, number>>((acc, world) => {
    acc[world.worldId] = Math.floor(world.totalSteps / BADGE_INTERVAL) + 1
    return acc
  }, {})

  const totalBadgeMoments = Object.values(badgeMomentsPerWorld).reduce(
    (sum, worldMoments) => sum + worldMoments,
    0,
  )

  const baseCoins = completedSteps * STEP_COIN_REWARD
  const worldBonusCoins = worldBadgesEarned * WORLD_COMPLETION_BONUS

  return {
    completedSteps,
    currentStep,
    currentWorldId,
    unlockedWorldId,
    worldProgress,
    milestoneBadgesEarned,
    worldBadgesEarned,
    totalBadgesEarned: milestoneBadgesEarned + worldBadgesEarned,
    badgeMomentsPerWorld,
    totalBadgeMoments,
    baseCoins,
    worldBonusCoins,
    totalCoins: baseCoins + worldBonusCoins,
    earnedBadges,
  }
}
