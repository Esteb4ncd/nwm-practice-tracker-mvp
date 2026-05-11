import { useEffect, useMemo, useState } from 'react'
import type { CSSProperties } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getStudentSession } from '@/lib/auth'
import {
  fetchStudentBadges,
  fetchStudentCharacterProfile,
  fetchStudentProgressSnapshot,
  saveStudentCharacterProfile,
} from '@/lib/progressionApi'

type VariantId = 1 | 2 | 3 | 4
type CharacterSelection = { bodyVariant: VariantId; faceVariant: VariantId; colorVariant: VariantId }
type UnlockState = { maxBody: number; maxFace: number; maxColor: number }
type StoredCharacterState = CharacterSelection & { characterName?: string }

const TOTAL_LEVELS = 65
const COLORS = [
  { id: 1 as VariantId, hex: '#E75A5A', unlock: 'Default color' },
  { id: 2 as VariantId, hex: '#8D68E8', unlock: 'Unlock at 10 levels' },
  { id: 3 as VariantId, hex: '#1BB8CA', unlock: 'Unlock at 25 levels' },
  { id: 4 as VariantId, hex: '#AACF42', unlock: 'Unlock at 45 levels' },
]

const BODY_OPTIONS = [
  { id: 1 as VariantId, src: '/avatars/bodies/body01.svg', unlock: 'Default body' },
  { id: 2 as VariantId, src: '/avatars/bodies/body02.svg', unlock: 'Unlock at 15 levels' },
  { id: 3 as VariantId, src: '/avatars/bodies/body03.svg', unlock: 'Unlock at 35 levels' },
]

const FACE_OPTIONS = [
  { id: 1 as VariantId, src: '/avatars/faces/Face01.svg', unlock: 'Default face' },
  { id: 2 as VariantId, src: '/avatars/faces/Face02.svg', unlock: 'Unlock at 2 badges' },
  { id: 3 as VariantId, src: '/avatars/faces/Face03.svg', unlock: 'Unlock at 5 badges' },
  { id: 4 as VariantId, src: '/avatars/faces/Face04.svg', unlock: 'Unlock at 8 badges' },
]

const FACE_ALIGNMENT: Record<number, { top: string; width: string }> = {
  1: { top: '8%', width: '64%' },
  2: { top: '10%', width: '62%' },
  3: { top: '18%', width: '58%' },
}

const DEFAULT_SELECTION: CharacterSelection = { bodyVariant: 1, faceVariant: 1, colorVariant: 1 }
const DEFAULT_CHARACTER_NAME = 'My Character'

function getCharacterStorageKey(studentId: string) {
  return `music-app-character-${studentId}`
}

function readErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message
  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as { message?: unknown }).message === 'string'
  ) {
    return (error as { message: string }).message
  }
  return fallback
}

function normalizeCharacterName(value: string | null | undefined) {
  const trimmed = (value ?? '').trim()
  if (!trimmed) return DEFAULT_CHARACTER_NAME
  return trimmed.slice(0, 24)
}

function clampVariant(value: number): VariantId {
  if (value >= 4) return 4
  if (value <= 1) return 1
  return value as VariantId
}

function clampRange(value: number, max: number): VariantId {
  return clampVariant(Math.max(1, Math.min(value, max)))
}

function clampToUnlocks(selection: CharacterSelection, unlocks: UnlockState): CharacterSelection {
  return {
    bodyVariant: clampRange(selection.bodyVariant, unlocks.maxBody),
    faceVariant: clampRange(selection.faceVariant, unlocks.maxFace),
    colorVariant: clampRange(selection.colorVariant, unlocks.maxColor),
  }
}

function getUnlocks(totalLevels: number, totalBadges: number): UnlockState {
  const bodyByProgress = 1 + Number(totalLevels >= 15) + Number(totalLevels >= 35) + Number(totalLevels >= 65)
  const faceByProgress = 1 + Number(totalBadges >= 2) + Number(totalBadges >= 5) + Number(totalBadges >= 8)
  const colorByProgress = 1 + Number(totalLevels >= 10) + Number(totalLevels >= 25) + Number(totalLevels >= 45)

  return {
    maxBody: Math.max(1, Math.min(bodyByProgress, BODY_OPTIONS.length)),
    maxFace: Math.max(1, Math.min(faceByProgress, FACE_OPTIONS.length)),
    maxColor: Math.max(1, Math.min(colorByProgress, COLORS.length)),
  }
}

function AvatarMaskLayer({
  src,
  fill,
  className,
  style,
}: {
  src: string
  fill: string
  className: string
  style?: CSSProperties
}) {
  return (
    <div
      className={className}
      style={{
        backgroundColor: fill,
        WebkitMaskImage: `url(${src})`,
        WebkitMaskRepeat: 'no-repeat',
        WebkitMaskPosition: 'center',
        WebkitMaskSize: 'contain',
        maskImage: `url(${src})`,
        maskRepeat: 'no-repeat',
        maskPosition: 'center',
        maskSize: 'contain',
        ...style,
      }}
    />
  )
}

