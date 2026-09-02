import { Moment } from "moment"
import { ReactNode } from "react"

export type CalendarEvent = {
  id: string
  title: string
  date: string
  type: 'active' | 'info' | 'warning' | 'danger'
  time: string
  sessionType: string
  status: string
  children: { user_id: number, last_name: string, first_name: string }[]
  enrolled: boolean
  start_date: string | null
  end_date: string | null
  end_time: string
  originalId: string | number
  price: string | number
  original_price: string | number
  promotion: boolean
  variants?: { id: number; hour: number; price: string | number }[]
  is_daily_payment?: boolean
  enrolled_dates?: string[]
  enrolled_dates_by_player?: Record<string, string[]>
}

export type CustomCalendarProps = {
  events?: CalendarEvent[],
  player_id: string | null | undefined,
  onSuccess: () => Promise<void>,
  parent_id: string | null | undefined | number,
  loading?: boolean,
  currentMonth: Moment,
  setCurrentMonth: (item: any) => void
}

export interface SessionDataType {
  id: string;
  sessionName: string;
  description: string;
  type: string;
  date: string;
  end_date: string;
  time: string;
  coachName: string;
  playerName: string;
  price: string;
  payment: string;
  status: string;
  max_players?: number;
  location?: string;
  promotion_price?: string;
  comped: boolean
  coach_id?: string | number
}

export type Event = {
  title: string;
  date: string;
  time: string;
  end_time: string;
  end_date ?: string
  status: "Available" | "Booked" | "Blocked" | string;
}

export interface WeeklyScheduleProps {
  events: Event[];
  id: string | null
  preference: Record<string, string> | null | undefined
}



export interface CoachResponse {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  status: string;
  picture: string | null;
  location: string | null;
  phone_no: string | null;
  joining_date: string | null;
  birth_date: string | null;
  created_at: string;

  profile: CoachProfile;

  session_data: SessionDataCoach[];
  payment_data: PaymentDataCoach[];
  this_month_revenue: string
  last_month_revenue: string
  average_price_per_session: string
  total_revenue: string
}

export interface CoachProfile {
  id: number;
  bio: string | null;
  rating: number | null;
  user_id: number;
  created_at: string;
  career_start: string | null;

  specialities: string[];
  certifications: string[];

  schedule_preference: Record<string, string> | null;
}

export interface SessionDataCoach {
  id: number;
  name: string;
  description: string;
  status: string;
  session_type: string;
  coach_id: number;
  location: string;

  start_time: string;
  end_time: string;
  date: string;
  end_date: string;

  price: number;
  promotion_price: number;

  max_players: number;
  apply_promotion: boolean;
  show_storefront: boolean;

  image: string;
  session_rating: number
  created_at: string;
  payment_detail: {
    amount: number
    created_at: string
    id: number
    method: string | null
    paid_at: string | Date | null
    session_id: number
    status: string
    transaction_id: string | null
    user_id: number
  }[]
}

export interface PaymentDataCoach {
  id: number;
  session_id: number;
  user_id: number;
  amount: number;
  status: string;
  created_at: string;
}


export type PaymentData = {
  transactionId: string;
  transactionNote: string;
  parentName: string;
  playerName: string;
  session: string;
  amount: number;
  methodType: string;
  methodDetail: string;
  date: string;
  time: string;
  status: "Completed" | "Pending" | "Failed" | "Comped" | "Voided";
  id: number;
};

export type SquareSavedCard = {
  id: string;
  cardBrand: string;
  last4: string;
  expMonth: string; // could also be number
  expYear: string;  // could also be number
  cardholderName: string;
  billingAddress: {
    postalCode?: string;
    [key: string]: any; // in case other fields exist
  };
  fingerprint: string;
  customerId: string;
  merchantId: string;
  enabled: boolean;
  cardType: "CREDIT" | "DEBIT" | string;
  prepaidType: "PREPAID" | "NOT_PREPAID" | string;
  bin: string;
  createdAt: string; // ISO date string
  version: string;
  hsaFsa: boolean;
};

export type coachinfoType = {
  id: number
  name: string;
  email: string;
  phoneNo: string;
  status: string;
  bio: string;
  notification: string;
  specialities: string[];
  certifications: string[];
  preferedSchedule: string;
  totalSessions: string;
  completed: string;
  upComing: string;
  players: string;
  avgRating: string;
};

