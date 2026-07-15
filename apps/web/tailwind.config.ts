import type { Config } from 'tailwindcss';
import { tokens } from './lib/design-tokens';

/**
 * Tailwind Config — Design System فاز ۵ (بخش ۱۰.۶ PRD).
 * مقادیر از design-tokens.ts می‌آیند (منبع واحد Truth؛ بدون Hardcode پراکنده).
 */
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Vazirmatn', 'system-ui', 'sans-serif'],
      },
      colors: {
        primary: tokens.color.primary,
        brand: {
          from: tokens.color.primary[700],
          to: tokens.color.indigo[600],
        },
        success: tokens.color.success,
        warning: tokens.color.warning,
        danger: tokens.color.danger,
        neutral: tokens.color.neutral,
        ink: tokens.color.text,
      },
      borderRadius: {
        sm: tokens.radius.sm,
        md: tokens.radius.md,
        lg: tokens.radius.lg,
      },
      boxShadow: {
        card: tokens.shadow.sm,
        glass: tokens.shadow.md,
        'glass-hover': tokens.shadow.lg,
      },
      backdropBlur: {
        card: tokens.blur.card,
        modal: tokens.blur.modal,
      },
      transitionDuration: {
        fast: tokens.animation.fast.replace('ms', ''),
        base: tokens.animation.base.replace('ms', ''),
        slow: tokens.animation.slow.replace('ms', ''),
      },
      maxWidth: {
        content: tokens.containerWidth.content,
        dashboard: tokens.containerWidth.dashboard,
      },
      zIndex: {
        dropdown: String(tokens.zIndex.dropdown),
        modal: String(tokens.zIndex.modal),
        toast: String(tokens.zIndex.toast),
        tooltip: String(tokens.zIndex.tooltip),
      },
      keyframes: {
        'blob-drift': {
          '0%, 100%': { transform: 'translate(0px, 0px) scale(1)' },
          '33%': { transform: 'translate(20px, -30px) scale(1.05)' },
          '66%': { transform: 'translate(-15px, 15px) scale(0.97)' },
        },
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'blob-drift': 'blob-drift 14s ease-in-out infinite',
        'fade-up': 'fade-up 0.4s ease-out both',
      },
    },
  },
  plugins: [],
};

export default config;
