import type { Config } from 'tailwindcss';
import plugin from 'tailwindcss/plugin';

const config: Config = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{md,mdx}',
  ],
  // theme: {
    // extend: {
      /* Extended color utilities for text colors */
      // colors: {
        // 'primary': '#f3f5fb',    /* Light foreground for dark backgrounds */
        // primary in HSL for easier opacity adjustments
        // 'primary': 'hsl(220, 20%, 92%)',    /* Light foreground for dark backgrounds */
        // 'secondary': 'hsl(240, 5.9%, 90%)',  /* Muted/secondary text (zinc-200) */

        // 'surface': 'hsl(240, 5.9%, 10%)',    /* Main background (zinc-900) */
        // 'surface-light': 'hsl(240, 3.7%, 15.9%)', /* Panel/card background (zinc-800) */
        // 'surface-lighter': 'hsl(240, 5.3%, 26.1%)', /* Lighter panel/card background (zinc-700) */
      // },
    // },
  // },
  plugins: [
    plugin(function ({ addComponents }) {
      addComponents({
        /* Card & Section Styling
           Used in: ItemWornSource, ItemTraitsFlags, ItemStatsSection, ItemContributors, 
           IdentifyDump, summary.tsx, item-selection-panel.tsx */
        '.card-section': {
          '@apply rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-3': {},
        },

        '.card-section-dark': {
          '@apply rounded-xl border border-zinc-800 bg-zinc-950/80 p-4 shadow-inner': {},
        },

        /* Badge & Tag Styling 
           Used in: ItemWornSource, ItemTraitsFlags, ItemContributors, ItemPreviewCard, item-card.tsx */
        '.badge-base': {
          '@apply inline-flex items-center gap-2 rounded-md border px-2.5 py-1 text-xs': {},
        },
        '.badge-tag': {
          '@apply text-xs px-2 py-1 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-200': {},
        },
        '.badge-stat-yellow': {
          '@apply border-yellow-800 bg-yellow-900/40 text-yellow-100': {},
        },
        '.badge-stat-blue': {
          '@apply border-blue-800 bg-blue-900/40 text-blue-100': {},
        },
        '.badge-stat-red': {
          '@apply border-red-800 bg-red-900/40 text-red-100': {},
        },

        /* Overlay & Modal Styling 
           Used in: import-panel, ConfirmDialog, modal.tsx */
        '.overlay-modal': {
          '@apply fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm': {},
        },

        /* Border & Background Combinations
           Used in: leaderboard */
        '.border-panel': {
          '@apply border border-zinc-800 bg-zinc-900': {},
        },

        /* Button Variants
           Uses: .transition-colors for consistent transitions
           Used in: EditModal.tsx, import-panel.tsx, ConfirmDialog.tsx */
        '.btn-primary': {
          '@apply px-4 py-2 text-sm rounded-md bg-orange-600 hover:bg-orange-500 text-white transition-colors': {},
        },
        '.btn-secondary': {
          '@apply px-3 py-2 text-sm rounded-md text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800 transition-colors': {},
        },
        '.btn-outline': {
          '@apply px-3 py-2 rounded-md border border-zinc-800 text-sm text-zinc-100 hover:border-orange-500 transition-colors': {},
        },
        '.btn-danger': {
          '@apply px-4 py-2 text-sm rounded-md bg-red-600 hover:bg-red-500 text-white transition-colors': {},
        },
        '.btn-warning': {
          '@apply px-6 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold transition-colors shadow-lg shadow-amber-900/50': {},
        },

        /* Form Inputs & Checkboxes
           Used in: Input.tsx, CheckBox.tsx, ConfirmDialog.tsx, ComboBox.tsx */
        '.input-base': {
          '@apply w-full rounded-md border border-zinc-800 bg-zinc-900 text-zinc-100 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500': {},
        },

        '.checkbox-base': {
          '@apply h-4 w-4 rounded border border-zinc-600 bg-zinc-900 text-orange-500 focus:ring-orange-500 focus:ring-1 focus:outline-none': {},
        },

        /* Badges - Item Metadata & Status
           Used in: ItemHeaderBadges.tsx, ComboBox.tsx */
        '.badge-artifact': {
          '@apply text-[11px] uppercase bg-amber-900/40 border border-amber-700 px-2 py-1 rounded-md text-amber-200': {},
        },
        '.badge-danger': {
          '@apply inline-flex items-center gap-1 text-[11px] uppercase bg-rose-900/40 border border-rose-700 px-2 py-1 rounded-md text-rose-200': {},
        },
        '.badge-selected': {
          '@apply inline-flex items-center gap-1 px-2 bg-orange-900/40 text-orange-100 border border-orange-800 rounded-md text-xs': {},
        },

      });
    }),
  ],
};

export default config;
