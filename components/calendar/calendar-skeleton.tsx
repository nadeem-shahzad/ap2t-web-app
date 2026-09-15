import { Skeleton } from '../ui/skeleton';

const CalendarSkeleton = () => {
  return (
    <div className="grid grid-cols-7 gap-2">
      {Array.from({ length: 35 }).map((_, index) => (
        <div
          key={index}
          className="
        min-h-[96px] md:min-h-[120px]
        rounded-lg
        bg-[#1A1A1A]
        p-2
      "
        >
          {/* Date */}
          <Skeleton className="mb-2 h-3 w-6 bg-[#2A2A2A]" />

          {/* Events */}
          <div className="space-y-1">
            <Skeleton className="h-4 w-full rounded bg-[#2A2A2A]" />
            <Skeleton className="h-4 w-4/5 rounded bg-[#2A2A2A]" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default CalendarSkeleton;
