'use client';

import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Clock } from 'lucide-react';
import * as React from 'react';

function format12Hour(hour: number, minute: number) {
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const h = hour % 12 || 12;
  return `${pad(h)}:${pad(minute)} ${suffix}`;
}

function pad(n: number) {
  return String(n).padStart(2, '0');
}

export function TimePickerFixed({
  value,
  onChange,
  className,
}: {
  value?: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const timeOptions = Array.from({ length: 29 }, (_, index) => {
    const totalMinutes = 8 * 60 + index * 30;
    return format12Hour(Math.floor(totalMinutes / 60), totalMinutes % 60);
  });

  const updateTime = (time: string) => {
    onChange(time);
    setOpen(false);
  };

  function formatDisplay(time: string) {
    return time;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'w-full h-9 rounded-md dark:bg-[#1A1A1A]',
            !value && 'text-muted-foreground',
            className
          )}
        >
          {value ? formatDisplay(value) : <p className="text-[14px] font-normal">Pick a time</p>}
          <Clock className="ml-auto h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-fit p-2 bg-[#1A1A1A] border-[#3A3A3A]" align="start">
        <ScrollArea className="h-64 w-[19rem] overflow-hidden">
          <div className="grid grid-cols-3 gap-1.5 py-1 pr-3">
            {timeOptions.map((time) => (
              <Button
                key={time}
                size="sm"
                className="h-8 w-full px-1 text-xs"
                variant={time === value ? 'default' : 'ghost'}
                onClick={() => updateTime(time)}
              >
                {time}
              </Button>
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
