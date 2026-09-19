'use client';
import CardStatus from '@/components/card-status';
import { EditParents } from '@/components/parents/edit-parents';
import { LinkChildrenDialog } from '@/components/parents/link-children';
import { CreatePlayer } from '@/components/players/create-player';
import RenderAvatar from '@/components/render-avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/auth-context';
import { useIsMobile } from '@/hooks/use-mobile';
import axios from '@/lib/axios';
import { formatDateOnly } from '@/lib/date';
import { exportToExcel, getYear, joinNames } from '@/lib/functions';
import { ParentDetailResponse, PaymentItemParent, SquareSavedCard } from '@/lib/types';
import { Scrollbar } from '@radix-ui/react-scroll-area';
import {
  Banknote,
  Calendar,
  Clock,
  CreditCard,
  DollarSign,
  Dot,
  Download,
  Mail,
  MapPin,
  Phone,
  User,
  Users,
  UserX,
} from 'lucide-react';
import moment from 'moment';
import Link from 'next/link';
import { ReactNode, useEffect, useState } from 'react';
import { IoIosPin } from 'react-icons/io';
import { IoCalendarClear } from 'react-icons/io5';
import PaymentMethodSteps from '../square/payment-method-steps';
import { Spinner } from '../ui/spinner';

export default function MainParentPage({
  id,
  back,
  admin = false,
}: {
  id: string | number | undefined;
  back?: ReactNode;
  admin?: boolean;
}) {
  const [data, setData] = useState<ParentDetailResponse | undefined>();
  const [tab, setTab] = useState('linked');
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const { user } = useAuth();
  const [cardInformation, setCardInformation] = useState<SquareSavedCard | undefined>();

  useEffect(() => {
    if (id && user?.id) {
      fetchData();
      fetchCardInformation();
    }
  }, [id, user]);

  async function fetchCardInformation() {
    const result = await axios.get(`/user/card?id=${id}`);
    setCardInformation(result.data);
  }

  const fetchData = async () => {
    setDataLoading(true);
    try {
      const result = await axios.get(`/admin/parents/${id}`);
      setData(result.data);
    } finally {
      setDataLoading(false);
    }
  };

  const setStatus = async (status: string) => {
    setLoading(true);
    try {
      const result = await axios.put(`/user`, {
        id: id,
        status: status,
      });
      setData((prevState) => {
        if (!prevState) return prevState;

        return {
          ...prevState,
          parent: {
            ...prevState.parent,
            status,
          },
        };
      });
    } finally {
      setLoading(false);
    }
  };

  function handleExport(payments: PaymentItemParent[] | undefined, fileName = 'payments.xlsx') {
    if (!payments || payments.length === 0) return;

    const headers = ['Session Name', 'Status', 'Amount', 'Session Date', 'Created At', 'Method', 'Transaction ID'];

    const rows: string[][] = payments.map((item) => [
      item.session_name || 'N/A',
      item.status,
      item.status === 'refunded'
        ? `-${Number(item.amount || 0).toFixed(2)}`
        : `$${Number(item.amount || 0).toFixed(2)}`,
      formatPaymentSessionDate(item),
      item.created_at ? moment(item.created_at).format('YYYY-MM-DD') : 'N/A',
      item.method || 'N/A',
      item.transaction_id || 'Nil',
    ]);

    return exportToExcel(headers, rows, fileName);
  }

  if (dataLoading) {
    return (
      <div className="flex flex-col w-full gap-6">
        {back}
        <Skeleton className="h-[200px] w-full bg-secondary rounded-sm" />
        <Skeleton className="h-[300px] w-full bg-secondary rounded-sm" />
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full gap-6">
      {back}

      <Card className="w-full rounded-[12px] bg-[#252525]">
        <CardContent>
          <div className="w-full flex justify-between flex-wrap gap-4">
            <div className="flex flex-col gap-2">
              <span className="flex gap-2 text-xl items-center">
                {joinNames([data?.parent?.first_name, data?.parent?.last_name])}{' '}
                <span>
                  <CardStatus value={data?.parent?.status || ''} icon={true} />
                </span>
              </span>
              <div className="text-[#D1D5DC] text-xs flex flex-col gap-2">
                <span className="inline-flex gap-2 ">
                  <Mail size={14} /> {data?.parent?.email}
                </span>
                <span className="inline-flex gap-2">
                  <Phone size={14} /> {data?.parent?.phone_no}
                </span>
                <span className="inline-flex gap-2">
                  <IoIosPin size={14} /> {data?.parent?.location}
                </span>
                <span className="inline-flex gap-2">
                  <MapPin size={14} /> {data?.parent?.zip_code}
                </span>
                <span className="inline-flex gap-2">
                  <IoCalendarClear size={14} /> Member since{' '}
                  {data?.parent?.created_at &&
                    moment(new Date(data.parent.created_at)).format('YYYY-MM-DD')}
                </span>
              </div>
            </div>
            {data && (
              <div className="flex gap-4 flex-wrap">
                <EditParents
                  parent_id={data?.parent?.id}
                  data={{
                    first_name: data?.parent?.first_name,
                    last_name: data?.parent?.last_name,
                    phone_no: data?.parent?.phone_no,
                    location: data?.parent?.location,
                    zip_code: data?.parent?.zip_code || '',
                  }}
                  onRefresh={fetchData}
                />
                {admin && (
                  <>
                    {/* <Button>
                    <Send /> Send Reminder
                  </Button> */}

                    {data?.parent?.status === 'active' ? (
                      <Button variant="destructive" onClick={() => setStatus('inactive')}>
                        {loading ? (
                          <>
                            <Spinner className="text-black" />
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
                        {loading ? (
                          <>
                            <Spinner className="text-black" />
                            Activating...
                          </>
                        ) : (
                          <>
                            <User className="h-4 w-4" />
                            Activate
                          </>
                        )}
                      </Button>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
          <div className="mt-4 flex w-full justify-between flex-wrap gap-4">
            <HeaderCard
              title={String(data?.stats?.total_linked_children || 0)}
              description="Linked Children"
              icon={
                <div className="rounded-[8px] flex w-10 h-10 items-center justify-center bg-success-bg">
                  <Users className="text-success-text" size={20} />
                </div>
              }
            />

            <HeaderCard
              title={String(data?.stats?.total_spent || 0)}
              description="Total Spent"
              icon={
                <div className="rounded-[8px] flex w-10 h-10 items-center justify-center bg-info-bg">
                  <DollarSign className="text-info-text" size={20} />
                </div>
              }
            />

            <RenderCardDetail data={cardInformation} />

            {/* <HeaderCard
              title={"**** 4242"}
              description="Exp:12/2026"
              icon={
                <div className="rounded-[8px] flex w-10 h-10 items-center justify-center bg-active-bg">
                  <CreditCard className="text-active-text" size={20} />
                </div>
              }
            /> */}

            <HeaderCard
              title={String(data?.stats?.upcoming_sessions || 0)}
              description="Upcoming Session"
              icon={
                <div className="rounded-[8px] flex w-10 h-10 items-center justify-center bg-other-bg">
                  <Calendar className="text-other-text" size={20} />
                </div>
              }
            />
          </div>
        </CardContent>
      </Card>

      <div className="w-full rounded-[12px] bg-[#252525] p-2">
        <Tabs
          value={tab}
          onValueChange={(v) => {
            setTab(v);
          }}
        >
          <ScrollArea className={`overflow-x-auto ${isMobile && 'max-w-[calc(100vw-64px)]'}`}>
            <TabsList className="bg-transparent relative flex gap-2">
              {['linked', 'history', 'payment', 'method'].map((t) => (
                <TabsTrigger
                  key={t}
                  value={t}
                  className="h-9 px-4 text-[12px] leading-tight tracking-tight"
                >
                  {t === 'linked' && (
                    <div className="flex gap-2 items-center py-2">
                      <Users /> Linked Children
                    </div>
                  )}
                  {t === 'history' && (
                    <div className="flex gap-2 items-center py-2">
                      <Calendar /> Booking History
                    </div>
                  )}
                  {t === 'payment' && (
                    <div className="flex gap-2 items-center py-2">
                      <CreditCard /> Payment History
                    </div>
                  )}

                  {t === 'method' && (
                    <div className="flex gap-2 items-center py-2">
                      <Banknote /> Payment Method
                    </div>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
            <Scrollbar orientation="horizontal" />
          </ScrollArea>
          <Separator />

          <TabsContent value="linked">
            <div className="flex gap-4 p-4 justify-end">
              <LinkChildrenDialog parent_id={id as string} onSuccess={fetchData} />
              <CreatePlayer
                parent_id={id as string}
                onRefresh={fetchData}
                placeholder="Add Child"
              />
            </div>

            <div className="flex w-full justify-between gap-4 p-2 flex-wrap">
              {data?.linked_childrens &&
                data?.linked_childrens?.map((item) => (
                  <Card
                    key={item.user_id}
                    className="rounded-[10px] bg-[#1A1A1A] border-[#3A3A3A] flex flex-1"
                  >
                    <CardContent className="space-y-4">
                      <div className="flex gap-4 items-center">
                        <RenderAvatar
                          className="h-12 w-12"
                          fallback={joinNames([item.first_name, item.last_name])}
                          img={item.picture}
                        />
                        <div>
                          <Link
                            href={`/portal/parent/dashboard/${item.user_id}`}
                            className="hover:underline"
                          >
                            <div className="text-lg text-white">
                              {joinNames([item.first_name, item.last_name])}
                            </div>
                          </Link>
                          <div className="text-muted-foreground">
                            Age {getYear(item.birth_date)} - {item.skill_level}
                          </div>
                        </div>
                      </div>
                      <Separator />
                      <div className="flex w-full justify-between">
                        <div className="text-white">Next Session:</div>
                        <div className="text-muted-foreground">
                          {item?.next_session &&
                            `${formatDateOnly(item?.next_session?.date)} ${item.next_session?.start_time}`}
                        </div>
                      </div>

                      <div className="flex w-full justify-between">
                        <div className="text-white">Total Sessions:</div>
                        <div className="text-muted-foreground">{item.total_sessions}</div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </TabsContent>

          <TabsContent value="history" className="space-y-4 p-2">
            {data?.sessions &&
              data?.sessions?.map((item) => (
                <div
                  key={item.session_id}
                  className="bg-[#1A1A1A] w-full rounded-[8px] p-4 space-y-4"
                >
                  <div className="flex w-full justify-between items-start">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[#F3F4F6]">{item.name}</span>
                        <CardStatus value={item.status} />
                        {item.comped && <CardStatus value={'comped'} />}
                      </div>
                      <div className="text-muted-foreground text-xs flex items-center gap-2">
                        <Calendar size={14} />{' '}
                        {formatBookingDates(item)}{' '}
                        <Clock size={14} /> {item.start_time} - {item.end_time}
                      </div>
                    </div>
                    <div className="text-[#F3F4F6]">
                      ${item?.apply_promotion ? item?.promotion_price : item?.price}
                    </div>
                  </div>

                  <Separator className="my-2" />

                  <div className="grid grid-cols-2 text-[#F3F4F6] text-xs max-w-md">
                    <span>Coach: {joinNames([item.coach_first_name, item.coach_last_name])}</span>
                    <div className="inline-flex items-start gap-1 flex-wrap">
                      <Dot size={16} className="mt-[2px]" />
                      <span className="font-medium">Child:</span>
                      <span className="flex flex-wrap gap-1">
                        {item?.players?.map((p, i) => (
                          <span key={i}>
                            {i > 0 && ', '}
                            {joinNames([p.first_name, p.last_name])}
                          </span>
                        ))}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            <div></div>
          </TabsContent>

          <TabsContent value="payment" className="space-y-4 p-2">
            <div className="flex gap-4 flex-wrap justify-between items-center">
              <div />
              <Button
                onClick={() => handleExport(data?.payments)}
                variant={'outline'}
                className="bg-black"
              >
                <Download /> Export
              </Button>
            </div>

            {data?.payments?.map((item, i) => (
              <Card key={item.id} className="bg-black">
                <CardContent className="space-y-2">
                  <div className="flex justify-between gap-2 flex-wrap">
                    <div className="flex gap-4 items-center text-sm">
                      <p>{item?.session_name}</p>
                      <CardStatus value={item?.status} />
                    </div>
                    <p className={`text-md ${item?.status === 'refunded' && 'text-danger-text'}`}>
                      {item?.status === 'refunded'
                        ? `-$${Number(item?.amount || 0).toFixed(0)}`
                        : `$${Number(item?.amount || 0).toFixed(0)}`}
                    </p>
                  </div>

                  <div className="flex gap-2 items-center text-xs text-muted-foreground flex-wrap">
                    <div className="flex gap-2">
                      <Calendar size={14} />
                      <p>
                        {formatPaymentSessionDate(item)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <CreditCard size={14} />
                      <p>{item.method}</p>
                    </div>
                    <div className="flex gap-2">
                      <p>Receipt: </p>
                      <p>{item?.transaction_id || 'Nil'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="method" className="space-y-4 p-2">
            <PaymentMethodSteps
              id={data?.parent?.id}
              data={cardInformation}
              onRefresh={fetchCardInformation}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

const RenderCardDetail = ({ data }: { data: SquareSavedCard | undefined }) => {
  return (
    <Card className="rounded-[10px] bg-[#1A1A1A] border-[#3A3A3A] sm:w-[250px] w-full">
      <CardContent>
        <div className="flex gap-4 items-center">
          <div className="rounded-[8px] flex w-10 h-10 items-center justify-center bg-active-bg">
            <CreditCard className="text-active-text" size={20} />
          </div>
          <div>
            <div className="text-lg text-white">{data?.last4 ? `**** ${data?.last4}` : 'NA'}</div>
            <div className="text-muted-foreground">
              {data?.expMonth ? `Exp:${data?.expMonth}/${data?.expYear}` : 'NA'}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

function formatBookingDates(session: ParentDetailResponse['sessions'][number]) {
  if (session.enrolled_dates?.length) {
    return session.enrolled_dates.map((date) => moment.utc(date).format('YYYY-MM-DD')).join(', ');
  }

  return session.date ? moment.utc(session.date).format('YYYY-MM-DD') : 'Date to be confirmed';
}

function formatPaymentSessionDate(payment: PaymentItemParent) {
  const date = payment.session_date || payment.created_at;
  return date ? moment.utc(date).format('YYYY-MM-DD') : 'N/A';
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
    <Card className="rounded-[10px] bg-[#1A1A1A] border-[#3A3A3A] sm:w-[250px] w-full">
      <CardContent>
        <div className="flex gap-4 items-center">
          {icon}
          <div>
            <div className="text-lg text-white">{title}</div>
            <div className="text-muted-foreground">{description}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
