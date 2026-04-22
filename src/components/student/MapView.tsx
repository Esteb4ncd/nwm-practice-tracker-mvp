import { useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { MapNode } from './MapNode'

interface MapViewProps {
  level: number
  onLevelChange: (level: number) => void
  completedCount: number
}

const nodePositions = [
  { top: '76%', left: '10%' },
  { top: '63%', left: '30%' },
  { top: '72%', left: '52%' },
  { top: '52%', left: '70%' },
  { top: '34%', left: '56%' },
  { top: '26%', left: '30%' },
  { top: '10%', left: '48%' },
]

export function MapView({ level, onLevelChange, completedCount }: MapViewProps) {
  const nodeStates = useMemo(
    () =>
      nodePositions.map((_, index) => {
        if (index < completedCount) return 'completed' as const
        if (index === completedCount) return 'current' as const
        return 'locked' as const
      }),
    [completedCount],
  )

  return (
    <section className="rounded-2xl border border-border bg-white p-4">
      <div className="mb-4 flex gap-2">
        {[1, 2, 3].map((item) => (
          <Button
            key={item}
            size="sm"
            variant={item === level ? 'default' : 'secondary'}
            onClick={() => onLevelChange(item)}
          >
            Level {item}
          </Button>
        ))}
      </div>

      <div
        className="relative h-[520px] overflow-hidden rounded-xl border border-border bg-neutral"
        aria-label="Student progress map"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-studentTeal/25 via-info/20 to-primary/15" />
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <path
            d="M10,80 C20,70 30,60 40,70 C50,80 55,70 65,55 C75,40 60,30 45,28 C30,25 35,15 50,12"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray="2 2"
            className="text-white"
          />
        </svg>

        {nodePositions.map((position, index) => (
          <MapNode
            key={`node-${index + 1}`}
            index={index + 1}
            stars={(index % 3) + 1}
            state={nodeStates[index]}
            style={{ top: position.top, left: position.left }}
          />
        ))}
      </div>
    </section>
  )
}
