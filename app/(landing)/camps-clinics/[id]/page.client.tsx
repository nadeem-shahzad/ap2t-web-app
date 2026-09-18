'use client';

import AppCalendar from '@/components/app-calendar';
import { detailIcons } from '@/components/landing/constants';
import { CurvedImage } from '@/components/landing/curved-image';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { useIsMobile } from '@/hooks/use-mobile';
import axios from '@/lib/axios';
import { formatSessionDateRange } from '@/lib/date';
import { CampClinicSession, SessionDate } from '@/lib/types';
import { cn } from '@/lib/utils';
import { CircleAlert, CircleCheckBig, CreditCard, DollarSign } from 'lucide-react';
import moment from 'moment';
import NextLink from 'next/link';
import { ComponentProps, useState } from 'react';
import type { DayButton } from 'react-day-picker';
import Zoom from 'react-medium-image-zoom';
import 'react-medium-image-zoom/dist/styles.css';
import { toast } from 'sonner';

function FixedDateDayButton({
  className,
  day,
  modifiers,
  fixedDatesMap,
  ...props
}: ComponentProps<typeof DayButton> & { fixedDatesMap: Map<string, SessionDate> }) {
  const dateKey = moment(day.date).format('YYYY-MM-DD');
  const info = fixedDatesMap.get(dateKey);
  const soldOut = info ? info.left <= 0 || !info.is_signup_open : false;

  return (
    <Button
      variant="ghost"
      size="icon"
      data-selected-single={modifiers.selected}
      className={cn(
        'flex h-auto min-h-(--cell-size) w-full flex-col items-center justify-center gap-0.5 aspect-square font-normal leading-none',
        'data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground',
        info && !soldOut && !modifiers.selected && 'ring-1 ring-inset ring-primary/50',
        className
      )}
      {...props}
    >
      <span className="text-sm">{day.date.getDate()}</span>
      {info && (
        <span
          className={cn(
            'text-[9px] leading-none',
            soldOut ? 'text-red-400 line-through' : 'opacity-80'
          )}
        >
          ${info.promotion_price ?? info.price}
        </span>
      )}
    </Button>
  );
}

