'use client';
import PageTable from '@/components/app-table';
import InputWithIcon from '@/components/input-with-icon';
import { CreateSessionDialog } from '@/components/sessions/create-session-dialog';
import { SESSION_COLUMNS } from '@/components/sessions/session-column';
import SessionSheetCalendar from '@/components/sessions/session-sheet-calender';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/auth-context';
import axios from '@/lib/axios';
import { joinNames } from '@/lib/functions';
import { SessionProps } from '@/lib/types';
import { Calendar, Filter, List } from 'lucide-react';
import moment, { Moment } from 'moment';
import { ReactNode, useEffect, useState } from 'react';

export default function Page() {
  const [filter, setFilter] = useState(false);
  const [tab, setTab] = useState('table');
  const [sessions, setSessions] = useState<SessionProps[]>([]);
  const [search, setSearch] = useState({ main: '', coach: '', type: '' });
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState<Moment>(moment());
  const { user } = useAuth();

  useEffect(() => {
    if (user?.id) fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      const result = await axios.get('/admin/sessions');
      if (result.data) {
        const mappedSessions = result.data.map((s: any) => ({
          id: s.id,
          sessionName: s.name,
          type: s.session_type,
          date: moment(new Date(s.date)).format('YYYY-MM-DD'),
          time: `${s.start_time} - ${s.end_time}`,
          coachName: joinNames([s.coach_first_name, s.coach_last_name]),
          price: s.price,
          status: s?.status || 'upcoming',
          end_date: s?.end_date ? moment(new Date(s.end_date)).format('YYYY-MM-DD') : null,
          original: s,
        }));
        setSessions(mappedSessions);
      }
    } catch (error) {
      console.error('Error fetching sessions', error);
    } finally {
      setLoading(false);
    }
  };

  function handleChangeSearch(key: string, val: string) {
    setSearch((prev) => ({ ...prev, [key]: val }));
  }

  const filteredData = sessions.filter((item) => {
    const sessionText = item?.sessionName?.toLowerCase() ?? '';
    const coachText = item?.coachName?.toLowerCase() ?? '';
    const typeText = item?.type?.toLowerCase() ?? '';
    const sessionWords = search.main?.toLowerCase().trim().split(/\s+/).filter(Boolean) || [];
    const coachWords = search.coach?.toLowerCase().trim().split(/\s+/).filter(Boolean) || [];
    const typeWords = search.type?.toLowerCase().trim().split(/\s+/).filter(Boolean) || [];

    const matchesSession =
      !sessionWords.length || sessionWords.every((word) => sessionText.includes(word));

    const matchesCoach = !coachWords.length || coachWords.every((word) => coachText.includes(word));

    const matchesType = !typeWords.length || typeWords.every((word) => typeText.includes(word));

    return matchesSession && matchesCoach && matchesType;
  });

  return (
    <div className="flex flex-col w-full gap-4">
      <Header session_length={sessions.length}>
        <div className="flex flex-wrap gap-4">
          <div className="flex gap-4 items-center flex-wrap">
            <div className="!bg-[#252525] border border-border rounded-[10px] flex flex-wrap items-center p-[2px]">
              <Button
                onClick={() => setTab('table')}
                variant={tab === 'table' ? 'default' : 'ghost'}
                className="h-7 "
              >
                {' '}
                <List />
                Table
              </Button>
              <Button
                onClick={() => setTab('calendar')}
                variant={tab === 'calendar' ? 'default' : 'ghost'}
                className="h-7"
              >
                <Calendar /> Calendar
              </Button>
            </div>
            <CreateSessionDialog
              onRefresh={async () => {
                await fetchData();
              }}
            />
          </div>
        </div>
      </Header>

      <div className="flex flex-col gap-4 rounded-[14px] bg-#252525 border border-[#3A3A3A] p-4 bg-[#252525]">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-center">
          <div className="w-full">
            <InputWithIcon
              value={search.main}
              onChange={(e) => handleChangeSearch('main', e.target.value)}
              placeholder="Search by session..."
            />
          </div>

          {tab === 'table' && (
            <Button onClick={() => setFilter(!filter)}>
              <Filter /> Filters
            </Button>
          )}
        </div>
        {filter && tab === 'table' && (
          <div className="flex flex-col w-full gap-4">
            <Separator />
            <div className="flex flex-col sm:flex-row w-full gap-4">
              <div className="flex flex-1 flex-col gap-2">
                <Label className="text-muted-foreground font-normal">Coach</Label>
                <Input
                  value={search.coach}
                  onChange={(e) => handleChangeSearch('coach', e.target.value)}
                  className="rounded-[8px] dark:bg-black"
                />
              </div>

              <div className="flex flex-1 flex-col gap-2">
                <Label className="text-muted-foreground font-normal">Session Type</Label>
                <Input
                  value={search.type}
                  onChange={(e) => handleChangeSearch('type', e.target.value)}
                  className="rounded-[8px] dark:bg-black"
                />
              </div>

              {/* <div className="flex flex-1 flex-col gap-2">
                <Label className="text-muted-foreground font-normal">
                  Attendance
                </Label>
                <Input className="rounded-[8px] dark:bg-black" />
              </div> */}
            </div>
          </div>
        )}
      </div>

      {tab === 'table' && (
        <PageTable
          loading={loading}
          headerClassName={'rounded-4xl'}
          columns={SESSION_COLUMNS}
          data={filteredData || []}
          onRowClick={() => {}}
        />
      )}
      {tab === 'calendar' && (
        <SessionSheetCalendar
          sessions={sessions}
          currentMonth={currentMonth}
          setCurrentMonth={setCurrentMonth}
        />
      )}
    </div>
  );
}

const Header = ({
  children,
  session_length,
}: {
  children: ReactNode;
  session_length: number | undefined;
}) => {
  return (
    <div className="flex w-full gap-4 justify-between flex-wrap items-center">
      <div className="space-y-2">
        <p className="text-xl">Sessions Management</p>
        <span className="text-xs text-muted-foreground flex items-center">
          <span>
            {session_length} of {session_length} sessions{' '}
          </span>
          <span className="text-warning-text inline-flex">
            {' '}
            {/* <Dot size={16} /> 1 pending payments */}
          </span>
        </span>
      </div>

      {children}
    </div>
  );
};
