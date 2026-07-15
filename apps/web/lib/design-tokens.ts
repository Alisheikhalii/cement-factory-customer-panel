/**
 * Design Tokens — منبع واحد Truth بصری (بخش ۱۰.۶ PRD + docs/industrial_ether/DESIGN.md).
 * تمام مقادیر رنگ/شعاع/سایه/انیمیشن باید از این‌جا بیایند، نه Hardcode در Component.
 * این فایل هم در tailwind.config.ts مصرف می‌شود و هم به‌صورت CSS Variable در globals.css.
 *
 * پالت مطابق طرح مرجع «Luminous Industrial Glass»:
 * Primary = Deep Amethyst (#380080)، Secondary = Electric Indigo (#4b41e1)،
 * پس‌زمینه گرادیان روشن (#f7f9fb → #e0e3e5) پشت پنل‌های شیشه‌ای.
 */
export const tokens = {
  color: {
    // پالت برند (DESIGN.md — colors)
    primary: {
      DEFAULT: '#380080', // Deep Amethyst
      container: '#5300b7', // primary-container — حالت فعال ناوبری/گرادیان
      onContainer: '#eaddff',
      fixed: '#eaddff',
      fixedDim: '#d3bbff',
      50: '#F5F3FF',
      100: '#EDE9FE',
      200: '#DDD6FE',
      300: '#C4B5FD',
      400: '#A78BFA',
      500: '#8B5CF6',
      600: '#7C3AED',
      700: '#6D28D9',
      800: '#5B21B6',
      900: '#4C1D95',
    },
    secondary: {
      DEFAULT: '#4b41e1', // Electric Indigo
      container: '#655dfb',
    },
    // سطوح (Surface) — DESIGN.md
    surface: {
      DEFAULT: '#f7f9fb',
      dim: '#d8dadc',
      variant: '#e0e3e5',
      container: '#eceef0',
      containerLow: '#f2f4f6',
      containerLowest: '#ffffff',
      containerHigh: '#e6e8ea',
    },
    onSurface: '#191c1e',
    onSurfaceVariant: '#4a4454',
    outline: '#7b7486',
    outlineVariant: '#ccc3d7',
    // رنگ‌های وضعیت (DESIGN.md — status)
    success: '#16A34A', // بارگیری‌شده/تکمیل
    info: '#3B82F6', // تایید‌شده
    warning: '#D97706', // ثبت‌شده/در انتظار
    danger: '#DC2626', // رد‌شده
    neutral: '#6B7280', // لغو‌شده
    text: '#191c1e', // متن اصلی (on-surface)
  },
  radius: {
    sm: '8px', // دکمه/Input (DESIGN.md — shapes)
    md: '12px',
    lg: '16px', // کارت‌های Glass (1rem)
    full: '9999px',
  },
  blur: {
    card: '12px', // glass-card (DESIGN.md — سطح ۲)
    panel: '16px', // glass-panel
    modal: '8px', // Backdrop مودال‌ها
  },
  shadow: {
    sm: '0 2px 8px rgba(15,23,42,0.06)',
    md: '0 8px 32px rgba(79,70,229,0.08)', // glass-panel (DESIGN.md)
    lg: '0 20px 40px rgba(83,0,183,0.12)', // Hover کارت (سطح ۳)
  },
  animation: {
    fast: '150ms',
    base: '300ms', // Hover/Transition استاندارد مرجع
    slow: '400ms',
    stagger: '100ms', // فاصله بین انیمیشن ورود کارت‌ها (مرجع: 0.1s per item)
  },
  zIndex: {
    dropdown: 20,
    modal: 50,
    toast: 60,
    tooltip: 70,
  },
  containerWidth: {
    content: '1280px', // حداکثر عرض محتوای صفحات لیستی
    dashboard: '1440px', // حداکثر عرض کارت‌های داشبورد (container-max مرجع)
  },
} as const;

/** فاصله ثابت بین انیمیشن ورود کارت‌ها (Framer Stagger) به‌صورت ثانیه. */
export const STAGGER_SECONDS = 0.1;
