import { useState } from 'react'
import { Button } from '@/components/ui/button'

const avatars = ['🧗', '🎻', '🎹', '🥁', '🎤']

export function CharacterDisplay() {
  const [activeAvatar, setActiveAvatar] = useState(avatars[0])

  return (
    <section className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
      <div className="rounded-xl border border-border bg-white p-6">
        <p className="text-sm text-textSecondary">My Character</p>
        <div className="mt-4 flex h-48 items-center justify-center rounded-xl bg-neutral text-7xl">
          {activeAvatar}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-white p-6">
        <p className="mb-3 text-sm font-semibold text-textPrimary">Choose Avatar Style</p>
        <div className="grid grid-cols-5 gap-2">
          {avatars.map((avatar) => (
            <Button
              key={avatar}
              variant={activeAvatar === avatar ? 'default' : 'secondary'}
              onClick={() => setActiveAvatar(avatar)}
            >
              {avatar}
            </Button>
          ))}
        </div>

        <div className="mt-6 space-y-2 text-sm text-textSecondary">
          <p>Level: 2</p>
          <p>Total stars: 14</p>
          <p>Streak: 4 days</p>
        </div>
      </div>
    </section>
  )
}
