/**
 * Design Tokens — منبع واحد Truth بصری (بخش ۱۰.۶ PRD).
 * تمام مقادیر رنگ/شعاع/سایه/انیمیشن باید از این‌جا بیایند، نه Hardcode در Component.
 * این فایل هم در tailwind.config.ts مصرف می‌شود و هم به‌صورت CSS Variable در globals.css.
 */
export const tokens = {
  color: {
    // پالت برند (بخش ۱۰.۲) — بنفش/نیلی گرادیانت
    primary: {
      50: '#F5F3FF',
      100: '#EDE9FE',
      200: '#DDD6FE',
      300: '#C4B5FD',
      400: '#A78BFA',
      500: '#8B5CF6',
      600: '#7C3AED',
      700: '#6D28D9', // Primary اصلی برند
      800: '#5B21B6',
      900: '#4C1D95',
    },
    indigo: {
      500: '#6366F1',
      600: '#4F46E5', // انتهای گرادیانت Primary
    },
    success: '#16A34A', // تایید‌شده/بارگیری‌شده
    warning: '#D97706', // ثبت‌شده/در انتظار
    danger: '#DC2626', // رد‌شده
    neutral: '#6B7280', // لغو‌شده
    text: '#1E293B', // متن اصلی
  },
  radius: {
    sm: '8px',
    md: '12px',
    lg: '20px', // کارت‌های Glass
    full: '9999px',
  },
  blur: {
    card: '20px', // Glassmorphism کارت‌ها
    modal: '8px', // Backdrop مودال‌ها
  },
  shadow: {
    sm: '0 2px 8px rgba(15,23,42,0.06)',
    md: '0 8px 32px rgba(31,38,135,0.10)',
    lg: '0 12px 40px rgba(31,38,135,0.18)', // Hover کارت
  },
  animation: {
    fast: '150ms',
    base: '250ms', // Hover/Transition استاندارد
    slow: '400ms',
    stagger: '80ms', // فاصله بین انیمیشن ورود کارت‌ها (Framer Motion)
  },
  zIndex: {
    dropdown: 20,
    modal: 50,
    toast: 60,
    tooltip: 70,
  },
  containerWidth: {
    content: '1280px', // حداکثر عرض محتوای صفحات لیستی
    dashboard: '1440px', // حداکثر عرض کارت‌های داشبورد
  },
} as const;

/** فاصله ثابت بین انیمیشن ورود کارت‌ها (Framer Stagger) به‌صورت ثانیه. */
export const STAGGER_SECONDS = 0.08;
