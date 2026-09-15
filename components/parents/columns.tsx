import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ParentData } from '@/lib/types';
import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, Eye, Mail, MapPin, Phone, Users } from 'lucide-react';
import Link from 'next/link';
import { IoIosPin } from 'react-icons/io';
import CardStatus from '../card-status';
import DummyButton from '../dummy-button';
import getInitials from './get-initials';

export const PARENT_COLUMNS: ColumnDef<ParentData>[] = [
  {
    accessorKey: 'name',
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
      <div className="flex gap-2 items-center">
        <Avatar>
          <AvatarImage src="" />
          <AvatarFallback className="bg-primary text-black">
            {getInitials(row.original.name)}
          </AvatarFallback>
        </Avatar>
        <div>
          <div className="text-[#D1D5DC]">{row.original.name}</div>
          <div className="text-xs text-muted-foreground">Joined</div>
          <div className="text-xs text-muted-foreground">{row.original.joining_date}</div>
        </div>
      </div>
    ),
  },
  {
    accessorKey: 'email',
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="text-[#99A1AF] text-[12px] tracking-wider dark:hover:bg-transparent dark:hover:text-white/50"

        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        CONTACT INFO
        <ArrowUpDown />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="space-y-1">
        <div className="text-[#D1D5DC] flex items-center gap-2">
          <Mail size={14} /> {row.original.email}
        </div>
        <div className="text-[#D1D5DC] flex items-center gap-2">
          <Phone size={14} /> {row.original.number}
        </div>
      </div>
    ),
  },
  {
    accessorKey: 'location',
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="text-[#99A1AF] text-[12px] tracking-wider dark:hover:bg-transparent dark:hover:text-white/50"

        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        LOCATION
        <ArrowUpDown />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="text-[#D1D5DC] flex items-center gap-2">
        <IoIosPin size={14} /> {row.original.location}
      </div>
    ),
  },
  {
    accessorKey: 'zip_code',
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="text-[#99A1AF] text-[12px] tracking-wider dark:hover:bg-transparent dark:hover:text-white/50"

        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        ZIP CODE
        <ArrowUpDown />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="text-[#D1D5DC] flex items-center gap-2">
        <MapPin size={14} /> {row.original.zip_code}
      </div>
    ),
  },
  {
    accessorKey: 'children',
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="text-[#99A1AF] text-[12px] tracking-wider dark:hover:bg-transparent dark:hover:text-white/50"

        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        CHILDREN
        <ArrowUpDown />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="text-[#D1D5DC] flex items-center gap-2">
        <Users size={14} className="text-primary" /> {row.original.children}
      </div>
    ),
  },
  {
    accessorKey: 'card_status',
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="text-[#99A1AF] text-[12px] tracking-wider dark:hover:bg-transparent dark:hover:text-white/50"

        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        CARD STATUS
        <ArrowUpDown />
      </Button>
    ),
    cell: ({ row }) => {
      return (
        <div className="w-25">
          <CardStatus value={row.original.card_status} icon={true} />
        </div>
      );
    },
  },
  {
    accessorKey: 'total_spent',
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="text-[#99A1AF] text-[12px] tracking-wider dark:hover:bg-transparent dark:hover:text-white/50"

        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        TOTAL SPENT
        <ArrowUpDown />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="space-y-1">
        <div className="text-[#D1D5DC]">${row.original.total_spent}</div>
        <div className="text-muted-foreground">Last: ${row.original.last_spent}</div>
        <div className="text-muted-foreground">{row.original.last_transaction_date}</div>
      </div>
    ),
  },
  {
    id: 'actions',
    header: () => (
      <div className="text-[#99A1AF] text-[12px] tracking-wider dark:hover:bg-transparent dark:hover:text-white/50">
        ACTIONS
      </div>
    ),
    cell: ({ row }) => (
      <Link href={`/portal/admin/parents/${row.original.id}`}>
        <DummyButton>
          <Eye /> View
        </DummyButton>
      </Link>
    ),
  },
];
