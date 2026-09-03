'use client'

import BackButton from '@/components/back-button'
import { Button } from '@/components/ui/button'
import { useKiosk } from '@/lib/kiosk-context'
import { Calendar, ChevronRight, Clock, CreditCard, User } from 'lucide-react'
import moment from 'moment'
import type { ReactNode } from 'react'

export default function SessionReviewPage({ setStep }: { setStep: (val: number) => void }) {
  const { state } = useKiosk()
  const { player, session, checkInType } = state

  if (!player || !session) return null

  const isWalkIn = checkInType === 'walk-in'

  return (
    <div className="flex flex-1 flex-col">
      <BackButton onClick={() => setStep(isWalkIn ? 1 : 0)} />

      <div className="flex flex-1 items-center justify-center px-6 py-8">
        <div className="w-full max-w-2xl rounded-xl border border-active-text bg-card p-8">
          <div className="mb-6 flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-active-bg">
              <Calendar className="h-10 w-10 text-active-text" />
            </div>
          </div>

          <h2 className="mb-2 text-center text-2xl font-bold text-foreground">Confirm Your Session</h2>
          <p className="mb-8 text-center text-foreground/60">
            Review your {isWalkIn ? 'walk-in' : 'pre-booked'} session before proceeding to payment.
          </p>

          <div className="mb-8 rounded-lg border bg-secondary p-5">
            <div className="mb-5 flex items-center justify-between gap-4 border-b border-border pb-4">
              <div>
                <p className="text-xs text-foreground/60">Selected Session</p>
                <h3 className="text-xl font-semibold text-foreground">{session.name}</h3>
              </div>
              <span className={`rounded-md border px-3 py-1 text-xs ${isWalkIn ? 'border-warning-text/30 bg-warning-bg text-warning-text' : 'border-success-text/30 bg-success-bg text-success-text'}`}>
                {isWalkIn ? 'Walk-In' : 'Pre-Booked'}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Detail icon={<User size={20} />} label="Player" value={player.name} />
              <Detail icon={<CreditCard size={20} />} label="Session Price" value={`$${session.price}`} />
              <Detail icon={<Calendar size={20} />} label="Date" value={session.date ? moment(session.date).format('YYYY-MM-DD') : 'Today'} />
              <Detail icon={<Clock size={20} />} label="Time" value={`${session.start_time} - ${session.end_time}`} />
            </div>
          </div>

          <Button onClick={() => setStep(2)} className="h-14 w-full rounded-full text-lg font-semibold">
            Proceed to Payment <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  )
}

function Detail({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-md border border-active-text/30 bg-active-bg text-active-text">
        {icon}
      </div>
      <div>
        <p className="text-xs text-foreground/60">{label}</p>
        <p className="font-semibold text-foreground">{value}</p>
      </div>
    </div>
  )
}
