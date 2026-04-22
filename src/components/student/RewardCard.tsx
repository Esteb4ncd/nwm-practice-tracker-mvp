import { motion } from 'framer-motion'
import type { Reward } from '@/lib/types'
import { toTitle } from '@/lib/utils'

const rewardIcons: Record<Reward['type'], string> = {
  star: '⭐',
  practice: '🎵',
  achievement: '🏆',
  effort: '💪',
}

export function RewardCard({ reward }: { reward: Reward }) {
  return (
    <motion.div
      whileHover={{ scale: [1, 1.3, 1], rotate: [0, -8, 8, 0] }}
      transition={{ duration: 0.55 }}
      className="rounded-xl border border-border bg-white p-4"
    >
      <div className="mb-2 text-2xl">{rewardIcons[reward.type]}</div>
      <p className="font-semibold text-textPrimary">{toTitle(reward.type)}</p>
      <p className="text-xs text-textSecondary">Awarded by teacher</p>
      <p className="mt-2 text-xs text-textMuted">
        {new Date(reward.created_at).toLocaleDateString()}
      </p>
    </motion.div>
  )
}
