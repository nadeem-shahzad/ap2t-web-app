"use client";
import BackButton from "@/components/back-button";
import CardStatus from "@/components/card-status";
import { AddParticipantDialog } from "@/components/sessions/add-participant-dialog";
import { EditSessionDialog } from "@/components/sessions/edit-session-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/auth-context";
import { useIsMobile } from "@/hooks/use-mobile";
import axios from "@/lib/axios";
import { joinNames } from "@/lib/functions";
import { SessionDataType } from "@/lib/types";
import { Scrollbar } from "@radix-ui/react-scroll-area";
import {
  Calendar,
  CheckCircle,
  CircleAlert,
  CircleCheckBig,
  CircleX,
  Clock,
  DollarSign,
  Loader2,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Plus,
  User,
  Users
} from "lucide-react";
import moment from "moment";
import { useEffect, useState } from "react";
import { DiscountDialog } from "../payment/apply-discount";

type noteType = {
  id: string;
  name: string;
  content: string;
  created_at: string;
  important: boolean;
}

export default function SessionMainPage({ id, back, back_title, admin = false, promotion = false }: { id: number, back: string, back_title: string, admin?: boolean, promotion?: boolean }) {
  const [data, setData] = useState<SessionDataType>();
  const [rawSessionData, setRawSessionData] = useState<any>(null);
  const [allSessions, setAllSessions] = useState<any[]>([]);
  const [tab, setTab] = useState("Participants");
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(false);
  const { user, isAdmin } = useAuth()
  const [participants, setParticipants] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [selectedSessionDate, setSelectedSessionDate] = useState("");
  const [dailyDataLoading, setDailyDataLoading] = useState(false);
  const [notes, setNotes] = useState([])
  const [paymentStats, setPaymentStats] = useState({
    total_revenue: 0,
    paid_amount: 0,
    pending_amount: 0,
  });

  useEffect(() => {
    if (id) {
      fetchData();
      fetchAllSessions();
      fetchParticipants();
      fetchNotes()
      fetchPayments();
    }
  }, [id]);

  const allowed = isAdmin ? true : user?.id === data?.coach_id ? true : false

  const fetchData = async () => {
    try {
      setLoading(true);

      const result = await axios.get(`/admin/sessions/${id}`);
      if (result.data) {
        const d = result.data;
        setRawSessionData(d);
        if (d.is_daily_payment) {
          setSelectedSessionDate(moment(new Date(d.date)).format("YYYY-MM-DD"));
        }
        setData({
          id: d.id,
          sessionName: d.name,
          date: moment(new Date(d.date)).format("YYYY-MM-DD"),
          end_date: moment(new Date(d.end_date)).format("YYYY-MM-DD"),
          time: `${d.start_time} - ${d.end_time}`,
          coachName: joinNames([d.coach_first_name, d.coach_last_name]),
          scehedule_preferences: d.coach?.coach_schedule_preference,
          status: d.status,
          price: d.price,
          promotion_price: d.promotion_price,
          max_players: d.max_players,
          location: d.location,
          comped: d.comped,
          description: d.description,
          coach_id: d.coach_id
        } as any);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchAllSessions = async () => {
    try {
      const result = await axios.get("/admin/sessions");
      if (result.data) {
        const mapped = result.data.map((s: any) => ({
          id: s.id,
          sessionName: s.name,
          type: s.session_type,
          date: s.date,
          time: `${s.start_time} - ${s.end_time}`,
          status: s.status || "upcoming",
          end_date: s.end_date,
          original: s,
        }));
        setAllSessions(mapped);
      }
    } catch {
      // non-critical — availability check will silently skip
    }
  };

  const fetchParticipants = async () => {
    try {
      const response = await axios.get(`/admin/sessions/${id}/participants`, {
        params: rawSessionData?.is_daily_payment && selectedSessionDate ? { session_date: selectedSessionDate } : undefined,
      });
      setParticipants(response.data);
    } catch (error) {
      console.error("Error fetching participants", error);
    }
  };


  const fetchPayments = async () => {
    try {
      const response = await axios.get(`/admin/sessions/${id}/payments`, {
        params: rawSessionData?.is_daily_payment && selectedSessionDate ? { session_date: selectedSessionDate } : undefined,
      });
      setPayments(response.data);
    } catch (error) {
      console.error("Error fetching payments", error);
    }
  };

  const fetchNotes = async () => {
    try {
      const result = await axios.get(`/admin/sessions/${id}/note`)

      const notesMapped = result.data?.map((note: any) => (
        {
          name: joinNames([note.writer_first_name, note.writer_last_name]),
          content: note.note || "no content",
          created_at: moment(new Date(note.created_at)).format("YYYY-MM-DD"),
          id: note.id,
          important: note.important || false
        }
      ))
      setNotes(notesMapped || [])
    } catch (error) {
      console.error("Error fetching notes", error)
      setNotes([])
    }
  }

  useEffect(() => {
    const res = calculatePaymentStats(participants, payments)
    setPaymentStats({ paid_amount: res.totalPaid, pending_amount: res.totalPending, total_revenue: res.totalAmount })
  }, [participants, payments, data])

  useEffect(() => {
    if (rawSessionData?.is_daily_payment && selectedSessionDate) {
      setDailyDataLoading(true);
      Promise.all([fetchParticipants(), fetchPayments()])
        .finally(() => setDailyDataLoading(false));
    }
  }, [selectedSessionDate, rawSessionData?.is_daily_payment]);

  function calculatePaymentStats(
    participants: any[],
    payments: any[],
  ) {
    let totalAmount = 0;
    let totalPaid = 0;
    let totalPending = 0;

    const paymentMap = new Map();
    payments.forEach(p => paymentMap.set(p.user_id, p));

    participants.forEach(participant => {
      const payment = paymentMap.get(participant.player_id);
      if (payment) {
        if (payment.status === "paid") {
          totalPaid += Number(payment?.amount || 0);
        } else if (payment.status === 'pending') {
          totalPending += Number(payment?.amount || 0);
        }
        totalAmount += Number(payment?.amount || 0);
      }
    });

    return {
      totalAmount,
      totalPaid,
      totalPending
    };
  }



  const stats = [
    {
      h: `${participants.length}/${data?.max_players || '-'}`,
      p: rawSessionData?.is_daily_payment ? `Booked for ${selectedSessionDate}` : "Overall Enrolled",
      icon: <Users />,
      type: "info",
    },
    // {
    //   h: `$${paymentStats.total_revenue.toFixed(2)}`,
    //   p: "Expected Revenue",
    //   icon: <DollarSign />,
    //   type: "success",
    // },
    {
      h: `$${paymentStats.paid_amount.toFixed(2)}`,
      p: "Paid",
      icon: <CheckCircle />,
      type: "active",
    },
    {
      h: `$${paymentStats.pending_amount.toFixed(2)}`,
      p: "Pending",
      icon: <CircleAlert />,
      type: "warning",
    },
  ];
  return (
    <div className="flex flex-col w-full gap-6">
      <BackButton title={back_title} route={back} />

      {rawSessionData?.is_daily_payment && (
        <div className="flex max-w-xs flex-col gap-2">
          <Label className="flex items-center gap-2">Session Date {dailyDataLoading && <Spinner className="h-4 w-4" />}</Label>
          <Input
            type="date"
            value={selectedSessionDate}
            min={moment(new Date(rawSessionData.date)).format("YYYY-MM-DD")}
            max={moment(new Date(rawSessionData.end_date || rawSessionData.date)).format("YYYY-MM-DD")}
            onChange={(event) => setSelectedSessionDate(event.target.value)}
          />
        </div>
      )}

      <Card className="w-full rounded-2xl bg-[#252525]">
        <CardContent className="p-0 space-y-2">
          <div className="px-6 space-y-4">
            <div className="flex justify-between items-center flex-wrap gap-4">
              <div className="flex gap-2 items-center">
                <span className="flex gap-2 text-xl items-center leading-none">
                  {data?.sessionName}
                </span>
                <CardStatus value={data?.status} icon={true} />
                {data?.comped && <CardStatus value={"comped"} icon={true} />}
              </div>
              <div className="flex gap-4">

                {data && data?.status === "upcoming" && allowed &&
                  <StartSessionNow id={id} onRefresh={async () => {
                    await fetchData()
                  }} />
                }

                {allowed && data && <EditSessionDialog
                  coach_id={admin ? null : user?.id}
                  sessionId={id}
                  sessionData={rawSessionData}
                  onSuccess={fetchData}
                  promotion={promotion}
                />}
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              {data?.description}
            </p>

            <div className="flex gap-4 flex-col sm:flex-row">
              <div className="flex-1 flex gap-3 items-center">
                <Calendar className="h-4 w-4 text-ghost-text" />
                <div className=" ">
                  <p className="text-xs text-ghost-text">Date</p>
                  <h1 className="text-[#E5E7EB] text-sm">{data?.date} - {data?.end_date}</h1>
                </div>
              </div>

              <div className="flex-1 flex gap-3 items-center">
                <Clock className="h-4 w-4 text-ghost-text" />
                <div className=" ">
                  <p className="text-xs text-ghost-text">Time</p>
                  <h1 className="text-sm text-[#E5E7EB]">{data?.time}</h1>
                </div>
              </div>

              <div className="flex-1 flex gap-3 items-center">
                <User className="h-4 w-4 text-ghost-text" />
                <div className=" ">
                  <p className="text-xs text-ghost-text">Coach</p>
                  <h1 className="text-[#E5E7EB] text-sm">{data?.coachName}</h1>
                </div>
              </div>

              <div className="flex-1 flex gap-3 items-center">
                <MapPin className="h-4 w-4 text-ghost-text" />
                <div className=" ">
                  <p className="text-xs text-ghost-text">Location</p>
                  <h1 className="text-[#E5E7EB] text-sm">
                    {data?.location}
                  </h1>
                </div>
              </div>
            </div>

            <div className="flex justify-between gap-4 flex-wrap">
              {stats.map((item, index) => (
                <Card
                  key={index}
                  className="rounded-[10px] bg-[#1A1A1A] border-[#3A3A3A] flex-1 p-0"
                >
                  <CardContent className="space-y-4 p-4">
                    <div className="flex gap-4 items-center">
                      <div className={`text-${item.type}-text`}>
                        {item.icon}
                      </div>
                      <div className="flex flex-col gap-1">
                        <h1 className="font-semibold text-xl">{item.h}</h1>
                        <p className="text-[#B0B0B0] text-xs">{item.p}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
          <Separator className="my-4" />

          <div className="flex gap-2 flex-wrap px-6">

            {data && data.status !== "completed" && data.status !== "cancelled" && allowed && (
              <Markbuttons
                id={id}
                onRefresh={async () => {
                  await fetchData()
                  await fetchParticipants()
                }}
              />
            )}

            {data && !data?.comped && allowed &&
              <MarkComped id={id} onRefresh={fetchData} />
            }
          </div>
        </CardContent>
      </Card>

      <div className="w-full rounded-2xl bg-[#252525] py-2">
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
              {["Participants", "Payments", "Notes"].map((t) => (
                <TabsTrigger
                  key={t}
                  value={t}
                  className="h-9 px-4 text-[12px] leading-tight tracking-tight"
                >
                  {t === "Participants" && (
                    <div className="flex gap-2 items-center py-2">
                      <User /> {rawSessionData?.is_daily_payment ? `Booked (${participants.length})` : `Overall Enrolled (${participants.length})`}
                    </div>
                  )}
                  {t === "Payments" && (
                    <div className="flex gap-2 items-center py-2">
                      <DollarSign /> Payments {`(${payments.length})`}
                    </div>
                  )}
                  {t === "Notes" && (
                    <div className="flex gap-2 items-center py-2">
                      <MessageSquare /> Notes {`(${notes.length})`}
                    </div>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
            <Scrollbar orientation="horizontal" />
          </ScrollArea>
          <Separator />

          <TabsContent value="Participants" className="space-y-4 p-4">
            {data?.status === "upcoming" && allowed && <AddParticipantDialog sessionId={Number(id)} variants={rawSessionData?.variants ?? []} session_date={rawSessionData?.is_daily_payment ? selectedSessionDate : undefined} enrolled_player_ids={rawSessionData?.is_daily_payment ? participants.map((participant) => participant.player_id) : []} onSuccess={async () => {
              await fetchParticipants()
              await fetchPayments()
            }} />}
            {participants.map((participent: any, i) => (
              <Card key={i} className="bg-[#1A1A1A] border border-border">
                <CardContent className="space-y-2">
                  <div className="flex gap-2 items-center">
                    <h1>{participent.first_name} {participent.last_name}</h1>
                    {data?.status === 'upcoming' && < CardStatus
                      value={participent?.status}
                    />
                    }
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="flex gap-2 items-center">
                      <User className="w-4 h-4 text-ghost-text" />{" "}
                      <div className="flex text-sm text-ghost-text">
                        <p>Position: {participent.position}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 items-center">
                      <Mail className="w-4 h-4 text-ghost-text" />{" "}
                      <p className="flex text-sm text-ghost-text">
                        {participent.email}
                      </p>
                    </div>
                    <div className="flex gap-2 items-center">
                      <Phone className="w-4 h-4 text-ghost-text" />{" "}
                      <p className="flex text-sm text-ghost-text">
                        {participent.phone_no}
                      </p>
                    </div>

                  </div>

                  <Separator />
                  {participent?.status === "pending" && data?.status === 'ongoing' && <AttendanceMarking player_id={participent.player_id} session_id={Number(id)} onRefresh={async () => {
                    await fetchParticipants()
                  }} />
                  }
                </CardContent>
              </Card>
            ))}
          </TabsContent>
          <TabsContent value="Payments" className="space-y-4 p-4">
            {payments.length === 0 ? (
              <Card className="bg-[#1A1A1A] border border-border">
                <CardContent className="p-8 text-center">
                  <p className="text-ghost-text">No payments found for this session</p>
                </CardContent>
              </Card>
            ) : (
              payments.map((payment, i) => (
                <Card key={i} className="bg-[#1A1A1A] border border-border">
                  <CardContent className="space-y-2">
                    <div className="flex gap-2 items-center">
                      <h1>{payment.player_first_name} {payment.player_last_name}</h1>
                      <CardStatus
                        value={payment.status}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="flex text-sm text-ghost-text gap-1">
                        <p className="text-muted-foreground">Payment:</p>{" "}
                        <p className="text-[#D1D5DC]"> ${payment.amount}</p>
                      </div>

                      <div className="flex text-sm text-ghost-text gap-1">
                        <p className="text-muted-foreground">Method:</p>{" "}
                        <p className="text-[#D1D5DC]">{payment.method}</p>
                      </div>
                      <div className="flex text-sm text-ghost-text gap-1">
                        <p className="text-muted-foreground">Date:</p>{" "}
                        <p className="text-[#D1D5DC]">{payment.paid_at ? new Date(payment.paid_at).toLocaleDateString() : 'Pending'}</p>
                      </div>
                      {rawSessionData?.is_daily_payment && (
                        <div className="flex text-sm text-ghost-text gap-1">
                          <p className="text-muted-foreground">Session Date:</p>{" "}
                          <p className="text-[#D1D5DC]">{payment.session_date ? moment(new Date(payment.session_date)).format("YYYY-MM-DD") : "-"}</p>
                        </div>
                      )}
                      <div className="flex text-sm text-ghost-text gap-1">
                        <p className="text-muted-foreground">Transaction ID:</p>{" "}
                        <p className="text-[#D1D5DC]">{payment.transaction_id}</p>
                      </div>
                    </div>

                    {!['paid', 'comped'].includes(payment?.status) && isAdmin &&

                      <DiscountDialog onRefresh={fetchPayments} original={data?.price || "0"} data={payment} />
                    }
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="Notes" className="space-y-4 p-4">
            <div className="flex justify-between items-center">
              <h1 className="text-lg ">Internal Notes</h1>
              {allowed && <AddNoteDialog session_id={Number(id)} onRefresh={async () => {
                await fetchNotes()
              }} />}
            </div>
            {notes.map((note: noteType) => {
              return (
                <Card
                  key={note.id}
                  className={
                    note.important
                      ? "bg-[#F0B1000D] border border-[#F0B1004D]"
                      : " bg-[#1A1A1A] border border-border "
                  }
                >
                  <CardContent className="">
                    <div className="flex flex-col gap-2">
                      <div className="flex gap-2">
                        <h1 className="text-sm text-[#E5E7EB]">{note.name}</h1>
                        {note.important && (
                          <Badge className="border-[#F0B1004D] bg-[#F0B10033] text-[#FDC700] rounded-sm">
                            Important
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {note.created_at}
                      </p>
                      <div className="note-content break-all overflow-wrap-anywhere w-full">
                        {note.content}
                      </div>

                    </div>

                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

const Markbuttons = ({ id, onRefresh }: { id: number, onRefresh: () => Promise<void> }) => {
  const [loadingStatus, setLoadingStatus] = useState("")
  const markList = ["completed", "cancelled"]

  const designType = {
    completed: {
      design: "flex gap-2 dark:bg-active-bg text-active-text dark:border dark:border-active-text/32",
      icon: <CircleCheckBig />
    },
    cancelled: {
      design: "flex gap-2 dark:bg-danger-bg text-danger-text dark:border dark:border-danger-text/32",
      icon: <CircleX />
    },
  }

  async function handleUpdateStatus(val: string) {
    if (!id) return
    setLoadingStatus(val)
    try {
      await axios.put(`/admin/sessions/${id}`, {
        status: val,
        id
      });
      await onRefresh()
    } finally {
      setLoadingStatus("")
    }
  }
  return (
    <div className="flex gap-2 flex-wrap">
      {markList.map((item) => (
        <Button
          key={item}
          variant={"outline"}
          className={designType[item as keyof typeof designType].design}
          onClick={() => {
            handleUpdateStatus(item)
          }}
        >
          {loadingStatus === item ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Marking...
            </>
          ) : (
            <>
              {designType[item as keyof typeof designType].icon}
              Mark as {item?.charAt(0)?.toUpperCase() + item?.slice(1)}
            </>
          )}
        </Button>
      ))}
    </div>
  )
}

const MarkComped = ({ id, onRefresh }: { id: number, onRefresh: () => Promise<void> }) => {
  const [loadingStatus, setLoadingStatus] = useState(false)
  async function handleUpdateStatus() {
    if (!id) return
    setLoadingStatus(true)
    try {
      await axios.put(`/admin/sessions/${id}`, {
        comped: true,
        id
      });
      await onRefresh()
    } finally {
      setLoadingStatus(false)
    }
  }
  return (
    <div className="flex gap-2 flex-wrap">
      <Button

        variant={"outline"}
        className={"flex gap-2 dark:bg-warning-bg text-warning-text dark:border dark:border-warning-text/32"}
        onClick={() => {
          handleUpdateStatus()
        }}
      >
        {loadingStatus ? (
          <>
            <Spinner />
            Marking...
          </>
        ) : (
          <>
            <CircleCheckBig />
            Mark as Comped
          </>
        )}
      </Button>
    </div>
  )
}

const StartSessionNow = ({ id, onRefresh }: { id: number, onRefresh: () => Promise<void> }) => {
  const [loadingStatus, setLoadingStatus] = useState(false)

  async function handleUpdateStatus() {
    if (!id) return
    setLoadingStatus(true)
    try {
      await axios.put(`/admin/sessions/${id}`, {
        status: "ongoing",
        date: new Date().toISOString(),
        id
      });
      await onRefresh()
    } finally {
      setLoadingStatus(false)
    }
  }
  return (
    <div className="flex gap-2 flex-wrap">
      <Button
        onClick={() => {
          handleUpdateStatus()
        }}
      >
        {loadingStatus ? (
          <>
            <Spinner className="text-black" />
            starting...
          </>
        ) : (
          <>
            <CircleCheckBig />
            Start Session Now
          </>
        )}
      </Button>
    </div>
  )
}


const AttendanceMarking = ({ player_id, onRefresh, session_id }: { player_id: number, session_id: number, onRefresh: () => Promise<void> }) => {

  const [loading, setLoaidng] = useState(false)

  async function markAttendance(status: string) {
    if (!player_id || !session_id) return

    setLoaidng(true)
    try {

      await axios.post(`/admin/sessions/${session_id}/attendance`, { status, session_id, user_id: player_id })
      await onRefresh()

    } finally {
      setLoaidng(false)
    }

  }

  return (
    loading ? <Spinner /> :
      <div className="flex gap-4 flex-wrap">

        <Button className="dark:bg-active-bg text-active-text border dark:border-active-text/32" onClick={() => {
          markAttendance("present")
        }}>
          <CheckCircle />
          Mark Present
        </Button>
        <Button className="dark:bg-danger-bg text-danger-text border dark:border-danger-text/32"
          onClick={() => {
            markAttendance("absent")
          }}>
          <CircleX />
          Mark Absent
        </Button>
      </div>
  )
}

const AddNoteDialog = ({ session_id, onRefresh }: { session_id: number, onRefresh: () => Promise<void> }) => {
  const { user, } = useAuth()
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState({
    note_type: "",
    note: "",
    important: false,
  })

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!user?.id) return
    setLoading(true)
    try {
      await axios.post(`/admin/sessions/${session_id}/note`, {
        ...data,
        user_id: user.id,
        session_id
      })
      await onRefresh()
      setOpen(false)
    } finally {
      setLoading(false)

    }
  }

  return (
    <>
      <Button onClick={() => setOpen(!open)}>
        <Plus />
        Add Note
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-[#252525] rounded-[10px] p-0">
          <DialogHeader className="p-4 border-b border-border">
            <DialogTitle className="text-lg font-semibold text-[#F3F4F6]">
              Add Internal Note
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="max-w-[500px]">
            <ScrollArea className=" py-1 space-y-4 px-2 h-[50vh]">
              <div className="space-y-4 p-4">
                <div className="flex gap-2 items-center ">
                  <Checkbox
                    className="data-[state=checked]:border-white data-[state=checked]:bg-primary data-[state=checked]:text-black dark:data-[state=checked]:border-white dark:data-[state=checked]:bg-primary"
                    checked={data.important}
                    onCheckedChange={(checked) => {
                      setData({ ...data, important: checked === true })
                    }}
                  />
                  <Label className="text-[#99A1AF] text-sm">Important</Label>
                </div>
                <div className="space-y-2 w-full">
                  <Label className="text-[#99A1AF] text-sm">Type</Label>

                  <Select
                    value={data.note_type}
                    onValueChange={(value) => setData({ ...data, note_type: value })}
                  >
                    <SelectTrigger className="w-full !bg-[#1A1A1A] border-border rounded-[10px]">
                      <SelectValue placeholder="note type..." />
                    </SelectTrigger>
                    <SelectContent className="!bg-[#1A1A1A]">
                      <SelectGroup>
                        <SelectLabel>Select a type</SelectLabel>
                        <SelectItem value="Reminder">Reminder</SelectItem>
                        <SelectItem value="Task">Task</SelectItem>
                        <SelectItem value="Idea">Idea</SelectItem>
                        <SelectItem value="Sugestion">Sugestion</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[#99A1AF] text-sm">Note</Label>
                  <Textarea
                    placeholder="Enter your note here..."
                    className="min-h-36 text-wrap"
                    value={data.note}
                    onChange={(e) => setData({ ...data, note: e.target.value })}
                  ></Textarea>
                </div>
              </div>

              <Scrollbar />
            </ScrollArea>
            <div className="border-t border-border flex items-center justify-end p-4">
              <div className="flex gap-4">
                <DialogClose className="text-[13px] font-medium leading-none h-8 px-4 bg-black text-white border-border rounded-md hover:opacity-70 cursor-pointer flex flex-1 items-center justify-center">
                  Cancel
                </DialogClose>
                <Button type="submit" disabled={loading}> {loading && <Spinner className="text-black" />}  Add Note</Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};
