'use client';
import PageTable from '@/components/app-table';
import InputWithIcon from '@/components/input-with-icon';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/auth-context';
import axios from '@/lib/axios';
import { Ban, Clock, CreditCard, DollarSign, File, Filter, OctagonAlert } from 'lucide-react';
import { ReactNode, Suspense, useEffect, useMemo, useState } from 'react';

import SquareConnection from '@/components/admin-dashboard/square-connection';
import CardStatus, { typeClasses } from '@/components/card-status';
import getInitials from '@/components/parents/get-initials';
import { CompedDialog } from '@/components/payment/comped-dialog';
import { CustomEmailDialog } from '@/components/payment/custom-email-dialog';
import { OverrideDialog } from '@/components/payment/override-dialog';
import { ViewDialog } from '@/components/payment/view-dialog';
import RenderAvatar from '@/components/render-avatar';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { useDebounce } from '@/hooks/use-debounce';
import { PaymentItem, PaymentsSummaryResponse } from '@/lib/types';
import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, CheckCircle, Eye, Send } from 'lucide-react';
import moment from 'moment';

const allFilters = ['All', 'Paid', 'Pending', 'Failed', 'Comped'];

export default function Page() {
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const { user } = useAuth();
  const [filter, setFilter] = useState<'All' | 'Paid' | 'Pending' | 'Failed' | 'Comped'>('All');

  const [payments, setPayments] = useState<PaymentsSummaryResponse | undefined>();
  const [visible, setVisible] = useState<{ show: string; data: any }>({ show: '', data: null });
  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    if (user?.id) fetchData();
  }, [user]);

  async function fetchData() {
    try {
      setLoading(true);
      const result = await axios.get('/admin/payments');
      setPayments(result.data);
    } finally {
      setLoading(false);
    }
  }

  const localData = [
    {
      Icon: <DollarSign />,
      title: 'Total Revenue',
      description: `$${payments?.totalRevenue || 0}`,
      type: 'active',
      going: 'active',
    },
    {
      Icon: <Clock />,
      title: 'Pending',
      description: payments?.totalPending || 0,
      type: 'warning',
      going: 'warning',
    },
    {
      Icon: <OctagonAlert />,
      title: 'Failed',
      description: payments?.totalFailed || 0,
      type: 'danger',
      going: 'danger',
    },
    {
      Icon: <File />,
      title: 'Comped',
      description: payments?.totalComped || 0,
      type: 'other',
      going: 'active',
    },
  ];

  const filteredData = useMemo(() => {
    if (!payments?.paymentsData) return [];

    const searchWords = debouncedSearch.toLowerCase().trim().split(/\s+/);

    return payments.paymentsData.filter((item) => {
      const statusMatch = filter === 'All' || item?.status?.toLowerCase() === filter.toLowerCase();

      const toSearch = `${item.player_name} ${item.parent_name} ${item.session_name}`.toLowerCase();
      const searchMatch =
        !searchWords.length || searchWords.every((word: string) => toSearch.includes(word));

      return statusMatch && searchMatch;
    });
  }, [payments?.paymentsData, filter, debouncedSearch]);

  const PAYMENT_COLUMNS: ColumnDef<PaymentItem>[] = useMemo(
    () => [
      {
        accessorKey: 'transaction_id',
        header: ({ column }) => (
          <Button
            variant="ghost"
            className="text-[#99A1AF] text-[12px] tracking-wider dark:hover:bg-transparent dark:hover:text-white/50"

            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            TRANSACTION
            <ArrowUpDown />
          </Button>
        ),
        cell: ({ row }) => (
          <div className="space-y-1">
            <div className="text-[#D1D5DC] ">{row.getValue('transaction_id') || 'N/A'}</div>
            <div className="text-xs text-active-text flex items-center gap-1">
              <CheckCircle size={14} />
              Duplicate Checked
            </div>
          </div>
        ),
      },

      {
        accessorKey: 'player_name',
        header: ({ column }) => (
          <Button
            variant="ghost"
            className="text-[#99A1AF] text-[12px] tracking-wider dark:hover:bg-transparent dark:hover:text-white/50"

            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            PLAYER / PARENT
            <ArrowUpDown />
          </Button>
        ),
        cell: ({ row }) => (
          <div className="flex gap-2 items-center">
            <RenderAvatar
              className="h-8 w-8"
              img={row.original.player_picture}
              fallback={getInitials(row.original.player_name)}
            />

            <div>
              <div className="text-[#D1D5DC]">{row.getValue('player_name')}</div>
              <div className="text-xs text-muted-foreground">{row.original.parent_name}</div>
            </div>
          </div>
        ),
      },

      {
        accessorKey: 'session_name',
        header: ({ column }) => (
          <Button
            variant="ghost"
            className="text-[#99A1AF] text-[12px] tracking-wider dark:hover:bg-transparent dark:hover:text-white/50"

            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            SESSION
            <ArrowUpDown />
          </Button>
        ),
        cell: ({ row }) => <div className="text-[#D1D5DC]">{row.getValue('session_name')}</div>,
      },

      {
        accessorKey: 'amount',
        header: ({ column }) => (
          <Button
            variant="ghost"
            className="text-[#99A1AF] text-[12px] tracking-wider dark:hover:bg-transparent dark:hover:text-white/50"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            AMOUNT
            <ArrowUpDown />
          </Button>
        ),
        cell: ({ row }) => <div className="text-[#D1D5DC]">${row.getValue('amount')}</div>,
      },

      {
        accessorKey: 'method',
        header: ({ column }) => (
          <Button
            variant="ghost"
            className="text-[#99A1AF] text-[12px] tracking-wider dark:hover:bg-transparent dark:hover:text-white/50"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            METHOD
            <ArrowUpDown />
          </Button>
        ),
        cell: ({ row }) => (
          <div className="space-y-1">
            <div className="text-[#D1D5DC]">{row.getValue('method') || 'N/A'}</div>
            {/* <div className="text-xs text-muted-foreground">
          {row.original.methodDetail}
        </div> */}
          </div>
        ),
      },

      {
        accessorKey: 'created_at',
        header: ({ column }) => (
          <Button
            variant="ghost"
            className="text-[#99A1AF] text-[12px] tracking-wider dark:hover:bg-transparent dark:hover:text-white/50"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            DATE
            <ArrowUpDown />
          </Button>
        ),
        cell: ({ row }) => (
          <div className="space-y-1">
            <div className="text-[#D1D5DC]">
              {row.original.created_at &&
                moment(new Date(row.original.created_at)).format('YYYY-MM-DD')}
            </div>
            <div className="text-xs text-muted-foreground">
              {row.original.created_at &&
                moment(new Date(row.original.created_at)).format('hh:mm A')}
            </div>
          </div>
        ),
      },

      {
        accessorKey: 'status',
        header: ({ column }) => (
          <Button
            variant="ghost"
            className="text-[#99A1AF] text-[12px] tracking-wider dark:hover:bg-transparent dark:hover:text-white/50"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            STATUS
            <ArrowUpDown />
          </Button>
        ),
        cell: ({ row }) => {
          const status = row.getValue('status');
          return (
            <div className="w-24">
              <CardStatus value={status as keyof typeof typeClasses} />
            </div>
          );
        },
      },

      {
        id: 'actions',
        header: () => (
          <div className="text-[#99A1AF] text-[12px] tracking-wider dark:hover:bg-transparent dark:hover:text-white/50">
            ACTIONS
          </div>
        ),
        cell: ({ row }) => {
          const status = row.original.status;

          return (
            <div className="flex gap-2">
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    className="text-muted-foreground hover:dark:bg-primary hover:dark:text-black"
                    size="icon"
                    variant="ghost"
                  >
                    <Eye size={16} />
                  </Button>
                </DialogTrigger>
                <ViewDialog data={row.original} />
              </Dialog>

              {/* {(status === "completed" || status === 'comped') &&
            <>
              <Button className="text-muted-foreground hover:dark:bg-primary hover:dark:text-black" size="icon" variant="ghost">
                <CircleX size={16} />
              </Button>
              <Button className="text-muted-foreground hover:dark:bg-primary hover:dark:text-black" size="icon" variant="ghost">
                <FileText size={16} />
              </Button>
            </>} */}

              {status === 'failed' && (
                <>
                  {/* <Button className="text-muted-foreground hover:dark:bg-primary hover:dark:text-black" size="icon" variant="ghost">

                <RefreshCcw size={16} />
              </Button> */}
                  <Button
                    onClick={() => setVisible({ show: 'email', data: row.original })}
                    className="text-muted-foreground hover:dark:bg-primary hover:dark:text-black"
                    size="icon"
                    variant="ghost"
                  >
                    <Send size={16} />
                  </Button>

                  <Button
                    onClick={() => setVisible({ show: 'override', data: row.original })}
                    className="text-muted-foreground hover:dark:bg-primary hover:dark:text-black"
                    size="icon"
                    variant="ghost"
                  >
                    <CheckCircle size={16} />
                  </Button>
                </>
              )}

              {status === 'pending' && (
                <>
                  <Button
                    onClick={() => setVisible({ show: 'comped', data: row.original })}
                    className="text-muted-foreground hover:dark:bg-primary hover:dark:text-black"
                    size="icon"
                    variant="ghost"
                  >
                    <Ban size={16} />
                  </Button>

                  <Button
                    onClick={() => setVisible({ show: 'override', data: row.original })}
                    className="text-muted-foreground hover:dark:bg-primary hover:dark:text-black"
                    size="icon"
                    variant="ghost"
                  >
                    <CheckCircle size={16} />
                  </Button>
                </>
              )}
            </div>
          );
        },
      },
    ],
    []
  );

  return (
    <div className="flex flex-col w-full gap-4">
      <Header>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <Card className="p-0">
            <CardContent className="flex gap-2 p-[16px]">
              <div
                className={`rounded-[8px] flex w-10 h-10 items-center justify-center bg-info-bg text-info-text`}
              >
                <CreditCard size={20} />
              </div>

              <SquareConnection />
            </CardContent>
          </Card>
        </div>
      </Header>

      <div className="flex justify-between gap-4 flex-wrap">
        {localData.map((item, index) => (
          <Card key={index} className="rounded-[10px] bg-[#252525] border-[#3A3A3A] flex-1">
            <CardContent className="space-y-2">
              <div className="flex gap-4 items-center">
                <div
                  className={`rounded-[8px] flex w-10 h-10 items-center justify-center bg-${item.type}-bg text-${item.type}-text`}
                >
                  {item.Icon}
                </div>
                <p className="text-[#B0B0B0]">{item.title}</p>
              </div>
              <div className="flex flex-col gap-1">
                <h1 className="font-semibold text-2xl">{item.description}</h1>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div
        className="
  flex flex-col gap-4
  rounded-[14px]
  bg-[#252525]
  border border-[#3A3A3A]
  p-4
  sm:flex-row
  sm:items-center
  sm:justify-between
"
      >
        <div className="w-full sm:flex-1">
          <InputWithIcon
            value={search}
            placeholder="Search by parent, player, or transaction ID..."
            className="w-full"
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Filters */}
        <div
          className="
    flex flex-wrap items-center gap-2
    w-full
    sm:w-auto
  "
        >
          <Filter className="text-muted-foreground" size={16} />
          <p className="text-muted-foreground text-sm mr-1">Status:</p>

          {allFilters.map((item) => (
            <Button
              key={item}
              variant={filter === item ? 'default' : 'outline'}
              size="sm"
              className={
                filter === item
                  ? 'font-medium'
                  : 'font-normal text-muted-foreground border-muted-foreground'
              }
              onClick={() => setFilter(item as typeof filter)}
            >
              {item}
            </Button>
          ))}
        </div>
      </div>

      <PageTable
        loading={loading}
        columns={PAYMENT_COLUMNS}
        data={filteredData}
        onRowClick={() => {}}
      />

      <CompedDialog
        data={visible?.data}
        open={visible.show === 'comped'}
        onOpenChange={() => {
          setVisible((prevState) => ({ ...prevState, show: '' }));
        }}
        onRefresh={fetchData}
      />

      <OverrideDialog
        data={visible?.data}
        open={visible.show === 'override'}
        onOpenChange={() => {
          setVisible((prevState) => ({ ...prevState, show: '' }));
        }}
        onRefresh={fetchData}
      />

      <CustomEmailDialog
        data={visible?.data}
        open={visible.show === 'email'}
        onOpenChange={() => {
          setVisible((prevState) => ({ ...prevState, show: '' }));
        }}
      />
    </div>
  );
}

const Header = ({ children }: { children: ReactNode }) => {
  return (
    <div className="flex w-full gap-4 justify-between flex-wrap items-center">
      <div className="space-y-1">
        <p className="text-xl">Payments Management</p>
        <span className="text-xs text-muted-foreground flex items-center">
          <span>Secure payment processing powered by Square</span>
        </span>
      </div>

      {children}
    </div>
  );
};