function CharacterAvatar({
  bodyVariant,
  faceVariant,
  colorVariant,
}: {
  bodyVariant: VariantId
  faceVariant: VariantId
  colorVariant: VariantId
}) {
  const color = COLORS.find((entry) => entry.id === colorVariant)?.hex ?? COLORS[0].hex
  const bodySrc = BODY_OPTIONS.find((entry) => entry.id === bodyVariant)?.src ?? BODY_OPTIONS[0].src
  const faceSrc = FACE_OPTIONS.find((entry) => entry.id === faceVariant)?.src ?? FACE_OPTIONS[0].src
  const alignment = FACE_ALIGNMENT[bodyVariant] ?? FACE_ALIGNMENT[1]

  return (
    <div className="relative aspect-[198/175] w-full max-w-[230px]">
      <AvatarMaskLayer src={bodySrc} fill={color} className="absolute inset-0" />
      <AvatarMaskLayer
        src={faceSrc}
        fill="#111111"
        className="absolute left-1/2 -translate-x-1/2"
        style={{ top: alignment.top, width: alignment.width, height: alignment.width }}
      />
    </div>
  )
}

function optionButtonClass(isSelected: boolean, unlocked: boolean) {
  if (!unlocked) return 'opacity-40 cursor-not-allowed border-border'
  return isSelected ? 'ring-2 ring-primary border-primary' : 'border-border hover:border-primary/70'
}

