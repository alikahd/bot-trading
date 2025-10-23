// تعريف المسارات
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  EMAIL_VERIFICATION: '/verify-email',
  PASSWORD_RESET: '/reset-password',
  SUBSCRIPTION: '/subscription',
  PAYMENT: '/payment',
  PAYMENT_SUCCESS: '/payment/success',
  PAYMENT_PENDING: '/payment/pending',
  PAYMENT_REVIEW: '/payment/review',
  ADMIN: '/admin',
  TERMS: '/terms',
  CONTACT: '/contact',
  ABOUT: '/about',
} as const;

export type RoutePath = typeof ROUTES[keyof typeof ROUTES];
