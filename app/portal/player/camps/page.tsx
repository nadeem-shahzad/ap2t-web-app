'use client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { Spinner } from '@/components/ui/spinner';
import { useAuth } from '@/contexts/auth-context';
import axios from '@/lib/axios';
import { joinNames } from '@/lib/functions';
import { PrmotionsType } from '@/lib/types';
import { Calendar, ChevronDown, CreditCard, DollarSign, Users } from 'lucide-react';
import moment from 'moment';
import { useEffect, useState } from 'react';
import Zoom from 'react-medium-image-zoom';
import 'react-medium-image-zoom/dist/styles.css';
import { toast } from 'sonner';

export default function Page() {
  const { user } = useAuth();
  const [data, setData] = useState<PrmotionsType[] | []>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.id) fetchData();
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await axios.get(`/player/${user?.id}/promotions?type=camp`);
      setData(result.data);
      if (result.data) {
        const mappedSessions = result.data.map((s: any) => ({
          ...s,
          date: s.date ? moment(new Date(s.date)).format('YYYY-MM-DD') : '',
          end_date: s.end_date ? moment(new Date(s.end_date)).format('YYYY-MM-DD') : '',
          time: `${s.start_time} - ${s.end_time}`,
          coachName: joinNames([s.coach_first_name, s.coach_last_name]),
          status: s.status,
          save: Number(s.price || 0) - Number(s.promotion_price || 0),
        }));
        setData(mappedSessions);
      }
    } catch (error) {
      console.error('Error fetching sessions', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col w-full gap-4">
      <Header />

      {loading ? (
        <div className="flex flex-1 items-center justify-center mt-10">
          <Spinner />
        </div>
      ) : (
        <div className="flex flex-wrap gap-4">
          {data.map((item) => (
            <RenderEachItem key={item.id} item={item} fetchData={fetchData} />
          ))}
        </div>
      )}
    </div>
  );
}

