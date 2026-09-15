'use client';

import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { DialogTrigger } from '@radix-ui/react-dialog';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import moment, { Moment } from 'moment';
import { Dialog } from '../ui/dialog';
import { ScrollArea, ScrollBar } from '../ui/scroll-area';
import { useSidebar } from '../ui/sidebar';
import ShowCalenderSessionDialog from './show-calender-session-dialog';

type SessionProps = {
  id: number;
  sessionName: string;
  type: string;
  date: string;
  end_date: string;
  time: string;
  coachName: string;
  price: string | number;
  status: string;
};

type Props = {
  sessions: SessionProps[];
  currentMonth: Moment;
  setCurrentMonth: (val: Moment) => void;
};

export default function SessionSheetCalendar({ sessions, currentMonth, setCurrentMonth }: Props) {
  const { open } = useSidebar();
  const isMobile = useIsMobile();

  const startOfWeek = currentMonth.clone().startOf('isoWeek');

  const days: Moment[] = [];
  for (let i = 0; i < 7; i++) {
    days.push(startOfWeek.clone().add(i, 'day'));
  }

  const coaches = [...new Set(sessions.map((s) => s.coachName))];

  const timeSlots: { label: string; start_hour: number; end_hour: number }[] = [];
  for (let i = 8; i <= 20; i++) {
    timeSlots.push({
      label: `${moment({ hour: i }).format('hA')}-${moment({ hour: i + 1 }).format('hA')}`,
      start_hour: i,
      end_hour: i + 1,
    });
  }
  const parseHour = (timeStr: string): number => {
    return moment(timeStr.trim(), ['hh:mm A', 'h:mm A', 'HH:mm']).hour();
  };

  const getSession = (day: Moment, coach: string, startHour: number, endHour: number) => {
    return sessions.find((s) => {
      const sessionStartDay = moment(s.date).startOf('day');
      const sessionEndDay = moment(s.end_date).startOf('day');
      if (!day.isSameOrAfter(sessionStartDay) || !day.isSameOrBefore(sessionEndDay)) return false;
      if (s.coachName !== coach) return false;

      const [start, end] = s.time.split(' - ');
      const sessionStart = parseHour(start);
      const sessionEnd = parseHour(end);

      return startHour >= sessionStart && endHour <= sessionEnd;
    });
  };

  const nextWeek = () => setCurrentMonth(currentMonth.clone().add(1, 'week'));
  const prevWeek = () => setCurrentMonth(currentMonth.clone().subtract(1, 'week'));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between bg-[#1A1A1A] border border-border rounded-xl px-4 py-3 shadow-sm">
        <Button variant="outline" size="icon" onClick={prevWeek}>
          <ChevronLeft size={18} />
        </Button>

        <div className="font-semibold text-base md:text-lg tracking-tight">
          {days[0].format('MMM D')} — {days[6].format('MMM D')}
        </div>

        <Button variant="outline" size="icon" onClick={nextWeek}>
          <ChevronRight size={18} />
        </Button>
      </div>

      {days.map((day) => (
        <div
          key={day.format()}
          className="rounded-xl border border-border bg-[#1A1A1A] shadow-sm overflow-hidden"
        >
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <div className="font-medium text-sm md:text-base">{day.format('dddd')}</div>
            <div className="text-xs text-muted-foreground">{day.format('MMM D')}</div>
          </div>

          <ScrollArea
            className={`overflow-x-auto ${open ? 'w-[calc(100dvw-306px)]' : 'w-[calc(100dvw)]'} ${isMobile && 'w-[calc(100vw-44px)]'}`}
          >
            <table className="w-full text-sm border-separate border-spacing-0">
              <thead className="sticky top-0 z-20 bg-[#111]">
                <tr>
                  <th className="sticky left-0 z-30 bg-[#111] p-3 text-left text-xs font-medium text-muted-foreground w-24 border-r border-border">
                    Time
                  </th>

                  {coaches.map((coach) => (
                    <th
                      key={coach}
                      className="p-3 text-left text-xs font-medium text-muted-foreground min-w-[200px]"
                    >
                      {coach}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {timeSlots.map((slot, i) => (
                  <tr key={slot.start_hour} className={i % 2 === 0 ? 'bg-[#181818]' : ''}>
                    <td className="sticky left-0 z-10 bg-[#111] p-3 text-xs font-medium text-muted-foreground whitespace-nowrap border-r border-border">
                      {slot.label}
                    </td>

                    {coaches.map((coach) => {
                      const session = getSession(day, coach, slot.start_hour, slot.end_hour);

                      if (!session) {
                        return (
                          <td key={coach} className="p-2">
                            <div className="h-9 rounded-md border border-dashed border-border opacity-40" />
                          </td>
                        );
                      }

                      return (
                        <td key={coach} className="p-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <div className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 transition-all text-white text-xs px-2 py-1.5 rounded-md cursor-pointer shadow-sm hover:shadow-md h-full flex items-center">
                                {session.sessionName}
                              </div>
                            </DialogTrigger>

                            <ShowCalenderSessionDialog
                              session={session.sessionName}
                              coach={coach}
                              time={session.time}
                              start={session.date}
                              end={session.end_date}
                            />
                          </Dialog>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      ))}
    </div>
  );
}
