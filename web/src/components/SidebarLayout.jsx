import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Home, Clock, FileText, MessageCircle, Settings, LogOut, Menu, X, Globe } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { removeToken } from '../services/auth';
import { motion, AnimatePresence } from 'framer-motion';

export default function SidebarLayout() {
  const { colors, toggleTheme, isDark } = useTheme();
  const navigate = useNavigate();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: Home },
    { name: 'History', path: '/history', icon: Clock },
    { name: 'Templates', path: '/templates', icon: FileText },
    { name: 'AI Legal Chat', path: '/chat', icon: MessageCircle },
    { name: 'Legal Translator', path: '/translator', icon: Globe },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  const handleLogout = () => {
    removeToken();
    navigate('/login');
  };

  const SidebarContent = () => (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '24px 0' }}>
      <div style={{ padding: '0 24px', marginBottom: '40px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '800', color: colors.primary, margin: 0 }}>LegalRisk AI</h2>
      </div>

      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', padding: '0 16px' }}>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={() => setIsMobileOpen(false)}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              padding: '12px 16px',
              borderRadius: '12px',
              color: isActive ? colors.primary : colors.textSecondary,
              backgroundColor: isActive ? colors.primary + '15' : 'transparent',
              textDecoration: 'none',
              fontWeight: isActive ? '700' : '600',
              transition: 'all 0.2s ease',
            })}
          >
            <item.icon size={20} style={{ marginRight: '16px' }} />
            {item.name}
          </NavLink>
        ))}
      </nav>

      <div style={{ padding: '0 16px', marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <button
          onClick={toggleTheme}
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '12px 16px',
            borderRadius: '12px',
            color: colors.textSecondary,
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            fontWeight: '600',
            textAlign: 'left',
          }}
        >
          <div style={{ width: '20px', height: '20px', borderRadius: '10px', backgroundColor: isDark ? '#fff' : '#000', marginRight: '16px' }} />
          Toggle {isDark ? 'Light' : 'Dark'} Mode
        </button>

        <button
          onClick={handleLogout}
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '12px 16px',
            borderRadius: '12px',
            color: colors.error,
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            fontWeight: '600',
            textAlign: 'left',
          }}
        >
          <LogOut size={20} style={{ marginRight: '16px' }} />
          Log Out
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', backgroundColor: colors.bg, overflow: 'hidden' }}>
      
      {/* Desktop Sidebar */}
      <div style={{ 
        width: '280px', 
        backgroundColor: colors.card, 
        borderRight: `1px solid ${colors.border}`,
        display: 'none'
      }} className="desktop-sidebar">
        <SidebarContent />
      </div>

      {/* Mobile Header & Hamburger */}
      <div className="mobile-header" style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '60px',
        display: 'flex', alignItems: 'center', padding: '0 16px', zIndex: 40,
      }}>
        <button onClick={() => setIsMobileOpen(true)} style={{ color: colors.text, background: 'none', border: 'none' }}>
          <Menu size={28} />
        </button>
      </div>

      {/* Mobile Drawer Overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileOpen(false)}
              style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 50 }}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              style={{ position: 'fixed', top: 0, bottom: 0, left: 0, width: '280px', backgroundColor: colors.card, zIndex: 60 }}
            >
              <SidebarContent />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div style={{ flex: 1, overflowY: 'auto', position: 'relative' }}>
        <Outlet />
      </div>

      <style>{`
        @media (min-width: 1024px) {
          .desktop-sidebar { display: block !important; }
          .mobile-header { display: none !important; }
        }
      `}</style>
    </div>
  );
}
