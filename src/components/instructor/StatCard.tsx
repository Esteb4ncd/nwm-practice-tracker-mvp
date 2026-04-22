import { motion } from 'framer-motion'

interface StatCardProps {
  label: string
  value: string
  index: number
}

export function StatCard({ label, value, index }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.35 }}
      className="rounded-xl border border-border bg-white p-4"
    >
      <p className="text-xs uppercase tracking-wide text-textMuted">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-textPrimary">{value}</p>
    </motion.div>
  )
}
