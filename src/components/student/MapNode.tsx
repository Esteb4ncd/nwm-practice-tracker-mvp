import { motion } from 'framer-motion'
import { Lock } from 'lucide-react'
import { cn } from '@/lib/utils'

type NodeState = 'completed' | 'current' | 'locked'

interface MapNodeProps {
  index: number
  stars: number
  state: NodeState
  style?: React.CSSProperties
}

export function MapNode({ index, stars, state, style }: MapNodeProps) {
  return (
    <motion.div
      initial={state === 'locked' ? { scale: 0 } : undefined}
      animate={state === 'current' ? { scale: [1, 1.05, 1] } : { scale: 1 }}
      transition={
        state === 'current'
          ? { duration: 2, repeat: Number.POSITIVE_INFINITY }
          : { type: 'spring', duration: 0.45 }
      }
      style={style}
      className={cn(
        'absolute flex h-14 w-14 flex-col items-center justify-center rounded-full border-2 shadow-md',
        state === 'completed' && 'border-success bg-success text-white',
        state === 'current' && 'border-warning bg-accent text-dark',
        state === 'locked' && 'border-border bg-slate-200 text-textMuted',
      )}
    >
      {state === 'locked' ? (
        <Lock className="h-4 w-4" />
      ) : (
        <>
          <span className="text-xs font-bold">{index}</span>
          <span className="text-[10px]">{'⭐'.repeat(Math.max(1, stars))}</span>
        </>
      )}
    </motion.div>
  )
}
