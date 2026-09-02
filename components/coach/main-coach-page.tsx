"use client";
import CardStatus from "@/components/card-status";
import LineChart from "@/components/charts/line-chart-dots";
import EditCoachProfile from "@/components/coach/EditCoachProfile";
import { WeeklySchedule } from "@/components/coach/weekly-schedule";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  type ChartConfig
} from "@/components/ui/chart";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIsMobile } from "@/hooks/use-mobile";
import axios from "@/lib/axios";
import { getYear, joinNames } from "@/lib/functions";
import { CoachResponse, Event, PaymentDataCoach, SessionDataCoach } from "@/lib/types";
import { Scrollbar } from "@radix-ui/react-scroll-area";
import {
  Award,
  Calendar,
  CircleCheckBigIcon,
  Clock,
  DollarSign,
  Info,
  Mail,
  Phone,
  TrendingUp,
  User,
  UserX,
  Loader2,
} from "lucide-react";
import moment from "moment";
import { ReactNode, useEffect, useState } from "react";
import { IoCalendarClear } from "react-icons/io5";


export default function MainCoachPage({
  id,
  back = null,
  admin = false
}: {
  id: string | undefined;
  back?: ReactNode;
  admin?: boolean;
}) {
  const [data, setData] = useState<CoachResponse>();
  const [tab, setTab] = useState("Details");
  const [loading, setLoading] = useState(true)
  const [statusLoading, setStatusLoading] = useState(false)
  const [sessionTypes, setSessionTypes] = useState([])
  const isMobile = useIsMobile();

  const chartConfig = {
    value: {
      label: "Sessions",
      color: "var(--primary)",
    },
  } satisfies ChartConfig;

  useEffect(() => {
    if (id) {
      fetchData()
      fetchSessionTypes()
    }
  }, [id]);

  const fetchData = async () => {
    setLoading(true)
    try {
      const response = await axios.get(`/admin/coaches/${id}`);

      setData(response.data)
    } finally {
      setLoading(false)
    }
  };

  const fetchSessionTypes = async () => {
    setLoading(true)
    try {
      const response = await axios.get(`/admin/configuration?session_types=true`);
      setSessionTypes(response.data)
    } finally {
      setLoading(false)
    }
  };

  const setStatus = async (status: string) => {
    if (!id) return;

    setStatusLoading(true);
    try {
      await axios.put("/user", { id, status });
      setData((previous) => previous ? { ...previous, status } : previous);
    } finally {
      setStatusLoading(false);
    }
  };




  const COACH_REVENUE_TREND = generateRevenueTrend(data?.session_data);
  const percentageChange = CalculateRevenuePercentage(data)
  const statsData = calculateStats(data?.session_data, data?.payment_data)
  const COACH_REVENUE_SESSION_TYPES = generateRevenueBySessionTypes(data?.session_data, sessionTypes)

  const localData = [
    {
      Icon: <Calendar />,
      title: "Total Sessions",
      description: statsData?.totalSessions,
      type: "success",
      going: "active",
    },
    {
      Icon: <Clock />,
      title: "Completed",
      description: statsData?.totalCompleted,
      type: "active",
      going: "active",
    },
    {
      Icon: <CircleCheckBigIcon />,
      title: "Upcoming",
      description: statsData?.totalUpcoming,
      type: "info",
      going: "info",
    },
    {
      Icon: <Award />,
      title: "Avg Rating",
      description: statsData?.averageRating,
      type: "other",
      going: "active",
    },
    // {
    //   Icon: <DollarSign />,
    //   title: "Total Revenue",
    //   description: statsData?.totalRevenue,
    //   type: "warning",
    //   going: "warning",
    // },
  ];

  const weeklyEvents = data?.session_data
    ? data.session_data.flatMap((session) => {
      const events = [];

      let current = moment(session.date);
      const end = moment(session.end_date);

      while (current.isSameOrBefore(end, "day")) {
        events.push({
          title: session.name,
          date: current.format("YYYY-MM-DD"),
          time: session.start_time,
          end_time: session.end_time,
          status: "Booked",
          end_date : end.format("YYYY-MM-DD")
        });

        current = current.clone().add(1, "day");
      }

      return events;
    })
    : [];

  const blockedEvents: Event[] = [];

  if (data?.profile?.schedule_preference) {
    Object.entries(data.profile.schedule_preference).forEach(([timestamp, status]) => {
      if (status === "blocked") {
        const m = moment(timestamp);
        blockedEvents.push({
          title: "",
          date: m.format("YYYY-MM-DD"),
          time: m.format("HH:mm"),
          end_time: "",
          status: "Blocked",
          end_date : undefined
        });
      }
    });
  }

  const combinedEvents = blockedEvents ? [...weeklyEvents, ...blockedEvents] : weeklyEvents;

  const baseTab = admin ? ["Details", "Availability", "Sessions", "Revenue"] : ["Details", "Availability", "Sessions"]

  if (loading) {
    return (
      <div className="flex flex-col w-full gap-6">
        {back}
        <Skeleton className="h-[200px] w-full bg-secondary rounded-sm" />
        <Skeleton className="h-[300px] w-full bg-secondary rounded-sm" />

      </div>
    )
  }



  return (
    <div className="flex flex-col w-full gap-6">
      {back}

      <Card className="w-full rounded-[12px] bg-[#252525]">
        <CardContent className="space-y-4">
          <div className="w-full flex justify-between flex-wrap gap-4">
            <div className="flex flex-col gap-2">
              <span className="flex gap-2 text-xl items-center">
                {joinNames([data?.first_name, data?.last_name])}{" "}
                <span>
                  <CardStatus
                    value={data?.status}
                    icon={true}
                  />
                </span>
              </span>
              <div className="text-[#D1D5DC] text-xs flex flex-col gap-2">
                <span className="inline-flex gap-2 ">
                  <Mail size={14} /> {data?.email}
                </span>
                <span className="inline-flex gap-2">
                  <Phone size={14} /> {data?.phone_no}
                </span>
                <span className="inline-flex gap-2">
                  <IoCalendarClear size={14} /> Joined {data?.created_at && moment(new Date(data?.created_at)).format("YYYY-MM-DD")} • {getYear(data?.profile?.career_start || "")} years
                  experience
                </span>
              </div>
            </div>
            <div className="flex gap-4 flex-wrap">
              {admin && (data?.status === "active" ? (
                <Button variant="destructive" onClick={() => setStatus("inactive")} disabled={statusLoading}>
                  {statusLoading ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Disabling...</>
                  ) : (
                    <><UserX className="h-4 w-4" /> Disable</>
                  )}
                </Button>
              ) : (
                <Button onClick={() => setStatus("active")} disabled={statusLoading}>
                  {statusLoading ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Activating...</>
                  ) : (
                    <><User className="h-4 w-4" /> Activate</>
                  )}
                </Button>
              ))}
              <EditCoachProfile id={id} onRefresh={async () => await fetchData()} data={data} />
            </div>
          </div>

          <div className="flex justify-between gap-4 flex-wrap">
            {localData.map((item, index) => (
              <HeaderCard
                key={index}
                title={String(item.description)}
                description={item.title}
                icon={
                  <div
                    className={`rounded-[8px] flex w-10 h-10 items-center justify-center bg-${item.type}-bg text-${item.type}-text border-${item.type}-text/32`}
                  >
                    {item.Icon}
                  </div>
                }
              />
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="w-full rounded-[12px] bg-[#252525] py-2">
        <Tabs
          value={tab}
          onValueChange={(v) => {
            setTab(v);
          }}
        >
          <ScrollArea
            className={`overflow-x-auto ${isMobile && "max-w-[calc(100vw-64px)]"}`}
          >
            <TabsList className="bg-transparent relative flex gap-2 px-2">
              {baseTab.map((t) => (
                <TabsTrigger
                  key={t}
                  value={t}
                  className="h-9 px-4 text-[12px] leading-tight tracking-tight"
                >
                  {t === "Details" && (
                    <div className="flex gap-2 items-center py-2">
                      <User /> Details
                    </div>
                  )}
                  {t === "Availability" && (
                    <div className="flex gap-2 items-center py-2">
                      <Calendar /> Availability
                    </div>
                  )}
                  {t === "Sessions" && (
                    <div className="flex gap-2 items-center py-2">
                      <Clock /> Sessions
                    </div>
                  )}
                  {t === "Revenue" && admin && (
                    <div className="flex gap-2 items-center py-2">
                      <DollarSign /> Revenue
                    </div>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
            <Scrollbar orientation="horizontal" />
          </ScrollArea>
          <Separator />

          <TabsContent value="Details" className="space-y-4 p-4">
            <h1 className="text-lg text-[#F3F4F6]">Biography</h1>
            <p className="text-sm text-muted-foreground">
              {data?.profile?.bio}
            </p>

            <h1 className="text-lg text-[#F3F4F6]">Specialties</h1>
            <div className="flex gap-1">
              {data?.profile?.specialities && data?.profile?.specialities?.map((s) => {
                return (
                  <div
                    key={s}
                    className="py-2 px-3 rounded-lg bg-[#1A1A1A] border border-border text-xs leading-none text-[#D1D5DC]"
                  >
                    {s}
                  </div>
                );
              })}
            </div>

            <h1 className="text-lg text-[#F3F4F6]">Certifications</h1>
            <div className="space-y-2">
              {
                data?.profile?.certifications && data?.profile?.certifications?.map((certification) => (
                  <div key={certification} className="bg-[#1A1A1A] border border-border rounded-[10px] px-4 py-3 flex items-center gap-2">
                    <Award className="text-primary" size={16} />
                    <h1 className="text-[#E5E7EB] text-sm">{certification}</h1>
                  </div>
                ))
              }
            </div>

            {/* <h1 className="text-lg text-[#F3F4F6]">Scheduling Preferences</h1>
            <div className="bg-[#1A1A1A] border border-border text-ghost-text rounded-[10px] px-4 py-3 flex items-center gap-2">
              <Clock size={16} />
              <h1 className="text-[#E5E7EB]">
                {data?.preferedSchedule}
              </h1>
            </div> */}
          </TabsContent>

          <TabsContent value="Availability" className="space-y-4 p-4">
            {/* <div className="bg-[#1A1A1A] border border-border rounded-[10px] px-4 py-2 flex justify-between gap-4 flex-wrap">
              <div className="flex gap-2 items-center text-sm">
                <GoDotFill className="text-active-text" />
                <h1 className="text-[#D1D5DC]">Synced with booking system</h1>
                <p className="text-ghost-text">Last sync: 5:03:15 PM</p>
              </div>
              <Button className="flex gap-2">
                <RefreshCcw /> Sync Now{" "}
              </Button>
            </div> */}

            <WeeklySchedule events={combinedEvents} id={id as string} preference={data?.profile?.schedule_preference} />

            <Card className="bg-info-bg p-3 border-info-text/30">
              <CardContent className="p-0">
                <div className="flex gap-4 items-start">
                  <Info size={14} className="text-info-text" />
                  <div className="font-normal space-y-1">
                    <Label className="text-info-text text-[14px] leading-none">
                      Availability Management
                    </Label>
                    <p className="text-[#D1D5DC] text-xs">
                      Click on available slots to block them. Click on block
                      slots to make them available again. Booked slots cannot be
                      modified here
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="Sessions" className="space-y-2 p-4">
            <h1 className="text-lg text-[#F3F4F6]">All Sessions</h1>
            <div className="space-y-4 pt-2">
              {data?.session_data && data?.session_data?.map((session, i) => {
                return (
                  <Card key={i} className="p-0 overflow-hidden">
                    <CardContent className="bg-[#1A1A1A] p-4 space-y-2">
                      <div className="flex justify-between">
                        <div className="flex gap-2">
                          <h1 className="text-md text-[#F3F4F6]">
                            {session.name}
                          </h1>
                          <div>
                            <CardStatus value={session?.status} />
                          </div>
                        </div>
                        <h1>${session?.apply_promotion ? session.promotion_price : session.price}</h1>
                      </div>
                      <div className="flex gap-4 text-xs text-muted-foreground">
                        <div className="flex gap-2  items-center">
                          <Calendar size={12} /> <p>{moment(new Date(session.date)).format("YYYY-MM-DD")}</p>
                        </div>
                        <div className="flex gap-2  items-center">
                          <Clock size={12} /> <p>{session.start_time} {session.end_time}</p>
                        </div>
                        {/* <div className="flex gap-2 items-center">
                          <Users size={12} /> <p>{session.player}</p>
                        </div> */}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </TabsContent>

          {admin && <TabsContent value="Revenue" className="space-y-4 p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2 p-4 flex-1 bg-[#1A1A1A] rounded-[10px] border border-border">
                <div className="flex gap-2">
                  <DollarSign className="h-4 w-4 text-primary" />
                  <p className="text-sm text-ghost-text">Total Revenue</p>
                </div>
                <h1 className="text-xl">${data?.total_revenue}</h1>
                <p className="text-sm text-ghost-text">All time earnings</p>
              </div>
              <div className="space-y-2 p-4 flex-1 bg-[#1A1A1A] rounded-[10px] border border-border">
                <div className="flex gap-2">
                  <TrendingUp className="h-4 w-4 text-active-text" />
                  <p className="text-sm text-ghost-text">This Month</p>
                </div>
                <h1 className="text-xl">${data?.this_month_revenue}</h1>
                <p className="text-xs text-active-text">{percentageChange}% from last month</p>
              </div>
              <div className="space-y-2 p-4 flex-1 bg-[#1A1A1A] rounded-[10px] border border-border">
                <div className="flex gap-2">
                  <Calendar className="h-4 w-4 text-info-text" />
                  <p className="text-sm text-ghost-text">Avg per Session</p>
                </div>
                <h1 className="text-xl">${Number(data?.average_price_per_session || 0).toFixed(0)}</h1>
                <p className="text-sm text-ghost-text">Based on {data?.session_data?.length} sessions</p>
              </div>
            </div>

            <Card className="bg-[#1A1A1A]">
              <CardContent className="space-y-2">
                <p className="text-sm">6-Month Revenue Trend</p>

                <div className="grid grid-cols-1">
                  <div className="h-70 ">
                    <LineChart
                      data={COACH_REVENUE_TREND || []}
                      config={chartConfig}
                      xAxisKey="month"
                      tickFormatter={(value) => value.slice(0, 3)}
                      lines={[
                        {
                          key: "value",
                        },
                      ]}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-2">
              <h1 className="text-md text-[#F3F4F6]">
                Revenue by Session Type
              </h1>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                {COACH_REVENUE_SESSION_TYPES.map((item) => (
                  <div
                    key={item.type}
                    className="bg-[#1A1A1A] border border-border rounded-[10px] p-4 space-y-2"
                  >
                    <div className="flex justify-between">
                      <p className="text-sm text-muted-foreground">
                        {item.type}
                      </p>
                      <h1>${item.revenue.toLocaleString()}</h1>
                    </div>

                    <Progress
                      value={item.percentage}
                      valueClassName={item.color}
                      className="bg-[#3A3A3A]"
                    />
                  </div>
                ))}

              </div>
            </div>
          </TabsContent>
          }
        </Tabs>
      </div>
    </div>
  );
}



const HeaderCard = ({
  title = "",
  description = "",
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


function calculateStats(sessions: SessionDataCoach[] | undefined, payments: PaymentDataCoach[] | undefined) {
  let totalSessions = 0
  let totalCompleted = 0
  let totalUpcoming = 0
  let averageRating = 0
  let totalRevenue = 0
  if (sessions) {

    totalSessions = sessions.length
    totalCompleted = sessions.filter((item) => item.status === 'completed').length
    totalUpcoming = sessions.filter((item) => item.status === 'upcoming').length

    const completedRatings = sessions
      .filter(s => s.status === 'completed' && s.session_rating > 0)

    averageRating =
      completedRatings.length > 0
        ? completedRatings.reduce((sum, s) => sum + Number(s.session_rating), 0) /
        completedRatings.length
        : 0


  }
  if (payments) {
    const filteredPayments = payments.filter((item) => item.status === 'paid')
    totalRevenue = filteredPayments.reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0
    );
  }
  return (
    {
      totalSessions, totalCompleted, totalRevenue, totalUpcoming, averageRating
    }
  )

}

function CalculateRevenuePercentage(localData: CoachResponse | undefined) {
  if (!localData) return 0
  const thisMonth = Number(localData.this_month_revenue);
  const lastMonth = Number(localData.last_month_revenue);

  let percentageChange = 0;

  if (lastMonth > 0) {
    percentageChange = ((thisMonth - lastMonth) / lastMonth) * 100;
  }
  return percentageChange
}

function generateRevenueTrend(sessionData: SessionDataCoach[] | undefined) {
  if (!sessionData) return
  const now = moment();


  const months = Array.from({ length: 6 }, (_, i) => {
    const m = moment(now).subtract(5 - i, "months");
    return {
      key: m.format("YYYY-MM"),
      label: m.format("MMM"),
      value: 0,
    };
  });


  sessionData.forEach((session) => {
    const payments = session.payment_detail || [];

    payments.forEach((payment: any) => {
      if (payment.status !== "paid") return;

      const paymentMonth = moment(payment.created_at).format("YYYY-MM");

      const monthObj = months.find((m) => m.key === paymentMonth);
      if (monthObj) {
        monthObj.value += Number(payment.amount);
      }
    });
  });

  return months.map((m) => ({
    month: m.label,
    value: m.value,
  }));
}


function generateRevenueBySessionTypes(
  sessionData: SessionDataCoach[] | undefined,
  sessionTypes: string[]
) {
  if (!sessionData) return [];


  const revenueMap: Record<string, number> = {};
  sessionTypes.forEach((type) => {
    revenueMap[type] = 0;
  });


  sessionData.forEach((session) => {
    const payments = session.payment_detail || [];

    payments.forEach((payment: any) => {
      if (payment.status !== "paid") return;

      const type = session.session_type;
      if (type && revenueMap[type] !== undefined) {
        revenueMap[type] += Number(payment.amount);
      }
    });
  });


  const totalRevenue = Object.values(revenueMap).reduce(
    (sum, val) => sum + val,
    0
  );


  const colors = [
    "bg-success-text",
    "bg-info-text",
    "bg-active-text",
    "bg-warning-text",
    "bg-destructive",
    "bg-primary",
    "bg-secondary",
    "bg-purple-500",
    "bg-pink-500",
    "bg-indigo-500",
  ];

  return sessionTypes.map((type, index) => {
    const revenue = revenueMap[type];

    return {
      type,
      revenue,
      color: colors[index % colors.length],
      percentage: totalRevenue
        ? Math.round((revenue / totalRevenue) * 100)
        : 0,
    };
  });
}

