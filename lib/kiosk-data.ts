export interface Player {
  id  : number
  name: string
  picture: string
  hasCardOnFile: boolean
  email?: string
  parentEmail?: string
}

export interface Session {
  id  : number
  name: string
  date: string
  end_date : string
  start_time: string
  end_time : string
  price: number | string
  original_price:string|number
  promotion:boolean
  max_players: number
  total_enrolled: number
  spots_left  : number
  is_daily_payment?: boolean
  variants?: SessionVariant[]
  selectedVariant?: SessionVariant | null
}

export interface SessionVariant {
  id: number
  hour: string | number
  price: number | string
}

export interface Booking {
  id  : number
  playerId: number
  sessionId: number
  paymentStatus: 'paid' | 'pending' | 'unpaid'
  type: 'pre-booked' | 'walk-in'
}



export function generateApprovalCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

export function generateConfirmationCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}
