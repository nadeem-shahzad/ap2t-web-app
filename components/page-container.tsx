'use client';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ReactNode } from 'react';

export default function PageContainer({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <ScrollArea className="h-[calc(100dvh-70px)] w-full">
      <div className="w-full flex justify-center">
        <div className="flex flex-col w-full p-6 gap-6">
          <div className={`flex flex-1${className}`}>{children}</div>
        </div>
      </div>
    </ScrollArea>
  );
}
