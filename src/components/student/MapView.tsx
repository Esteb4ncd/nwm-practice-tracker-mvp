import { useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { WORLDS, type ProgressSnapshot } from '@/lib/progression'
import { MapNode } from './MapNode'

interface MapViewProps {
  worldId: number
  onWorldChange: (worldId: number) => void
  progress: ProgressSnapshot
  recentlyUnlockedStep?: number | null
}

function getNodePositions(stepCount: number) {
  if (stepCount === 1) {
    return [{ top: '50%', left: '50%' }]
  }

  return Array.from({ length: stepCount }).map((_, index) => {
    const t = index / (stepCount - 1)
    const y = 89 - t * 78
    const x = 50 + Math.sin(t * 3.1 * Math.PI) * 31
    return {
      top: `${y}%`,
      left: `${x}%`,
    }
  })
}

export function MapView({ worldId, onWorldChange, progress, recentlyUnlockedStep }: MapViewProps) {
  const world = WORLDS.find((entry) => entry.id === worldId) ?? WORLDS[0]
  const worldState = progress.worldProgress.find((entry) => entry.worldId === world.id)
  const nodePositions = useMemo(() => getNodePositions(world.steps), [world.steps])

  const pathPoints = useMemo(
    () =>
      nodePositions
        .map((position) => `${position.left.replace('%', '')},${position.top.replace('%', '')}`)
        .join(' '),
    [nodePositions],
  )

  const worldThemeClass =
    world.theme === 'forest'
      ? 'from-studentTeal/25 via-info/20 to-success/15'
      : world.theme === 'canyon'
        ? 'from-warning/25 via-accent/20 to-secondary/20'
        : 'from-primary/25 via-secondary/25 to-dark/20'

  return (
    <section className="rounded-2xl border border-border bg-white p-4">
      <div className="mb-2 flex flex-wrap gap-2">
        {WORLDS.map((item) => (
          <Button
            key={item.id}
            size="sm"
            variant={item.id === worldId ? 'default' : 'secondary'}
            onClick={() => onWorldChange(item.id)}
            disabled={item.id > progress.unlockedWorldId}
          >
            {item.label}
          </Button>
        ))}
      </div>
      <p className="mb-4 text-sm text-textSecondary">
        {world.subtitle} • {world.steps} checkpoints • Difficulty: {world.difficulty}
      </p>

      <div
        className="relative h-[520px] overflow-hidden rounded-xl border border-border bg-neutral"
        aria-label="Student progress map"
      >
        <div className={`absolute inset-0 bg-gradient-to-b ${worldThemeClass}`} />
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <polyline
            points={pathPoints}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeDasharray="2 2"
            className="text-white/90"
          />
        </svg>

        {nodePositions.map((position, index) => (
          <div key={`node-${index + 1}`}>
            <MapNode
              checkpoint={index + 1}
              stickerCount={worldState && index < worldState.completedSteps ? 1 : 0}
              state={
                world.id > progress.unlockedWorldId
                  ? 'locked'
                  : index < (worldState?.completedSteps ?? 0)
                    ? 'completed'
                    : progress.currentStep === (worldState?.startStep ?? 1) + index
                      ? 'current'
                      : 'locked'
              }
              style={{ top: position.top, left: position.left }}
              newlyUnlocked={
                recentlyUnlockedStep === (worldState?.startStep ?? 1) + index &&
                world.id <= progress.unlockedWorldId
              }
            />
          </div>
        ))}

        {world.id > progress.unlockedWorldId ? (
          <div className="absolute inset-0 flex items-center justify-center bg-dark/30">
            <p className="rounded-full bg-white px-4 py-2 text-sm font-medium text-dark">
              Complete previous world to unlock
            </p>
          </div>
        ) : null}
      </div>
    </section>
  )
}
