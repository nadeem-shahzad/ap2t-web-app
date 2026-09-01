'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Clock, User, Calendar, DollarSign, Info, Loader2, XCircle, CheckCircle, CreditCard, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useKiosk } from '@/lib/kiosk-context'
import { useApproval } from '@/hooks/use-approval'
import moment from 'moment'

export default function ApprovalWaitingPage({ setStep }: { setStep: (val: number) => void }) {
  const router = useRouter()
  const { state, reset } = useKiosk()
  const { player, session, booking, approvalCode } = state
  const currentSession = booking?.session || session
  const { loading: isWaiting, error } = useApproval(
    player?.id,
    currentSession?.id,
    currentSession?.is_daily_payment ? new Date().toISOString().slice(0, 10) : undefined,
  )


  if (!player || !currentSession || !approvalCode) {
    return null
  }

  if (!error && !isWaiting) {
    return (
      <ApprovedSection setStep={setStep} />
    );
  }

  return (


    <div className="flex flex-1 items-center justify-center px-4 sm:px-6 py-6 sm:py-10">
      <div className="w-full max-w-xl rounded-xl border border-alternative-text bg-card p-6 sm:p-8">

        {/* Icon */}
        <div className="mb-6 flex justify-center">
          <div className="relative flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-full bg-alternative-bg">
            {error ? (
              <XCircle className="h-12 w-12 sm:h-16 sm:w-16 text-red-500" />
            ) : isWaiting ? (
              <Loader2 className="h-12 w-12 sm:h-16 sm:w-16 animate-spin text-alternative-text" />
            ) : (
              <Clock className="h-12 w-12 sm:h-16 sm:w-16 text-alternative-text" />
            )}
          </div>
        </div>

        {/* Heading */}
        <h2 className={`text-center text-xl sm:text-2xl font-bold 
  ${error ? "text-red-500" : "text-warning-text"}`}>

          {error
            ? "Approval Rejected"
            : isWaiting
              ? "Approval Request Sent"
              : "Ready for Approval"}
        </h2>

        <p className="mt-2 mb-8 text-center text-xs text-muted-foreground">
          {error
            ? "Front desk has rejected your request. Please contact staff."
            : isWaiting
              ? "Please wait while front desk staff reviews your request"
              : "Staff is ready to approve your check-in"}
        </p>

        {/* Approval Code */}
        <div className="mb-8 rounded-lg border border-success-text/32 bg-success-bg/50 p-5 sm:p-6 text-center">
          <p className="mb-2 text-xs sm:text-sm text-muted-foreground">
            Show this code to front desk staff
          </p>
          <p className="text-3xl sm:text-4xl font-bold tracking-widest text-primary">
            {approvalCode}
          </p>
          <p className="mt-2 text-xs sm:text-sm text-primary">
            Approval Request ID
          </p>
        </div>

        {/* Session Details */}
        <div className="mb-6 rounded-lg border bg-secondary p-4 sm:p-5">
          <h3 className="mb-4 text-xs sm:text-sm ">
            Session Details
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* Player */}
            <div className="flex items-center gap-3">
              <div className='h-10 w-10 flex items-center justify-center bg-success-bg border border-success-text/32 rounded-md'>
                <User className="text-success-text" size={20} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Player</p>
                <p className="text-sm font-semibold text-foreground">
                  {player.name}
                </p>
              </div>
            </div>

            {/* Member */}
            <div className="flex items-center gap-3">
              <div className='h-10 w-10 flex items-center justify-center bg-success-bg border border-success-text/32 rounded-md'>
                <Info className="text-success-text" size={20} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Member #</p>
                <p className="text-sm font-semibold text-foreground">
                  {player.id}
                </p>
              </div>
            </div>

            {/* Session */}
            <div className="flex items-center gap-3">
              <div className='h-10 w-10 flex items-center justify-center bg-success-bg border border-success-text/32 rounded-md'>

                <Calendar className="text-success-text" size={20} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Session</p>
                <p className="text-sm font-semibold text-foreground">
                  {currentSession.name}
                </p>
              </div>
            </div>

            {/* Time */}
            <div className="flex items-center gap-3">
              <div className='h-10 w-10 flex items-center justify-center bg-success-bg border border-success-text/32 rounded-md'>

                <Clock className="text-success-text" size={20} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Time</p>
                <p className="text-sm font-semibold text-foreground">
                  {currentSession.start_time}
                </p>
              </div>
            </div>

          </div>

          {/* Payment Banner */}
          <div className="mt-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-lg bg-warning-bg/50 p-4">
            <div className="flex items-center gap-2">
              <div className='h-10 w-10 flex items-center justify-center bg-warning-bg border border-warning-text/32 rounded-md'>
                <DollarSign className="text-warning-text" size={20} />
              </div>
              <div>
                <div className="text-xs sm:text-sm text-muted-foreground">
                  Amount Due (Pending Payment)
                </div>
                <div className="text-base sm:text-lg font-bold text-warning-text">
                  ${currentSession.price}
                </div>
              </div>

            </div>

            <Button className='bg-warning-text text-black rounded-md'>
              PAYMENT REQUIRED
            </Button>



          </div>
        </div>

        {/* Info Section */}
        <div className="rounded-lg border bg-secondary p-4 sm:p-5">
          <h3 className="mb-3 flex items-center gap-2 text-xs sm:text-sm font-medium text-primary">
            <Info className="h-4 w-4" />
            {error ? "What to do next" : "What to do while you wait"}
          </h3>

          <ul className="space-y-2 text-xs sm:text-sm text-foreground/70">
            {error ? (
              <>
                <li className="flex items-start gap-2">
                  <span className="text-foreground/40">1.</span>
                  Visit the front desk for clarification
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-foreground/40">2.</span>
                  Check your session eligibility
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-foreground/40">3.</span>
                  Request approval again if needed
                </li>
              </>
            ) : <>
              <li className="flex items-start gap-2">
                <span className="text-foreground/40">1.</span>
                Proceed to the front desk with your approval code
              </li>
              <li className="flex items-start gap-2">
                <span className="text-foreground/40">2.</span>
                Staff will verify your session and approve participation
              </li>
              <li className="flex items-start gap-2">
                <span className="text-foreground/40">3.</span>
                You'll receive confirmation once approved
              </li>
            </>}
          </ul>
        </div>

      </div>
    </div>


  )
}