const RenderEachItem = ({
  item,
  fetchData,
}: {
  item: PrmotionsType;
  fetchData: () => Promise<void>;
}) => {
  const [loading, setLoading] = useState(false);
  const [datesPopoverOpen, setDatesPopoverOpen] = useState(false);
  const { user } = useAuth();
  const isFixedDates = item.date_mode === 'fixed_dates';
  const nearestFixedDate = isFixedDates
    ? [...(item.dates ?? [])]
        .filter((d) => d.is_active && d.is_signup_open)
        .sort((a, b) => a.date.localeCompare(b.date))[0]
    : null;
  const [selectedDate, setSelectedDate] = useState(
    nearestFixedDate ? moment(nearestFixedDate.date).format('YYYY-MM-DD') : item.date
  );
  const enrolledDateKeys = new Set(item.enrolled_dates ?? []);
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const usesSessionDate = item.is_daily_payment || isFixedDates;
  const isEnrolledForSelectedDate = item.is_daily_payment
    ? (item.enrolled_dates?.includes(selectedDate) ?? false)
    : item.enrolled;

  const selectableFixedDates = isFixedDates
    ? (item.dates ?? []).filter((d) => d.is_active)
    : [];
  const availableFixedDates = selectableFixedDates.filter(
    (d) => !enrolledDateKeys.has(moment(d.date).format('YYYY-MM-DD'))
  );

  const selectedFixedDateRows = selectableFixedDates.filter((d) =>
    selectedDates.includes(moment(d.date).format('YYYY-MM-DD'))
  );
  const fixedDatesTotal = selectedFixedDateRows.reduce(
    (sum, d) => sum + Number(d.promotion_price ?? d.price),
    0
  );

  const displayPrice = isFixedDates
    ? selectedFixedDateRows.length
      ? fixedDatesTotal
      : `From $${Math.min(...selectableFixedDates.map((d) => Number(d.promotion_price ?? d.price)))}`
    : item.promotion_price;
  const displayOriginalPrice = isFixedDates ? undefined : item.price;

  function toggleDate(dateKey: string) {
    setSelectedDates((prev) =>
      prev.includes(dateKey) ? prev.filter((d) => d !== dateKey) : [...prev, dateKey]
    );
  }

  async function handleEnroll(item: PrmotionsType) {
    if (!user?.id || !item?.id) return;

    setLoading(true);
    try {
      if (isFixedDates) {
        const results = await Promise.allSettled(
          selectedDates.map((session_date) =>
            axios.post(`/admin/sessions/${item.id}/participants`, {
              player_id: user?.id,
              session_date,
            })
          )
        );
        const failed = results.filter((r) => r.status === 'rejected').length;
        if (failed > 0) {
          toast.error(
            `Failed to register for ${failed} of ${selectedDates.length} selected date(s).`
          );
        }
        setSelectedDates([]);
      } else {
        await axios.post(`/admin/sessions/${item.id}/participants`, {
          player_id: user?.id,
          ...(usesSessionDate ? { session_date: selectedDate } : {}),
        });
      }
      await fetchData();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full sm:w-[380px] p-0 overflow-hidden">
      <div className="relative">
        <Zoom>
          <img
            src={item.image || '/footballkick.jpg'}
            alt={item.name}
            onError={(event) => {
              event.currentTarget.src = '/footballkick.jpg';
            }}
            className="w-full cursor-zoom-in object-cover"
          />
        </Zoom>

        <Badge className="absolute top-3 left-3 bg-active-text text-white font-normal">
          {item?.status?.charAt(0)?.toUpperCase() + item?.status?.slice(1)}
        </Badge>
      </div>
      <CardContent className="px-4 space-y-4">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-white">{item.name}</h3>
          <p className="text-sm text-muted-foreground">{item.description}</p>
        </div>

        <div className="flex items-center gap-2">
          <DollarSign size={16} className="text-success-text" />
          <span className="text-xl font-semibold">
            {typeof displayPrice === 'number' ? `$${displayPrice}` : displayPrice}
          </span>
          {displayOriginalPrice !== undefined && (
            <span className="text-sm line-through text-muted-foreground">
              {displayOriginalPrice}
            </span>
          )}
          {!isFixedDates && (
            <Badge className="bg-active-bg text-active-text rounded-md">Save ${item.save}</Badge>
          )}
          {isFixedDates && selectedFixedDateRows.length > 0 && (
            <Badge className="bg-active-bg text-active-text rounded-md">
              {selectedFixedDateRows.length} date{selectedFixedDateRows.length > 1 ? 's' : ''}
            </Badge>
          )}
        </div>

        {isFixedDates ? (
          <div className="space-y-1 bg-[#1A1A1A] border border-border rounded-xl p-3">
            <div className="flex gap-2 items-center">
              <Calendar size={12} className="text-muted-foreground" />
              <div className="text-xs text-muted-foreground">Dates Available</div>
            </div>
            <div className="text-sm text-white">{item.dates?.length ?? 0} dates</div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1 bg-[#1A1A1A] border border-border rounded-xl p-3">
              <div className="flex gap-2 items-center">
                <Calendar size={12} className="text-muted-foreground" />
                <div className="text-xs text-muted-foreground">Start Date</div>
              </div>
              <div className="text-sm text-white">{item.date}</div>
            </div>

            <div className="space-y-1 bg-[#1A1A1A] border border-border rounded-xl p-3">
              <div className="flex gap-2 items-center">
                <Calendar size={12} className="text-muted-foreground" />
                <div className="text-xs text-muted-foreground">End Date</div>
              </div>
              <div className="text-sm text-white">{item.end_date}</div>
            </div>
          </div>
        )}

        <Separator />

        {item.requires_upfront_payment && (
          <div className="flex items-start gap-2 rounded-md border border-primary/30 bg-primary/10 p-3 text-sm text-primary">
            <CreditCard className="mt-0.5 h-4 w-4 shrink-0" />
            <span>Upfront payment is required to enroll in this session.</span>
          </div>
        )}

        {item.is_daily_payment && (
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground">Booking Date</div>
            <input
              type="date"
              value={selectedDate}
              min={item.date}
              max={item.end_date || item.date}
              onChange={(event) => setSelectedDate(event.target.value)}
              className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
            />
          </div>
        )}

        {isFixedDates && (
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground">Choose Date(s)</div>
            <Popover open={datesPopoverOpen} onOpenChange={setDatesPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-9 justify-between font-normal"
                >
                  <span>
                    {selectedDates.length > 0
                      ? `${selectedDates.length} date${selectedDates.length > 1 ? 's' : ''} selected`
                      : 'Select date(s)'}
                  </span>
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[300px] p-2 space-y-1" align="start">
                {selectableFixedDates.map((d) => {
                  const dateKey = moment(d.date).format('YYYY-MM-DD');
                  const alreadyEnrolled = enrolledDateKeys.has(dateKey);
                  const soldOut = !alreadyEnrolled && (d.left <= 0 || !d.is_signup_open);
                  const effectivePrice = d.promotion_price ?? d.price;
                  return (
                    <label
                      key={d.id}
                      className={`flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm ${
                        alreadyEnrolled || soldOut
                          ? 'text-muted-foreground cursor-not-allowed'
                          : 'cursor-pointer hover:bg-white/5'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <Checkbox
                          checked={alreadyEnrolled || selectedDates.includes(dateKey)}
                          disabled={alreadyEnrolled || soldOut}
                          onCheckedChange={() => toggleDate(dateKey)}
                        />
                        {dateKey}
                      </span>
                      <span className="text-xs">
                        {alreadyEnrolled
                          ? 'Enrolled'
                          : soldOut
                            ? 'Sold out'
                            : `$${effectivePrice} · ${d.left} left`}
                      </span>
                    </label>
                  );
                })}
              </PopoverContent>
            </Popover>
          </div>
        )}

        <div className="flex gap-2 mb-4 w-full">
          {isFixedDates ? (
            availableFixedDates.length === 0 ? (
              <Badge className="bg-green-500/10 text-green-400 w-full">
                Enrolled in all dates
              </Badge>
            ) : (
              <Button
                disabled={loading || selectedDates.length === 0}
                onClick={() => handleEnroll(item)}
                variant="outline"
                className="w-full"
              >
                {loading && <Spinner />} <Users /> Participate
                {selectedDates.length > 0 ? ` (${selectedDates.length})` : ''}
              </Button>
            )
          ) : isEnrolledForSelectedDate ? (
            <Badge className="bg-green-500/10 text-green-400 w-full">Enrolled</Badge>
          ) : (
            <Button
              disabled={loading}
              onClick={() => handleEnroll(item)}
              variant="outline"
              className="w-full"
            >
              {loading && <Spinner />} <Users /> Participate
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const Header = () => {
  return (
    <div className="flex w-full gap-4 justify-between flex-wrap items-center">
      <div className="space-y-1">
        <p className="text-xl">Camps</p>
      </div>
    </div>
  );
};
