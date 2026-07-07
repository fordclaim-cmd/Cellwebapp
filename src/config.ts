// Joe: edit these values — the whole site reads from here.
export const PRICING = {
  setup: 1500,
  monthly: 397,
} as const;

// All "Book a free call" CTAs route to the on-site quote form. To use a
// calendar instead, point this at a Cal.com/Calendly URL.
export const BOOKING_URL = '/contact#quote';
export const CONTACT_EMAIL = 'Joe@goliath.solutions';
export const CONTACT_PHONE = '+15555550199'; // TODO(Joe): real number
export const CONTACT_PHONE_DISPLAY = '(555) 555-0199';