const ApprovedSection = ({ setStep }: { setStep: (val: number) => void }) => {

  const { state, } = useKiosk()
  const { player, session } = state
  const currentSession = session

  const handleDone = () => {
    setStep(6)
  }

  if (!player || !currentSession) {
    return null
  }


  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-8">
      <div className="w-full max-w-xl rounded-xl border-2 border-active-text/50 bg-card p-8">


        <div className="mb-6 flex justify-center">
          <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-active-bg">

            <CheckCircle className="h-16 w-16 text-active-text" />

          </div>
        </div>


        <h2 className={`mb-2 text-center text-2xl font-bold text-active-text`}>
          All Set!
        </h2>

        <p className="mb-6 text-center text-foreground/60">
          Your request has been approved successfully.
        </p>



        <div className="mb-8 flex justify-center">
          <div className="flex items-center gap-2 rounded-md bg-secondary px-6 py-3">

            <CreditCard className="h-5 w-5" />
            <span className="font-bold text-primary ml-1">${currentSession.price}</span>
          </div>
        </div>


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

                <CreditCard className="text-active-text" size={20} />

              </div>
              <div>
                <p className="text-xs text-foreground/60">Payment</p>
                <p className="font-semibold text-active-text">
                  Pending
                </p>
              </div>
            </div>
          </div>
        </div>


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

      </div>
    </div>
  )
}
