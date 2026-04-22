import { Link } from 'react-router-dom'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import type { DashboardStudentRow } from '@/lib/types'

interface StudentTableProps {
  rows: DashboardStudentRow[]
  isSelectMode: boolean
  selectedIds: string[]
  onToggleStudent: (studentId: string) => void
  onToggleAll: () => void
}

export function StudentTable({
  rows,
  isSelectMode,
  selectedIds,
  onToggleStudent,
  onToggleAll,
}: StudentTableProps) {
  const allSelected = selectedIds.length === rows.length && rows.length > 0

  return (
    <div className="rounded-xl border border-border bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            {isSelectMode ? (
              <TableHead className="w-[60px]">
                <Checkbox checked={allSelected} onCheckedChange={onToggleAll} />
              </TableHead>
            ) : null}
            <TableHead>Name</TableHead>
            <TableHead>Last Active</TableHead>
            <TableHead>Stars</TableHead>
            <TableHead>Streak</TableHead>
            <TableHead>Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => {
            const selected = selectedIds.includes(row.id)
            return (
              <TableRow
                key={row.id}
                className={cn(
                  isSelectMode && !selected && 'opacity-70',
                  isSelectMode && selected && 'bg-blue-50',
                )}
              >
                {isSelectMode ? (
                  <TableCell>
                    <Checkbox
                      checked={selected}
                      onCheckedChange={() => onToggleStudent(row.id)}
                    />
                  </TableCell>
                ) : null}
                <TableCell>
                  <p className="font-medium text-textPrimary">{row.name}</p>
                  <p className="text-xs text-textMuted">
                    {row.instrument} · {row.level}
                  </p>
                </TableCell>
                <TableCell className="text-textSecondary">{row.lastActive}</TableCell>
                <TableCell>{'⭐'.repeat(row.stars)}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <span
                        key={`${row.id}-${index}`}
                        className={cn(
                          'h-2.5 w-2.5 rounded-full',
                          index < row.streak ? 'bg-success' : 'bg-border',
                        )}
                      />
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <Link
                    className="font-medium text-primary transition-opacity hover:opacity-80"
                    to={`/students/${row.id}`}
                  >
                    View →
                  </Link>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
