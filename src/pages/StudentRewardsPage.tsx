import { RewardCard } from '@/components/student/RewardCard'
import { mockRewards, mockStudents } from '@/lib/mockData'
import { getStudentSession } from '@/lib/auth'

export function StudentRewardsPage() {
  const studentSession = getStudentSession()
  const studentId = studentSession?.studentId ?? mockStudents[0].id
  const rewards = mockRewards.filter((reward) => reward.student_id === studentId)
  const stars = rewards.filter((reward) => reward.type === 'star').length
  const badges = rewards.filter((reward) => reward.type === 'practice').length
  const achievements = rewards.filter((reward) => reward.type === 'achievement').length

  return (
    <div className="space-y-5">
      <section className="grid gap-3 md:grid-cols-3">
        <article className="rounded-xl border border-border bg-white p-4">
          <p className="text-sm text-textSecondary">Total stars</p>
          <p className="text-2xl font-semibold text-textPrimary">{stars}</p>
        </article>
        <article className="rounded-xl border border-border bg-white p-4">
          <p className="text-sm text-textSecondary">Practice badges</p>
          <p className="text-2xl font-semibold text-textPrimary">{badges}</p>
        </article>
        <article className="rounded-xl border border-border bg-white p-4">
          <p className="text-sm text-textSecondary">Achievements</p>
          <p className="text-2xl font-semibold text-textPrimary">{achievements}</p>
        </article>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {rewards.map((reward) => (
          <RewardCard key={reward.id} reward={reward} />
        ))}
      </section>
    </div>
  )
}
