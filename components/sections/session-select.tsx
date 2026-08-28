'use client'

import axios from '@/lib/axios'
import { useKiosk } from '@/lib/kiosk-context'
import { type Session } from '@/lib/kiosk-data'
import { Calendar, ChevronRight, Clock, User, Users } from 'lucide-react'
import moment from 'moment'
import { useEffect, useState } from 'react'
import { Spinner } from '../ui/spinner'
import BackButton from '../back-button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog'

export default function SessionSelectPage({ setStep }: { setStep: (val: number) => void }) {
  const { state, setSession } = useKiosk()
  const { player } = state
  const [sessions, setSessions] = useState<Session[] | null>([])
  const [addLoading, setAddLoading] = useState(false)
  const [sessionForVariant, setSessionForVariant] = useState<Session | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {

    axios.get(`/frontdesk/sessions`)
      .then((response) => {
        setSessions(response.data)
      })

  }

  async function handleClick(val: Session) {
    const player_id = player?.id
    const session_id = val?.id

    if (!player_id || !session_id) return
    if (val.variants?.length) {
      setSessionForVariant(val)
      return
    }

    setSession(val)
    setStep(2)

    // try {
    //   setAddLoading(true)
    //   await axios.post(`/frontdesk/sessions?id=${player_id}&sid=${session_id}`)

    // } finally {
    //   setAddLoading(false)
    // }
  }

  function handleVariantSelect(variant: NonNullable<Session['variants']>[number]) {
    if (!sessionForVariant) return

    setSession({
      ...sessionForVariant,
      price: variant.price,
      selectedVariant: variant,
    })
    setSessionForVariant(null)
    setStep(2)
  }




  if (!player) {
    return null
  }

  return (
    <div className="flex flex-col">
       <BackButton onClick={()=> setStep(0)}/>
      <div className="flex items-center justify-center gap-4 px-6 py-4">
        <div className='flex flex-col items-center justify-center'>
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <User className="h-8 w-8 text-foreground" />
          </div>
          <div className='flex flex-col items-center justify-center'>
            <p className="text-xl font-semibold text-primary">{player.name}</p>

          </div>
        </div>
      </div>
      <div className="flex flex-col items-center px-6 py-12">
        <div className="w-[90dvw] px-6 py-8">
          <h2 className="mb-6 text-xl font-semibold text-foreground tracking-wide">Available Sessions Today</h2>

          <div className="space-y-4">
            {sessions?.map((session) => (
              <button
              disabled={addLoading}
                key={session.id}
                onClick={() => handleClick(session)}
                className="flex w-full items-center justify-between rounded-lg border border-border bg-[#18181B] p-5 transition-all"
              >
                <div className="flex-1">
                  <h3 className="text-xl text-left font-semibold text-foreground tracking-wide">{session.name}</h3>
                  <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-foreground/60">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {session.date && moment(session.date).format("YYYY-MM-DD")}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {session?.start_time} - {session?.end_time}
                    </span>
                    <span
                      className={`flex items-center gap-1 ${session?.spots_left <= 3 ? 'text-warning-text' : 'text-foreground/60'
                        }`}
                    >
                      <Users className="h-4 w-4" />
                      {session?.spots_left} of {session?.max_players} spots left
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-xs text-foreground/60">Session Price</p>
                    {session?.promotion&&<span className="text-sm line-through text-muted-foreground">{session?.original_price}</span>}
                    <p className="text-2xl font-bold text-primary">${session?.price}</p>
                  </div>
                  {addLoading ? <Spinner className="h-6 w-6 text-primary"/> : <ChevronRight className="h-6 w-6 text-foreground/40" />}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <Dialog
        open={!!sessionForVariant}
        onOpenChange={(open) => {
          if (!open) setSessionForVariant(null)
        }}
      >
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Select a session option</DialogTitle>
            <DialogDescription>
              Choose the duration and price for {sessionForVariant?.name}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {sessionForVariant?.variants?.map((variant) => (
              <button
                key={variant.id}
                type="button"
                onClick={() => handleVariantSelect(variant)}
                className="flex w-full items-center justify-between rounded-lg border border-border bg-secondary p-4 text-left transition-colors hover:bg-secondary/70"
              >
                <span className="font-semibold text-foreground">{variant.hour} hour{Number(variant.hour) === 1 ? '' : 's'}</span>
                <span className="text-xl font-bold text-primary">${variant.price}</span>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>



    </div>
  )
}
