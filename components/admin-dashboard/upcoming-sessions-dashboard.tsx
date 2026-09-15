import { useIsMobile } from '@/hooks/use-mobile';
import { SessionRecord } from '@/lib/types';
import { Calendar } from 'lucide-react';
import Link from 'next/link';
import PageTable from '../app-table';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader } from '../ui/card';
import { useSidebar } from '../ui/sidebar';
import { DASHBOARD_SESSIONS_COLUMNS } from './columns';
export function UpcomingSessions({ sessions }: { sessions: SessionRecord[] }) {
  const { open } = useSidebar();
  const isMobile = useIsMobile();

  return (
    <Card className="bg-[#252525] flex flex-col h-full p-0 border border-[#3A3A3A] overflow-hidden">
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 pb-0 gap-4 sm:gap-0">
        <div className="flex flex-col gap-1">
          <h1 className="font-medium text-lg">Upcoming Sessions</h1>
          <p className="text-sm text-muted-foreground">Today's scheduled training sessions</p>
        </div>

        {/* Date */}
        <div className="flex items-center gap-2 text-[#99A1AF]">
          <Calendar className="h-4 w-4" />
          <span className="text-sm">
            {new Date().toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </span>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <PageTable
          headerClassName={'rounded-none border-none'}
          columns={DASHBOARD_SESSIONS_COLUMNS}
          data={sessions}
          onRowClick={() => {}}
          scrollAreaWidth={`${open ? 'w-[calc(100dvw-306px)]' : 'w-[calc(100dvw-98px)]'} ${isMobile && 'w-[calc(100vw-44px)]'}`}
        />
        <div className="flex justify-end py-4 px-2 bg-[#1A1A1A]">
          <Link href="/portal/admin/sessions">
            <Button className="bg-[#252525] border border-[#3A3A3A] text-[#D1D5DC]">
              View All Sessions
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
