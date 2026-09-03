"use client";

import React, { useEffect, useState } from "react";
import moment from "moment";
import { Button } from "../ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useIsMobile } from "@/hooks/use-mobile";
import axios from "@/lib/axios";
import { WeeklyScheduleProps } from "@/lib/types";

const timeSlots = [
  "08:00 AM",
  "09:00 AM",
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "01:00 PM",
  "02:00 PM",
  "03:00 PM",
  "04:00 PM",
  "05:00 PM",
  "06:00 PM",
  "07:00 PM",
  "08:00 PM",
  "09:00 PM"
];

export const WeeklySchedule: React.FC<WeeklyScheduleProps> = ({ events, id, preference }) => {

  const [currentWeekStart, setCurrentWeekStart] = useState(moment().startOf("week").add(1, "days"));
  const isMobile = useIsMobile();
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    dateTime: string;
    isBlocked: boolean;
  } | null>(null);


  const [localPreference, setLocalPreference] = useState<Record<string, string>>(preference || {});

  const weekDates = Array.from({ length: 7 }).map((_, i) =>
    moment(currentWeekStart).add(i, "days")
  );

  const prevWeek = () => setCurrentWeekStart(moment(currentWeekStart).subtract(7, "days"));
  const nextWeek = () => setCurrentWeekStart(moment(currentWeekStart).add(7, "days"));

  const getEventForCell = (date: moment.Moment, time: string) => {
    const cellTime = moment(date)
      .set({
        hour: parseInt(time.split(":")[0]) + (time.includes("PM") && parseInt(time.split(":")[0]) !== 12 ? 12 : 0),
        minute: parseInt(time.split(":")[1] || "0"),
        second: 0,
        millisecond: 0,
      });


    const key = `${date.format("YYYY-MM-DD")}_${time}`;
    if (localPreference[key] === "blocked") {
      return { title: "", date: date.format("YYYY-MM-DD"), time, status: "Blocked" };
    }

    const event = events.find(e => {
      const eventStart = moment(e.date).startOf("day");
      const eventEnd = moment(e.end_date).startOf("day");
      const cellDate = moment(date).startOf("day");
  //       console.log({
  //   raw_date: e.date,
  //   raw_end_date: e.end_date,
  //   eventStart: eventStart.format("YYYY-MM-DD"),
  //   eventEnd: eventEnd.format("YYYY-MM-DD"),
  //   cellDate: cellDate.format("YYYY-MM-DD"),
  // });
      if (cellDate.isAfter(eventEnd) || cellDate.isBefore(eventStart)) return false;

      const startTime = moment(date).set({
        hour: parseInt(e.time.split(":")[0]) + (e.time.includes("PM") && parseInt(e.time.split(":")[0]) !== 12 ? 12 : 0),
        minute: parseInt(e.time.split(":")[1] || "0"),
        second: 0,
        millisecond: 0,
      });

      const endTime = e.end_time
        ? moment(date).set({
          hour: parseInt(e.end_time.split(":")[0]) + (e.end_time.includes("PM") && parseInt(e.end_time.split(":")[0]) !== 12 ? 12 : 0),
          minute: parseInt(e.end_time.split(":")[1] || "0"),
          second: 0,
          millisecond: 0,
        })
        : moment(startTime).add(1, "hour");

      return (
  cellTime.isSameOrAfter(startTime) &&
  cellTime.isSameOrBefore(endTime) &&
  cellDate.isSameOrAfter(eventStart) &&
  cellDate.isSameOrBefore(eventEnd)
);
    });

    if (event) return event;
    return { title: "", date: date.format("YYYY-MM-DD"), time, status: "Available" };
  };

  const handleSlotClick = (e: React.MouseEvent, date: moment.Moment, time: string, event: any) => {
    e.stopPropagation();

    const dateTime = `${date.format("YYYY-MM-DD")}_${time}`;

    const isBlocked = localPreference[dateTime] === "blocked";
    if (event && event.status === "Booked") return
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      dateTime,
      isBlocked,
    });
  };


  const handleToggleBlock = async () => {
    if (!contextMenu) return;

    const updated = { ...localPreference };
    if (contextMenu.isBlocked) {
      delete updated[contextMenu.dateTime];
    } else {
      updated[contextMenu.dateTime] = "blocked";
    }

    setLocalPreference(updated);
    setContextMenu(null);

    if (!id) return;


    await axios.put(`/admin/coaches/${id}`, {
      id,
      schedule_preference: updated,
    });
  };

  React.useEffect(() => {
    const close = () => setContextMenu(null);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, []);

  const statusColor = (status: string) => {
    switch (status) {
      case "Available": return "bg-[#00C95033] text-active-text";
      case "Booked": return "bg-[#2B7FFF4D] text-info-text";
      case "Blocked": return "bg-[#FB2C3633] text-danger-text";
      default: return "bg-gray-200";
    }
  };

  return (
    <div className="flex flex-1 flex-col p-4 gap-4">
      {/* Week navigation */}
      <div className="flex flex-wrap gap-4 justify-between">
        <h1 className="text-lg text-[#F3F4F6]">Weekly Schedule</h1>
        <div className="flex items-center gap-4">
          <Button onClick={prevWeek} size="icon" variant="outline"><ChevronLeft /></Button>
          <div className="w-40 flex items-center justify-center">
            <div className="text-sm">Week of {currentWeekStart.format("MMM D, YYYY")}</div>
          </div>
          <Button onClick={nextWeek} size="icon" variant="outline"><ChevronRight /></Button>
        </div>
      </div>

      {/* Legend */}
      <div className="bg-[#1A1A1A] border border-border rounded-[10px] px-4 py-2 flex gap-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-active-bg border border-active-text/32 rounded-[3px]"></div> Available
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-info-bg border border-info-text/32 rounded-[3px]"></div> Booked
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-danger-bg border border-danger-text/32 rounded-[3px]"></div> Blocked
        </div>
      </div>

      {/* Schedule table */}
      <div className="flex flex-1 flex-col space-y-4">
        <div className={`relative flex flex-1 flex-col ${isMobile && "max-w-[calc(100vw-112px)]"}`}>
          <div className="flex rounded-md border md:overflow-auto">
            <ScrollArea className="overflow-x-auto flex flex-1">
              <Table className="relative w-[800px] table-fixed sm:w-full">
                <TableHeader>
                  <TableRow className="bg-[#1A1A1A] text-white">
                    <TableHead className="p-2 border font-normal">Time</TableHead>
                    {weekDates.map(date => (
                      <TableHead key={date.format("YYYY-MM-DD")} className="p-2 border border-[#3A3A3A] font-normal">
                        <div>{date.format("ddd")}</div>
                        <div className="text-xs">{date.format("MMM D")}</div>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody className="bg-white dark:bg-[#252525]">
                  {timeSlots.map(time => (
                    <TableRow key={time}>
                      <TableCell className="p-2 border py-4 border-[#3A3A3A] font-normal">{time}</TableCell>
                      {weekDates.map(date => {
                        const event = getEventForCell(date, time);
                        return (
                          <TableCell
                            key={date.format("YYYY-MM-DD") + time}
                            onClick={(e) => handleSlotClick(e, date, time, event)}
                            className={`p-2 border-2 border-border ${statusColor(event?.status || "Available")} overflow-hidden whitespace-nowrap truncate`}
                          >
                            {event?.title || ""}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>
        </div>
      </div>

      {/* Context menu */}
      {contextMenu && (
        <div
          style={{ top: contextMenu.y, left: contextMenu.x }}
          className="fixed z-50 bg-[#1A1A1A] border border-border rounded-md shadow-md"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={handleToggleBlock}
            className="px-4 py-2 text-sm hover:bg-danger-bg hover:text-danger-text w-full text-left"
          >
            {contextMenu.isBlocked ? "Remove Block" : "Block Slot"}
          </button>
        </div>
      )}
    </div>
  );
};
