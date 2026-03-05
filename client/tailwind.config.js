/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // Dark Industrial Theme
                'bg-primary': '#0a0e1a',
                'bg-secondary': '#131825',
                'bg-elevated': '#1a2234',
                'accent-primary': '#00d9ff',
                'accent-success': '#00ff88',
                'accent-warning': '#ffaa00',
                'accent-danger': '#ff3366',
                'text-primary': '#ffffff',
                'text-secondary': '#94a3b8',
                'text-muted': '#64748b',
            },
            fontFamily: {
                'heading': ['Orbitron', 'sans-serif'],
                'body': ['Inter', 'sans-serif'],
                'mono': ['JetBrains Mono', 'monospace'],
            },
            backgroundImage: {
                'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
                'gradient-mesh': 'linear-gradient(135deg, #0a0e1a 0%, #1a2234 50%, #131825 100%)',
            },
            animation: {
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'glow': 'glow 2s ease-in-out infinite alternate',
            },
            keyframes: {
                glow: {
                    '0%': { boxShadow: '0 0 5px rgba(0, 217, 255, 0.5)' },
                    '100%': { boxShadow: '0 0 20px rgba(0, 217, 255, 0.8)' },
                }
            },
            backdropBlur: {
                xs: '2px',
            }
        },
    },
    plugins: [],
}
