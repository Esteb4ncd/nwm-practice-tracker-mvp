import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { RadioGroup } from '@/components/ui/radio-group'
import { Textarea } from '@/components/ui/textarea'
import { StickerOption } from './StickerOption'
import type { RewardType } from '@/lib/types'
import { useSuccessToast } from '@/components/shared/SuccessToast'
import { awardSticker } from '@/lib/progressionApi'

interface AssignPanelProps {
  open: boolean
  onClose: () => void
  studentIds: string[]
  studentName?: string
  onAssigned?: () => void
}

export function AssignPanel({
  open,
  onClose,
  studentIds,
  studentName,
  onAssigned,
}: AssignPanelProps) {
  const [type, setType] = useState<RewardType>('star')
  const [note, setNote] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const successToast = useSuccessToast()

  const count = studentIds.length

  const onAssign = async () => {
    if (count === 0) return
    setIsLoading(true)

    try {
      for (const studentId of studentIds) {
        await awardSticker(studentId, type, note.trim() || null)
      }

      successToast(
        count > 1 ? `Assigned to ${count} students` : `Assigned to ${studentName ?? 'student'}`,
        `Saved successfully. Each sticker clears 1 step and grants ${10 * count} coins.`,
      )
      onClose()
      onAssigned?.()
      setNote('')
      setType('star')
    } catch {
      successToast('Unable to assign reward', 'Please check your Supabase connection.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ x: 340 }}
          animate={{ x: 0 }}
          exit={{ x: 340 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed right-0 top-0 z-50 h-full w-[340px] border-l-4 border-dark bg-white shadow-xl"
        >
          <div className="flex h-full flex-col">
            <header className="border-b border-border px-5 py-4">
              <div className="mb-1 flex items-start justify-between">
                <h3 className="text-lg font-semibold text-textPrimary">
                  {studentName ? 'Assign Sticker' : 'Assign Reward'}
                </h3>
                <button onClick={onClose} aria-label="Close assign panel">
                  <X className="h-4 w-4 text-textSecondary" />
                </button>
              </div>
              <p className="text-sm text-textSecondary">
                {studentName ? `Assigning to ${studentName}` : `Assigning to ${count} students`}
              </p>
            </header>

            <div className="flex-1 space-y-4 overflow-y-auto p-5">
              <div>
                <p className="mb-2 text-sm font-semibold text-textPrimary">Sticker type</p>
                <RadioGroup value={type} onValueChange={(value) => setType(value as RewardType)}>
                  <StickerOption value="star" icon="⭐" label="Star" selected={type === 'star'} />
                  <StickerOption
                    value="practice"
                    icon="🎵"
                    label="Practice"
                    selected={type === 'practice'}
                  />
                  <StickerOption
                    value="achievement"
                    icon="🏆"
                    label="Achievement"
                    selected={type === 'achievement'}
                  />
                  <StickerOption
                    value="effort"
                    icon="💪"
                    label="Effort"
                    selected={type === 'effort'}
                  />
                </RadioGroup>
              </div>

              <div>
                <p className="mb-2 text-sm font-semibold text-textPrimary">Optional note</p>
                <Textarea
                  placeholder="Add context for this reward..."
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                />
              </div>
            </div>

            <footer className="space-y-2 border-t border-border p-5">
              <Button className="w-full" onClick={onAssign} disabled={isLoading}>
                {isLoading
                  ? 'Assigning...'
                  : `Confirm & Assign to ${studentName ? studentName : `${count} students`}`}
              </Button>
              <Button variant="ghost" className="w-full" onClick={onClose}>
                Cancel
              </Button>
            </footer>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
