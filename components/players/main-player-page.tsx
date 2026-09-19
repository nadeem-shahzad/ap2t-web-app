'use client';
import CardStatus from '@/components/card-status';
import { BarChart } from '@/components/charts/bar-chart';
import { AddCoachNotes } from '@/components/players/add-coach-notes';
import { EditInfo } from '@/components/players/edit-info';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/auth-context';
import { useIsMobile } from '@/hooks/use-mobile';
import axios from '@/lib/axios';
import { getYear, joinNames } from '@/lib/functions';
import { PlayerResponse, SessionData, SquareSavedCard } from '@/lib/types';
import { Scrollbar } from '@radix-ui/react-scroll-area';
import {
  Bookmark,
  Calendar,
  CircleCheckBig,
  Clock,
  CreditCard,
  DollarSign,
  Gift,
  Info,
  Loader2,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  TrendingUp,
  User,
  UserX,
} from 'lucide-react';
import moment from 'moment';
import Link from 'next/link';
import { ReactNode, useEffect, useState } from 'react';
import { IoIosStar, IoIosStarOutline } from 'react-icons/io';
import getInitials from '../parents/get-initials';
import { DiscountDialog } from '../payment/apply-discount';
import PaymentMethodSteps from '../square/payment-method-steps';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogTitle,
} from '../ui/dialog';
import { Skeleton } from '../ui/skeleton';
import { Spinner } from '../ui/spinner';

