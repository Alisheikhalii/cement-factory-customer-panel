import type { Config } from 'tailwindcss';
import { tokens } from './lib/design-tokens';

/**
 * Tailwind Config — Design System مطابق طرح مرجع «Luminous Industrial Glass»
 * (docs/industrial_ether/DESIGN.md + نمونه‌های animated_* در docs/).
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
        secondary: tokens.color.secondary,
        surface: {
          DEFAULT: tokens.color.surface.DEFAULT,
          dim: tokens.color.surface.dim,
          variant: tokens.color.surface.variant,
          container: tokens.color.surface.container,
          'container-low': tokens.color.surface.containerLow,
          'container-lowest': tokens.color.surface.containerLowest,
          'container-high': tokens.color.surface.containerHigh,
        },
        'on-surface': tokens.color.onSurface,
        'on-surface-variant': tokens.color.onSurfaceVariant,
        outline: tokens.color.outline,
        'outline-variant': tokens.color.outlineVariant,
        brand: {
          from: tokens.color.primary.container,
          to: tokens.color.secondary.DEFAULT,
        },
        success: tokens.color.success,
        info: tokens.color.info,
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
        panel: tokens.blur.panel,
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
        // مرجع login: fadeInUp 0.8s cubic-bezier(0.16,1,0.3,1)
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        // مرجع login: floating تصویر بنر
        floating: {
          '0%, 100%': { transform: 'translateY(0px) scale(1)' },
          '50%': { transform: 'translateY(-10px) scale(1.02)' },
        },
        // مرجع landing: pulse-gentle دکمه CTA
        'pulse-gentle': {
          '0%, 100%': {
            transform: 'scale(1)',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
          },
          '50%': {
            transform: 'scale(1.03)',
            boxShadow: '0 10px 15px -3px rgba(56, 0, 128, 0.3)',
          },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'blob-drift': 'blob-drift 14s ease-in-out infinite',
        'fade-up': 'fade-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) both',
        floating: 'floating 6s ease-in-out infinite',
        'pulse-gentle': 'pulse-gentle 2s infinite ease-in-out',
        shimmer: 'shimmer 2s infinite',
      },
    },
  },
  plugins: [],
};

export default config;
