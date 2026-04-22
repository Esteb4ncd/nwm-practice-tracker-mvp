import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { hasSupabaseEnv, supabase } from '@/lib/supabase'
import { mockStudents } from '@/lib/mockData'
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
    let classStudents: Student[] = []

    if (hasSupabaseEnv && supabase) {
      const { data, error: rpcError } = await supabase.rpc('students_by_class_code', {
        class_code_input: classCode,
      })
      if (rpcError) {
        setError(rpcError.message)
        return
      }
      classStudents = (data as Student[]) ?? []
    } else {
      classStudents = mockStudents.filter((student) => student.class_code === classCode)
    }

    if (!classStudents.length) {
      setError('No class found with that code.')
      return
    }

    setStudents(classStudents)
    setStep(2)
  }

  const validatePin = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    if (!selectedStudent) {
      setError('Please choose your name first.')
      return
    }
    const isValid = await verifyPin(pin, selectedStudent.pin_hash)
    if (!isValid) {
      setError('Invalid PIN.')
      return
    }
    saveStudentSession(selectedStudent.id, classCode)
    navigate('/student/home')
  }

  return (
    <div className="grid min-h-screen md:grid-cols-2">
      <aside className="bg-darkDeep p-10 text-white">
        <h2 className="text-3xl font-semibold">Student Portal</h2>
        <p className="mt-2 text-slate-300">Keep your streak alive and unlock new map levels.</p>
        <div className="mt-10 rounded-xl border border-darkMid p-5">
          <p className="text-sm text-slate-300">Current streak</p>
          <p className="text-3xl font-bold text-accent">4 days 🔥</p>
        </div>
      </aside>

      <main className="flex items-center justify-center bg-white p-6">
        <div className="w-full max-w-md rounded-xl border border-border p-6">
          <h1 className="text-2xl font-semibold text-textPrimary">Find your class</h1>
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
