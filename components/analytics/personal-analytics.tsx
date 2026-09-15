'use client';

import AppCalendar from '@/components/app-calendar';
import LineChart from '@/components/charts/line-chart-dots';
import PieChart from '@/components/charts/pie-chart';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { auth } from '@/lib/firebase';
import { exportDashboardToExcel, exportToExcel } from '@/lib/functions';
import { PersonalAnalyticsResponse } from '@/lib/types';
import axios from '@/lib/axios';
import { useAuth } from '@/contexts/auth-context';
import {
  ChartColumn,
  CircleCheckBig,
  Download,
  Filter,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import moment from 'moment';
import { useEffect, useState } from 'react';

type Child = { id: number; name: string };

const sessionTypeConfig = {
  value: { label: 'Sessions' },
};

const trendConfig = {
  attended: { label: 'Attended', color: 'var(--chart-1)' },
  missed: { label: 'Missed', color: 'var(--chart-4)' },
};

export default function PersonalAnalytics({
  mode,
  playerId,
}: {
  mode: 'player' | 'parent';
  playerId?: number;
}) {
  const { user } = useAuth();
  const [dates, setDates] = useState<{ start?: Date; end?: Date }>({});
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>(
    playerId ? String(playerId) : ''
  );
  const [children, setChildren] = useState<Child[]>([]);
  const [report, setReport] = useState<PersonalAnalyticsResponse>();
  const [loadingChildren, setLoadingChildren] = useState(mode === 'parent');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (mode === 'player' && playerId) {
      setSelectedPlayerId(String(playerId));
    }
  }, [mode, playerId]);

  useEffect(() => {
    if (mode !== 'parent' || !user?.id) return;

    async function loadChildren() {
      try {
        const token = await auth.currentUser?.getIdToken();
        if (!token) return;
        const response = await axios.get('/personal-analytics?children=true', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setChildren(response.data.children || []);
      } finally {
        setLoadingChildren(false);
      }
    }

    loadChildren();
  }, [mode, user?.id]);

  async function applyFilter() {
    if (!selectedPlayerId || !dates.start || !dates.end) return;
    if (moment(dates.start).isAfter(dates.end, 'day')) return;

    setLoading(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) return;
      const start = moment(dates.start).format('YYYY-MM-DD');
      const end = moment(dates.end).format('YYYY-MM-DD');
      const response = await axios.get(
        `/personal-analytics?playerId=${selectedPlayerId}&start=${start}&end=${end}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setReport(response.data);
    } finally {
      setLoading(false);
    }
  }

  const canApply = Boolean(selectedPlayerId && dates.start && dates.end && !loadingChildren);
  const hasInvalidDateRange = Boolean(
    dates.start && dates.end && moment(dates.start).isAfter(dates.end, 'day')
  );
  const summary = [
    {
      title: 'Total Sessions',
      value: report?.totals.totalSessions ?? 0,
      icon: ChartColumn,
      color: 'info',
    },
    {
      title: 'Attended',
      value: report?.totals.attended ?? 0,
      icon: CircleCheckBig,
      color: 'active',
    },
    { title: 'Missed', value: report?.totals.missed ?? 0, icon: TrendingDown, color: 'danger' },
    {
      title: 'Attendance Rate',
      value: `${report?.totals.attendanceRate ?? 0}%`,
      icon: TrendingUp,
      color: 'success',
    },
  ];

  const overviewSheet = {
    sheetName: 'Overview',
    headers: ['Metric', 'Value'],
    rows: [
      ['Player', report?.player.name ?? ''],
      ['Start Date', report?.dateRange.start ?? ''],
      ['End Date', report?.dateRange.end ?? ''],
      ['Total Sessions', report?.totals.totalSessions ?? 0],
      ['Attended', report?.totals.attended ?? 0],
      ['Missed', report?.totals.missed ?? 0],
      ['Pending Attendance', report?.totals.pendingAttendance ?? 0],
      ['Attendance Rate (%)', report?.totals.attendanceRate ?? 0],
      ['Total Paid', report?.payments.totalPaid ?? 0],
    ],
  };
  const attendanceTrendSheet = {
    sheetName: 'Attendance Trend',
    headers: ['Date', 'Sessions', 'Attended', 'Missed'],
    rows:
      report?.attendanceTrend.map((item) => [
        item.date,
        item.sessions,
        item.attended,
        item.missed,
      ]) ?? [],
  };
  const sessionTypesSheet = {
    sheetName: 'Session Types',
    headers: ['Session Type', 'Count'],
    rows: report?.sessionTypeData.map((item) => [item.name, item.value]) ?? [],
  };
  const sessionActivitySheet = {
    sheetName: 'Session Activity',
    headers: [
      'Session',
      'Attendance Date',
      'Scheduled Date',
      'Coach',
      'Session Status',
      'Attendance',
      'Rating',
    ],
    rows:
      report?.sessions.map((session) => [
        session.name,
        moment(session.attendance_date).format('YYYY-MM-DD'),
        moment(session.date).format('YYYY-MM-DD'),
        [session.coach_first_name, session.coach_last_name].filter(Boolean).join(' ') || 'N/A',
        session.session_status,
        session.attendance_status,
        session.rating || '',
      ]) ?? [],
  };
  const paymentsSheet = {
    sheetName: 'Payments',
    headers: [
      'Session',
      'Session Date',
      'Payment Created',
      'Amount',
      'Status',
      'Method',
      'Paid At',
    ],
    rows:
      report?.payments.records.map((payment) => [
        payment.session_name,
        moment(payment.session_date).format('YYYY-MM-DD'),
        moment(payment.created_at).format('YYYY-MM-DD'),
        payment.amount,
        payment.status,
        payment.method || 'N/A',
        payment.paid_at ? moment(payment.paid_at).format('YYYY-MM-DD') : 'N/A',
      ]) ?? [],
  };

  function exportAllData() {
    if (!report) return;
    exportDashboardToExcel(
      [overviewSheet, attendanceTrendSheet, sessionTypesSheet, sessionActivitySheet, paymentsSheet],
      `${report.player.name.replace(/\s+/g, '-').toLowerCase()}-analytics.xlsx`
    );
  }

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="space-y-1">
        <p className="text-xl">Performance Analytics</p>
        <span className="flex text-xs text-muted-foreground">
          Filter and review performance over a selected period
        </span>
      </div>

      <Card>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 text-sm">
            <Filter className="text-primary" size={16} /> Filters
          </div>
          <div
            className={`grid grid-cols-1 gap-4 ${mode === 'parent' ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}
          >
            {mode === 'parent' && (
              <div className="flex flex-col gap-2">
                <Label className="text-xs font-normal text-muted-foreground">Child</Label>
                <Select
                  value={selectedPlayerId}
                  onValueChange={(value) => {
                    setSelectedPlayerId(value);
                    setReport(undefined);
                  }}
                  disabled={loadingChildren}
                >
                  <SelectTrigger className="w-full dark:bg-[#1A1A1A]">
                    <SelectValue
                      placeholder={loadingChildren ? 'Loading children...' : 'Select a child'}
                    />
                  </SelectTrigger>
                  <SelectContent className="bg-black">
                    {children.map((child) => (
                      <SelectItem key={child.id} value={String(child.id)}>
                        {child.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="flex flex-col gap-2">
              <Label className="text-xs font-normal text-muted-foreground">Start Date</Label>
              <AppCalendar
                date={dates.start}
                onChange={(start) => setDates((current) => ({ ...current, start }))}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label className="text-xs font-normal text-muted-foreground">End Date</Label>
              <AppCalendar
                date={dates.end}
                onChange={(end) => setDates((current) => ({ ...current, end }))}
              />
            </div>
          </div>
          {hasInvalidDateRange && (
            <p className="text-xs text-destructive">End date must be on or after the start date.</p>
          )}
          <Button
            className="w-full"
            disabled={!canApply || hasInvalidDateRange || loading}
            onClick={applyFilter}
          >
            {loading && <Spinner className="text-black" />}Apply Filter
          </Button>
        </CardContent>
      </Card>

      {loading ? (
        <PersonalAnalyticsLoader />
      ) : (
        report && (
          <>
            <div className="flex justify-end">
              <Button onClick={exportAllData}>
                <Download /> Export All Data
              </Button>
            </div>
            <div className="flex w-full flex-wrap justify-center gap-4">
              {summary.map((item) => {
                const Icon = item.icon;
                return (
                  <Card
                    key={item.title}
                    className="w-full flex-1 rounded-[10px] border-[#3A3A3A] bg-[#1A1A1A] p-0 px-4 py-2 sm:w-[204px]"
                  >
                    <CardContent className="space-y-2 p-0 py-2">
                      <div className="flex items-center gap-2">
                        <div
                          className={`flex h-7 w-7 items-center justify-center rounded-[8px] bg-${item.color}-bg`}
                        >
                          <Icon className={`text-${item.color}-text`} size={16} />
                        </div>
                        <p className="text-xs text-muted-foreground">{item.title}</p>
                      </div>
                      <p className="text-[24px] leading-tight text-white">{item.value}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Card>
                <CardContent className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm">Sessions by Type</p>
                      <p className="text-xs text-muted-foreground">
                        Distribution across selected sessions
                      </p>
                    </div>
                    <ExportButton
                      disabled={!sessionTypesSheet.rows.length}
                      onClick={() =>
                        exportToExcel(
                          sessionTypesSheet.headers,
                          sessionTypesSheet.rows,
                          'session-types.xlsx'
                        )
                      }
                    />
                  </div>
                  <div className="h-70">
                    {report.sessionTypeData.length ? (
                      <PieChart data={report.sessionTypeData} config={sessionTypeConfig} />
                    ) : (
                      <EmptyChartState />
                    )}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm">Attendance Trend</p>
                      <p className="text-xs text-muted-foreground">
                        Attendance over the selected period
                      </p>
                    </div>
                    <ExportButton
                      disabled={!attendanceTrendSheet.rows.length}
                      onClick={() =>
                        exportToExcel(
                          attendanceTrendSheet.headers,
                          attendanceTrendSheet.rows,
                          'attendance-trend.xlsx'
                        )
                      }
                    />
                  </div>
                  <div className="h-70">
                    {report.attendanceTrend.length ? (
                      <LineChart
                        data={report.attendanceTrend}
                        config={trendConfig}
                        xAxisKey="date"
                        tickFormatter={(value) => moment(value).format('MMM D')}
                        lines={[{ key: 'attended' }, { key: 'missed' }]}
                      />
                    ) : (
                      <EmptyChartState />
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm">Payment Summary</p>
                    <p className="text-xs text-muted-foreground">
                      Payment status for sessions in the selected period
                    </p>
                  </div>
                  <ExportButton
                    disabled={!paymentsSheet.rows.length}
                    onClick={() =>
                      exportToExcel(paymentsSheet.headers, paymentsSheet.rows, 'payments.xlsx')
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-5">
                  <PaymentStat label="Paid" value={report.payments.paid} />
                  <PaymentStat label="Pending" value={report.payments.pending} />
                  <PaymentStat label="Failed" value={report.payments.failed} />
                  <PaymentStat label="Comped" value={report.payments.comped} />
                  <PaymentStat label="Refunded" value={report.payments.refunded} />
                </div>
              </CardContent>
            </Card>

            <Card className="border-[#3A3A3A] bg-[#252525] p-0">
              <CardHeader className="flex flex-row items-start justify-between gap-4 p-6 pb-0">
                <div>
                  <p className="text-lg font-medium">Session Activity</p>
                  <p className="text-sm text-muted-foreground">
                    Detailed activity for {report.player.name}
                  </p>
                </div>
                <ExportButton
                  disabled={!sessionActivitySheet.rows.length}
                  onClick={() =>
                    exportToExcel(
                      sessionActivitySheet.headers,
                      sessionActivitySheet.rows,
                      'session-activity.xlsx'
                    )
                  }
                />
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>SESSION</TableHead>
                      <TableHead>ATTENDANCE DATE</TableHead>
                      <TableHead>SESSION DATE</TableHead>
                      <TableHead>COACH</TableHead>
                      <TableHead>STATUS</TableHead>
                      <TableHead>ATTENDANCE</TableHead>
                      <TableHead>RATING</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.sessions.map((session) => (
                      <TableRow key={session.id}>
                        <TableCell>{session.name}</TableCell>
                        <TableCell>
                          {moment(session.attendance_date).format('YYYY-MM-DD')}
                        </TableCell>
                        <TableCell>{moment(session.date).format('YYYY-MM-DD')}</TableCell>
                        <TableCell>
                          {[session.coach_first_name, session.coach_last_name]
                            .filter(Boolean)
                            .join(' ') || 'N/A'}
                        </TableCell>
                        <TableCell className="capitalize">{session.session_status}</TableCell>
                        <TableCell className="capitalize">{session.attendance_status}</TableCell>
                        <TableCell>{session.rating || '—'}</TableCell>
                      </TableRow>
                    ))}
                    {report.sessions.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                          No sessions found for this date range.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        )
      )}
    </div>
  );
}

function PersonalAnalyticsLoader() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-[100px] flex-1 rounded-sm bg-secondary" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Skeleton className="h-[300px] rounded-sm bg-secondary" />
        <Skeleton className="h-[300px] rounded-sm bg-secondary" />
      </div>
      <Skeleton className="h-[300px] rounded-sm bg-secondary" />
    </div>
  );
}

function PaymentStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md bg-[#1A1A1A] p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg">{value}</p>
    </div>
  );
}

function EmptyChartState() {
  return (
    <div className="flex h-full items-center justify-center text-center text-sm text-muted-foreground">
      No data is available for this date range.
    </div>
  );
}

function ExportButton({ onClick, disabled = false }: { onClick: () => void; disabled?: boolean }) {
  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      variant="outline"
      size="icon-sm"
      className="h-6 w-6 rounded-sm text-muted-foreground"
    >
      <Download />
    </Button>
  );
}
