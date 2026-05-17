import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  createStudentProfile,
  createTeacherProfile,
  fetchAdminAuthUsers,
  fetchAdminStudents,
  fetchAdminTeachers,
} from '@/lib/adminApi'
import { signOutTeacher } from '@/lib/auth'
import type { AdminAuthUser, AdminStudentProfile, AdminTeacherProfile } from '@/lib/types'

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

export function AdminPortalPage() {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(true)
  const [isSavingTeacher, setIsSavingTeacher] = useState(false)
  const [isSavingStudent, setIsSavingStudent] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [authUsers, setAuthUsers] = useState<AdminAuthUser[]>([])
  const [teachers, setTeachers] = useState<AdminTeacherProfile[]>([])
  const [students, setStudents] = useState<AdminStudentProfile[]>([])

  const [selectedAuthUserId, setSelectedAuthUserId] = useState('')
  const [teacherName, setTeacherName] = useState('')
  const [teacherEmail, setTeacherEmail] = useState('')

  const [studentTeacherId, setStudentTeacherId] = useState('')
  const [studentUsername, setStudentUsername] = useState('')
  const [studentClassCode, setStudentClassCode] = useState('')
  const [studentPin, setStudentPin] = useState('')

  const selectedAuthUser = useMemo(
    () => authUsers.find((user) => user.id === selectedAuthUserId) ?? null,
    [authUsers, selectedAuthUserId],
  )

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      const [users, teacherRows, studentRows] = await Promise.all([
        fetchAdminAuthUsers(),
        fetchAdminTeachers(),
        fetchAdminStudents(),
      ])
      setAuthUsers(users)
      setTeachers(teacherRows)
      setStudents(studentRows)
      if (!studentTeacherId && teacherRows.length) {
        setStudentTeacherId(teacherRows[0].id)
      }
    } catch (err) {
      setError(readErrorMessage(err, 'Unable to load admin portal data.'))
    } finally {
      setIsLoading(false)
    }
  }, [studentTeacherId])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const onCreateTeacher = async () => {
    if (!selectedAuthUserId) return
    setIsSavingTeacher(true)
    setError('')
    setSuccess('')
    try {
      const fallbackName = selectedAuthUser?.email?.split('@')[0] ?? 'Teacher'
      const fallbackEmail = selectedAuthUser?.email ?? ''
      await createTeacherProfile(
        selectedAuthUserId,
        teacherName.trim() || fallbackName,
        teacherEmail.trim() || fallbackEmail,
      )
      setSuccess('Teacher profile created/updated.')
      setTeacherName('')
      setTeacherEmail('')
      setSelectedAuthUserId('')
      await loadData()
    } catch (err) {
      setError(readErrorMessage(err, 'Unable to create teacher profile.'))
    } finally {
      setIsSavingTeacher(false)
    }
  }

  const onCreateStudent = async () => {
    if (!studentTeacherId || !studentUsername.trim() || !studentPin.trim()) return
    setIsSavingStudent(true)
    setError('')
    setSuccess('')
    try {
      await createStudentProfile(studentTeacherId, studentUsername, studentPin, studentClassCode)
      setSuccess('Student profile created.')
      setStudentUsername('')
      setStudentPin('')
      await loadData()
    } catch (err) {
      setError(readErrorMessage(err, 'Unable to create student profile.'))
    } finally {
      setIsSavingStudent(false)
    }
  }

  const onSignOut = async () => {
    await signOutTeacher()
    navigate('/login/admin')
  }

  return (
    <main className="min-h-screen bg-neutral p-4 sm:p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-white p-4 sm:p-6">
          <div>
            <h1 className="text-xl font-semibold text-textPrimary sm:text-2xl">Master Admin Portal</h1>
            <p className="text-sm text-textSecondary">
              Create teacher and student profiles directly from the app.
            </p>
          </div>
          <Button variant="secondary" onClick={onSignOut}>
            Sign Out
          </Button>
        </header>

        {error ? <p className="rounded-md bg-white p-3 text-sm text-error">{error}</p> : null}
        {success ? <p className="rounded-md bg-white p-3 text-sm text-success">{success}</p> : null}

        <section className="grid gap-4 lg:grid-cols-2">
          <article className="space-y-3 rounded-xl border border-border bg-white p-4 sm:p-6">
            <h2 className="text-lg font-semibold text-textPrimary">Add Teacher Profile</h2>
            <p className="text-xs text-textSecondary">
              Teacher account must already exist in Supabase Auth users.
            </p>
            <Select value={selectedAuthUserId} onValueChange={setSelectedAuthUserId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select auth user" />
              </SelectTrigger>
              <SelectContent>
                {authUsers.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {(user.email ?? 'No email')} ({user.id.slice(0, 8)}...)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              value={teacherName}
              onChange={(event) => setTeacherName(event.target.value)}
              placeholder="Teacher display name (optional)"
            />
            <Input
              type="email"
              value={teacherEmail}
              onChange={(event) => setTeacherEmail(event.target.value)}
              placeholder="Teacher email (optional)"
            />
            <Button onClick={onCreateTeacher} disabled={isSavingTeacher || !selectedAuthUserId}>
              {isSavingTeacher ? 'Saving teacher...' : 'Create Teacher'}
            </Button>
          </article>

          <article className="space-y-3 rounded-xl border border-border bg-white p-4 sm:p-6">
            <h2 className="text-lg font-semibold text-textPrimary">Add Student Profile</h2>
            <Select value={studentTeacherId} onValueChange={setStudentTeacherId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Assign to teacher" />
              </SelectTrigger>
              <SelectContent>
                {teachers.map((teacher) => (
                  <SelectItem key={teacher.id} value={teacher.id}>
                    {teacher.name ?? teacher.email ?? teacher.id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              value={studentUsername}
              onChange={(event) => setStudentUsername(event.target.value)}
              placeholder="Student username"
            />
            <Input
              value={studentClassCode}
              onChange={(event) => setStudentClassCode(event.target.value.toUpperCase())}
              placeholder="Class code"
            />
            <Input
              type="password"
              value={studentPin}
              onChange={(event) => setStudentPin(event.target.value)}
              placeholder="4-digit PIN"
              maxLength={8}
            />
            <Button
              onClick={onCreateStudent}
              disabled={isSavingStudent || !studentTeacherId || !studentUsername || !studentPin}
            >
              {isSavingStudent ? 'Saving student...' : 'Create Student'}
            </Button>
          </article>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <article className="rounded-xl border border-border bg-white p-4 sm:p-6">
            <h3 className="mb-3 text-lg font-semibold text-textPrimary">Teachers</h3>
            {isLoading ? <p className="text-sm text-textSecondary">Loading...</p> : null}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teachers.map((teacher) => (
                  <TableRow key={teacher.id}>
                    <TableCell>{teacher.name ?? '—'}</TableCell>
                    <TableCell>{teacher.email ?? '—'}</TableCell>
                    <TableCell className="text-xs text-textMuted">{teacher.id}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </article>

          <article className="rounded-xl border border-border bg-white p-4 sm:p-6">
            <h3 className="mb-3 text-lg font-semibold text-textPrimary">Students</h3>
            {isLoading ? <p className="text-sm text-textSecondary">Loading...</p> : null}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Teacher</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell>{student.username}</TableCell>
                    <TableCell>{student.class_code ?? '—'}</TableCell>
                    <TableCell>{student.teacher_name ?? '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </article>
        </section>
      </div>
    </main>
  )
}
