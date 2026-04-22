import { motion } from 'framer-motion'
import { Lock } from 'lucide-react'
import { cn } from '@/lib/utils'

type NodeState = 'completed' | 'current' | 'locked'

interface MapNodeProps {
  checkpoint: number
  stickerCount: number
  state: NodeState
  newlyUnlocked?: boolean
  style?: React.CSSProperties
}

export function MapNode({
  checkpoint,
  stickerCount,
  state,
  newlyUnlocked = false,
  style,
}: MapNodeProps) {
  return (
    <motion.div
      initial={newlyUnlocked ? { scale: 0 } : undefined}
      animate={state === 'current' ? { scale: [1, 1.05, 1] } : { scale: 1 }}
      transition={
        state === 'current'
          ? { duration: 2, repeat: Number.POSITIVE_INFINITY }
          : { type: 'spring', stiffness: 250, damping: 20 }
      }
      style={style}
      className={cn(
        'absolute flex h-10 w-10 flex-col items-center justify-center rounded-full border-2 shadow-md sm:h-11 sm:w-11',
        state === 'completed' && 'border-success bg-success text-white',
        state === 'current' && 'border-warning bg-accent text-dark',
        state === 'locked' && 'border-border bg-slate-200 text-textMuted',
      )}
    >
      {state === 'locked' ? (
        <Lock className="h-4 w-4" />
      ) : (
        <>
          <span className="text-[10px] font-bold leading-none">{checkpoint}</span>
          <span className="text-[9px] leading-none">{'⭐'.repeat(Math.max(1, stickerCount))}</span>
        </>
      )}
      <span className="absolute -bottom-5 text-[10px] font-medium text-dark">+10</span>
    </motion.div>
  )
}
