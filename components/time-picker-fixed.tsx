'use client';

import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Clock } from 'lucide-react';
import * as React from 'react';

function format12Hour(hour: number) {
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const h = hour % 12 || 12;
  return `${pad(h)}:00 ${suffix}`;
}

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function parseHour12(time?: string) {
  if (!time) return null;
  const [hhmm, suffix] = time.split(' ');
  let hour = parseInt(hhmm.split(':')[0], 10);
  if (suffix === 'PM' && hour !== 12) hour += 12;
  if (suffix === 'AM' && hour === 12) hour = 0;
  return hour;
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
  const selectedHour = parseHour12(value);

  const updateTime = (hour: number) => {
    onChange(format12Hour(hour));
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
        <ScrollArea className="max-h-32 w-20">
          <div className=" max-h-32 py-1 flex flex-col gap-1">
            {Array.from({ length: 14 }, (_, i) => i + 8).map((h) => (
              <Button
                key={h}
                size="sm"
                className="h-7"
                variant={h === selectedHour ? 'default' : 'ghost'}
                onClick={() => updateTime(h)}
              >
                {format12Hour(h)}
              </Button>
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
