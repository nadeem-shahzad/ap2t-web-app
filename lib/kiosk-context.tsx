'use client'

import { createContext, useContext, useState, type ReactNode } from 'react'
import type { Player, Session, Booking } from './kiosk-data'

interface KioskState {
  player: Player | null
  session: Session | null
  checkInType: 'pre-booked' | 'walk-in' | null
  booking: (Booking & { session: Session }) | null
  approvalCode: string | null
  paymentMethod: 'cash' | 'card' | null
}

interface KioskContextType {
  state: KioskState
  setPlayer: (player: Player | null) => void
  setSession: (session: Session | null) => void
  setCheckInType: (checkInType: KioskState['checkInType']) => void
  setApprovalCode: (code: string | null) => void
  reset: () => void
}

const initialState: KioskState = {
  player: null,
  session: null,
  checkInType: null,
  booking: null,
  approvalCode: null,
  paymentMethod: null,
}

const KioskContext = createContext<KioskContextType | undefined>(undefined)

export function KioskProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<KioskState>(initialState)

  const setPlayer = (player: Player | null) => {
    setState((prev) => ({ ...prev, player }))
  }

  const setSession = (session: Session | null) => {
    setState((prev) => ({ ...prev, session }))
  }

  const setCheckInType = (checkInType: KioskState['checkInType']) => {
    setState((prev) => ({ ...prev, checkInType }))
  }

  const setApprovalCode = (approvalCode: string | null) => {
    setState((prev) => ({ ...prev, approvalCode }))
  }

  const reset = () => {
    setState(initialState)
  }

  return (
    <KioskContext.Provider
      value={{
        state,
        setPlayer,
        setSession,
        setCheckInType,
        setApprovalCode,
        reset,
      }}
    >
      {children}
    </KioskContext.Provider>
  )
}

export function useKiosk() {
  const context = useContext(KioskContext)
  if (context === undefined) {
    throw new Error('useKiosk must be used within a KioskProvider')
  }
  return context
}