export function CharacterDisplay() {
  const studentSession = getStudentSession()
  const studentId = studentSession?.studentId ?? null
  const studentShareToken = studentSession?.shareToken ?? null
  const [selection, setSelection] = useState<CharacterSelection>(DEFAULT_SELECTION)
  const [savedSelection, setSavedSelection] = useState<CharacterSelection>(DEFAULT_SELECTION)
  const [characterName, setCharacterName] = useState(DEFAULT_CHARACTER_NAME)
  const [savedCharacterName, setSavedCharacterName] = useState(DEFAULT_CHARACTER_NAME)
  const [totalBadges, setTotalBadges] = useState(0)
  const [worldBadges, setWorldBadges] = useState(0)
  const [completedLevels, setCompletedLevels] = useState(0)
  const [coinBalance, setCoinBalance] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')
  const [error, setError] = useState('')

  const unlocks = useMemo(() => getUnlocks(completedLevels, totalBadges), [completedLevels, totalBadges])
  const isDirty =
    selection.bodyVariant !== savedSelection.bodyVariant ||
    selection.faceVariant !== savedSelection.faceVariant ||
    selection.colorVariant !== savedSelection.colorVariant ||
    characterName !== savedCharacterName

  useEffect(() => {
    let active = true
    const loadCharacterState = async () => {
      setIsLoading(true)
      setError('')
      try {
        if (!studentId) throw new Error('Student session not found. Please sign in again.')
        if (!studentShareToken) {
          throw new Error('Student session expired. Please sign in again from Student Login.')
        }

        const localRaw = localStorage.getItem(getCharacterStorageKey(studentId))
        const localSelection: StoredCharacterState | null = localRaw
          ? (JSON.parse(localRaw) as StoredCharacterState)
          : null

        const [badgeRows, snapshot, profile] = await Promise.all([
          fetchStudentBadges(studentId, studentShareToken),
          fetchStudentProgressSnapshot(studentId, studentShareToken),
          fetchStudentCharacterProfile(studentId, studentShareToken),
        ])

        if (!active) return

        const nextBadges = badgeRows.length
        const nextLevels = snapshot.total_steps
        const nextUnlocks = getUnlocks(nextLevels, nextBadges)
        const backendSelection: CharacterSelection | null = profile
          ? {
              bodyVariant: clampVariant(profile.body_variant),
              faceVariant: clampVariant(profile.face_variant),
              colorVariant: clampVariant(profile.color_variant),
            }
          : null
        const initialName = normalizeCharacterName(profile?.character_name ?? localSelection?.characterName)
        const initialSelection = clampToUnlocks(
          backendSelection ?? localSelection ?? DEFAULT_SELECTION,
          nextUnlocks,
        )

        setTotalBadges(nextBadges)
        setWorldBadges(snapshot.world_badges)
        setCompletedLevels(nextLevels)
        setCoinBalance(snapshot.coin_balance)
        setSelection(initialSelection)
        setSavedSelection(initialSelection)
        setCharacterName(initialName)
        setSavedCharacterName(initialName)
        localStorage.setItem(
          getCharacterStorageKey(studentId),
          JSON.stringify({ ...initialSelection, characterName: initialName }),
        )
      } catch (err) {
        if (!active) return
        setError(readErrorMessage(err, 'Unable to load character progress right now.'))
      } finally {
        if (active) setIsLoading(false)
      }
    }
    void loadCharacterState()
    return () => {
      active = false
    }
  }, [studentId, studentShareToken])

  useEffect(() => {
    setSelection((previous) => clampToUnlocks(previous, unlocks))
  }, [unlocks])

  const setPart = (key: keyof CharacterSelection, nextValue: VariantId, maxUnlocked: number) => {
    if (nextValue > maxUnlocked) return
    setSelection((previous) => ({ ...previous, [key]: nextValue }))
    setSaveMessage('')
  }

  const onChangeCharacterName = (value: string) => {
    setCharacterName(value.slice(0, 24))
    setSaveMessage('')
  }

  const onSave = async () => {
    if (!studentId) return
    setIsSaving(true)
    setError('')
    setSaveMessage('')

    const nextSaved = clampToUnlocks(selection, unlocks)
    const nextName = normalizeCharacterName(characterName)
    try {
      localStorage.setItem(
        getCharacterStorageKey(studentId),
        JSON.stringify({ ...nextSaved, characterName: nextName }),
      )
      if (studentShareToken) {
        await saveStudentCharacterProfile(
          studentId,
          nextSaved.bodyVariant,
          nextSaved.faceVariant,
          nextSaved.colorVariant,
          nextName,
          studentShareToken,
        )
      }
      setSavedSelection(nextSaved)
      setSavedCharacterName(nextName)
      setSelection(nextSaved)
      setCharacterName(nextName)
      setSaveMessage('Character saved.')
    } catch (err) {
      setError(readErrorMessage(err, 'Unable to save character right now.'))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section className="grid gap-4 lg:grid-cols-[1.1fr_1.3fr]">
      <div className="rounded-xl border border-border bg-white p-4 sm:p-6">
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-textMuted">Character Name</p>
          <Input
            value={characterName}
            onChange={(event) => onChangeCharacterName(event.target.value)}
            maxLength={24}
            placeholder="Name your character"
            className="h-9"
          />
        </div>
        <div className="mt-4 flex h-60 items-center justify-center rounded-xl bg-neutral sm:h-64">
          <CharacterAvatar
            bodyVariant={selection.bodyVariant}
            faceVariant={selection.faceVariant}
            colorVariant={selection.colorVariant}
          />
        </div>
        <p className="mt-2 text-sm font-semibold text-textPrimary">{normalizeCharacterName(characterName)}</p>
        <div className="mt-4 space-y-1 text-sm text-textSecondary">
          <p>Levels completed: {completedLevels}/{TOTAL_LEVELS}</p>
          <p>Total badges: {totalBadges}</p>
          <p>World trophies: {worldBadges}</p>
          <p>Coin balance: {coinBalance}</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-white p-4 sm:p-6">
        <p className="text-sm font-semibold text-textPrimary">Customize Character</p>
        <p className="mt-1 text-xs text-textSecondary">
          Tap an asset to apply it. Unlocks grow with progression.
        </p>

        <div className="mt-4 space-y-5">
          <div>
            <p className="mb-2 text-sm font-medium text-textPrimary">Bodies</p>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {BODY_OPTIONS.map((option) => {
                const unlocked = option.id <= unlocks.maxBody
                const isSelected = selection.bodyVariant === option.id
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setPart('bodyVariant', option.id, unlocks.maxBody)}
                    disabled={!unlocked}
                    title={unlocked ? 'Apply body' : option.unlock}
                    className={`h-16 rounded-md border bg-white p-1 transition ${optionButtonClass(isSelected, unlocked)}`}
                  >
                    <img src={option.src} alt="" className="h-full w-full object-contain" />
                    <span className="sr-only">{`Body ${option.id}`}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-textPrimary">Faces</p>
            <div className="grid grid-cols-4 gap-2">
              {FACE_OPTIONS.map((option) => {
                const unlocked = option.id <= unlocks.maxFace
                const isSelected = selection.faceVariant === option.id
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setPart('faceVariant', option.id, unlocks.maxFace)}
                    disabled={!unlocked}
                    title={unlocked ? 'Apply face' : option.unlock}
                    className={`h-16 rounded-md border bg-white p-1 transition ${optionButtonClass(isSelected, unlocked)}`}
                  >
                    <img src={option.src} alt="" className="h-full w-full object-contain" />
                    <span className="sr-only">{`Face ${option.id}`}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-textPrimary">Colors</p>
            <div className="grid grid-cols-4 gap-2">
              {COLORS.map((option) => {
                const unlocked = option.id <= unlocks.maxColor
                const isSelected = selection.colorVariant === option.id
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setPart('colorVariant', option.id, unlocks.maxColor)}
                    disabled={!unlocked}
                    title={unlocked ? 'Apply color' : option.unlock}
                    style={{ backgroundColor: option.hex }}
                    className={`h-12 rounded-md border transition ${optionButtonClass(isSelected, unlocked)}`}
                  >
                    <span className="sr-only">{`Color ${option.id}`}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <Button onClick={onSave} disabled={isSaving || isLoading || !isDirty}>
            {isSaving ? 'Saving...' : 'Save Character'}
          </Button>
          {saveMessage ? <p className="self-center text-sm text-success">{saveMessage}</p> : null}
        </div>

        <div className="mt-4 space-y-1 text-sm text-textSecondary">
          {isLoading ? <p>Loading character progression...</p> : null}
          {error ? <p className="text-error">{error}</p> : null}
        </div>
      </div>
    </section>
  )
}
