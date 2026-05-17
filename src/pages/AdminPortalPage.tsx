import { useCallback, useEffect, useState } from 'react'
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
  createTeacherAccount,
  createStudentProfile,
  deleteStudentProfile,
  deleteTeacherAccount,
  fetchAdminStudents,
  fetchAdminTeachers,
  updateStudentClassCode,
  updateTeacherClassCode,
  updateStudentPin,
} from '@/lib/adminApi'
import { signOutTeacher } from '@/lib/auth'
import type { AdminStudentProfile, AdminTeacherProfile } from '@/lib/types'

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
  const [isDeletingTeacherId, setIsDeletingTeacherId] = useState<string | null>(null)
  const [isDeletingStudentId, setIsDeletingStudentId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [teachers, setTeachers] = useState<AdminTeacherProfile[]>([])
  const [students, setStudents] = useState<AdminStudentProfile[]>([])
  const [showTeacherModal, setShowTeacherModal] = useState(false)
  const [showStudentModal, setShowStudentModal] = useState(false)

  const [teacherAccountEmail, setTeacherAccountEmail] = useState('')
  const [teacherAccountPassword, setTeacherAccountPassword] = useState('')
  const [teacherName, setTeacherName] = useState('')
  const [teacherClassCode, setTeacherClassCode] = useState('')
  const [teacherClassCodeDrafts, setTeacherClassCodeDrafts] = useState<Record<string, string>>({})
  const [savingTeacherClassCodeId, setSavingTeacherClassCodeId] = useState<string | null>(null)

  const [studentTeacherId, setStudentTeacherId] = useState('')
  const [studentUsername, setStudentUsername] = useState('')
  const [studentClassCode, setStudentClassCode] = useState('')
  const [studentPin, setStudentPin] = useState('')
  const [studentClassCodeDrafts, setStudentClassCodeDrafts] = useState<Record<string, string>>({})
  const [savingStudentClassCodeId, setSavingStudentClassCodeId] = useState<string | null>(null)
  const [pinDrafts, setPinDrafts] = useState<Record<string, string>>({})
  const [savingPinStudentId, setSavingPinStudentId] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      const [teacherRows, studentRows] = await Promise.all([fetchAdminTeachers(), fetchAdminStudents()])
      setTeachers(teacherRows)
      setStudents(studentRows)
      if (!studentTeacherId && teacherRows.length) {
        setStudentTeacherId(teacherRows[0].id)
        setStudentClassCode(teacherRows[0].class_code ?? '')
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
    if (!teacherAccountEmail.trim() || !teacherAccountPassword.trim()) return
    setIsSavingTeacher(true)
    setError('')
    setSuccess('')
    try {
      await createTeacherAccount(
        teacherAccountEmail,
        teacherAccountPassword,
        teacherName,
        teacherClassCode,
      )
      setSuccess('Teacher account created.')
      setTeacherAccountEmail('')
      setTeacherAccountPassword('')
      setTeacherName('')
      setTeacherClassCode('')
      setShowTeacherModal(false)
      await loadData()
    } catch (err) {
      setError(readErrorMessage(err, 'Unable to create teacher account.'))
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
      setStudentClassCode('')
      setStudentPin('')
      setShowStudentModal(false)
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

  const onChangeStudentPin = async (studentId: string) => {
    const nextPin = (pinDrafts[studentId] ?? '').trim()
    if (!nextPin) return
    setSavingPinStudentId(studentId)
    setError('')
    setSuccess('')
    try {
      await updateStudentPin(studentId, nextPin)
      setSuccess('Student PIN updated.')
      setPinDrafts((previous) => ({ ...previous, [studentId]: '' }))
      await loadData()
    } catch (err) {
      setError(readErrorMessage(err, 'Unable to update student PIN.'))
    } finally {
      setSavingPinStudentId(null)
    }
  }

  const onDeleteTeacher = async (teacher: AdminTeacherProfile) => {
    const label = teacher.name ?? teacher.email ?? teacher.id
    const confirmed = window.confirm(
      `Delete teacher "${label}"?\n\nThis also removes all students and related data for that teacher.`,
    )
    if (!confirmed) return

    setIsDeletingTeacherId(teacher.id)
    setError('')
    setSuccess('')
    try {
      await deleteTeacherAccount(teacher.id)
      setSuccess(`Deleted teacher ${label}.`)
      await loadData()
    } catch (err) {
      setError(readErrorMessage(err, 'Unable to delete teacher account.'))
    } finally {
      setIsDeletingTeacherId(null)
    }
  }

  const onUpdateTeacherClassCode = async (teacherId: string) => {
    const classCode = (teacherClassCodeDrafts[teacherId] ?? '').trim().toUpperCase()
    setSavingTeacherClassCodeId(teacherId)
    setError('')
    setSuccess('')
    try {
      await updateTeacherClassCode(teacherId, classCode)
      setSuccess(classCode ? 'Teacher class code updated.' : 'Teacher class code cleared.')
      await loadData()
    } catch (err) {
      setError(readErrorMessage(err, 'Unable to update teacher class code.'))
    } finally {
      setSavingTeacherClassCodeId(null)
    }
  }

  const onDeleteStudent = async (student: AdminStudentProfile) => {
    const confirmed = window.confirm(`Delete student "${student.username}"?`)
    if (!confirmed) return

    setIsDeletingStudentId(student.id)
    setError('')
    setSuccess('')
    try {
      await deleteStudentProfile(student.id)
      setSuccess(`Deleted student ${student.username}.`)
      await loadData()
    } catch (err) {
      setError(readErrorMessage(err, 'Unable to delete student profile.'))
    } finally {
      setIsDeletingStudentId(null)
    }
  }

  const onUpdateStudentClassCode = async (studentId: string) => {
    const classCode = (studentClassCodeDrafts[studentId] ?? '').trim().toUpperCase()
    setSavingStudentClassCodeId(studentId)
    setError('')
    setSuccess('')
    try {
      await updateStudentClassCode(studentId, classCode)
      setSuccess(classCode ? 'Student class code updated.' : 'Student class code cleared.')
      await loadData()
    } catch (err) {
      setError(readErrorMessage(err, 'Unable to update student class code.'))
    } finally {
      setSavingStudentClassCodeId(null)
    }
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

        <section className="space-y-4">
          <article className="rounded-xl border border-border bg-white p-4 sm:p-6">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="text-lg font-semibold text-textPrimary">Teachers</h3>
              <Button size="sm" onClick={() => setShowTeacherModal(true)}>
                Create Teacher
              </Button>
            </div>
            {isLoading ? <p className="text-sm text-textSecondary">Loading...</p> : null}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Class Code</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teachers.map((teacher) => (
                  <TableRow key={teacher.id}>
                    <TableCell>{teacher.name ?? '—'}</TableCell>
                    <TableCell>{teacher.email ?? '—'}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Input
                          value={teacherClassCodeDrafts[teacher.id] ?? teacher.class_code ?? ''}
                          onChange={(event) =>
                            setTeacherClassCodeDrafts((previous) => ({
                              ...previous,
                              [teacher.id]: event.target.value.toUpperCase(),
                            }))
                          }
                          placeholder="Class code"
                          className="h-8 min-w-[110px]"
                        />
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => onUpdateTeacherClassCode(teacher.id)}
                          disabled={savingTeacherClassCodeId === teacher.id}
                        >
                          {savingTeacherClassCodeId === teacher.id ? 'Saving...' : 'Save'}
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => onDeleteTeacher(teacher)}
                        disabled={isDeletingTeacherId === teacher.id}
                      >
                        {isDeletingTeacherId === teacher.id ? 'Deleting...' : 'Delete'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </article>

          <article className="rounded-xl border border-border bg-white p-4 sm:p-6">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="text-lg font-semibold text-textPrimary">Students</h3>
              <Button size="sm" onClick={() => setShowStudentModal(true)}>
                Create Student
              </Button>
            </div>
            {isLoading ? <p className="text-sm text-textSecondary">Loading...</p> : null}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Reset PIN</TableHead>
                  <TableHead>Teacher</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell>{student.username}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Input
                          value={studentClassCodeDrafts[student.id] ?? student.class_code ?? ''}
                          onChange={(event) =>
                            setStudentClassCodeDrafts((previous) => ({
                              ...previous,
                              [student.id]: event.target.value.toUpperCase(),
                            }))
                          }
                          placeholder="Class code"
                          className="h-8 min-w-[110px]"
                        />
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => onUpdateStudentClassCode(student.id)}
                          disabled={savingStudentClassCodeId === student.id}
                        >
                          {savingStudentClassCodeId === student.id ? 'Saving...' : 'Save'}
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Input
                          type="password"
                          placeholder="New PIN"
                          maxLength={8}
                          value={pinDrafts[student.id] ?? ''}
                          onChange={(event) =>
                            setPinDrafts((previous) => ({
                              ...previous,
                              [student.id]: event.target.value,
                            }))
                          }
                          className="h-8 min-w-[110px]"
                        />
                        <Button
                          size="sm"
                          disabled={
                            savingPinStudentId === student.id || !(pinDrafts[student.id] ?? '').trim()
                          }
                          onClick={() => onChangeStudentPin(student.id)}
                        >
                          {savingPinStudentId === student.id ? 'Saving...' : 'Update'}
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>{student.teacher_name ?? '—'}</TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => onDeleteStudent(student)}
                        disabled={isDeletingStudentId === student.id}
                      >
                        {isDeletingStudentId === student.id ? 'Deleting...' : 'Delete'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </article>
        </section>

        {showTeacherModal ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
            <div className="w-full max-w-md rounded-xl border border-border bg-white p-4 sm:p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-textPrimary">Create Teacher Account</h2>
                <Button size="sm" variant="ghost" onClick={() => setShowTeacherModal(false)}>
                  Close
                </Button>
              </div>
              <div className="space-y-3">
                <Input
                  type="email"
                  value={teacherAccountEmail}
                  onChange={(event) => setTeacherAccountEmail(event.target.value)}
                  placeholder="Teacher email"
                />
                <Input
                  type="password"
                  value={teacherAccountPassword}
                  onChange={(event) => setTeacherAccountPassword(event.target.value)}
                  placeholder="Temporary password (min 8 chars)"
                  minLength={8}
                />
                <Input
                  value={teacherName}
                  onChange={(event) => setTeacherName(event.target.value)}
                  placeholder="Teacher display name"
                />
                <Input
                  value={teacherClassCode}
                  onChange={(event) => setTeacherClassCode(event.target.value.toUpperCase())}
                  placeholder="Class code"
                />
                <div className="flex justify-end">
                  <Button
                    onClick={onCreateTeacher}
                    disabled={isSavingTeacher || !teacherAccountEmail || !teacherAccountPassword}
                  >
                    {isSavingTeacher ? 'Creating teacher...' : 'Create Teacher'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {showStudentModal ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
            <div className="w-full max-w-md rounded-xl border border-border bg-white p-4 sm:p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-textPrimary">Create Student Profile</h2>
                <Button size="sm" variant="ghost" onClick={() => setShowStudentModal(false)}>
                  Close
                </Button>
              </div>
              <div className="space-y-3">
                <Select
                  value={studentTeacherId}
                  onValueChange={(value) => {
                    setStudentTeacherId(value)
                    const selectedTeacher = teachers.find((teacher) => teacher.id === value)
                    setStudentClassCode(selectedTeacher?.class_code ?? '')
                  }}
                >
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
                <div className="flex justify-end">
                  <Button
                    onClick={onCreateStudent}
                    disabled={isSavingStudent || !studentTeacherId || !studentUsername || !studentPin}
                  >
                    {isSavingStudent ? 'Saving student...' : 'Create Student'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </main>
  )
}
