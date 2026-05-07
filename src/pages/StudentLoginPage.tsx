import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { fetchStudentsByClassCode } from '@/lib/progressionApi'
import { saveStudentSession, verifyPin } from '@/lib/auth'
import type { Student } from '@/lib/types'

export function StudentLoginPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [classCode, setClassCode] = useState('')
  const [students, setStudents] = useState<Student[]>([])
  const [selectedStudentId, setSelectedStudentId] = useState('')
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')

  const selectedStudent = useMemo(
    () => students.find((student) => student.id === selectedStudentId),
    [selectedStudentId, students],
  )

  const findClass = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    try {
      const classStudents = await fetchStudentsByClassCode(classCode)
      if (!classStudents.length) {
        setError('No class found with that code.')
        return
      }

      setStudents(classStudents)
      setStep(2)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to find that class right now.')
    }
  }

  const validatePin = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    if (!selectedStudent) {
      setError('Please choose your name first.')
      return
    }
    if (!selectedStudent.share_token) {
      setError('This student account is missing a share token. Ask your teacher to re-create the student login.')
      return
    }
    const isValid = await verifyPin(pin, selectedStudent.pin_hash)
    if (!isValid) {
      setError('Invalid PIN.')
      return
    }
    saveStudentSession(
      selectedStudent.id,
      classCode,
      selectedStudent.share_token,
      selectedStudent.username,
    )
    navigate('/student/home')
  }

  return (
    <div className="grid min-h-screen md:grid-cols-2">
      <aside className="bg-darkDeep p-6 text-white sm:p-10">
        <h2 className="text-2xl font-semibold sm:text-3xl">Student Portal</h2>
        <p className="mt-2 text-slate-300">Keep your streak alive and unlock new world levels.</p>
        <div className="mt-10 rounded-xl border border-darkMid p-5">
          <p className="text-sm text-slate-300">Live progression</p>
          <p className="text-lg font-semibold text-accent">Sign in to view your current level streak.</p>
        </div>
      </aside>

      <main className="flex items-center justify-center bg-white p-4 sm:p-6">
        <div className="w-full max-w-md rounded-xl border border-border p-5 sm:p-6">
          <h1 className="text-xl font-semibold text-textPrimary sm:text-2xl">Find your class</h1>
          <p className="mb-5 text-sm text-textSecondary">Step {step} of 3</p>

          {step === 1 ? (
            <form onSubmit={findClass} className="space-y-4">
              <Input
                value={classCode}
                onChange={(event) => setClassCode(event.target.value.toUpperCase())}
                placeholder="Class code"
                required
              />
              <Button className="w-full">Find My Class →</Button>
            </form>
          ) : null}

          {step === 2 ? (
            <div className="space-y-4">
              <label className="text-sm text-textSecondary">Select your name</label>
              <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose student" />
                </SelectTrigger>
                <SelectContent>
                {students.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                    {student.username}
                    </SelectItem>
                ))}
                </SelectContent>
              </Select>
              <Button className="w-full" disabled={!selectedStudentId} onClick={() => setStep(3)}>
                Continue →
              </Button>
            </div>
          ) : null}

          {step === 3 ? (
            <form onSubmit={validatePin} className="space-y-4">
              <Input
                value={pin}
                onChange={(event) => setPin(event.target.value)}
                placeholder="4-digit PIN"
                maxLength={4}
                required
              />
              <Button className="w-full">Sign In</Button>
            </form>
          ) : null}

          {error ? <p className="mt-4 text-sm text-error">{error}</p> : null}
        </div>
      </main>
    </div>
  )
}
