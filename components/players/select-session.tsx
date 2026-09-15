'use client';

import { ChevronsUpDown } from 'lucide-react';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export default function SelectSession({
  value,
  onReturn,
  player_id,
  sessions,
}: {
  value: string | number;
  onReturn: (value: number) => void;
  player_id: string | number | undefined;
  sessions: { value: string; label: string }[] | [];
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {value ? sessions.find((item) => item.value === value)?.label : 'Select session...'}
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="py-2 px-0 bg-[#1A1A1A]">
        <Command className="bg-transparent">
          <CommandInput placeholder="Search sessions..." />
          <CommandList>
            <CommandEmpty>No session found.</CommandEmpty>
            <CommandGroup className="space-y-2">
              {sessions.map((item) => (
                <CommandItem
                  className="text-black dark:text-white dark:bg-secondary mt-1 text-xs"
                  key={item.value}
                  value={item.label}
                  onSelect={() => {
                    onReturn(Number(item.value));
                    setOpen(false);
                  }}
                >
                  {item.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
