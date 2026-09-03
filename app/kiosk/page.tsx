"use client"
import ApprovalWaitingPage from "@/components/sections/approval/waiting";
import CashPaymentPage from "@/components/sections/cash-payment";
import CheckInConfirmedPage from "@/components/sections/checkin-confirmed";
import PaymentConfirmedPage from "@/components/sections/payment-confirmation";
import PaymentProcessingPage from "@/components/sections/payment-processing";
import PaymentRequiredPage from "@/components/sections/payment-required";
import SearchPage from "@/components/sections/search";
import SessionSelectPage from "@/components/sections/session-select";
import SessionReviewPage from "@/components/sections/session-review";
import { useKiosk } from "@/lib/kiosk-context";
import { useState } from "react";

export default function Page() {

  const [step, setStep] = useState(0)
  const { setPlayer, setSession, setCheckInType } = useKiosk()

 const RenderView = {
  0: () => (
    <SearchPage
      onClick={(val) => {
        setPlayer(val.user)
        setSession(val.session)
        setCheckInType(val.session ? 'pre-booked' : 'walk-in')
        if (val.session) {
          setStep(5)
        } else {
          setStep(1)
        }
      }}
    />
  ),

  1: () => <SessionSelectPage setStep={setStep} />,

  2: () => <PaymentProcessingPage setStep={setStep} />,

  5: () => <SessionReviewPage setStep={setStep} />,

  3 : ()=> <PaymentRequiredPage setStep={setStep}/>,

  4 : ()=> <CashPaymentPage setStep={setStep}/>,

  6 : () => <CheckInConfirmedPage />,

  7 : () => <PaymentConfirmedPage setStep={setStep}/>,

  8 : ()=> <ApprovalWaitingPage setStep={setStep} />
}


  return RenderView[step as keyof typeof RenderView]?.()
}

