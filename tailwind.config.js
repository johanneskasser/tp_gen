/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // Shadcn Base Colors
                border: 'hsl(214 32% 91%)',
                input: 'hsl(214 32% 91%)',
                ring: 'hsl(215 20.2% 65.1%)',
                background: 'hsl(0 0% 100%)',
                foreground: 'hsl(222.2 84% 4.9%)',
                primary: {
                    DEFAULT: 'hsl(215 20.2% 65.1%)',
                    foreground: 'hsl(210 40% 98%)',
                    50: '#f0f5f7',
                    100: '#bcd4de',
                    200: '#a5ccd1',
                    300: '#a0b9bf',
                    400: '#9dacb2',
                    500: '#949ba0',
                    600: '#6b7378',
                    700: '#4a5155',
                    800: '#2d3235',
                    900: '#1a1d1f',
                },
                secondary: {
                    DEFAULT: 'hsl(210 40% 96.1%)',
                    foreground: 'hsl(222.2 47.4% 11.2%)',
                },
                destructive: {
                    DEFAULT: 'hsl(0 84.2% 60.2%)',
                    foreground: 'hsl(210 40% 98%)',
                },
                muted: {
                    DEFAULT: 'hsl(210 40% 96.1%)',
                    foreground: 'hsl(215.4 16.3% 46.9%)',
                },
                accent: {
                    DEFAULT: 'hsl(210 40% 96.1%)',
                    foreground: 'hsl(222.2 47.4% 11.2%)',
                },
                popover: {
                    DEFAULT: 'hsl(0 0% 100%)',
                    foreground: 'hsl(222.2 84% 4.9%)',
                },
                card: {
                    DEFAULT: 'hsl(0 0% 100%)',
                    foreground: 'hsl(222.2 84% 4.9%)',
                },

                // Background Colors (legacy support)
                'background-primary': '#fafbfc',
                'background-secondary': '#f0f5f7',
                'background-tertiary': '#e5edef',

                // Border Colors (legacy support)
                'border-light': '#e5edef',
                'border-medium': '#a0b9bf',
                'border-strong': '#6b7378',

                // Text Colors (legacy support)
                text: {
                    primary: '#1a1d1f',
                    secondary: '#4a5155',
                    tertiary: '#6b7378',
                    inverse: '#ffffff',
                    disabled: '#94a3b8',
                },

                // Session Type Colors
                session: {
                    easy: {
                        bg: '#e8f4f8',
                        text: '#0369a1',
                        border: '#bcd4de',
                        chart: '#7dd3fc',
                    },
                    long: {
                        bg: '#f0f9ff',
                        text: '#0c4a6e',
                        border: '#a5ccd1',
                        chart: '#38bdf8',
                    },
                    intervals: {
                        bg: '#ffedd5',
                        text: '#c2410c',
                        border: '#fed7aa',
                        chart: '#fb923c',
                    },
                    tempo: {
                        bg: '#fef3c7',
                        text: '#a16207',
                        border: '#fde68a',
                        chart: '#fbbf24',
                    },
                    recovery: {
                        bg: '#f0fdf4',
                        text: '#15803d',
                        border: '#bbf7d0',
                        chart: '#4ade80',
                    },
                    race: {
                        bg: '#ffe4e6',
                        text: '#be123c',
                        border: '#fecdd3',
                        chart: '#fb7185',
                    },
                    strides: {
                        bg: '#fef9c3',
                        text: '#854d0e',
                        border: '#fde047',
                        chart: '#eab308',
                    },
                    'hill-repeats': {
                        bg: '#ffedd5',
                        text: '#9a3412',
                        border: '#fdba74',
                        chart: '#f59e0b',
                    },
                    progression: {
                        bg: '#cffafe',
                        text: '#155e75',
                        border: '#67e8f9',
                        chart: '#06b6d4',
                    },
                    fartlek: {
                        bg: '#fce7f3',
                        text: '#9f1239',
                        border: '#fbcfe8',
                        chart: '#ec4899',
                    },
                    strength: {
                        bg: '#f3f4f6',
                        text: '#374151',
                        border: '#d1d5db',
                        chart: '#6b7280',
                    },
                    plyometrics: {
                        bg: '#e0e7ff',
                        text: '#3730a3',
                        border: '#c7d2fe',
                        chart: '#6366f1',
                    },
                },

                // Semantic Colors
                success: {
                    bg: '#d1fae5',
                    text: '#065f46',
                    border: '#6ee7b7',
                },
                warning: {
                    bg: '#fef3c7',
                    text: '#92400e',
                    border: '#fde68a',
                },
                error: {
                    bg: '#fee2e2',
                    text: '#991b1b',
                    border: '#fca5a5',
                },
                info: {
                    bg: '#dbeafe',
                    text: '#1e40af',
                    border: '#93c5fd',
                },
                disabled: {
                    bg: '#f1f5f9',
                    text: '#94a3b8',
                    border: '#cbd5e1',
                },
            },

            fontFamily: {
                sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
                display: ['Outfit', 'sans-serif'],
                body: ['Manrope', 'sans-serif'],
                mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'Monaco', 'monospace'],
            },

            fontSize: {
                // Display
                'display': ['3rem', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '700' }],

                // Headings
                'h1': ['2rem', { lineHeight: '1.2', letterSpacing: '-0.01em', fontWeight: '700' }],
                'h2': ['1.5rem', { lineHeight: '1.3', fontWeight: '600' }],
                'h3': ['1.25rem', { lineHeight: '1.4', fontWeight: '600' }],
                'h4': ['1.125rem', { lineHeight: '1.4', fontWeight: '600' }],

                // Body
                'body-lg': ['1.125rem', { lineHeight: '1.6', fontWeight: '400' }],
                'body': ['1rem', { lineHeight: '1.6', fontWeight: '400' }],
                'body-sm': ['0.875rem', { lineHeight: '1.5', fontWeight: '400' }],

                // Utility
                'caption': ['0.75rem', { lineHeight: '1.4', fontWeight: '400', letterSpacing: '0.01em' }],
                'overline': ['0.75rem', { lineHeight: '1.4', fontWeight: '600', letterSpacing: '0.08em', textTransform: 'uppercase' }],

                // Numbers (Monospace)
                'number-lg': ['2rem', { lineHeight: '1.2', fontWeight: '700' }],
                'number': ['1.5rem', { lineHeight: '1.2', fontWeight: '600' }],
                'number-sm': ['1rem', { lineHeight: '1.2', fontWeight: '500' }],
            },

            spacing: {
                0: '0',
                1: '0.25rem',   // 4px
                2: '0.5rem',    // 8px
                3: '0.75rem',   // 12px
                4: '1rem',      // 16px
                5: '1.25rem',   // 20px
                6: '1.5rem',    // 24px
                8: '2rem',      // 32px
                10: '2.5rem',   // 40px
                12: '3rem',     // 48px
                16: '4rem',     // 64px
                20: '5rem',     // 80px
                24: '6rem',     // 96px
            },

            borderRadius: {
                'lg': '0.5rem',
                'xl': '0.75rem',
                '2xl': '1rem',
                '3xl': '1.5rem',
            },

            boxShadow: {
                'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                'DEFAULT': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
                'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            },

            animation: {
                'fade-in': 'fadeIn 200ms ease-out',
                'scale-in': 'scaleIn 200ms ease-out',
                'slide-down': 'slideDown 300ms ease-out',
                'slide-up': 'slideUp 300ms ease-out',
                'orbit': 'orbit 25s linear infinite',
                'counter-orbit': 'counter-orbit 25s linear infinite',
                'ping-slow': 'ping-slow 2.5s ease-out infinite',
                'blink': 'blink 1s step-end infinite',
                'float-gentle': 'float-gentle 4s ease-in-out infinite',
                'pulse-ring': 'pulse-ring 2s ease-out infinite',
                'shimmer': 'shimmer 3s linear infinite',
            },

            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                scaleIn: {
                    '0%': { transform: 'scale(0.95)', opacity: '0' },
                    '100%': { transform: 'scale(1)', opacity: '1' },
                },
                slideDown: {
                    '0%': { transform: 'translateY(-10px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                slideUp: {
                    '0%': { transform: 'translateY(10px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                orbit: {
                    '0%': { transform: 'rotate(0deg)' },
                    '100%': { transform: 'rotate(360deg)' },
                },
                'counter-orbit': {
                    '0%': { transform: 'rotate(0deg)' },
                    '100%': { transform: 'rotate(-360deg)' },
                },
                'ping-slow': {
                    '0%': { transform: 'scale(1)', opacity: '0.6' },
                    '100%': { transform: 'scale(1.8)', opacity: '0' },
                },
                blink: {
                    '0%, 100%': { opacity: '1' },
                    '50%': { opacity: '0' },
                },
                'float-gentle': {
                    '0%, 100%': { transform: 'translateY(0px)' },
                    '50%': { transform: 'translateY(-8px)' },
                },
                'pulse-ring': {
                    '0%': { transform: 'scale(1)', opacity: '0.4' },
                    '50%': { opacity: '0.2' },
                    '100%': { transform: 'scale(1.3)', opacity: '0' },
                },
                shimmer: {
                    '0%': { backgroundPosition: '-200% 0' },
                    '100%': { backgroundPosition: '200% 0' },
                },
            },

            transitionDuration: {
                'fast': '150ms',
                'base': '200ms',
                'slow': '300ms',
                'slower': '500ms',
            },

            transitionTimingFunction: {
                'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
            },
        },
    },
    plugins: [
        require('@tailwindcss/forms'),
    ],
}
