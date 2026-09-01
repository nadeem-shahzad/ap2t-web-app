'use client'

import { Button } from '@/components/ui/button'
import { useApproval } from '@/hooks/use-approval'
import axios from '@/lib/axios'
import { useKiosk } from '@/lib/kiosk-context'
import { ArrowRight, Banknote, Calendar, CheckCircle, CircleX, Clock, CreditCard, Loader2, User } from 'lucide-react'
import moment from 'moment'
import { useEffect, useState } from 'react'

export default function PaymentConfirmedPage({ setStep }: { setStep: (val: number) => void }) {

  const { state, } = useKiosk()
  const { player, session, booking, paymentMethod } = state
  const currentSession = booking?.session || session

  const {loading, error} = useApproval(
    player?.id,
    currentSession?.id,
    currentSession?.is_daily_payment ? new Date().toISOString().slice(0, 10) : undefined,
  )

  const handleDone = () => {
    setStep(6)
  }

  if (!player || !currentSession) {
    return null
  }


  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-8">
      <div className="w-full max-w-xl rounded-xl border-2 border-active-text/50 bg-card p-8">

        {/* Status Icon */}
        <div className="mb-6 flex justify-center">
          <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-active-bg">
            {loading ? (
              <Loader2 className="h-16 w-16 animate-spin text-primary" />
            ) : error ? (
              <CircleX className="h-16 w-16 text-destructive" />
            ) : (
              <CheckCircle className="h-16 w-16 text-active-text" />
            )}

            {!loading && (
              <div className="absolute -right-1 -top-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary">
                {paymentMethod === 'cash' ? (
                  <Banknote className="h-4 w-4 text-primary-foreground" />
                ) : (
                  <CreditCard className="h-4 w-4 text-primary-foreground" />
                )}
              </div>
            )}
          </div>
        </div>

        {/* Title & Message */}
        <h2 className={`mb-2 text-center text-2xl font-bold text-active-text ${error && "text-red-500"}`}>
          {loading
            ? 'Awaiting Confirmation...'
            : error
              ? 'Payment Rejected'
              : 'All Set!'}
        </h2>

        <p className="mb-6 text-center text-foreground/60">
          {loading
            ? 'Please wait while we confirm your payment with the front desk.'
            : error
              ? 'Your payment could not be confirmed. Please contact the front desk.'
              : `Your ${paymentMethod || 'cash'} payment has been processed successfully.`}
        </p>

        {/* Loading state */}
        {loading && (
          <div className="rounded-lg border border-warning-text/30 bg-warning-bg p-4 text-center mb-6">
            <p className="text-sm text-warning-text">
              Do not close this screen while we confirm your payment...
            </p>
          </div>
        )}

        {error && !loading && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-center mb-6">
            <p className="text-sm text-destructive">
              Payment was rejected. Please try again or contact the front desk.
            </p>
          </div>
        )}

        {/* Only show full details when loading is done */}
        {!loading && !error && (
          <>
            {/* Payment Amount */}
            <div className="mb-8 flex justify-center">
              <div className="flex items-center gap-2 rounded-md bg-secondary px-6 py-3">
                {paymentMethod === 'cash' ? (
                  <Banknote className="h-5 w-5 text-primary" />
                ) : (
                  <CreditCard className="h-5 w-5" />
                )}
                <span className="font-medium">Paid with {paymentMethod === 'cash' ? 'Cash' : 'Card'}:</span>
                <span className="font-bold text-primary ml-1">${currentSession.price}</span>
              </div>
            </div>

            {/* Session Details */}
            <div className="mb-8 rounded-lg border border-active-text/30 bg-secondary p-4">
              <h3 className="mb-4 flex items-center gap-2 text-sm font-medium">
                <CheckCircle size={20} /> Your Session Details
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <div className='h-10 w-10 flex items-center justify-center bg-active-bg border border-active-text/32 rounded-md'>
                    <User className="text-active-text" size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-foreground/60">Player</p>
                    <p className="font-semibold">{player.name}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className='h-10 w-10 flex items-center justify-center bg-active-bg border border-active-text/32 rounded-md'>
                    <User className="text-active-text" size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-foreground/60">Member #</p>
                    <p className="font-semibold">{player.id}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className='h-10 w-10 flex items-center justify-center bg-active-bg border border-active-text/32 rounded-md'>
                    <CreditCard className="text-active-text" size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-foreground/60">Session</p>
                    <p className="font-semibold">{currentSession.name}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className='h-10 w-10 flex items-center justify-center bg-active-bg border border-active-text/32 rounded-md'>
                    <Calendar className="text-active-text" size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-foreground/60">Date</p>
                    <p className="font-semibold">{currentSession.date && moment(currentSession.date).format("YYYY-MM-DD")}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className='h-10 w-10 flex items-center justify-center bg-active-bg border border-active-text/32 rounded-md'>
                    <Clock className="text-active-text" size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-foreground/60">Time</p>
                    <p className="font-semibold">{currentSession.start_time} - {currentSession.end_time}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className='h-10 w-10 flex items-center justify-center bg-active-bg border border-active-text/32 rounded-md'>
                    {paymentMethod === 'cash' ? (
                      <Banknote className="text-active-text" size={20} />
                    ) : (
                      <CreditCard className="text-active-text" size={20} />
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-foreground/60">Payment</p>
                    <p className="font-semibold text-active-text">
                      Paid - {paymentMethod === 'cash' ? 'Cash' : 'Card'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Success Message */}
            <div className="rounded-lg border border-success-text/32 bg-success-bg/30 p-4">
              <h3 className="mb-3 text-center text-lg font-semibold text-success-text">You're All Set!</h3>
              <ul className="space-y-2 text-sm text-foreground/80">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-success-text" />
                  Payment of ${currentSession.price} received and confirmed
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-success-text" />
                  Check-in complete - you're ready to play!
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-success-text" />
                  Receipt available at the front desk if needed
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-success-text" />
                  Enjoy your session!
                </li>
              </ul>
            </div>

            <Button
              onClick={handleDone}
              className="mt-8 h-14 w-full rounded-full bg-active-text text-lg font-semibold text-white leading-none"
            >
              Continue <ArrowRight />
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
