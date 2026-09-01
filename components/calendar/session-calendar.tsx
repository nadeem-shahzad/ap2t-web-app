"use client";

import { Moment } from "moment";
import CustomCalendar from "./custom-calendar";
import "./calenderstyle.css";
import { SessionProps } from "@/lib/types";

type SessionCalendarProps = { 
  sessions?: SessionProps[], 
  player_id?: string | null | undefined, 
  onSuccess?: () => Promise<void>, 
  parent_id?: string | null | undefined | number, 
  loading?: boolean, 
  currentMonth: Moment, 
  setCurrentMonth: (item: any) => void 
}

export default function SessionCalendar({ currentMonth, setCurrentMonth, sessions = [], player_id = null, onSuccess, parent_id = null, loading }: SessionCalendarProps) {
 const events = sessions.flatMap(session => {
  const rawStart = session.rawDate || session.date
  const rawEnd = session.end_date

  let startDate: string | null = null
  let endDate: string | null = null

  try {
    const start = new Date(rawStart)
    if (!isNaN(start.getTime())) {
      startDate = start.toISOString().split("T")[0]
    }

    if (rawEnd) {
      const end = new Date(rawEnd)
      if (!isNaN(end.getTime())) {
        endDate = end.toISOString().split("T")[0]
      }
    }
  } catch (e) {
    console.error("Date parse error", e)
  }

  if (!startDate) return []

  let type = "info"
  const status = session.status?.toLowerCase() || ""
  if (["completed", "paid", "active"].includes(status)) type = "active"
  else if (status === "cancelled") type = "danger"
  else if (status === "pending") type = "warning"
  else if (status === "upcoming") type = "info"
  else if (status === 'ongoing') type = "other"

  const dates = endDate
    ? expandDateRange(startDate, endDate)
    : [startDate]

  return dates.map(date => ({
    id: `${session.id}-${date}`,
    originalId: session.id,
    status,
    title: session.sessionName,
    sessionType: session.type,
    date,
    time: session.time?.split(" - ")[0],
    end_time : session?.time?.split(" - ")[1],
    type: type as any,
    children: session.children,
    enrolled: session.is_daily_payment
      ? session.enrolled_dates?.includes(date) ?? false
      : session.enrolled,
    isMultiDay: Boolean(endDate),
    end_date : endDate,
    start_date : startDate,
    price : session?.price,
    promotion:session?.promotion ?? false,
    original_price:session?.original_price ?? 0,
    variants: session?.variants ?? [],
    is_daily_payment: session.is_daily_payment,
    enrolled_dates: session.enrolled_dates,
    enrolled_dates_by_player: session.enrolled_dates_by_player,
  }))
})

  return (
    <div className="bg-[#252525] p-4 rounded-[10px]">
      <CustomCalendar currentMonth={currentMonth} setCurrentMonth={setCurrentMonth} loading={loading} parent_id={parent_id} events={events} player_id={player_id} onSuccess={async () => {
        await onSuccess?.()
      }} />
    </div>
  );
}

const expandDateRange = (start: string, end: string) => {
  const dates: string[] = []
  let current = new Date(start)
  const last = new Date(end)

  while (current <= last) {
    dates.push(current.toISOString().split("T")[0])
    current.setDate(current.getDate() + 1)
  }

  return dates
}
