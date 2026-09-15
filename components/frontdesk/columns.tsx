import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown } from 'lucide-react';
import getInitials from '../parents/get-initials';
import { PlayerData } from '@/lib/types';

export const PLAYERS_COLUMNS_FD: ColumnDef<PlayerData>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="text-[#99A1AF] text-[12px] tracking-wider dark:hover:bg-transparent dark:hover:text-white/50"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        PLAYER NAME
        <ArrowUpDown />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="flex gap-2 items-center">
        <Avatar>
          <AvatarImage src="" />
          <AvatarFallback className="bg-primary text-black">
            {getInitials(row.getValue('name'))}
          </AvatarFallback>
        </Avatar>
        <div>
          <div className="text-[#D1D5DC]">{row.getValue('name')}</div>
          <div className="text-xs text-muted-foreground">
            {row.original.coach_name ? `Coach ${row.original.coach_name}` : 'N/A'}
          </div>
        </div>
      </div>
    ),
  },
  {
    accessorKey: 'age',
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="text-[#99A1AF] text-[12px] tracking-wider dark:hover:bg-transparent dark:hover:text-white/50"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        AGE
        <ArrowUpDown />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="text-[#D1D5DC] flex items-center gap-2">{row.getValue('age')}</div>
    ),
  },
  {
    accessorKey: 'position',
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="text-[#99A1AF] text-[12px] tracking-wider dark:hover:bg-transparent dark:hover:text-white/50"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        POSITION
        <ArrowUpDown />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="text-[#D1D5DC] flex items-center gap-2">{row.getValue('position')}</div>
    ),
  },
  {
    accessorKey: 'parent',
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="text-[#99A1AF] text-[12px] tracking-wider dark:hover:bg-transparent dark:hover:text-white/50"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        PARENT NAME
        <ArrowUpDown />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="text-[#D1D5DC] flex items-center gap-2">{row.getValue('parent')}</div>
    ),
  },
  {
    accessorKey: 'last_session_date',
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="text-[#99A1AF] text-[12px] tracking-wider dark:hover:bg-transparent dark:hover:text-white/50"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        LAST SESSIONS
        <ArrowUpDown />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="space-y-1 text-[#D1D5DC]">
        <div>{row.getValue('last_session_date')}</div>
        <div>{row.original.last_session}</div>
      </div>
    ),
  },
];
