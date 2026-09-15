import { useIsMobile } from '@/hooks/use-mobile';
import { EVENT_STYLES } from '@/lib/constants';
import { CalendarEvent, CustomCalendarProps } from '@/lib/types';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import moment, { Moment } from 'moment';
import { useMemo, useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { ScrollArea, ScrollBar } from '../ui/scroll-area';
import CalendarSkeleton from './calendar-skeleton';
import EventDetail from './event-details';

export default function CustomCalendar({
  currentMonth,
  setCurrentMonth,
  loading,
  events = [],
  player_id = null,
  onSuccess,
  parent_id = null,
}: CustomCalendarProps) {
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent[]>([]);
  const startOfMonth = currentMonth.clone().startOf('month');
  const endOfMonth = currentMonth.clone().endOf('month');
  const calendarStart = startOfMonth.clone().startOf('week');
  const calendarEnd = endOfMonth.clone().endOf('week');
  const isMobile = useIsMobile();

  const days = useMemo(() => {
    const date = calendarStart.clone();
    const days: moment.Moment[] = [];

    while (date.isBefore(calendarEnd, 'day')) {
      days.push(date.clone());
      date.add(1, 'day');
    }
    return days;
  }, [currentMonth]);

  const getEventsForDay = (day: moment.Moment): CalendarEvent[] => {
    return events.filter((event) => event.date === day.format('YYYY-MM-DD'));
  };

  const handleDayClick = (day: moment.Moment) => {
    const events = getEventsForDay(day);
    setSelectedEvent(events);
  };

  return (
    <div className="flex flex-1 flex-col space-y-4">
      <div className="relative flex flex-1 flex-col max-w-full">
        <ScrollArea className={`flex flex-1 ${isMobile && 'max-w-[calc(100vw-64px)]'}`}>
          <div className="min-w-[700px] md:min-w-full max-w-6xl mx-auto space-y-4 px-2">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <h2 className="text-lg md:text-xl font-semibold">
                {currentMonth.format('MMMM YYYY')}
              </h2>

              <div className="flex gap-2">
                <Button
                  disabled={loading}
                  size="icon"
                  variant="outline"
                  onClick={() => setCurrentMonth((m: Moment) => m.clone().subtract(1, 'month'))}
                >
                  <ChevronLeft />
                </Button>

                <Button
                  disabled={loading}
                  className="h-9"
                  variant="outline"
                  onClick={() => setCurrentMonth(moment())}
                >
                  Today
                </Button>

                <Button
                  disabled={loading}
                  size="icon"
                  variant="outline"
                  onClick={() => setCurrentMonth((m: Moment) => m.clone().add(1, 'month'))}
                >
                  <ChevronRight />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-7 text-xs md:text-sm text-center text-muted-foreground gap-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="py-2">
                  {day}
                </div>
              ))}
            </div>

            {loading ? (
              <CalendarSkeleton />
            ) : (
              <div className="grid grid-cols-7 gap-2">
                {days.map((day) => {
                  const isCurrentMonth = day.month() === currentMonth.month();

                  const isToday = day.isSame(moment(), 'day');
                  const events = getEventsForDay(day);
                  const visibleEvents = events.slice(0, 2);
                  const overflowCount = events.length - visibleEvents.length;

                  const handleClick = () => {
                    handleDayClick(day);
                  };

                  return (
                    <Card
                      key={day.toString()}
                      onClick={handleClick}
                      className={`
                    p-0 min-h-[96px] md:min-h-[120px]
                    bg-[#1A1A1A]
                    cursor-pointer
                    rounded-lg
                    transition-colors
                    hover:bg-[#222]
                    ${!isCurrentMonth && '-z-10'}
                    ${isToday && 'ring-1 ring-primary'}
                  `}
                    >
                      <CardContent className="p-2 space-y-1">
                        <div
                          className={`
                        text-xs font-medium
                        ${isToday ? 'text-primary' : 'text-white'}
                      `}
                        >
                          {day.date()}
                        </div>

                        <div className="space-y-1">
                          {visibleEvents.map((event) => {
                            const styles = EVENT_STYLES[event.type];

                            return (
                              <div
                                key={event.id}
                                className={`text-[10px] px-2 py-1 rounded border truncate
                              ${styles.bg}
                              ${styles.text}
                              ${styles.border}
                            `}
                              >
                                <div className="leading-tight">
                                  <div className="opacity-80">{event.time}</div>
                                  <div className="font-medium truncate">{event.title}</div>
                                </div>
                              </div>
                            );
                          })}

                          {overflowCount > 0 && (
                            <div className="text-[10px] text-muted-foreground">
                              +{overflowCount} more…
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>

      <EventDetail
        onSuccess={onSuccess}
        parent_id={parent_id}
        player_id={player_id}
        events={selectedEvent}
        open={selectedEvent.length > 0}
        onOpenChange={() => setSelectedEvent([])}
      />
    </div>
  );
}