export type CoachCardNamesType = {
  totalSessions: string;
  completed: string
  upComing: string
  players: string
}

export type DashboardDataResponse = {
  totals: {
    totalRevenue: number;
    totalSessions: number;
    totalPending: number;
    totalComped: number;
    averageAttendance?: number
  };
  revenueBySession: {
    session_name: string;
    value: number;
  }[];
  sessionTypeData: {
    name: string;
    value: number;
    fill: string;
  }[];
  monthlyRevenueTrend: {
    month: string;
    value: number;
  }[];
  playerAttendanceData: {
    id: number;
    name: string;
    sessions: number;
    attended: number;
    missed: number;
    attendance_rate: number;
  }[];
  zipcodeData: {
    avg_revenue: string
    total_revenue: string
    total_users: string
    zip_code: string
    id : number
  }[];
  revenueByCoach?: {
    coach: string;
    value: number;
  }[]
};


export type SessionProps = {
  id: number,
  sessionName: string,
  type: string,
  date: string,
  rawDate : string
  time: string,
  end_date: string,
  coachName: string,
  coachPicture ?:string
  price: string | number,
  status: string
  original: any
  promotion ?:boolean
  original_price ?: string
  enrolled :boolean
  is_daily_payment?: boolean
  enrolled_dates?: string[]
  enrolled_dates_by_player?: Record<string, string[]>
  children: { user_id: number, last_name: string, first_name: string }[]
  location ?:string
  variants?: { id: number; hour: number; price: string | number }[]
}


export type SquareMode = "test" | "live";

export type SquareCredentials = {
  merchantId: string;
  locationId: string;
  apiKey: string;
};

export type SquareIntegrationState = {
  mode: SquareMode;
  credentials: {
    test: SquareCredentials;
    live: SquareCredentials;
  };
};

export type SquareFieldKey = keyof SquareCredentials;

export type ProfileInfoProps = {
  first_name: string,
  last_name: string,
  email: string,
  phone_no: string,
  location: string,
  birth_date: Date | undefined,
}

export type NotificationSetting = {
  title: string;
  description: string;
  value: boolean;
  icon: ReactNode;
};

export type FrontDeskActionData = {
  id: number;
  session_name: string;
  player_name: string;
  date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  session_date?: string | null;
  referal_code: string | null;
  price: number;
  action: "cash" | "approval";
  status: "waiting" | "accepted" | "rejected";
};


export interface ParentDetailResponse {
  parent: Parent;
  stats: ParentStats;
  linked_childrens: LinkedChildren[];
  sessions: ParentSession[];
  payments: PaymentItemParent[]
}

export type PaymentItemParent = {
  id: number;
  session_name: string
  transaction_id: string;
  user_id: number;
  session_id: number;
  amount: string; // or number if you prefer to convert
  method: string;
  status: "paid" | "pending" | "failed" | "comped" | "refunded";
  paid_at: string; // ISO date string
  created_at: string; // ISO date string
  comped_category: string | null;
  comped_reason: string | null;
};


export interface Parent {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  status: string;
  zip_code: string
  picture: string | null;
  location: string | null;
  phone_no: string | null;
  joining_date: string | null;
  birth_date: string | null;
  created_at: string;
  profile: ParentProfile;
  square_card_id?: string | null
}

export interface ParentProfile {
  id: number;
  user_id: number;
  created_at: string;
}

export interface ParentStats {
  total_linked_children: number;
  total_spent: number;
  upcoming_sessions: number;
}

export interface LinkedChildren {
  player_id: number;
  user_id: number;
  first_name: string;
  last_name: string;
  birth_date: string;
  picture: string | null;
  total_sessions: number;
  skill_level: string
  next_session: ChildNextSession | null;
}

export interface ChildNextSession {
  date: string;
  start_time: string;
}

export interface ParentSession {
  session_id: number;
  name: string;
  comped: boolean;
  status: string;
  date: string;
  start_time: string;
  end_time: string;
  coach_first_name: string;
  coach_last_name: string;
  price: string;
  apply_promotion: boolean
  promotion_price: string
  players: SessionPlayer[];
}
export interface SessionPlayer {
  first_name: string;
  last_name: string;
}

