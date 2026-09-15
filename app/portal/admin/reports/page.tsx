'use client';
import AppCalendar from '@/components/app-calendar';
import PageTable from '@/components/app-table';
import { BarChart } from '@/components/charts/bar-chart';
import LineChart from '@/components/charts/line-chart-dots';
import PieChart from '@/components/charts/pie-chart';
import {
  PLAYER_ATTENDANCE_DATA_COLUMNS,
  ZIP_REVENUE_DATA_COLUMNS,
} from '@/components/settings/columns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useSidebar } from '@/components/ui/sidebar';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { useAuth } from '@/contexts/auth-context';
import { useIsMobile } from '@/hooks/use-mobile';
import axios from '@/lib/axios';
import { MONTHLY_SESSIONS_CONFIG, SESSION_TYPE_CHART_CONFIG } from '@/lib/constants';
import { exportDashboardToExcel, exportToExcel } from '@/lib/functions';
import { DashboardDataResponse } from '@/lib/types';

import {
  ChartColumn,
  DollarSign,
  Download,
  FileText,
  Filter,
  LucideProps,
  MapPin,
  TrendingUp,
} from 'lucide-react';
import moment from 'moment';
import { ReactNode, useEffect, useState } from 'react';

export default function Page() {
  const [filter, setFilter] = useState(true);
  const { open } = useSidebar();
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<DashboardDataResponse | undefined>();
  const [filterLoading, setFilterLoading] = useState(false);

  const [dates, setDates] = useState<{ start: Date | undefined; end: Date | undefined }>({
    start: undefined,
    end: undefined,
  });
  const { user } = useAuth();

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  async function fetchData() {
    setLoading(true);
    try {
      const response = await axios.get('/admin/report');
      setReports(response.data);
    } finally {
      setLoading(false);
    }
  }

  async function filterData(start: Date | undefined, end: Date | undefined) {
    const startDate = start ? moment(start).format('YYYY-MM-DD') : null;
    const endDate = end ? moment(end).format('YYYY-MM-DD') : null;

    if (!startDate || !endDate) return;

    setFilterLoading(true);
    try {
      const response = await axios.get(
        `/admin/report?filter=true&start=${startDate}&end=${endDate}`
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

    {
      title: 'Avg Attendance',
      value: `${reports?.totals?.averageAttendance || 0}%`,
      Icon: (props: LucideProps) => <TrendingUp {...props} />,
      color: 'success',
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
      ['Avg Attendance (%)', reports?.totals.averageAttendance ?? 0],
    ],
  };

  const revenueByCoachSheet = {
    sheetName: 'Revenue by Coach',
    headers: ['Coach', 'Revenue'],
    rows: reports?.revenueByCoach?.map((r) => [r.coach, String(r.value)]) ?? [],
  };

  const sessionTypesSheet = {
    sheetName: 'Session Types',
    headers: ['Session Type', 'Count'],
    rows: reports?.sessionTypeData.map((s) => [s.name, String(s.value)]) ?? [],
  };

  const monthlyRevenueSheet = {
    sheetName: 'Monthly Revenue',
    headers: ['Month', 'Revenue'],
    rows: reports?.monthlyRevenueTrend.map((m) => [m.month, String(m.value)]) ?? [],
  };
  const playerAttendanceSheet = {
    sheetName: 'Player Attendance',
    headers: ['Player', 'Total Sessions', 'Attended', 'Missed', 'Attendance %'],
    rows:
      reports?.playerAttendanceData.map((p) => [
        p.name,
        String(p.sessions),
        String(p.attended),
        String(p.missed),
        String(p.attendance_rate),
      ]) ?? [],
  };

  const zipcodeSheet = {
    sheetName: 'Zip Code Analytics',
    headers: ['Zip Code', 'Total Users', 'Total Revenue', 'Avg Revenue'],
    rows:
      reports?.zipcodeData.map((z) => [
        z.zip_code,
        z.total_users,
        z.total_revenue,
        String(Number(z.avg_revenue).toFixed(0)),
      ]) ?? [],
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
      <Header>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <Button
            onClick={() => {
              exportDashboardToExcel(
                [
                  totalsSheet,
                  revenueByCoachSheet,
                  sessionTypesSheet,
                  monthlyRevenueSheet,
                  playerAttendanceSheet,
                  zipcodeSheet,
                ],
                'dashboard-report.xlsx'
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
      {filter && (
        <Card>
          <CardContent className="space-y-4">
            <div className="text-sm flex gap-2 items-center">
              <Filter className="text-primary" size={16} /> Filters
            </div>

            <div className="flex flex-col w-full gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* <div className="flex flex-1 flex-col gap-2">
                  <Label className="text-muted-foreground font-normal text-xs">Coach</Label>
                  <Input className="rounded-[8px] dark:bg-black" />
                </div> */}

                {/* <div className="flex flex-1 flex-col gap-2">
                  <Label className="text-muted-foreground font-normal text-xs">Session Type</Label>
                  <Input className="rounded-[8px] dark:bg-black" />
                </div> */}

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

                {/* <div className="flex flex-1 flex-col gap-2">
                  <Label className="text-muted-foreground font-normal text-xs">Additional</Label>
                  <Input className="rounded-[8px] dark:bg-black" />
                </div>

                <div className="flex flex-1 flex-col gap-2">
                  <Label className="text-muted-foreground font-normal text-xs">Additional</Label>
                  <Input className="rounded-[8px] dark:bg-black" />
                </div> */}
              </div>
              <Button
                disabled={filterLoading || !dates.start || !dates.end}
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
      )}

      <div className="grid sm:grid-cols-2 grid-cols-1 gap-4">
        <Card>
          <CardContent className="space-y-2">
            <div className="flex justify-between items-center">
              <div className="space-y-2">
                <p className="text-sm">Revenue by Coach</p>
                <p className="text-xs text-muted-foreground">Total earnings per coach</p>
              </div>
              <Button
                onClick={() => {
                  exportToExcel(
                    revenueByCoachSheet.headers,
                    revenueByCoachSheet.rows,
                    revenueByCoachSheet.sheetName + '.xlsx'
                  );
                }}
                variant={'outline'}
                size={'icon-sm'}
                className="h-6 w-6 rounded-sm text-[10px] text-muted-foreground"
              >
                <Download />
              </Button>
            </div>

            <BarChart chartData={reports?.revenueByCoach || []} xaxis="coach" yaxis="value" />
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

      <Card>
        <CardContent className="space-y-2">
          <div className="flex justify-between items-center">
            <div className="space-y-2">
              <p className="text-sm">Monthly Revenue Trend</p>
              <p className="text-xs text-muted-foreground">Revenue growth over time</p>
            </div>
            <Button
              onClick={() => {
                exportToExcel(
                  monthlyRevenueSheet.headers,
                  monthlyRevenueSheet.rows,
                  monthlyRevenueSheet.sheetName + '.xlsx'
                );
              }}
              variant={'outline'}
              size={'icon-sm'}
              className="h-6 w-6 rounded-sm text-[10px] text-muted-foreground"
            >
              <Download />
            </Button>
          </div>
          <div className="grid grid-cols-1">
            <div className="h-70">
              <LineChart
                data={reports?.monthlyRevenueTrend || []}
                config={MONTHLY_SESSIONS_CONFIG}
                xAxisKey="month"

                tickFormatter={(value) => value.slice(0, 3)}
                lines={[
                  {
                    key: 'value',
                  },
                ]}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-[#252525] flex flex-col h-full p-0 border border-[#3A3A3A] ">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 pb-0 gap-4 sm:gap-0">
          <div className="flex flex-col gap-1">
            <h1 className="font-medium text-lg">Player attendance & usage frequency</h1>
            <p className="text-sm text-muted-foreground">Track individual player engagement</p>
          </div>

          <Button
            onClick={() => {
              exportToExcel(
                playerAttendanceSheet.headers,
                playerAttendanceSheet.rows,
                playerAttendanceSheet.sheetName + '.xlsx'
              );
            }}
            variant={'outline'}
          >
            <Download /> Export
          </Button>
        </CardHeader>

        <CardContent className="p-0">
          <PageTable
            headerClassName={'rounded-none border-none'}
            columns={PLAYER_ATTENDANCE_DATA_COLUMNS}
            data={reports?.playerAttendanceData || []}
            onRowClick={() => {}}
            scrollAreaWidth={`${open ? 'w-[calc(100dvw-306px)]' : 'w-[calc(100dvw-104px)]'} ${isMobile && 'w-[calc(100vw-44px)]'}`}
          />
        </CardContent>
      </Card>

      <Card className="bg-[#252525] flex flex-col h-full p-0 border border-[#3A3A3A]">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 pb-0 gap-4 sm:gap-0">
          <div className="flex flex-col gap-1">
            <h1 className="font-medium text-lg">
              <MapPin className="text-primary inline-flex" size={20} /> Geographic Distribution by
              Zip Code
            </h1>
            <p className="text-sm text-muted-foreground">Customer location and revenue by area</p>
          </div>

          <Button
            onClick={() => {
              exportToExcel(
                zipcodeSheet.headers,
                zipcodeSheet.rows,
                zipcodeSheet.sheetName + '.xlsx'
              );
            }}
            variant={'outline'}
          >
            <Download /> Export
          </Button>
        </CardHeader>

        <CardContent className="p-0">
          <PageTable
            headerClassName={'rounded-none border-none'}
            columns={ZIP_REVENUE_DATA_COLUMNS}
            data={reports?.zipcodeData?.map((item, i) => ({ ...item, id: i })) || []}
            onRowClick={() => {}}
            scrollAreaWidth={`${open ? 'w-[calc(100dvw-306px)]' : 'w-[calc(100dvw-104px)]'} ${isMobile && 'w-[calc(100vw-44px)]'}`}
          />
        </CardContent>
      </Card>
    </div>
  );
}

const Header = ({ children }: { children: ReactNode }) => {
  return (
    <div className="flex w-full gap-4 justify-between flex-wrap items-center">
      <div className="space-y-1">
        <p className="text-xl">Reports & Analytics</p>
        <span className="text-xs text-muted-foreground flex items-center">
          <span>Filter, analyze, and export business data</span>
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
