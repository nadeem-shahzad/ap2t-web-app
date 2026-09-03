
export const admin_nav_items = [

  {
    title: 'Dashboard',
    url: '/portal/admin/dashboard',
    icon: 'dashboard',

    shortcut: ['d', 'a', 's', 'h'],
  },
  {
    title: 'Parents',
    url: '/portal/admin/parents',
    icon: 'parents',

    shortcut: ['d', 'a', 's', 'h'],
  },
  {
    title: 'Players',
    url: '/portal/admin/players',
    icon: 'players',

    shortcut: ['d', 'a', 's', 'h'],
  },
  {
    title: 'Coaches',
    url: '/portal/admin/coaches',
    icon: 'coaches',

    shortcut: ['d', 'a', 's', 'h'],
  },
  {
    title: 'Sessions',
    url: '/portal/admin/sessions',
    icon: 'sessions',

    shortcut: ['d', 'a', 's', 'h'],
  },
  {
    title: 'Promotions',
    url: '/portal/admin/promotions',
    icon: 'promotions',

    shortcut: ['d', 'a', 's', 'h'],
  },
  {
    title: 'Flyers',
    url: '/portal/admin/flyers',
    icon: 'flyers',

    shortcut: ['d', 'a', 's', 'h'],
  },
  {
    title: 'Payments',
    url: '/portal/admin/payments',
    icon: 'payments',

    shortcut: ['d', 'a', 's', 'h'],
  },
  {
    title: 'Reports',
    url: '/portal/admin/reports',
    icon: 'reports',

    shortcut: ['d', 'a', 's', 'h'],
  },
  {
    title: 'Front Desk',
    url: '/portal/admin/front-desk',
    icon: 'front_desk',

    shortcut: ['d', 'a', 's', 'h'],
  },
  {
    title: 'Settings',
    url: '/portal/admin/settings',
    icon: 'settings',

    shortcut: ['d', 'a', 's', 'h'],
  },
  {
    title: 'Configuration',
    url: '/portal/admin/configuration',
    icon: 'settings2',

    shortcut: ['d', 'a', 's', 'h'],
  },
];

export const parent_nav_items = [

  {
    title: 'Dashboard',
    url: '/portal/parent/dashboard',
    icon: 'dashboard',

    shortcut: ['d', 'a', 's', 'h'],
  },
  {
    title: 'Sessions',
    url: '/portal/parent/sessions',
    icon: 'sessions',

    shortcut: ['d', 'a', 's', 'h'],
  },
  {
    title: 'Settings',
    url: '/portal/parent/settings',
    icon: 'settings',

    shortcut: ['d', 'a', 's', 'h'],
  },
];

export const player_nav_items = [

  {
    title: 'Dashboard',
    url: '/portal/player/dashboard',
    icon: 'dashboard',

    shortcut: ['d', 'a', 's', 'h'],
  },
  {
    title: 'Sessions',
    url: '/portal/player/sessions',
    icon: 'sessions',

    shortcut: ['d', 'a', 's', 'h'],
  },
  {
    title: 'Camps',
    url: '/portal/player/camps',
    icon: 'camps',

    shortcut: ['d', 'a', 's', 'h'],
  },

  {
    title: 'Promotions',
    url: '/portal/player/promotions',
    icon: 'promotions',

    shortcut: ['d', 'a', 's', 'h'],
  },
  {
    title: 'Settings',
    url: '/portal/player/settings',
    icon: 'settings',

    shortcut: ['d', 'a', 's', 'h'],
  },

  
];

export const coach_nav_items = [

  {
    title: 'Dashboard',
    url: '/portal/coach/dashboard',
    icon: 'dashboard',

    shortcut: ['d', 'a', 's', 'h'],
  },
  {
    title: 'Sessions',
    url: '/portal/coach/sessions',
    icon: 'sessions',

    shortcut: ['d', 'a', 's', 'h'],
  },
  {
    title: 'Settings',
    url: '/portal/coach/settings',
    icon: 'settings',

    shortcut: ['d', 'a', 's', 'h'],
  },
];
export const front_desk_items = [
  {
    title: 'Dashboard',
    url: '/portal/front-desk/dashboard',
    icon: 'dashboard',

    shortcut: ['d', 'a', 's', 'h'],
  },
  {
    title: 'Registration',
    url: '/portal/front-desk/register',
    icon: 'register',

    shortcut: ['d', 'a', 's', 'h'],
  },
  {
    title: 'Settings',
    url: '/portal/front-desk/settings',
    icon: 'settings',

    shortcut: ['d', 'a', 's', 'h'],
  },
]

export const EVENT_STYLES = {
  active: {
    bg: 'bg-active-bg',
    text: 'text-active-text',
    border: 'border-active-text/32',
  },
  info: {
    bg: 'bg-info-bg',
    text: 'text-info-text',
    border: 'border-info-text/32',
  },
  warning: {
    bg: 'bg-warning-bg',
    text: 'text-warning-text',
    border: 'border-warning-text/32',
  },
  danger: {
    bg: 'bg-danger-bg',
    text: 'text-danger-text',
    border: 'border-danger-text/32',
  },
  other: {
    bg: 'bg-other-bg',
    text: 'text-other-text',
    border: 'border-other-text/32',
  },
}

export const DARKMODECARDSTYLE = {
  '.input-container': {
    borderColor: '#2D2D2D',
    borderRadius: '6px',
  },
  '.input-container.is-focus': {
    borderColor: '#d3fb20',
  },
  '.input-container.is-error': {
    borderColor: '#ff1600',
  },
  '.message-text': {
    color: '#999999',
  },
  '.message-icon': {
    color: '#999999',
  },
  '.message-text.is-error': {
    color: '#ff1600',
  },
  '.message-icon.is-error': {
    color: '#ff1600',
  },
  input: {
    backgroundColor: '#1A1A1A',
    color: '#FFFFFF',
    fontFamily: 'helvetica neue, sans-serif',
  },
  'input::placeholder': {
    color: '#999999',
  },
  'input.is-error': {
    color: '#ff1600',
  },
};


export const SESSION_TYPE_CHART_CONFIG = {
  value: {
    label: "Sessions",
  },
  "Group Session": {
    label: "Group Session",
    color: "var(--chart-1)",
  },
  "Private Session": {
    label: "Private Session",
    color: "var(--chart-2)",
  },
  "Trial Session": {
    label: "Trial Session",
    color: "var(--chart-3)",
  },
  "Fitness Session": {
    label: "Fitness Session",
    color: "var(--chart-4)",
  },
  "Goalkeeper Session": {
    label: "Goalkeeper Session",
    color: "var(--chart-5)",
  },
}

export const MONTHLY_SESSIONS_CONFIG = {
  value: {
    label: "Sessions",
    color: "var(--chart-1)",
  },
}


export const BASE_URL = "/api"



