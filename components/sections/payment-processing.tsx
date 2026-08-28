'use client'

import { Button } from '@/components/ui/button'
import { useSafeEffect } from '@/hooks/use-safe-effect'
import axios from '@/lib/axios'
import { useKiosk } from '@/lib/kiosk-context'
import { Calendar, CheckCircle, CircleCheckBig, CircleX, Clock, CreditCard, Loader2, User } from 'lucide-react'
import moment from 'moment'
import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

export default function PaymentProcessingPage({ setStep }: { setStep: (val: number) => void }) {
    const { state, } = useKiosk()
    const { player, session } = state
    const [isProcessing, setIsProcessing] = useState(false)
    const [error, setError] = useState(false)
    const [max, setMax] = useState(false)
    const hasCalled = useRef(false)

    useSafeEffect(() => {
        if (player?.id && session?.id && !hasCalled.current) {
            chargePlayer(player.id, session.id)
        }
    }, [player?.id, session?.id])

    const chargePlayer = useCallback((id: number | undefined, sid: number | undefined) => {
        if (!id || !sid) return

        setError(false)
        setMax(false)
        setIsProcessing(true)

        axios.get(`/frontdesk/checkin/payment?id=${id}&sid=${sid}&price=${session?.price}&variant_id=${session?.selectedVariant?.id ?? ''}`)
            .then((response) => {
                if (!response.data?.success) {
                    toast.error(response.data?.message)
                    setStep(3)
                } else {
                    setStep(6)
                }
            })
            .catch((e) => {
                setError(true)
                if (e?.response?.data?.max) {
                    setMax(true)
                }
            })
            .finally(() => {
                setIsProcessing(false)
            })
    }, [session?.price, session?.selectedVariant?.id, setStep])




    return (
        <div className="flex flex-1 flex-col items-center justify-center px-6 py-8">
            <div className="w-full max-w-2xl rounded-xl border border-active-text bg-card p-8">

                {/* ICON */}
                <div className="mb-6 flex justify-center">
                    <div className="flex h-24 w-24 items-center justify-center rounded-full bg-active-bg">

                        {isProcessing && (
                            <Loader2 className="h-16 w-16 animate-spin text-primary" />
                        )}

                        {!isProcessing && !error && (
                            <CheckCircle className="h-16 w-16 text-active-text" />
                        )}

                        {error && (
                            <CircleX className="h-16 w-16 text-destructive" />
                        )}

                    </div>
                </div>

                {/* TITLE */}
                <h2 className="mb-2 text-center text-2xl font-bold text-foreground">
                    {isProcessing && "Processing Pending Payment"}
                    {!isProcessing && !error && "Payment Complete!"}
                    {error && "Payment Failed"}
                </h2>

                <p className="mb-6 text-center text-foreground/60">
                    {isProcessing && "Processing your pre-booked session payment..."}
                    {!isProcessing && !error && "Your session payment has been processed"}
                    {error && "We couldn't process your payment. Please try again."}
                </p>

                {/* AMOUNT */}
                <div className="mb-8 flex justify-center">
                    <div className="flex items-center gap-4 rounded-md bg-secondary px-6 py-3">
                        <CreditCard className="h-5 w-5 text-primary" />
                        <span className="text-muted-foreground">
                            Amount:
                            <span className="font-bold text-primary ml-1">
                                ${session?.price}
                            </span>
                        </span>
                    </div>
                </div>

                {/* SESSION DETAILS */}
                {!isProcessing && (
                    <div className="mb-8 rounded-lg border bg-secondary p-4">
                        <h3 className="mb-4 flex items-center gap-2 text-sm font-medium">
                            <CircleCheckBig size={20} /> Your Session Details
                        </h3>

                        <div className="grid grid-cols-2 gap-4">

                            <div className="flex items-center gap-2">
                                <div className="flex h-10 w-10 items-center justify-center rounded-md border border-active-text/32 bg-active-bg">
                                    <User className="text-active-text" size={20} />
                                </div>
                                <div>
                                    <p className="text-xs text-foreground/60">Player</p>
                                    <p className="font-semibold">{player?.name}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <div className="flex h-10 w-10 items-center justify-center rounded-md border border-active-text/32 bg-active-bg">
                                    <CreditCard className="text-active-text" size={20} />
                                </div>
                                <div>
                                    <p className="text-xs text-foreground/60">Session</p>
                                    <p className="font-semibold">{session?.name}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <div className="flex h-10 w-10 items-center justify-center rounded-md border border-active-text/32 bg-active-bg">
                                    <Calendar className="text-active-text" size={20} />
                                </div>
                                <div>
                                    <p className="text-xs text-foreground/60">Date</p>
                                    <p className="font-semibold">
                                        {session?.date && moment(session.date).format("YYYY-MM-DD")}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <div className="flex h-10 w-10 items-center justify-center rounded-md border border-active-text/32 bg-active-bg">
                                    <Clock className="text-active-text" size={20} />
                                </div>
                                <div>
                                    <p className="text-xs text-foreground/60">Time</p>
                                    <p className="font-semibold">
                                        {session?.start_time} - {session?.end_time}
                                    </p>
                                </div>
                            </div>

                        </div>
                    </div>
                )}

                {/* PROCESSING INFO */}
                {isProcessing && (
                    <div className="space-y-4">
                        <div className="rounded-lg border border-warning-text/30 bg-warning-bg p-4 text-center">
                            <p className="text-sm text-warning-text">
                                Please do not close this screen while payment is processing...
                            </p>
                        </div>

                        <div className="rounded-lg border border-info-text/30 bg-info-bg p-4">
                            <p className="text-sm text-info-text">
                                Your pre-booked session had a pending payment. We're now charging
                                the card on file to complete your check-in.
                            </p>
                        </div>
                    </div>
                )}

                {/* SUCCESS */}
                {!isProcessing && !error && (
                    <div className="space-y-4">

                        <div className="rounded-lg border border-[#D3FB20] bg-[#CBFD000D] p-4">
                            <ul className="space-y-2 text-sm text-foreground/80">

                                <li className="flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4 text-success-text" />
                                    Payment of ${session?.price} charged successfully
                                </li>

                                <li className="flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4 text-success-text" />
                                    Receipt sent to {player?.email}
                                </li>

                                <li className="flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4 text-success-text" />
                                    Check-in confirmed - proceed to field!
                                </li>

                            </ul>
                        </div>

                        <Button
                            onClick={() => setStep(6)}
                            className="h-12 w-full rounded-full bg-active-text px-8 text-white"
                        >
                            Continue to Check-In
                        </Button>

                    </div>
                )}

                {/* ERROR */}
                {error && !max && (
                    <div className="space-y-4">

                        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-center">
                            <p className="text-sm text-destructive">
                                Payment could not be processed. Please retry.
                            </p>
                        </div>

                        <Button
                            variant={"outline"}
                            className="h-12 w-full rounded-full px-8"
                            onClick={() => setStep(3)}
                        >
                            Continue to Manual
                        </Button>

                        <Button
                            className="h-12 w-full rounded-full px-8"
                            onClick={() => chargePlayer(player?.id, session?.id)}
                        >
                            Retry Payment
                        </Button>
                    </div>
                )}

                {error && max &&
                    <Button
                        className="h-12 w-full rounded-full px-8"
                        onClick={() => setStep(1)}
                    >
                        Select Other Session
                    </Button>}

            </div>
        </div>
    )
}
