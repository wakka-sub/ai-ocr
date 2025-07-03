import colors from 'tailwindcss/colors'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#6750A4',
        onPrimary: '#FFFFFF',
        surface: '#FFFBFE',
        surfaceContainerLow: '#F7F2FA',
        inverseSurface: '#313033',
        outline: '#79747E',
        onSurface: '#1C1B1F',
        onSurfaceVariant: '#49454F',
        success: colors.emerald,
        danger: colors.rose,
      },
      fontFamily: {
        sans: ['Roboto', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        headlineSmall: ['1.5rem', { lineHeight: '2rem', fontWeight: '700' }],
        bodyMedium: ['1rem', { lineHeight: '1.5rem', fontWeight: '400' }],
        labelLarge: ['0.875rem', { lineHeight: '1.25rem', fontWeight: '500' }],
      },
      borderRadius: {
        sm: '4px',
        md: '8px',
        lg: '12px',
      },
      boxShadow: {
        'elevation-1':
          '0px 1px 2px 0px rgba(0,0,0,0.3), 0px 1px 3px 1px rgba(0,0,0,0.15)',
        'elevation-2':
          '0px 2px 4px 0px rgba(0,0,0,0.3), 0px 2px 6px 2px rgba(0,0,0,0.15)',
        'elevation-3':
          '0px 3px 6px 0px rgba(0,0,0,0.3), 0px 4px 8px 3px rgba(0,0,0,0.15)',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: 0, transform: 'translateY(4px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
      },
      animation: {
        fadeIn: 'fadeIn 0.2s cubic-bezier(0.2, 0, 0, 1)',
      },
    },
  },
  plugins: [],
}
