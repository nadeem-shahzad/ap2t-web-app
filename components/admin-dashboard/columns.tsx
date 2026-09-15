import { Button } from '@/components/ui/button';
import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown } from 'lucide-react';
import Link from 'next/link';
import CardStatus from '../card-status';
import { SessionRecord } from '@/lib/types';

export const DASHBOARD_SESSIONS_COLUMNS: ColumnDef<SessionRecord>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="dark:hover:bg-transparent dark:hover:text-white/50"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        SESSION NAME
        <ArrowUpDown />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="text-[#D1D5DC] flex items-center gap-2">{row.getValue('name')}</div>
    ),
  },
  {
    accessorKey: 'session_type',
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="dark:hover:bg-transparent dark:hover:text-white/50"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        SESSION TYPE
        <ArrowUpDown />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="text-[#D1D5DC] flex items-center gap-2">{row.getValue('session_type')}</div>
    ),
  },
  {
    accessorKey: 'coach_name',
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="dark:hover:bg-transparent dark:hover:text-white/50"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        COACH
        <ArrowUpDown />
      </Button>
    ),
    cell: ({ row }) => {
      return (
        <div className="text-[#D1D5DC] flex items-center gap-2">{row.getValue('coach_name')}</div>
      );
    },
  },
  {
    accessorKey: 'start_time',
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="dark:hover:bg-transparent dark:hover:text-white/50"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        TIME
        <ArrowUpDown />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="text-[#D1D5DC] flex items-center gap-2">
        {row.getValue('start_time')} - {row.original?.end_time}
      </div>
    ),
  },
  {
    accessorKey: 'status',
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="dark:hover:bg-transparent dark:hover:text-white/50"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        STATUS
        <ArrowUpDown />
      </Button>
    ),
    cell: ({ row }) => {
      const status = row.getValue('status') as string;
      return (
        <div className="w-20">
          <CardStatus value={status} />
        </div>
      );
    },
  },
  {
    id: 'actions',
    header: 'Action',
    cell: ({ row }) => (
      <Link
        href={`/portal/admin/sessions/${row.original.id}`}
        className="text-primary hover:underline"
      >
        View Details
      </Link>
    ),
  },
];