export type NotificationType = {
  id: number;
  title: string
  to: number;
  from: number;
  route: string;
  msg: string;
  to_name: string
  read: boolean;
  created_at: string;
};

export type ReviewType = {
  id: number;
  title: string;
  description: string;
  name: string;
  designation: string;
  rating: number;
  admin: boolean;
  show: boolean;
  showChanged?: boolean
};


export type SessionCoach = {
  id: number;
  name: string;
  description: string;
  status: string;
  session_type: string;
  coach_id: number;
  location: string;
  start_time: string;
  end_time: string;
  date: string;
  end_date: string;
  price: string;
  max_players: number;
  apply_promotion: boolean;
  created_at: string;
  promotion_price: string;
  image: string;
  show_storefront: boolean;
  comped: boolean;
  promotion_start: string | null;
  promotion_end: string | null;
  type: "camp" | "clinic" | string;
  age_limit: string;
  coach_first_name: string;
  coach_last_name: string;
}

export type SessionType = {
  name: string;
  description: string;
  type: string;
  age_limit: string;
  session_type: string;
  coach_id: number | null;
  coach_name: string;
  location: string;
  date: null | Date;
  start_time: string;
  status: string;
  end_time: string;
  price: number | string;
  is_daily_payment?: boolean;
  max_players: number | string;
  apply_promotion: boolean;
  promotion_price?: number | string;
  image: string;
  end_date: null | Date;
  promotion_start: null | Date;
  promotion_end: null | Date;
  show_storefront: boolean;
  coach_schedule_preference?: any
};
export type BookedSession = {
  name: string;
  date: string;
  end_date: string;
  start_time: string;
  end_time: string;
};



export type PaymentRecord = {
  amount: string
  parent_id: number
  parent_first_name: string
  parent_last_name: string
  user_id: number
  user_first_name: string
  user_last_name: string
  status: string
  id: number
}

export type DashboardStats = {
  totalCheckIns: number;
  checkInsDifference: number;
  checkInsChangePercentage: number;
  totalRevenue: number;
  revenueChangePercentage: number;
  pendingToday: number;
  pendingChangePercentage: number;
  upcomingToday: number;
  upcomingChangePercentage: number;
  attendanceData: AttendanceRecord[];
  sessionsData: SessionRecord[];
  paymentAlerts: PaymentRecord[]
}
export type AttendanceRecord = {
  id: number;
  session_id: number;
  user_id: number;
  status: "present" | "absent" | string;
  created_at: string;
}
export type SessionRecord = {
  id: number;
  session_type: string;
  name: string;
  start_time: string;
  end_time: string;
  coach_id: number;
  status: "upcoming" | "completed" | string;
  coach_first_name: string;
  coach_last_name: string;
  coach_name: string;
}


export type CampClinicSession = {
  id: number;
  session_type: string;
  type: string;
  name: string;
  description: string;
  date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  age_limit: string;
  apply_promotion: boolean;
  promotion_price: string;
  price: string;
  max_players: number;
  is_daily_payment?: boolean;
  total_enrolled_players: number;
  total_left: number;
  location : string
  image ?: string
}

export type CampClinicCard = {
  id: string | number,
  badge: "CAMP" | "CLINIC";
  image?: string;
  title: string;
  description: string;
  price: number;
  left: number
  details: [
    string,
    string,
    string,
    string
  ];
}

export type ParentData = {
  id: number | string;
  name: string;
  joining_date: string;
  email: string;
  number: string | null;
  location: string;
  children: string;
  card_status: string;
  total_spent: string;
  last_spent: string;
  last_transaction_date: string;
  zip_code: string;
}


export type PaymentsSummaryResponse = {
  totalRevenue: number;
  totalPending: number;
  totalFailed: number;
  totalComped: number;
  paymentsData: PaymentItem[];
}


export type PaymentItem = {
  id: number;
  transaction_id: string | null;
  user_id: number;
  session_id: number;
  amount: string;
  method: string | null;
  status: "pending" | "paid" | "failed" | "comped" | "completed";
  paid_at: string | null;
  created_at: string;


  session_name: string | null;


  player_user_id: number | null;
  player_first_name: string | null;
  player_last_name: string | null;
  player_picture: string | null;
  player_name: string;


  parent_id: number | null;
  parent_first_name: string | null;
  parent_last_name: string | null;
  parent_name: string;
}


