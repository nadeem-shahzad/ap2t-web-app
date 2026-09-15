'use client';

import PageTable from '@/components/app-table';
import BulkEmail from '@/components/bulk-email';
import ExportExcel from '@/components/export-excel';
import InputWithIcon from '@/components/input-with-icon';
import { PLAYERS_COLUMNS } from '@/components/players/columns';
import { CreatePlayer } from '@/components/players/create-player';
import Header from '@/components/players/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/auth-context';
import axios from '@/lib/axios';
import { getYear, joinNames } from '@/lib/functions';
import { PlayerData } from '@/lib/types';
import { Filter } from 'lucide-react';
import moment from 'moment';
import { useEffect, useState } from 'react';

export default function Page() {
  const [filter, setFilter] = useState(false);
  const [players, setPlayers] = useState<PlayerData[] | []>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [coachSearch, setCoachSearch] = useState('');
  const [typeSearch, setTypeSearch] = useState('');
  const [ageSearch, setAgeSearch] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    if (user?.id) fetchData();
  }, [user]);

  async function fetchData() {
    try {
      const result = await axios.get('/admin/users?role=player');
      if (result.data) {
        const mappedPlayers = result.data.map((p: any) => ({
          id: p.id,
          email: p.email,
          name: joinNames([p.first_name, p.last_name]),
          coach_name: joinNames([p?.coach_first_name, p?.coach_last_name]),
          age: getYear(p.birth_date),
          position: p.position || 'N/A',
          phone: p.phone_no,
          parent: joinNames([p?.parent_first_name, p?.parent_last_name]),
          last_session: p?.last_session || 'N/A',
          last_session_date: p?.last_session_date
            ? moment(new Date(p?.last_session_date)).format('YYYY-MM-DD')
            : 'N/A',
          attendance: String(p?.attendance_percent || 0),
          joining_date: p.created_at,
          parent_email: p.parent_email,
        }));
        setPlayers(mappedPlayers);
      }
    } catch (error) {
      console.error('Error fetching players', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredData = players.filter((item) => {
    const playerSearchText = `${item?.name} ${item?.parent} ${item?.position}`.toLowerCase();
    const coachSearchText = `${item?.coach_name ?? ''}`.toLowerCase();
    const typeSearchText = `${item?.last_session ?? ''}`.toLowerCase();
    const playerAge = Number(item?.age ?? 0);

    const playerSearchWords = search?.toLowerCase().trim().split(/\s+/).filter(Boolean) || [];
    const coachSearchWords = coachSearch?.toLowerCase().trim().split(/\s+/).filter(Boolean) || [];
    const typeSearchWords = typeSearch?.toLowerCase().trim().split(/\s+/).filter(Boolean) || [];

    const matchesPlayer =
      !playerSearchWords.length ||
      playerSearchWords.every((word) => playerSearchText.includes(word));

    const matchesCoach =
      !coachSearchWords.length || coachSearchWords.every((word) => coachSearchText.includes(word));

    const matchesType =
      !typeSearchWords.length || typeSearchWords.every((word) => typeSearchText.includes(word));

    const matchesAge = !ageSearch || playerAge <= Number(ageSearch);

    return matchesPlayer && matchesCoach && matchesType && matchesAge;
  });

  return (
    <div className="flex flex-col w-full gap-6">
      <Header length={players.length}>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <ExportExcel
            header={[
              'Name',
              'Coach Name',
              'Age',
              'Position',
              'Parent Name',
              'Last Session',
              'Last Session Date',
              'Attendance',
            ]}
            fileName="players_data.xlsx"
            data={players.map((item) => [
              item?.name || '',
              item?.coach_name,
              item?.age,
              item?.position,
              item?.parent,
              item?.last_session,
              item?.last_session_date,
              item?.attendance,
            ])}
          />

          <CreatePlayer
            onRefresh={async () => {
              await fetchData();
            }}
          />

          <BulkEmail players={players} />
        </div>
      </Header>

      <div className="flex flex-col gap-4 rounded-[14px] bg-#252525 border border-[#3A3A3A] p-4 bg-[#252525]">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <div className="w-full">
            <InputWithIcon
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by player name, parent or position..."
            />
          </div>

          <Button onClick={() => setFilter(!filter)}>
            <Filter /> Filters
          </Button>
        </div>

        {filter && (
          <div className="flex flex-col w-full gap-4">
            <Separator />
            <div className="flex flex-col sm:flex-row w-full gap-4">
              <div className="flex flex-1 flex-col gap-2">
                <Label className="text-muted-foreground font-normal">Coach</Label>
                <Input
                  value={coachSearch}
                  onChange={(e) => setCoachSearch(e.target.value)}
                  className="rounded-[8px] dark:bg-black"
                />
              </div>

              <div className="flex flex-1 flex-col gap-2">
                <Label className="text-muted-foreground font-normal">Session</Label>
                <Input
                  className="rounded-[8px] dark:bg-black"
                  value={typeSearch}
                  onChange={(e) => setTypeSearch(e.target.value)}
                />
              </div>

              <div className="flex flex-1 flex-col gap-2">
                <Label className="text-muted-foreground font-normal">age</Label>
                <Input
                  className="rounded-[8px] dark:bg-black"
                  value={ageSearch}
                  onChange={(e) => setAgeSearch(e.target.value)}
                />
              </div>
            </div>
          </div>
        )}
      </div>
      <PageTable loading={loading} columns={PLAYERS_COLUMNS} data={filteredData} />
    </div>
  );
}
