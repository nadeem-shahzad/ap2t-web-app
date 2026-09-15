import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { useState } from 'react';
import { Button } from './ui/button';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';

const AppCalendar = ({
  date,
  onChange,
  required = false,
  className,
}: {
  date: Date | undefined | null;
  onChange: (item: any) => void;
  required?: boolean;
  className?: string;
}) => {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  return (
    <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={'outline'}
          className={cn(
            'w-full h-9 rounded-md dark:bg-[#1A1A1A]',
            !date && 'text-muted-foreground',
            className
          )}
        >
          {date ? format(date, 'PPP') : <p className="text-[14px] font-normal">Pick a date</p>}
          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 bg-black rounded" align="start">
        <Calendar
          required={required}
          className="z-20"
          mode="single"
          selected={date || undefined}
          onSelect={(e: any) => {
            onChange(e);
            setIsCalendarOpen(false);
          }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
};

export default AppCalendar;
