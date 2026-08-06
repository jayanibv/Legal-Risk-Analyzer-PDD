import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';

export default function AnimatedButton({ onPress, title, loading, disabled, style, textStyle, icon }) {
  const { colors } = useTheme();

  return (
    <motion.button
      onClick={onPress}
      disabled={disabled || loading}
      whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || loading ? 1 : 0.95 }}
      style={{
        background: `linear-gradient(90deg, ${colors.primaryGradientStart || colors.primary}, ${colors.primaryGradientEnd || colors.primary})`,
        borderRadius: '16px',
        border: 'none',
        color: '#FFFFFF',
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.15)',
        padding: '16px 24px',
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '8px',
        fontSize: '16px',
        fontWeight: '700',
        letterSpacing: '0.5px',
        width: '100%',
        ...style
      }}
    >
      {loading ? (
        <div className="spinner" style={{ width: '20px', height: '20px', border: '3px solid rgba(255,255,255,0.3)', borderRadius: '50%', borderTopColor: '#fff', animation: 'spin 1s ease-in-out infinite' }} />
      ) : (
        <>
          {icon}
          <span style={{ fontFamily: 'inherit', ...textStyle }}>{title}</span>
        </>
      )}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </motion.button>
  );
}
