'use client';
import AppCalendar from '@/components/app-calendar';
import BackButton from '@/components/back-button';
import { BarChart } from '@/components/charts/bar-chart';
import PieChart from '@/components/charts/pie-chart';
import { AssignCoachDialog } from '@/components/sessions/assign-coach-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useSidebar } from '@/components/ui/sidebar';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { useIsMobile } from '@/hooks/use-mobile';
import axios from '@/lib/axios';
import { SESSION_TYPE_CHART_CONFIG } from '@/lib/constants';
import { exportDashboardToExcel, exportToExcel } from '@/lib/functions';
import { DashboardDataResponse } from '@/lib/types';

import { ChartColumn, DollarSign, Download, FileText, Filter, LucideProps } from 'lucide-react';
import moment from 'moment';
import { ReactNode, useState } from 'react';

export default function Page() {
  const [loading, setLoading] = useState(false);
  const [reports, setReports] = useState<DashboardDataResponse | undefined>();
  const [filterLoading, setFilterLoading] = useState(false);
  const [coach, setCoach] = useState<{ id: null | number; name: string }>({ id: null, name: '' });

  const [dates, setDates] = useState<{ start: Date | undefined; end: Date | undefined }>({
    start: undefined,
    end: undefined,
  });

  async function filterData(start: Date | undefined, end: Date | undefined) {
    const startDate = start ? moment(start).format('YYYY-MM-DD') : null;
    const endDate = end ? moment(end).format('YYYY-MM-DD') : null;

    if (!startDate || !endDate) return;

    setFilterLoading(true);
    try {
      const response = await axios.get(
        `/coach/stats?filter=true&start=${startDate}&end=${endDate}&coach=${coach.id}`
      );
      setReports(response.data);
    } finally {
      setFilterLoading(false);
    }
  }

  const data = [
    {
      title: 'Total Revenue',
      value: `$${reports?.totals?.totalRevenue || 0}`,
      Icon: (props: LucideProps) => <DollarSign {...props} />,
      color: 'active',
    },

    {
      title: 'Total Sessions',
      value: reports?.totals?.totalSessions || 0,
      Icon: (props: LucideProps) => <ChartColumn {...props} />,
      color: 'info',
    },

    {
      title: 'Outstanding',
      value: reports?.totals?.totalPending || 0,
      Icon: (props: LucideProps) => <FileText {...props} />,
      color: 'warning',
    },

    {
      title: 'Comped',
      value: reports?.totals?.totalComped || 0,
      Icon: (props: LucideProps) => <FileText {...props} />,
      color: 'other',
    },
  ];

  const totalsSheet = {
    sheetName: 'Overview',
    headers: ['Metric', 'Value'],
    rows: [
      ['Total Revenue', reports?.totals.totalRevenue ?? 0],
      ['Total Sessions', reports?.totals.totalSessions ?? 0],
      ['Pending Payments', reports?.totals.totalPending ?? 0],
      ['Comped Payments', reports?.totals.totalComped ?? 0],
    ],
  };

  const revenueBySession = {
    sheetName: 'Revenue by Session',
    headers: ['Session', 'Revenue'],
    rows: reports?.revenueBySession?.map((r) => [r.session_name, String(r.value)]) ?? [],
  };

  const sessionTypesSheet = {
    sheetName: 'Session Types',
    headers: ['Session Type', 'Count'],
    rows: reports?.sessionTypeData.map((s) => [s.name, String(s.value)]) ?? [],
  };

  if (loading) {
    return (
      <div className="flex flex-col w-full gap-4">
        <Header>{null}</Header>

        <DashboardLoader />
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full gap-4">
      <BackButton title="Back to coaches" route="/portal/admin/coaches" />
      <Header>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <Button
            onClick={() => {
              exportDashboardToExcel(
                [totalsSheet, revenueBySession, sessionTypesSheet],
                `${coach.name || 'Coach'}-report.xlsx`
              );
            }}
          >
            <Download /> Export All Data
          </Button>
        </div>
      </Header>

      <div className="mt-4 flex w-full flex-wrap gap-4 justify-center">
        {data.map((item, i) => (
          <HeaderCard
            key={i}
            title={String(item.value)}
            description={item.title}
            icon={
              <div
                className={`rounded-[8px] flex w-7 h-7 items-center justify-center bg-${item.color}-bg  border-${item.color}-text/32`}
              >
                <item.Icon className={`text-${item.color}-text`} size={16} />
              </div>
            }
          />
        ))}
      </div>

      <Card>
        <CardContent className="space-y-4">
          <div className="text-sm flex gap-2 items-center">
            <Filter className="text-primary" size={16} /> Filters
          </div>

          <div className="flex flex-col w-full gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex flex-1 flex-col gap-2">
                <Label className="text-muted-foreground font-normal text-xs">Start Date</Label>
                <AppCalendar
                  date={dates.start}
                  onChange={(d) => setDates((prevState) => ({ ...prevState, start: d }))}
                />
              </div>

              <div className="flex flex-1 flex-col gap-2">
                <Label className="text-muted-foreground font-normal text-xs">End Date</Label>
                <AppCalendar
                  date={dates.end}
                  onChange={(d) => setDates((prevState) => ({ ...prevState, end: d }))}
                />
              </div>

              <div className="flex flex-1 flex-col gap-2">
                <Label className="text-muted-foreground font-normal text-xs">Select Coach</Label>
                <AssignCoachDialog
                  placeholder={coach?.name ? coach.name : 'Select Coach'}
                  onSelect={(coach) => {
                    setCoach({
                      name: `${coach?.first_name} ${coach?.last_name}`,
                      id: coach?.id,
                    });
                  }}
                />
              </div>
            </div>
            <Button
              disabled={filterLoading || !dates.start || !dates.end || !coach?.id}
              onClick={() => {
                setFilterLoading(true);
                filterData(dates.start, dates.end);
              }}
            >
              {filterLoading && <Spinner className="text-black" />}Apply Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid sm:grid-cols-2 grid-cols-1 gap-4">
        <Card>
          <CardContent className="space-y-2">
            <div className="flex justify-between items-center">
              <div className="space-y-2">
                <p className="text-sm">Revenue by Session</p>
                <p className="text-xs text-muted-foreground">Total earnings per session</p>
              </div>
              <Button
                onClick={() => {
                  exportToExcel(
                    revenueBySession.headers,
                    revenueBySession.rows,
                    revenueBySession.sheetName + '.xlsx'
                  );
                }}
                variant={'outline'}
                size={'icon-sm'}
                className="h-6 w-6 rounded-sm text-[10px] text-muted-foreground"
              >
                <Download />
              </Button>
            </div>

            <BarChart chartData={reports?.revenueBySession || []} xaxis="coach" yaxis="value" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-2">
            <div className="flex justify-between items-center">
              <div className="space-y-2">
                <p className="text-sm">Session by Type</p>
                <p className="text-xs text-muted-foreground">Distribution on session types</p>
              </div>
              <Button
                onClick={() => {
                  exportToExcel(
                    sessionTypesSheet.headers,
                    sessionTypesSheet.rows,
                    sessionTypesSheet.sheetName + '.xlsx'
                  );
                }}
                variant={'outline'}
                size={'icon-sm'}
                className="h-6 w-6 rounded-sm text-[10px] text-muted-foreground"
              >
                <Download />
              </Button>
            </div>

            <div className="h-70">
              <PieChart data={reports?.sessionTypeData || []} config={SESSION_TYPE_CHART_CONFIG} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

const Header = ({ children }: { children: ReactNode }) => {
  return (
    <div className="flex w-full gap-4 justify-between flex-wrap items-center">
      <div className="space-y-1">
        <p className="text-xl">Coach Analytics</p>
        <span className="text-xs text-muted-foreground flex items-center">
          <span>Filter, analyze, and export coach data</span>
        </span>
      </div>

      {children}
    </div>
  );
};

const HeaderCard = ({
  title = '',
  description = '',
  icon = null,
}: {
  title: string;
  description: string;
  icon: ReactNode;
}) => {
  return (
    <Card className="flex-1 rounded-[10px] bg-[#1A1A1A] border-[#3A3A3A] sm:w-[204px] w-full p-0 py-2 px-4">
      <CardContent className="p-0 py-2 space-y-2">
        <div className="flex gap-2 items-center">
          {icon}
          <div className="space-y-0">
            <p className="text-muted-foreground text-[12px] ">{description}</p>
          </div>
        </div>
        <p className="text-[24px] text-white leading-tight">{title}</p>
      </CardContent>
    </Card>
  );
};

export function DashboardLoader() {
  return (
    <div className="flex flex-col w-full gap-4">
      <div className="mt-4 flex w-full flex-wrap gap-4 justify-center">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-[100px] flex flex-1 bg-secondary rounded-sm" />
        ))}
      </div>

      <div className="grid sm:grid-cols-2 grid-cols-1 gap-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <Skeleton key={i} className="h-[300px] flex flex-1 bg-secondary rounded-sm" />
        ))}
      </div>

      <Skeleton className="h-[300px] flex flex-1 bg-secondary rounded-sm" />
      <Skeleton className="h-[300px] flex w-full bg-secondary rounded-sm" />
      <Skeleton className="h-[300px] flex w-full bg-secondary rounded-sm" />
      <Skeleton className="h-[300px] flex w-full bg-secondary rounded-sm" />
    </div>
  );
}