export default function CampsAndClinicsDetail({ data = null }: { data: CampClinicSession | null }) {
  const mobile = useIsMobile();
  const [loading, setLoading] = useState(false);
  const isFixedDates = data?.date_mode === 'fixed_dates';
  const nearestFixedDate = isFixedDates
    ? [...(data?.dates ?? [])]
        .filter((d) => d.is_active && d.is_signup_open)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0]
    : null;
  const [formData, setFormData] = useState({
    session_date:
      data?.is_daily_payment && data.date
        ? moment(data.date).format('YYYY-MM-DD')
        : nearestFixedDate
          ? moment(nearestFixedDate.date).format('YYYY-MM-DD')
          : '',
    player: {
      first_name: '',
      last_name: '',
      birth_date: null as Date | null,
      email: '',
      password: '',
      role: 'player',
      medical_notes: '',
    },
    parent: {
      first_name: '',
      last_name: '',
      email: '',
      role: 'parent',
      password: '',
      phone_no: '',
    },
  });
  const isUnderAged =
    !!formData.player.birth_date && moment().diff(moment(formData.player.birth_date), 'years') < 18;
  const selectedFixedDateRow = isFixedDates
    ? data?.dates?.find(
        (d) => moment(d.date).format('YYYY-MM-DD') === formData.session_date
      )
    : null;

  const fixedDatesMap = new Map(
    (isFixedDates ? (data?.dates ?? []) : [])
      .filter((d) => d.is_active)
      .map((d) => [moment(d.date).format('YYYY-MM-DD'), d])
  );

  const showCalendar = isFixedDates;

  const currentCamp = data
    ? {
        id: data.id,
        badge: data.session_type.toUpperCase() as 'CAMP' | 'CLINIC',
        title: data.name,
        image: data.image,
        description: data.description,
        price: selectedFixedDateRow
          ? Number(
              data.apply_promotion
                ? (selectedFixedDateRow.promotion_price ?? selectedFixedDateRow.price)
                : selectedFixedDateRow.price
            )
          : Number(data.apply_promotion ? data.promotion_price : data.price),
        left: selectedFixedDateRow ? selectedFixedDateRow.left : data.total_left,
        details: [
          isFixedDates
            ? `${data.dates?.length ?? 0} dates available`
            : formatSessionDateRange(data.date, data.end_date),
          `${moment(data.start_time, 'HH:mm').format('hh:mm A')} - ${moment(data.end_time, 'HH:mm').format('hh:mm A')}`,
          `Ages ${data.age_limit ?? 'All'}`,
          data?.location || '',
        ],
        highlights: [
          'Professional coaching staff',
          'Daily technical & tactical sessions',
          'Small group training for individual attention',
          'Fitness and conditioning drills',
          'Game-based learning activities',
          'Indoor climate-controlled facility',
          'Skill assessment and feedback',
          'Fun, competitive environment',
        ],
      }
    : null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if ((data?.is_daily_payment || isFixedDates) && !formData.session_date) {
      toast.error('Please select a booking date');
      return;
    }

    setLoading(true);

    try {
      const res = await axios.post(`/camps-clinics/${data?.id}`, formData);

      if (res.data.success) {
        toast.success('Registration complete. Please log in to continue.');
      }
    } catch (err: any) {
      const message = err?.response?.data?.error || err?.message || 'Something went wrong';

      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-16 sm:pt-20 relative">
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8">
        <section className="space-y-5">
          <div className="relative flex flex-col items-center bg-[#090909] py-12 sm:py-16 rounded-lg overflow-hidden">
            <div className="relative space-y-8 w-full max-w-4xl">
              <div className="flex flex-col items-center gap-4 text-center">
                <h1 className="text-4xl sm:text-5xl font-bold">Camps & Clinics</h1>
                <p className="text-sm text-muted max-w-xl">
                  Enhance your reflection time, coordination, and movement efficiency.
                </p>
              </div>
            </div>

            {currentCamp?.image ? (
              <Zoom>
                <img
                  src={currentCamp.image}
                  alt={`${currentCamp.title} program`}
                  className="h-[600px] w-full rounded-md object-contain"
                  onError={(event) => {
                    event.currentTarget.src = '/footballkick.jpg';
                  }}
                />
              </Zoom>
            ) : (
              <CurvedImage
                src={'/footballkick.jpg'}
                alt="About hero"
                curveDepth={mobile ? 10 : 20}
                className="shadow-2xl"
                imageClassName="object-top"
              />
            )}
          </div>

          {currentCamp && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div
                  className={`text-xs font-semibold px-2.5 py-1 rounded-md
              ${
                currentCamp.badge === 'CLINIC'
                  ? 'bg-blue-500/15 text-blue-400'
                  : 'bg-primary/15 text-primary'
              }
            `}
                >
                  {currentCamp.badge}
                </div>

                {data?.requires_upfront_payment && currentCamp?.left && (
                  <div className="text-xs font-semibold px-2 py-1 rounded-md bg-red-500/15 text-red-400">
                    {currentCamp.left} Left
                  </div>
                )}
              </div>

              <div className="font-semibold text-white text-4xl">{currentCamp.title}</div>

              <div className="text-sm text-muted-foreground leading-relaxed">
                {currentCamp.description}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 items-stretch">
                <div className="space-y-4">
                  <Card className="bg-[#131313] rounded border border-white/5">
                    <CardContent className="p-4 space-y-4">
                      <div className="text-lg leading-relaxed">Event details</div>
                      <div className="flex flex-col gap-4 pt-2">
                        {currentCamp.details.map((eachDetail, index) => {
                          const Icon = detailIcons[index];

                          return (
                            <div
                              key={index}
                              className="flex items-center gap-2 text-xs text-muted-foreground"
                            >
                              {Icon && <Icon className="h-4 w-4 text-primary shrink-0" />}
                              <span>{eachDetail}</span>
                            </div>
                          );
                        })}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <DollarSign className="h-4 w-4 text-primary shrink-0" />

                          <span>${currentCamp.price}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-[#131313] rounded border border-white/5">
                    <CardContent className="p-4 space-y-4">
                      <div className="text-lg leading-relaxed">About This Event</div>
                      <p className="text-[#B3B3B3] text-sm max-w-2xl">{currentCamp?.description}</p>

                      <div className="text-lg leading-relaxed">Highlights</div>

                      {currentCamp?.highlights?.map((eachHighlight, idx) => (
                        <div key={idx} className="flex items-center gap-4">
                          <CircleCheckBig className="text-primary" size={16} />
                          <p className="text-[#B3B3B3] text-sm">{eachHighlight}</p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
                <div className={showCalendar ? 'h-full' : undefined}>
                  <Card
                    className={cn(
                      'bg-[#131313] rounded border border-white/5',
                      showCalendar && 'h-full flex flex-col'
                    )}
                  >
                    <CardContent
                      className={cn(
                        showCalendar ? 'p-4 space-y-4 flex-1 flex flex-col justify-start' : 'p-4 space-y-6'
                      )}
                    >
                      {showCalendar && (
                        <div className="space-y-2 rounded-[8px] border border-[#3A3A3A] bg-[#0F0F0F] p-3">
                          <h4 className="text-center text-sm font-medium text-white/80">
                            Available Dates
                          </h4>
                          <Calendar
                            mode="single"
                            required
                            selected={
                              formData.session_date
                                ? new Date(formData.session_date)
                                : undefined
                            }
                            defaultMonth={
                              formData.session_date
                                ? new Date(formData.session_date)
                                : nearestFixedDate
                                  ? new Date(nearestFixedDate.date)
                                  : undefined
                            }
                            onSelect={(value) => {
                              if (!value) return;
                              const dateKey = moment(value).format('YYYY-MM-DD');
                              const info = fixedDatesMap.get(dateKey);
                              if (!info || info.left <= 0 || !info.is_signup_open) return;
                              setFormData((prev) => ({ ...prev, session_date: dateKey }));
                            }}
                            disabled={(date) => {
                              const info = fixedDatesMap.get(moment(date).format('YYYY-MM-DD'));
                              return !info || info.left <= 0 || !info.is_signup_open;
                            }}
                            components={{
                              DayButton: (props) => (
                                <FixedDateDayButton {...props} fixedDatesMap={fixedDatesMap} />
                              ),
                            }}
                            className="mx-auto w-fit [--cell-size:2.25rem]"
                          />
                          <div className="flex items-center justify-center gap-4 text-xs text-white/50 border-t border-[#3A3A3A] pt-2">
                            <span className="flex items-center gap-1.5">
                              <span className="h-2 w-2 rounded-full ring-1 ring-primary/50" />
                              Available
                            </span>
                            <span className="flex items-center gap-1.5">
                              <span className="h-2 w-2 rounded-full bg-primary" />
                              Selected
                            </span>
                          </div>
                          {selectedFixedDateRow && (
                            <p className="text-center text-sm text-white/70">
                              {moment(selectedFixedDateRow.date).format('MMM D, YYYY')} —{' '}
                              <span className="font-semibold text-white">
                                $
                                {selectedFixedDateRow.promotion_price ??
                                  selectedFixedDateRow.price}
                              </span>{' '}
                              · {selectedFixedDateRow.left} left
                            </p>
                          )}
                        </div>
                      )}

                      {data?.requires_upfront_payment ? (
                        <div className="space-y-5 text-center">
                          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/15 text-primary">
                            <CreditCard className="size-6" />
                          </div>
                          <div className="space-y-2">
                            <h3 className="text-2xl font-semibold text-white">
                              Upfront payment required
                            </h3>
                            <p className="text-sm leading-relaxed text-white/60">
                              This session requires payment during registration. Continue to sign up
                              and complete your payment to reserve your place.
                            </p>
                          </div>
                          <Button asChild className="w-full rounded-full">
                            <NextLink href="/portal/auth?p=signup">Sign up to continue</NextLink>
                          </Button>
                        </div>
                      ) : (
                      <form onSubmit={handleSubmit}>
                        <div className="space-y-1">
                          <h3 className="text-2xl font-semibold text-white">Register Now</h3>
                          <p className="text-sm text-white/60">Secure your spot for this event</p>
                        </div>

                        {!data?.is_daily_payment && currentCamp?.left && (
                          <div className="bg-[#DC262652] border-[#EF4444] p-5 rounded-[8px]">
                            <div className="flex items-start gap-3">
                              <CircleAlert className="text-[#EF4444] mt-0.5" />
                        
                              <div className="space-y-1">
                                <div className="text-[#EF4444] font-medium">
                                  Limited Spots Available
                                </div>
                        
                                {/*<div className="text-muted text-sm">*/}
                                {/*  Only {currentCamp?.left} spots remaining. Register soon to avoid*/}
                                {/*  missing out!*/}
                                {/*</div>*/}
                              </div>
                            </div>
                          </div>
                        )}
                        <div className="flex flex-col gap-4">
                          {data?.is_daily_payment && (
                            <div className="space-y-2">
                              <h4 className="text-sm font-medium text-white/80">Booking Date</h4>
                              <input
                                type="date"
                                required
                                min={moment(data.date).format('YYYY-MM-DD')}
                                max={moment(data.end_date || data.date).format('YYYY-MM-DD')}
                                value={formData.session_date}
                                className="w-full rounded-[8px] border border-[#6D6D6D] bg-transparent px-3 py-2 text-sm text-white focus:outline-none focus:border-white/30"
                                onChange={(e) =>
                                  setFormData((prev) => ({
                                    ...prev,
                                    session_date: e.target.value,
                                  }))
                                }
                              />
                              <p className="text-xs text-white/50">
                                Select the day you want to attend.
                              </p>
                            </div>
                          )}

                          <div className="space-y-3">
                            <h4 className="text-sm font-medium text-white/80">
                              Player Information
                            </h4>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <input
                                type="text"
                                placeholder="First Name"
                                required
                                className="w-full rounded-[8px] border border-[#6D6D6D] px-3 py-2 text-sm text-white"
                                onChange={(e) =>
                                  setFormData((prev) => ({
                                    ...prev,
                                    player: {
                                      ...prev.player,
                                      first_name: e.target.value,
                                    },
                                  }))
                                }
                              />
                              <input
                                type="text"
                                placeholder="Last Name"
                                required
                                className="w-full rounded-[8px] border border-[#6D6D6D] px-3 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:border-white/30"
                                onChange={(e) =>
                                  setFormData((prev) => ({
                                    ...prev,
                                    player: {
                                      ...prev.player,
                                      last_name: e.target.value,
                                    },
                                  }))
                                }
                              />
                              <input
                                type="email"
                                placeholder="Email"
                                required
                                className="w-full rounded-[8px] border border-[#6D6D6D] px-3 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:border-white/30"
                                onChange={(e) =>
                                  setFormData((prev) => ({
                                    ...prev,
                                    player: {
                                      ...prev.player,
                                      email: e.target.value.trim().toLocaleLowerCase(),
                                    },
                                  }))
                                }
                              />
                              <input
                                type="password"
                                placeholder="Password"
                                required
                                className="w-full rounded-[8px] border border-[#6D6D6D] px-3 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:border-white/30"
                                onChange={(e) =>
                                  setFormData((prev) => ({
                                    ...prev,
                                    player: { ...prev.player, password: e.target.value },
                                  }))
                                }
                              />
                            </div>
                            <div className="space-y-2">
                              <h4 className="text-xs font-medium text-white/80">Birth Date</h4>

                              <AppCalendar
                                className="w-full rounded-[8px] border dark:bg-none dark:border-[#6D6D6D] px-3 py-2 text-sm placeholder-white/40 focus:outline-none focus:border-white/30"
                                date={formData.player.birth_date}
                                onChange={(date: Date) =>
                                  setFormData((prev) => ({
                                    ...prev,
                                    player: {
                                      ...prev.player,
                                      birth_date: date,
                                    },
                                  }))
                                }
                              />
                            </div>
                          </div>

                          {isUnderAged && <div className="space-y-3">
                            <h4 className="text-sm font-medium text-white/80">
                              Parent / Guardian Information
                            </h4>

                            <div className="grid grid-cols-2 gap-2">
                              <input
                                type="text"
                                placeholder="First Name"
                                required
                                className="w-full rounded-[8px] border border-[#6D6D6D] px-3 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:border-white/30"
                                onChange={(e) =>
                                  setFormData((prev) => ({
                                    ...prev,
                                    parent: {
                                      ...prev.parent,
                                      first_name: e.target.value,
                                    },
                                  }))
                                }
                              />
                              <input
                                type="text"
                                placeholder="Last Name"
                                required
                                className="w-full rounded-[8px] border border-[#6D6D6D] px-3 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:border-white/30"
                                onChange={(e) =>
                                  setFormData((prev) => ({
                                    ...prev,
                                    parent: {
                                      ...prev.parent,
                                      last_name: e.target.value,
                                    },
                                  }))
                                }
                              />
                            </div>

                            <input
                              type="email"
                              placeholder="Email"
                              required
                              className="w-full rounded-[8px] border border-[#6D6D6D] px-3 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:border-white/30"
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  parent: {
                                    ...prev.parent,
                                    email: e.target.value.trim().toLocaleLowerCase(),
                                  },
                                }))
                              }
                            />
                            <input
                              type="password"
                              placeholder="*******"
                              required
                              className="w-full rounded-[8px] border border-[#6D6D6D] px-3 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:border-white/30"
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  parent: {
                                    ...prev.parent,
                                    password: e.target.value,
                                  },
                                }))
                              }
                            />

                            <input
                              type="tel"
                              placeholder="Phone"
                              required
                              className="w-full rounded-[8px] border border-[#6D6D6D] px-3 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:border-white/30"
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  parent: {
                                    ...prev.parent,
                                    phone_no: e.target.value,
                                  },
                                }))
                              }
                            />

                          </div>}
                          <textarea
                            placeholder="Medical Information (Optional)"
                            rows={3}
                            className="w-full rounded-[8px] border border-[#6D6D6D] px-3 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:border-white/30"
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                player: { ...prev.player, medical_notes: e.target.value },
                              }))
                            }
                          />
                        </div>

                        <Button type="submit" className="w-full rounded-full" disabled={loading}>
                          {loading && <Spinner className=" text-black h-5 w-5" />}
                          Complete Registration
                        </Button>

                        <p className="text-xs text-white/50 leading-relaxed text-center">
                          Payment will be collected at the facility before the event starts.
                          Registration confirmation will be sent to your email.
                        </p>
                      </form>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