export type PlayerData = {
  id: number | string;
  name: string;
  coach_name: string;
  age: string;
  position: string;
  phone: string | null;
  parent: string;
  last_session: string;
  last_session_date: string;
  attendance: string;
  joining_date: string | Date | null;
} 



export type PlayerResponse = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  status: string;
  zip_code: string
  picture: string | null;
  location: string | null;
  phone_no: string;
  joining_date: string | null;
  birth_date: Date | null;
  created_at: string;

  profile: PlayerProfile;

  parent_id: number | null;
  attach_parent: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone_no: string;
    picture: string;
    location: string;
    profile?: any;
  } | null;

  sessions_data: SessionData[];

  payment_data: Payment[];

  all_notes: NoteWithCoach[];
}

export interface PlayerProfile {
  id: number;
  user_id: number;
  parent_id: number | null;
  position: string;
  skill_level: string;
  medical_notes: string | null;
  created_at: string;
}

export interface SessionData {
  id: number;
  name: string;
  description: string;
  status: string;
  session_type: string;
  coach_id: number;
  location: string;

  start_time: string;
  end_time: string;
  date: string;
  end_date: string;

  price: string;
  promotion_price: string | null;
  apply_promotion: boolean;

  max_players: number;
  created_at: string;

  image: string;
  show_storefront: boolean;

  coach_first_name: string | null;
  coach_last_name: string | null;

  payment_detail: Payment | null;

  note_detail: SessionNote[];
  session_rating: number
  attendance_detail: Attendance[];
}

export type Payment = {
  id: number;
  session_id: number;
  user_id: number;
  status: string;
  amount?: string | number;
  created_at?: string;
  original_price?: string | number;
}

export type SessionNote = {
  id: number;
  user_id: number;
  session_id: number;
  note_type: string;
  note: string;
  important: boolean;
  created_at: string;
}
export type Attendance = {
  id: number;
  user_id: number;
  session_id: number;
  status: "present" | "absent" | "pending" | string;
  created_at: string;
}

export type NoteWithCoach = {
  id: number;
  user_id: number;
  session_id: number;
  note_type: string;
  note: string;
  important: boolean;
  created_at: string;
  rating?: number;
  coach_first_name: string | null;
  coach_last_name: string | null;
  session_name: string;
}

export type PrmotionsType = {
  id: number;
  name: string;
  description: string;
  status: "all" | "completed" | "upcoming" | "cancelled" | "ongoing" | string;
  session_type: string;
  coach_id: number;
  location: string;
  start_time: string;
  end_time: string;
  time: string;
  date: string;
  end_date: string | null;
  price: string;
  promotion_price: string | null;
  save: number;
  max_players: number;
  apply_promotion: boolean;
  show_storefront: boolean;
  image: string;
  created_at: string;
  coach_first_name: string;
  coach_last_name: string;
  coachName: string;
  payment_statuses: string[];
  store_front: boolean
  participants: {
    user_id: number;
  }[];
  total_participants: number;
  total_revenue: number;
  rawData: any
  promotion_end: string | null
  enrolled ?: boolean
  is_daily_payment?: boolean
  enrolled_dates?: string[]
}

export type ConfirmationProps = {
  title: string
  description: string
  onPressYes: () => Promise<void>
  onPressCancel: () => void
  open: boolean
  loading: boolean
  children?: null | ReactNode
  valid?: boolean
}

export type ReserveProps = {
   id: number;
  name: string;
  description: string;
  status: string;
  session_type: string;
  coach_id: number;
  location: string;
  start_time: string;
  end_time: string;
  date: string;
  end_date: string;
  price: string;
  promotion_price: string;
  max_players: number;
  apply_promotion: boolean;
  show_storefront: boolean;
  comped: boolean;
  enrolled: boolean;
  created_at: string;
  promotion_start: string | null;
  promotion_end: string | null;
  image: string;
  type: string;
  age_limit: string;
  coach_first_name: string;
  coach_last_name: string;
  coach_picture: string | null;
}