export default function MainPlayerPage({
  id,
  back,
  admin = false,
}: {
  id: number | undefined;
  back?: ReactNode;
  admin?: boolean;
}) {
  const [data, setData] = useState<PlayerResponse | undefined>();
  const [tab, setTab] = useState('Session History');
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(true);
  const [statusLoading, setStatusLoading] = useState(false);
  const [cardInformation, setCardInformation] = useState<SquareSavedCard | undefined>();

  useEffect(() => {
    if (user?.id && id) {
      fetchData();
      fetchCardInformation();
    }
  }, [id, user]);

  async function fetchCardInformation() {
    const result = await axios.get(`/user/card?id=${id}`);
    setCardInformation(result.data);
  }

  const setStatus = async (status: string) => {
    setStatusLoading(true);
    try {
      const result = await axios.put(`/user`, {
        id: id,
        status: status,
      });
      setData((prevState) => {
        if (!prevState) return prevState;

        return {
          ...prevState,
          status,
        };
      });
    } finally {
      setStatusLoading(false);
    }
  };

  const fetchData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const result = await axios.get(`/admin/players/${id}`);

      setData(result.data);
    } finally {
      setLoading(false);
    }
  };

  function pendingString() {
    const totalPendingCount = calculateTotalPendingPayments(data?.payment_data);
    const totalPendingValue = calculatePendingStats(data?.payment_data);

    if (totalPendingCount && totalPendingCount > 0) {
      return `${totalPendingCount} session${totalPendingCount > 1 ? 's' : ''} pending payment${totalPendingCount > 1 ? 's' : ''} totalling $${totalPendingValue}`;
    } else null;
  }

  const CHECKINS_12WEEKS_DATA = generate12WeekCheckins(data?.sessions_data);

  const attendancePercent = calculateAttendancePercentage(data?.sessions_data);
  const totalAttended = calculateTotalAttendedSessions(data?.sessions_data);
  const totalPendingCount = calculateTotalPendingPayments(data?.payment_data);
  const totalCompedCount = calculateTotalCompedPayments(data?.payment_data);
  const totalSessionsCount = data?.sessions_data?.length ? data?.sessions_data.length : 0;

  if (loading) {
    return (
      <div className="flex flex-col w-full gap-6">
        {back}

        <Skeleton className="h-[150px] w-full bg-secondary rounded-sm" />
        <Skeleton className="h-[100px] w-full bg-secondary rounded-sm" />
        <Skeleton className="h-[200px] w-full bg-secondary rounded-sm" />
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full gap-6">
      {back}

      <Card className="w-full rounded-[12px] bg-[#252525]">
        <CardContent>
          <div className="w-full flex justify-between">
            <div className="flex flex-col gap-2">
              <span className="flex gap-2 text-xl items-center">
                {joinNames([data?.first_name, data?.last_name])}{' '}
                <span>
                  <CardStatus value={data?.status} icon={true} />
                </span>
              </span>
              <div
                className="text-[#D1D5DC] text-xs gap-2 grid grid-cols-2"
                style={{ columnGap: 20 }}
              >
                <span className="inline-flex gap-2 ">
                  <Calendar size={14} />
                  Age {getYear(data?.birth_date)}
                </span>

                <span className="inline-flex gap-2">
                  <Bookmark size={14} /> {data?.profile?.position}
                </span>
                <span className="inline-flex gap-2">
                  <User size={14} />
                  Parent:{' '}
                  {data?.parent_id
                    ? joinNames([data?.attach_parent?.first_name, data?.attach_parent?.last_name])
                    : 'N/A'}
                </span>
                <span className="inline-flex gap-2">
                  <Clock size={14} /> Joined:{' '}
                  {data?.created_at && moment(new Date(data?.created_at)).format('YYYY-MM-DD')}
                </span>
              </div>
            </div>
            <div className=" flex gap-4">
              {admin &&
                (data?.status === 'active' ? (
                  <Button variant="destructive" onClick={() => setStatus('inactive')}>
                    {statusLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Disabling...
                      </>
                    ) : (
                      <>
                        <UserX className="h-4 w-4" />
                        Disable
                      </>
                    )}
                  </Button>
                ) : (
                  <Button onClick={() => setStatus('active')}>
                    {statusLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Activating...
                      </>
                    ) : (
                      <>
                        <User className="h-4 w-4" />
                        Activate
                      </>
                    )}
                  </Button>
                ))}

              {data && <EditInfo player_id={id} data={data} onRefresh={fetchData} />}
            </div>
          </div>
          <div className="mt-4 flex w-full justify-between flex-wrap gap-2">
            <HeaderCard
              title={String(attendancePercent) + '%'}
              description="Attendance"
              icon={
                <div className="rounded-[8px] flex w-8 h-8 items-center justify-center bg-success-bg">
                  <CircleCheckBig className="text-success-text" size={16} />
                </div>
              }
            />

            <HeaderCard
              title={String(totalSessionsCount)}
              description="Total Sessions"
              icon={
                <div className="rounded-[8px] flex w-8 h-8 items-center justify-center bg-info-bg">
                  <Calendar className="text-info-text" size={16} />
                </div>
              }
            />

            <HeaderCard
              title={String(totalAttended)}
              description="Attended"
              icon={
                <div className="rounded-[8px] flex w-8 h-8 items-center justify-center bg-active-bg">
                  <TrendingUp className="text-active-text" size={16} />
                </div>
              }
            />

            <HeaderCard
              title={String(totalPendingCount)}
              description="Pending Pay"
              icon={
                <div className="rounded-[8px] flex w-8 h-8 items-center justify-center bg-alternative-bg">
                  <DollarSign className="text-alternative-text" size={16} />
                </div>
              }
            />

            <HeaderCard
              title={String(totalCompedCount)}
              description="Comped"
              icon={
                <div className="rounded-[8px] flex w-8 h-8 items-center justify-center bg-other-bg">
                  <Gift className="text-other-text" size={16} />
                </div>
              }
            />
          </div>
        </CardContent>
      </Card>

      {data?.parent_id && (
        <Card className="w-full rounded-[12px] bg-[#252525]">
          <CardContent className="space-y-4">
            {/* {data && !data?.parent_id && (
            <AddParentDialog playerId={id} onSuccess={fetchData} />
          )} */}

            <div className="w-full flex justify-between">
              <p className="text-[18px] text-white">Linked Parent</p>
              {admin && (
                <Link target="blank" href={`/portal/admin/parents/${data?.parent_id}`}>
                  <Button>View Parent Profile</Button>
                </Link>
              )}
            </div>

            <div className="flex gap-4">
              <Avatar className="bg-primary text-black">
                <AvatarImage src={data.attach_parent?.picture} />
                <AvatarFallback className="bg-primary text-black">
                  {getInitials(
                    joinNames([data.attach_parent?.first_name, data.attach_parent?.last_name])
                  )}
                </AvatarFallback>
              </Avatar>

              <div>
                <p className="text-md">
                  {joinNames([data.attach_parent?.first_name, data.attach_parent?.last_name])}
                </p>
                <p className="text-xs text-muted-foreground">Primary Contact</p>
              </div>
            </div>

            <div className="grid grid-cols-2 max-w-lg gap-2 text-xs font-normal">
              <div className="flex gap-1 items-center">
                <Mail size={12} className="text-[#99A1AF]" />
                <p className="text-[#D1D5DC]">{data.attach_parent?.email}</p>
              </div>

              <div className="flex gap-1 items-center">
                <Phone size={12} className="text-[#99A1AF]" />
                <p className="text-[#D1D5DC]">{data.attach_parent?.phone_no}</p>
              </div>

              <div className="flex gap-1 items-center">
                <Info size={12} className="text-[#99A1AF]" />
                <p className="text-[#D1D5DC]">Emergency: {data.attach_parent?.phone_no}</p>
              </div>

              <div className="flex gap-1 items-center">
                <MapPin size={12} className="text-[#99A1AF]" />
                <p className="text-[#D1D5DC]">{data.attach_parent?.location}</p>
              </div>
            </div>

            <Separator />

            {data?.profile?.medical_notes && (
              <Card className="bg-alternative-bg p-3 border-alternative-text/30">
                <CardContent className="p-0">
                  <div className="flex gap-4 items-start">
                    <Info size={14} className="text-alternative-text" />
                    <div className="font-normal space-y-1">
                      <Label className="text-alternative-text text-[14px] leading-none">
                        Medical Notes
                      </Label>
                      <div className="text-[#D1D5DC] text-xs break-all whitespace-pre-wrap">
                        {data?.profile?.medical_notes}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      )}

      <div className="w-full rounded-[12px] bg-[#252525] p-2 border-[#3A3A3A]">
        <Tabs
          value={tab}
          onValueChange={(v) => {
            setTab(v);
          }}
        >
          <ScrollArea className={`overflow-x-auto ${isMobile && 'max-w-[calc(100vw-64px)]'}`}>
            <TabsList className="bg-transparent relative flex gap-2">
              {[
                'Session History',
                'Attendance Timeline',
                'Payment Status',
                'Coach Notes',
                'Payment Method',
              ].map((t, i) => (
                <TabsTrigger
                  key={t}
                  value={t}
                  className="h-9 px-4 text-[12px] leading-tight tracking-tight"
                >
                  {i === 0 && (
                    <div className="flex gap-2 items-center py-2 ">
                      <Calendar /> {t}
                    </div>
                  )}
                  {i === 1 && (
                    <div className="flex gap-2 items-center py-2">
                      <TrendingUp /> {t}
                    </div>
                  )}
                  {i === 2 && (
                    <div className="flex gap-2 items-center py-2">
                      <DollarSign /> {t}{' '}
                      {totalPendingCount > 0 ? (
                        <div className="w-4 h-4 text-xs leading-none flex items-center justify-center bg-[#FDC700] text-black rounded-full">
                          {totalPendingCount}
                        </div>
                      ) : null}
                    </div>
                  )}
                  {i === 3 && (
                    <div className="flex gap-2 items-center  py-2">
                      <MessageSquare /> {t}
                    </div>
                  )}

                  {i === 4 && (
                    <div className="flex gap-2 items-center  py-2">
                      <CreditCard /> {t}
                    </div>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
            <Scrollbar orientation="horizontal" />
          </ScrollArea>

          <Separator />

          <TabsContent value="Session History" className="space-y-4 p-2">
            {data?.sessions_data &&
              data?.sessions_data?.map((item, i) => (
                <Card key={i} className="bg-black">
                  <CardContent className="space-y-2">
                    <div className="flex justify-between gap-2 flex-wrap">
                      <div className="flex gap-4 items-center text-sm">
                        <p>{item.name}</p>
                        <CardStatus value={item.status} icon={true} />

                        <CardStatus value={item.payment_detail?.status || 'pending'} />
                      </div>
                      <span className="flex gap-1 items-center">
                        <p className="text-md">
                          {item?.payment_detail?.status === 'comped'
                            ? 'Free'
                            : `$${item?.payment_detail?.amount}`}
                        </p>
                        {item?.payment_detail?.original_price && (
                          <span className="text-sm line-through text-muted-foreground">
                            ${item?.payment_detail?.original_price}
                          </span>
                        )}
                      </span>
                    </div>

                    <div className="flex gap-2 items-center text-xs text-muted-foreground flex-wrap">
                      <div className="flex gap-2">
                        <Calendar size={14} />
                        <p>{formatSessionDates(item)}</p>
                      </div>
                      <div className="flex gap-2">
                        <Clock size={14} />
                        <p>
                          {item.start_time} - {item.end_time}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <User size={14} />
                        <p>Coach {joinNames([item?.coach_first_name, item?.coach_last_name])}</p>
                      </div>
                    </div>
                    {item?.note_detail &&
                      item?.note_detail?.map((eachNote) => (
                        <div key={eachNote.id} className="mt-4 space-y-4">
                          <Separator />
                          <div className="flex flex-wrap gap-4 items-center text-xs text-muted-foreground">
                            <MessageSquare size={14} />
                            <p className="break-all whitespace-pre-wrap">{eachNote?.note}</p>
                          </div>
                        </div>
                      ))}

                    <RenderRating item={item} user_id={id} onRefresh={fetchData} />
                  </CardContent>
                </Card>
              ))}
          </TabsContent>

          <TabsContent value="Attendance Timeline" className="space-y-4 p-2">
            <p>Last 12 weeks</p>
            <p className="text-muted-foreground text-xs">Track attendance patterns over time</p>

            <BarChart chartData={CHECKINS_12WEEKS_DATA} yaxis={'checkins'} xaxis={'time'} />
          </TabsContent>

          <TabsContent value="Payment Status" className="space-y-4 p-2">
            {pendingString() && (
              <Card className="bg-alternative-bg p-3 border-alternative-text/30">
                <CardContent className="p-0">
                  <div className="flex gap-4 items-start">
                    <Info size={14} className="text-alternative-text" />
                    <div className="font-normal space-y-1">
                      <Label className="text-alternative-text text-[14px] leading-none">
                        Pending Payments
                      </Label>
                      <p className="text-[#D1D5DC] text-xs">{pendingString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {data?.payment_data &&
              data.payment_data.map((item, i) => (
                <Card key={i} className="bg-black">
                  <CardContent className="space-y-2">
                    <div className="flex justify-between gap-4 flex-wrap">
                      <div className="flex gap-4 items-center text-sm">
                        <p>{item.session_name || 'Session payment'}</p>
                        <CardStatus value={item.status || 'pending'} />
                      </div>
                      <p
                        className={`text-md ${item.status !== 'paid' && item.status !== 'comped' && 'text-alternative-text'}`}
                      >
                        {item.status === 'comped'
                          ? 'Free'
                          : `$${item.amount ?? 0}`}
                      </p>
                    </div>

                    <div className="flex gap-2 items-center text-xs text-muted-foreground flex-wrap">
                      <div className="flex gap-2">
                        <Calendar size={14} />
                        <p>{formatPaymentDate(item)}</p>
                      </div>
                      <div className="flex gap-2">
                        <User size={14} />
                        <p>Coach {joinNames([item.coach_first_name, item.coach_last_name])}</p>
                      </div>
                    </div>

                    {item.status &&
                      !['paid', 'comped'].includes(item.status) && (
                        <DiscountDialog
                          data={item}
                          onRefresh={fetchData}
                          original={item.original_price}
                        />
                      )}
                  </CardContent>
                </Card>
              ))}
          </TabsContent>

          <TabsContent value="Coach Notes" className="space-y-4 p-2">
            <div className="flex gap-4 justify-between flex-wrap">
              <div>
                <p>Coach Feedback & Notes</p>
                <p className="text-muted-foreground text-xs">
                  {data?.all_notes &&
                    data?.all_notes.length > 0 &&
                    `${data?.all_notes.length} notes from coaches`}
                </p>
              </div>
              {admin && <AddCoachNotes player_id={id} onRefresh={fetchData} />}
            </div>

            {data?.all_notes &&
              data?.all_notes?.map((item, i) => (
                <Card key={i} className="bg-black">
                  <CardContent className="space-y-2">
                    <div className="flex gap-4 items-center text-sm">
                      <p>Coach {joinNames([item?.coach_first_name, item?.coach_last_name])}</p>

                      <div className="flex gap-1">
                        <div className="flex gap-1">
                          {Array.from({ length: 5 }).map((_, i) =>
                            i < (item?.rating || 0) ? (
                              <IoIosStar className="text-primary" key={i} />
                            ) : (
                              <IoIosStarOutline key={i} className="text-muted-foreground" />
                            )
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 items-center text-xs text-muted-foreground">
                      <Calendar size={14} />
                      <p>
                        {item?.created_at && moment(new Date(item.created_at)).format('YYYY-MM-DD')}
                      </p>
                      <MessageSquare size={14} />
                      <p>{item?.session_name}</p>
                    </div>

                    <p className="text-xs text-[#D1D5DC] break-all whitespace-pre-wrap">
                      {item?.note}
                    </p>
                  </CardContent>
                </Card>
              ))}
          </TabsContent>

          <TabsContent value="Payment Method" className="space-y-4 p-2">
            <PaymentMethodSteps id={id} data={cardInformation} onRefresh={fetchCardInformation} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

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
    <Card className="rounded-[10px] bg-[#1A1A1A] border-[#3A3A3A] sm:w-[204px] w-fit p-0 py-2 px-4">
      <CardContent className="p-0">
        <div className="flex gap-2 items-center">
          {icon}
          <div className="space-y-0">
            <p className="text-[24px] text-white leading-tight">{title}</p>
            <p className="text-muted-foreground text-[12px] ">{description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

function calculateTotalPendingPayments(payments: PlayerResponse['payment_data'] | undefined) {
  if (!payments) return 0;

  return payments.reduce((count, payment) => {
    return payment.status === 'pending' ? count + 1 : count;
  }, 0);
}

function calculateTotalCompedPayments(payments: PlayerResponse['payment_data'] | undefined) {
  if (!payments) return 0;

  return payments.reduce((count, payment) => {
    return payment.status === 'comped' ? count + 1 : count;
  }, 0);
}

function calculatePendingStats(payments: PlayerResponse['payment_data'] | undefined) {
  if (!payments) return 0;
  return payments.reduce((total, payment) => {
    if (payment.status !== 'pending') return total;
    return total + Number(payment.amount || 0);
  }, 0);
}

function formatSessionDates(session: SessionData) {
  if (session.enrolled_dates?.length) {
    return session.enrolled_dates.map((date) => moment.utc(date).format('YYYY-MM-DD')).join(', ');
  }

  return session.date ? moment.utc(session.date).format('YYYY-MM-DD') : 'Date to be confirmed';
}

function formatPaymentDate(payment: PlayerResponse['payment_data'][number]) {
  const date = payment.session_date || payment.session_start_date;
  return date ? moment.utc(date).format('YYYY-MM-DD') : 'Date to be confirmed';
}

function calculateAttendancePercentage(sessions: SessionData[] | undefined) {
  if (!sessions) return 0;

  const completedSessions = sessions.filter((s) => s.status === 'completed');

  if (completedSessions.length === 0) return 0;

  const presentCount = completedSessions.reduce((acc, session) => {
    const attendanceRecords = session.attendance_detail || [];
    const isPresent = attendanceRecords.some((a: any) => a.status === 'present');
    return acc + (isPresent ? 1 : 0);
  }, 0);

  return (presentCount / completedSessions.length) * 100;
}

function calculateTotalAttendedSessions(sessions: SessionData[] | undefined) {
  if (!sessions) return 0;

  const completedSessions = sessions.filter((s) => s.status === 'completed');

  return completedSessions.reduce((count, session) => {
    const attendanceRecords = session.attendance_detail || [];

    const hasPresent = attendanceRecords.some((a: any) => a.status === 'present');

    return hasPresent ? count + 1 : count;
  }, 0);
}

function generate12WeekCheckins(sessions: SessionData[] | undefined) {
  if (!sessions) return [];

  const weekMap: Record<string, number> = {};

  // Bucket by each attendance record's own timestamp, not the parent
  // session's date — sessions.date is always null for fixed_dates sessions,
  // and even for daily/multi-day sessions a check-in's own date is the
  // correct thing to bucket by, not the session's start date.
  sessions.forEach((session) => {
    const attendance = session.attendance_detail || [];
    attendance
      .filter((a: any) => a.status === 'present' && a.created_at)
      .forEach((a: any) => {
        const weekKey = moment(a.created_at).startOf('week').format('YYYY-MM-DD');
        weekMap[weekKey] = (weekMap[weekKey] || 0) + 1;
      });
  });

  let weeksArray = Object.entries(weekMap)
    .sort(([a], [b]) => moment(a).diff(moment(b)))
    .map(([week, count]) => ({
      week,
      checkins: count,
    }));

  if (weeksArray.length > 12) {
    weeksArray = weeksArray.slice(-12);
  }

  return weeksArray.map((w, index) => ({
    time: `W${index + 1}`,
    checkins: w.checkins,
  }));
}

const RenderRating = ({
  item,
  user_id,
  onRefresh,
}: {
  item: SessionData;
  user_id: number | undefined;
  onRefresh: () => Promise<void>;
}) => {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [loading, setLoading] = useState(false);

  if (item?.status !== 'completed' || !user_id) return null;
  if (item?.session_rating && item.session_rating > 0) return null;
  async function handleSubmit() {
    if (!item?.id || !user_id) return;
    setLoading(true);
    try {
      await axios.put(`/player/${user_id}/sessions/${item.id}/rating`, { rating });
      await onRefresh();
      handleClose(false);
    } finally {
      setLoading(false);
    }
  }

  function handleClose(val: boolean) {
    setOpen(val);
    setRating(0);
  }

  return (
    <>
      <Button className="mt-1" onClick={() => setOpen(true)}>
        Rate Session
      </Button>

      <Dialog open={open} onOpenChange={handleClose}>
        <DialogOverlay />
        <DialogContent className="sm:max-w-[550px] bg-[#252525]">
          <DialogHeader className="pb-4 border-b">
            <DialogTitle className="text-sm font-normal">Rate Your Session</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="performance" className="text-xs text-muted-foreground">
                Performance & Rating
              </Label>
              <div className="flex gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span key={i} onClick={() => setRating(i + 1)} className="cursor-pointer">
                    {i < rating ? (
                      <IoIosStar className="text-primary" size={20} />
                    ) : (
                      <IoIosStarOutline className="text-muted-foreground" size={20} />
                    )}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button onClick={handleSubmit} disabled={loading} type="submit">
              {loading && <Spinner className="text-black" />} Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
