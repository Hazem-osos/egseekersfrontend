export const config = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'https://egbackend-6zw2.onrender.com/api',
  wsUrl: process.env.NEXT_PUBLIC_WS_URL || 'wss://egbackend-6zw2.onrender.com',
  environment: process.env.NODE_ENV || 'development',
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
} as const;

export const API_ENDPOINTS = {
  auth: {
    login: '/auth/login',
    adminLogin: '/auth/admin/login',
    register: '/auth/register',
    verify: '/auth/verify',
    me: '/auth/me',
  },
  contracts: {
    base: '/contracts',
    accept: (id: string) => `/contracts/${id}/accept`,
    decline: (id: string) => `/contracts/${id}/decline`,
    submit: (id: string) => `/contracts/${id}/submit`,
    review: (id: string) => `/contracts/${id}/review`,
  },
  admin: {
    dashboard: '/admin/dashboard',
    users: '/admin/users',
    jobs: '/admin/jobs',
    contracts: '/admin/contracts',
    payments: '/admin/payments',
    tickets: '/admin/tickets',
    reports: '/admin/reports',
    settings: '/admin/settings',
    logs: '/admin/logs',
  }
} as const; 