'use client';

import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Clock } from 'lucide-react';
import * as React from 'react';

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function to12Hour(hour: number) {
  return hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
}

function to24Hour(hour: number, period: 'AM' | 'PM') {
  if (period === 'AM') return hour === 12 ? 0 : hour;
  return hour === 12 ? 12 : hour + 12;
}

export function TimePicker({
  value,
  onChange,
  className,
}: {
  value?: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);

  const date = value ? new Date(`1970-01-01T${value}:00`) : new Date();

  const hour24 = date.getHours();
  const minute = date.getMinutes();

  const hour = to12Hour(hour24);
  const period: 'AM' | 'PM' = hour24 >= 12 ? 'PM' : 'AM';

  const updateTime = (h = hour, m = minute, p = period) => {
    const h24 = to24Hour(h, p);
    onChange(`${pad(h24)}:${pad(m)}`);
  };

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
          {value ? value : <p className="text-[14px] font-normal">Pick a time</p>}
          <Clock className="ml-auto h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-fit p-2 bg-[#1A1A1A] border-[#3A3A3A]" align="start">
        <div className="flex gap-2">
          {/* Hours */}
          <ScrollArea className="h-32 w-14 border-r border-[#2A2A2A]">
            <div className="py-1">
              {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                <Button
                  size={'sm'}
                  className="h-7"
                  key={h}
                  onClick={() => updateTime(h)}
                  variant={h === hour ? 'default' : 'ghost'}
                >
                  {pad(h)}
                </Button>
              ))}
            </div>
          </ScrollArea>

          {/* Minutes */}
          <ScrollArea className="h-32 w-14 border-r border-[#2A2A2A]">
            <div className="py-1">
              {Array.from({ length: 60 }, (_, i) => i).map((m) => (
                <Button
                  size={'sm'}
                  className="h-7"
                  key={m}
                  onClick={() => updateTime(hour, m)}
                  variant={m === minute ? 'default' : 'ghost'}
                >
                  {pad(m)}
                </Button>
              ))}
            </div>
          </ScrollArea>

          {/* AM / PM */}
          <div className="flex flex-col gap-1 px-1">
            {(['AM', 'PM'] as const).map((p) => (
              <button
                key={p}
                onClick={() => updateTime(hour, minute, p)}
                className={cn(
                  'px-2 py-1 text-xs rounded hover:opacity-70',
                  p === period && 'bg-primary text-black'
                )}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
