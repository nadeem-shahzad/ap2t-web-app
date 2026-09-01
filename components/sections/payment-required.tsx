'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, CreditCard, User, Clock, DollarSign, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useKiosk } from '@/lib/kiosk-context'
import { generateApprovalCode } from '@/lib/kiosk-data'
import axios from '@/lib/axios'
import { Spinner } from '../ui/spinner'
import BackButton from '../back-button'

export default function PaymentRequiredPage({ setStep }: { setStep: (val: number) => void }) {
  const router = useRouter()
  const { state, setApprovalCode, reset } = useKiosk()
  const { player, session, } = state
  const [loading, setLoading] = useState(false)

  const currentSession = session

  useEffect(() => {
    if (!player || !currentSession) {
    }
  }, [player, currentSession, router])

  const handlePayCash = () => {
    setStep(4)
  }

  const handleRequestApproval = async () => {
    const code = generateApprovalCode()
    setApprovalCode(code)
    setLoading(true)
    try {
      await axios.post(`/frontdesk/actions`, {
        user_id: player?.id,
        session_id: session?.id,
        referal_code: code,
        price: session?.price,
        action: "approval",
        status: "waiting",
        session_date: currentSession.is_daily_payment ? new Date().toISOString().slice(0, 10) : null,
        created_at: new Date()
      })
      setStep(8)
    } finally {
      setLoading(false)
    }
  }

  if (!player || !currentSession) {
    return null
  }

  return (
    <div className="flex flex-col">
      <BackButton onClick={() => setStep(1)} />
      <div className="flex flex-1 items-center justify-center px-4 sm:px-6 py-6 sm:py-10">
        <div className="w-full max-w-2xl rounded-xl border  bg-card p-6 sm:p-8">

          {/* Icon */}
          <div className="mb-6 flex justify-center">
            <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full bg-warning-bg">
              <AlertTriangle className="h-8 w-8 sm:h-10 sm:w-10 text-warning-text" />
            </div>
          </div>

          {/* Heading */}
          <h2 className="text-center text-xl sm:text-2xl font-bold text-warning-text">
            No Payment Method Found
          </h2>

          <p className="mt-2 text-center text-sm sm:text-base text-muted-foreground">
            We couldn't find a credit card on file for this account
          </p>

          {/* Badge */}
          <div className="mt-6 flex justify-center">
            <div className="flex items-center gap-2 rounded-md border  bg-secondary px-4 py-2 text-xs sm:text-sm text-foreground">
              <CreditCard className="h-4 w-4" />
              Payment required before check-in
            </div>
          </div>

          {/* Session Details */}
          <div className="mt-8 rounded-lg border  bg-secondary p-4 sm:p-6">
            <h3 className="mb-5 text-sm font-medium text-primary text-center sm:text-left">
              Selected Session Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

              {/* Player */}
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 flex items-center justify-center bg-successs-bg border border-success-text/32 rounded-md">
                  <User className="text-success-text" size={18} />
                </div>
                <div>
                  <p className="text-xs text-foreground/60">Player</p>
                  <p className="text-sm font-semibold text-foreground">{player.name}</p>
                </div>
              </div>

              {/* Session */}
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 flex items-center justify-center bg-successs-bg border border-success-text/32 rounded-md">
                  <CreditCard className="text-success-text" size={18} />
                </div>
                <div>
                  <p className="text-xs text-foreground/60">Session</p>
                  <p className="text-sm font-semibold text-foreground">{currentSession?.name}</p>
                </div>
              </div>

              {/* Time */}
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 flex items-center justify-center bg-successs-bg border border-success-text/32 rounded-md">
                  <Clock className="text-success-text" size={18} />
                </div>
                <div>
                  <p className="text-xs text-foreground/60">Time</p>
                  <p className="text-sm font-semibold text-foreground">{currentSession?.start_time} - {currentSession?.end_time}</p>
                </div>
              </div>

              {/* Amount */}
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 flex items-center justify-center bg-successs-bg border border-success-text/32 rounded-md">
                  <DollarSign className="text-success-text" size={18} />
                </div>
                <div>
                  <p className="text-xs text-foreground/60">Amount Due</p>
                  <p className="text-sm font-semibold text-warning-text">
                    ${currentSession.price}
                  </p>
                </div>
              </div>

            </div>
          </div>

          {/* CTA Title */}
          <h3 className="mt-10 mb-6 text-center text-lg sm:text-xl text-primary">
            How would you like to proceed?
          </h3>

          {/* Options */}
          <div className="grid gap-5 sm:gap-6 md:grid-cols-2">

            {/* Pay Cash */}
            <div className="rounded-lg border-2 border-primary/50 bg-primary/5 p-5 sm:p-6">
              <div className="flex justify-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20">
                  <DollarSign className="h-6 w-6 text-primary" />
                </div>
              </div>

              <h4 className="mt-4 text-center text-base sm:text-lg font-semibold text-foreground">
                Pay Cash Now
              </h4>

              <p className="mt-2 text-center text-xs sm:text-sm text-foreground/60">
                Proceed to front desk and pay ${currentSession.price} in cash
              </p>

              <ul className="mt-4 space-y-2 text-xs sm:text-sm text-foreground/60">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  Immediate payment
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  Check-in after payment
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  No card needed
                </li>
              </ul>

              <Button
                onClick={handlePayCash}
                className="mt-5 w-full bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Pay with Cash
              </Button>
            </div>

            {/* Request Approval */}
            <div className="rounded-lg border border-[#4F4F4F] bg-[#18181B] p-5 sm:p-6">
              <div className="flex justify-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-foreground/10">
                  <User className="h-6 w-6 text-foreground/60" />
                </div>
              </div>

              <h4 className="mt-4 text-center text-base sm:text-lg font-semibold text-foreground">
                Request Approval
              </h4>

              <p className="mt-2 text-center text-xs sm:text-sm text-foreground/60">
                Play now, parent/guardian pays later
              </p>

              <ul className="mt-4 space-y-2 text-xs sm:text-sm text-foreground/60">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-foreground/40" />
                  Play today
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-foreground/40" />
                  Parent gets email
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-foreground/40" />
                  Pay when card added
                </li>
              </ul>

              <Button
                onClick={handleRequestApproval}
                variant="outline"
                className="mt-5 w-full"
                disabled={loading}
              >
                {loading && <Spinner className='text-foreground' />}  Request Approval
              </Button>
            </div>

          </div>

          <p className="mt-8 text-center text-xs sm:text-sm text-foreground/40">
            * Front desk staff can help you with either option
          </p>

        </div>
      </div>
    </div>


  )
}


