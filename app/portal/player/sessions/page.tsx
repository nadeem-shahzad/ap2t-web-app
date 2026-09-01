"use client";
import SessionCalendar from "@/components/calendar/session-calendar";
import PrivateSessionInquiryDialog from "@/components/players/privateSessionInquiry";
import ReserveComponent from "@/components/players/reserveDialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import axios from "@/lib/axios";
import { joinNames } from "@/lib/functions";
import { ReserveProps, SessionProps } from "@/lib/types";
import { Calendar, List } from "lucide-react";
import moment, { Moment } from "moment";
import { ReactNode, useEffect, useState } from "react";

export default function Page() {

  const [sessions, setSessions] = useState<SessionProps[]>([]);
  const [reserves, setReserves] = useState<SessionProps[]>([])
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState<Moment>(moment())
  const [tab, setTab] = useState<"daily" | "monthly">("daily")
  const { user } = useAuth()

  useEffect(() => {
    if (user?.id) {
      fetchDataMonthly();
      fetchDataDaily()
    }
  }, [user, currentMonth]);

  async function fetchData() {
    if (!user?.id) return
    await Promise.all([fetchDataDaily(), fetchDataMonthly()])
  }

  const fetchDataMonthly = async () => {
    setLoading(true)
    const month = currentMonth
      ? currentMonth.format("YYYY-MM")
      : null;
    try {
      const result = await axios.get(`/player/${user?.id}/sessions`,
        {
          params: { month }
        }
      );
      if (result.data) {
        const mappedSessions = result.data.map((s: any) => {

          let finalPrice = s.price
          let promotion = false
          if (
            s.apply_promotion &&
            s.promotion_price &&
            s.promotion_start &&
            s.promotion_end &&
            moment(s.promotion_start).isBefore(moment()) &&
            moment(s.promotion_end).isAfter(moment())
          ) {
            finalPrice = s.promotion_price;
            promotion = true
          }

          return ({
            id: s.id,
            sessionName: s.name,
            type: s.session_type,
            date: moment(new Date(s.date)).format("YYYY-MM-DD"),
            time: `${s.start_time} - ${s.end_time}`,
            coachName: joinNames([s.coach_first_name, s.coach_last_name]),
            coachPicture : s.coach_picture || "",
            price: finalPrice,
            original_price: s.price,
            promotion: promotion,
            children: s?.children || [],
            variants: s?.variants || [],
            status: s?.status || 'upcoming',
            enrolled: s?.enrolled,
            is_daily_payment: s?.is_daily_payment ?? false,
            enrolled_dates: s?.enrolled_dates ?? [],
            end_date: s?.end_date ? moment(new Date(s.end_date)).format("YYYY-MM-DD") : null
          })
        });
        setSessions(mappedSessions);
      }
    } catch (error) {
      console.error("Error fetching sessions", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDataDaily = async () => {

    setLoading(true);

    try {
      const result = await axios.get(`/player/${user?.id}/sessions`);
       if (result.data) {
        const mappedSessions = result.data.map((s: any) => {

          let finalPrice = s.price
          let promotion = false
          if (
            s.apply_promotion &&
            s.promotion_price &&
            s.promotion_start &&
            s.promotion_end &&
            moment(s.promotion_start).isBefore(moment()) &&
            moment(s.promotion_end).isAfter(moment())
          ) {
            finalPrice = s.promotion_price;
            promotion = true
          }

          return ({ 
            id: s.id,
            sessionName: s.name,
            type: s.session_type,
            date: moment(new Date(s.date)).format("YYYY-MM-DD"),
            time: `${s.start_time}`,
            coachName: joinNames([s.coach_first_name, s.coach_last_name]),
            coachPicture : s.coach_picture || "",
            price: finalPrice,
            original_price: s.price,
            promotion: promotion,
            children: s?.children || [],
            variants: s?.variants || [],
            status: s?.status || 'upcoming',
            enrolled: s?.enrolled,
            is_daily_payment: s?.is_daily_payment ?? false,
            enrolled_dates: s?.enrolled_dates ?? [],
            end_date: s?.end_date ? moment(new Date(s.end_date)).format("YYYY-MM-DD") : null,
            location : s?.location || ""
          })
        });
        setReserves(mappedSessions);
      }
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="flex flex-col w-full gap-4">
      <Header session_length={sessions.length}>
        <div className="flex flex-wrap gap-4">
          <div className="flex gap-4 items-center flex-wrap">
            <div className="!bg-[#252525] border border-border rounded-[10px] flex flex-wrap items-center p-[2px]">
              <Button
                onClick={() => setTab("daily")}
                variant={tab === "daily" ? "default" : "ghost"}
                className="h-7 "
              >
                {" "}
                <List />
                Daily
              </Button>
              <Button
                onClick={() => setTab("monthly")}
                variant={tab === "monthly" ? "default" : "ghost"}
                className="h-7"
              >
                <Calendar /> Monthly
              </Button>
            </div>
            <PrivateSessionInquiryDialog email={user?.email} firstName={user?.first_name} lastName={user?.last_name} />
          </div>
        </div>
      </Header>

      {tab === "daily" && <ReserveComponent sessions={reserves} player_id={user?.id} onSuccess={fetchData} loading={loading} />}

      {tab === 'monthly' &&
        <SessionCalendar currentMonth={currentMonth} setCurrentMonth={setCurrentMonth} player_id={user?.id} sessions={sessions} onSuccess={fetchData} loading={loading} />}
    </div>
  );
}

const Header = ({ children, session_length }: { children: ReactNode, session_length: number | undefined }) => {
  return (
    <div className="flex w-full gap-4 justify-between flex-wrap items-center">
      <div className="space-y-2">
        <p className="text-xl">Sessions Enrollment</p>
        <span className="text-xs text-muted-foreground flex items-center">
          <span>{session_length} of {session_length} sessions </span>
          <span className="text-warning-text inline-flex">
            {" "}
            {/* <Dot size={16} /> 1 pending payments */}
          </span>
        </span>
      </div>

      {children}
    </div>
  );
};
