'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Banknote, User, Calendar, Clock, ArrowRight, CheckCircle, CreditCard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useKiosk } from '@/lib/kiosk-context'
import moment from 'moment'
import axios from '@/lib/axios'
import { Spinner } from '../ui/spinner'
import BackButton from '../back-button'

export default function CashPaymentPage({ setStep }: { setStep: (val: number) => void }) {
  const router = useRouter()
  const { state } = useKiosk()
  const { player, session } = state
  const [loading, setLoading] = useState(false)
  const currentSession = session

  useEffect(() => {
    if (!player || !currentSession) {
      // router.push('/')
    }
  }, [player, currentSession, router])

  const handleProceedToFrontDesk = async () => {

    setLoading(true)
    try {
      await axios.post(`/frontdesk/actions`, {
        user_id: player?.id,
        session_id: session?.id,
        price: session?.price,
        action: "cash",
        status: "waiting",
        session_date: currentSession.is_daily_payment ? moment().format("YYYY-MM-DD") : null,
        created_at: new Date()
      })
      setStep(7)
    } finally {
      setLoading(false)
    }

  }


  if (!player || !currentSession) {
    return null
  }

  return (

    <div className="flex flex-col">
      <BackButton onClick={() => setStep(3)} />
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-8">
        <div className="w-full max-w-xl rounded-xl border border-primary bg-card p-8">
          <div className="mb-6 flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/20">
              <Banknote className="h-12 w-12 text-primary" />
            </div>
          </div>

          <h2 className="mb-2 text-center text-2xl font-bold text-primary">Ready to Pay with Cash</h2>
          <p className="mb-6 text-center text-foreground/60">
            Please proceed to the front desk to complete your payment
          </p>

          <div className="mb-8 flex justify-center">
            <div className="flex items-center gap-4 rounded-md bg-secondary px-6 py-3">
              <CreditCard className="h-5 w-5 text-primary" />
              <span className="text-muted-foreground">Amount:  <span className=" font-bold text-primary">${currentSession.price}</span></span>

            </div>
          </div>

          <div className="mb-8 rounded-lg border border-primary/20 bg-secondary p-4">
            <h3 className="mb-4 text-sm font-medium text-primary">Selected Session Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <div className='h-10 w-10 flex items-center justify-center bg-success-bg border border-success-text/32 rounded-md'>
                  <User className="text-success-text" size={20} />
                </div>
                <div>
                  <p className="text-xs text-foreground/60">Player</p>
                  <p className="font-semibold text-foreground">{player.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className='h-10 w-10 flex items-center justify-center bg-success-bg border border-success-text/32 rounded-md'>

                  <CreditCard className="text-success-text" size={20} />
                </div>
                <div>
                  <p className="text-xs text-foreground/60">Session</p>
                  <p className="font-semibold text-foreground">{currentSession.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className='h-10 w-10 flex items-center justify-center bg-success-bg border border-success-text/32 rounded-md'>

                  <Calendar className="text-success-text" size={20} />
                </div>
                <div>
                  <p className="text-xs text-foreground/60">Date</p>
                  <p className="font-semibold text-foreground">{currentSession.date && moment(currentSession.date).format("YYYY-MM-DD")}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className='h-10 w-10 flex items-center justify-center bg-success-bg border border-success-text/32 rounded-md'>

                  <Clock className="text-success-text" size={20} />
                </div>
                <div>
                  <p className="text-xs text-foreground/60">Time</p>
                  <p className="font-semibold text-foreground">{currentSession?.start_time} - {currentSession?.end_time}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-8 rounded-lg border border-success-text/32 bg-success-bg/30 p-4">
            <h3 className="mb-4 text-center text-lg font-medium text-success-text">Next Steps</h3>
            <ol className="space-y-2 text-sm text-foreground/80">
              <li className="flex items-start gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full  text-xs text-success-text">
                  1
                </span>
                Proceed to the front desk with your cash payment
              </li>
              <li className="flex items-start gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full  text-xs text-success-text">
                  2
                </span>
                Front desk staff will process your ${currentSession.price} payment
              </li>
              <li className="flex items-start gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full  text-xs text-success-text">
                  3
                </span>
                Staff will mark your session as "paid with cash"
              </li>
              <li className="flex items-start gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full  text-xs text-success-text">
                  4
                </span>
                You'll receive confirmation and can proceed to your session!
              </li>
            </ol>
          </div>

          <div className="text-center">
            <p className="mb-4 flex items-center justify-center gap-2 text-primary">
              <CheckCircle className="h-5 w-5" />
              Front Desk is Ready to Help
            </p>
            <Button
              disabled={loading}
              onClick={handleProceedToFrontDesk}
              className="h-14 w-full max-w-md rounded-full  px-8 text-lg font-semibold"
            >
              Proceed to Front Desk {loading ? <Spinner /> : <ArrowRight className="ml-2 h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
