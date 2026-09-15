import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, MapPin } from 'lucide-react';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';

type AttendanceData = {
  name: string;
  sessions: number;
  attended: number;
  missed: number;
  attendance_rate: number;
};

type ZipRevenueData = {
  avg_revenue: string;
  total_revenue: string;
  total_users: string;
  zip_code: string;
  id: number;
};

export const PLAYER_ATTENDANCE_DATA_COLUMNS: ColumnDef<AttendanceData>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="dark:hover:bg-transparent dark:hover:text-white/50"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        PLAYER
        <ArrowUpDown />
      </Button>
    ),
    cell: ({ row }) => <div className="text-[#D1D5DC]">{row.getValue('name')}</div>,
  },
  {
    accessorKey: 'sessions',
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="dark:hover:bg-transparent dark:hover:text-white/50"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        TOTAL SESSIONS
        <ArrowUpDown />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="text-[#D1D5DC] flex items-center gap-2">{row.getValue('sessions')}</div>
    ),
  },
  {
    accessorKey: 'attended',
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="dark:hover:bg-transparent dark:hover:text-white/50"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        ATTENDED
        <ArrowUpDown />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="text-active-text flex items-center gap-2">{row.getValue('attended')}</div>
    ),
  },
  {
    accessorKey: 'missed',
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="dark:hover:bg-transparent dark:hover:text-white/50"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        MISSED
        <ArrowUpDown />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="text-danger-text flex items-center gap-2">{row.getValue('missed')}</div>
    ),
  },
  {
    accessorKey: 'attendance_rate',
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="dark:hover:bg-transparent dark:hover:text-white/50"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        ATTENDANCE RATE
        <ArrowUpDown />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="flex gap-4 items-center w-50">
        <Progress value={row.original.attendance_rate} />

        <div className="text-[#D1D5DC] flex items-center gap-2">
          {row.getValue('attendance_rate')}%
        </div>
      </div>
    ),
  },
];

export const ZIP_REVENUE_DATA_COLUMNS: ColumnDef<ZipRevenueData>[] = [
  {
    accessorKey: 'zip_code',
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="dark:hover:bg-transparent dark:hover:text-white/50"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        ZIP
        <ArrowUpDown />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="flex gap-2 items-center">
        <MapPin className="text-[#D1D5DC]" size={14} />
        <div className="text-[#D1D5DC]">{row.getValue('zip_code')}</div>
      </div>
    ),
  },
  {
    accessorKey: 'total_users',
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="dark:hover:bg-transparent dark:hover:text-white/50"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        PLAYERS
        <ArrowUpDown />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="text-[#D1D5DC] flex items-center gap-2">
        {Number(row.getValue('total_users') || 0).toFixed(0)}
      </div>
    ),
  },
  {
    accessorKey: 'total_revenue',
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="dark:hover:bg-transparent dark:hover:text-white/50"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        REVENUE
        <ArrowUpDown />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="text-[#D1D5DC] flex items-center gap-2">
        ${Number(row.getValue('total_revenue') || 0).toFixed(0)}
      </div>
    ),
  },
  {
    accessorKey: 'avg_revenue',
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="dark:hover:bg-transparent dark:hover:text-white/50"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        AVG REVENUE
        <ArrowUpDown />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="text-[#D1D5DC] flex items-center gap-2">
        ${Number(row.getValue('avg_revenue') || 0).toFixed(0)}
      </div>
    ),
  },
];
