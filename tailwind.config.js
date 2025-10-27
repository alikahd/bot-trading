/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    screens: {
      'xs': '375px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    },
    extend: {
      animation: {
        'blob': 'blob 7s infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.6s ease-out forwards',
      },
      keyframes: {
        blob: {
          '0%': {
            transform: 'translate(0px, 0px) scale(1)',
          },
          '33%': {
            transform: 'translate(30px, -50px) scale(1.1)',
          },
          '66%': {
            transform: 'translate(-20px, 20px) scale(0.9)',
          },
          '100%': {
            transform: 'translate(0px, 0px) scale(1)',
          },
        },
        float: {
          '0%, 100%': {
            transform: 'translateY(0px)',
          },
          '50%': {
            transform: 'translateY(-20px)',
          },
        },
        glow: {
          '0%': {
            boxShadow: '0 0 20px rgba(59, 130, 246, 0.5)',
          },
          '100%': {
            boxShadow: '0 0 30px rgba(59, 130, 246, 0.8)',
          },
        },
        fadeIn: {
          '0%': {
            opacity: '0',
            transform: 'translateY(10px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      colors: {
        'glass': 'rgba(255, 255, 255, 0.1)',
      },
    },
  },
  plugins: [
    // إضافة أنماط شريط التمرير المخصص
    function({ addUtilities }) {
      addUtilities({
        '.scrollbar-thin': {
          'scrollbar-width': 'thin',
        },
        '.scrollbar-thumb-gray-600': {
          '--scrollbar-thumb': '#4b5563',
        },
        '.scrollbar-thumb-purple-600': {
          '--scrollbar-thumb': '#9333ea',
        },
        '.scrollbar-track-gray-800': {
          '--scrollbar-track': '#1f2937',
        },
        '.scrollbar-thin::-webkit-scrollbar': {
          width: '6px',
        },
        '.scrollbar-thin::-webkit-scrollbar-track': {
          background: 'var(--scrollbar-track, #1f2937)',
          'border-radius': '3px',
        },
        '.scrollbar-thin::-webkit-scrollbar-thumb': {
          background: 'var(--scrollbar-thumb, #4b5563)',
          'border-radius': '3px',
        },
        '.scrollbar-thin::-webkit-scrollbar-thumb:hover': {
          background: '#6b7280',
        },
        '.scrollbar-thumb-purple-600::-webkit-scrollbar-thumb': {
          background: 'linear-gradient(180deg, #a855f7, #9333ea)',
          'border-radius': '3px',
          border: '1px solid rgba(147, 51, 234, 0.3)',
        },
        '.scrollbar-thumb-purple-600::-webkit-scrollbar-thumb:hover': {
          background: 'linear-gradient(180deg, #c084fc, #a855f7)',
          border: '1px solid rgba(147, 51, 234, 0.5)',
        },
      });
    },
  ],
};
