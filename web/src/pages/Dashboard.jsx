import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useAnimation } from 'framer-motion';
import { Menu, FileText, AlertTriangle, CloudUpload, ChevronRight, FileDigit } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { isAuthenticated, removeToken } from '../services/auth';
import { getHistory, getUserProfile } from '../services/api';

const PulseDot = ({ color }) => (
  <div style={{ position: 'relative', width: '12px', height: '12px', marginRight: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
    <motion.div
      animate={{ scale: [1, 2], opacity: [1, 0] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' }}
      style={{ position: 'absolute', width: '24px', height: '24px', borderRadius: '50%', backgroundColor: color }}
    />
    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: color, position: 'relative', zIndex: 2 }} />
  </div>
);

const ConcentricRings = ({ color }) => {
  return (
    <div style={{ position: 'absolute', width: '120px', height: '120px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <motion.div
        animate={{ scale: [0.8, 1.6], opacity: [0.8, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
        style={{ position: 'absolute', width: '80px', height: '80px', borderRadius: '50%', border: `2px solid ${color}` }}
      />
      <motion.div
        animate={{ scale: [0.8, 1.6], opacity: [0.8, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeOut', delay: 1 }}
        style={{ position: 'absolute', width: '80px', height: '80px', borderRadius: '50%', border: `2px solid ${color}` }}
      />
    </div>
  );
};

const formatDate = (dateString) => {
  if (!dateString) return "Just now";
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  } catch (e) {
    return dateString;
  }
};

export default function DashboardScreen() {
  const navigate = useNavigate();
  const { colors, isDark } = useTheme();
  
  const [recentScans, setRecentScans] = useState([]);
  const [userName, setUserName] = useState('User');
  const [stats, setStats] = useState({ total: 0, highRisk: 0 });

  useEffect(() => {
    const checkAuth = async () => {
      const authed = await isAuthenticated();
      if (!authed) {
        navigate('/onboarding');
      } else {
        fetchData();
      }
    };
    checkAuth();
  }, [navigate]);

  const fetchData = async () => {
    try {
      const profile = await getUserProfile();
      if (profile && profile.name) setUserName(profile.name);
      
      const data = await getHistory();
      if (Array.isArray(data)) {
        setRecentScans(data.slice(0, 3));
        const highRisk = data.filter(d => d.risk_level?.toLowerCase() === 'high risk').length;
        setStats({ total: data.length, highRisk });
      }
    } catch (e) {
      if (e.message && (e.message.includes("401") || e.message.includes("Unauthorized"))) {
        removeToken();
        navigate('/onboarding');
      }
    }
  };

  const getRiskColor = (level) => {
    if (!level) return colors.textSecondary;
    switch (level.toLowerCase()) {
      case 'high risk': return colors.error;
      case 'medium risk': return '#FFB020';
      case 'low risk': return colors.success;
      default: return colors.textSecondary;
    }
  };

  return (
    <div style={{ flex: 1, minHeight: '100vh', background: `linear-gradient(180deg, ${colors.bg} 0%, ${colors.cardAlt} 100%)`, padding: '24px', paddingTop: '40px' }}>
      
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '24px' }}>
        <button onClick={() => navigate('/settings')} style={{ width: '50px', height: '50px', borderRadius: '25px', border: `2px solid ${colors.primary}`, boxShadow: `0 4px 8px ${colors.primary}4D`, overflow: 'hidden', padding: 0, cursor: 'pointer' }}>
          <img src="/src/assets/images/mascot.jpg" alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </button>
      </motion.div>

      {/* Welcome Section */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
          <h1 style={{ fontSize: '32px', fontFamily: 'Space Grotesk, sans-serif', color: colors.text, margin: 0 }}>Hello, {userName}</h1>
          <PulseDot color={colors.primary} />
        </div>
        <p style={{ fontSize: '16px', color: colors.textSecondary, margin: 0 }}>What would you like to review today?</p>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '32px' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} style={{ flex: 1, padding: '20px', borderRadius: '16px', backgroundColor: colors.card, borderLeft: `4px solid ${colors.primary}`, boxShadow: `0 8px 12px rgba(0,0,0,0.1)`, position: 'relative', overflow: 'hidden' }}>
          <FileDigit size={64} color={isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'} style={{ position: 'absolute', right: '-10px', bottom: '-10px' }} />
          <h2 style={{ fontSize: '32px', fontFamily: 'Space Grotesk, sans-serif', color: colors.text, margin: '0 0 4px 0' }}>{stats.total}</h2>
          <p style={{ fontSize: '13px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px', color: colors.textSecondary, margin: 0 }}>Total Scans</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} style={{ flex: 1, padding: '20px', borderRadius: '16px', backgroundColor: colors.card, borderLeft: `4px solid ${colors.error}`, boxShadow: `0 8px 12px rgba(0,0,0,0.1)`, position: 'relative', overflow: 'hidden' }}>
          <AlertTriangle size={64} color={isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'} style={{ position: 'absolute', right: '-10px', bottom: '-10px' }} />
          <h2 style={{ fontSize: '32px', fontFamily: 'Space Grotesk, sans-serif', color: colors.text, margin: '0 0 4px 0' }}>{stats.highRisk}</h2>
          <p style={{ fontSize: '13px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px', color: colors.textSecondary, margin: 0 }}>High Risk</p>
        </motion.div>
      </div>

      {/* Quick Upload Zone */}
      <h3 style={{ fontSize: '14px', fontFamily: 'Space Grotesk, sans-serif', textTransform: 'uppercase', letterSpacing: '1.5px', color: colors.textSecondary, marginBottom: '16px' }}>Analyze Document</h3>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} style={{ marginBottom: '32px' }}>
        <motion.button
          onClick={() => navigate('/upload')}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          style={{ width: '100%', padding: '2px', borderRadius: '16px', background: `linear-gradient(45deg, ${colors.primary}, ${colors.secondary})`, border: 'none', cursor: 'pointer', display: 'block' }}
        >
          <div style={{ backgroundColor: colors.cardAlt, borderRadius: '14px', padding: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ position: 'relative', width: '100px', height: '100px', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '24px' }}>
              <ConcentricRings color={colors.primary} />
              <FileText size={48} color={colors.primary} />
            </div>
            <h4 style={{ fontSize: '18px', fontFamily: 'Space Grotesk, sans-serif', color: colors.text, margin: '0 0 8px 0' }}>Tap or drag file to analyze</h4>
            <p style={{ fontSize: '13px', fontWeight: '600', color: colors.textSecondary, margin: 0 }}>PDF, DOCX — Max 10MB</p>
          </div>
        </motion.button>
      </motion.div>

      {/* Recent Scans */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ fontSize: '14px', fontFamily: 'Space Grotesk, sans-serif', textTransform: 'uppercase', letterSpacing: '1.5px', color: colors.textSecondary, margin: 0 }}>Recent Scans</h3>
        <button onClick={() => navigate('/history')} style={{ padding: '6px 12px', borderRadius: '8px', backgroundColor: 'rgba(0, 229, 255, 0.1)', color: colors.primary, border: 'none', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>See All</button>
      </div>

      <div>
        {recentScans.length === 0 ? (
          <p style={{ color: colors.textSecondary, fontStyle: 'italic', paddingLeft: '8px' }}>No recent scans found.</p>
        ) : (
          recentScans.map((scan, index) => {
            const riskColor = getRiskColor(scan.risk_level);
            return (
              <motion.div key={scan.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 + (index * 0.1) }}>
                <button
                  onClick={() => navigate(`/summary/${scan.id}`)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', padding: '16px', borderRadius: '16px', backgroundColor: colors.card, border: 'none', marginBottom: '12px', boxShadow: `0 4px 8px rgba(0,0,0,0.05)`, cursor: 'pointer', textAlign: 'left' }}
                >
                  <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: colors.error + '20', display: 'flex', justifyContent: 'center', alignItems: 'center', marginRight: '16px' }}>
                    <FileText size={20} color={colors.error} />
                  </div>
                  
                  <div style={{ flex: 1, marginRight: '8px' }}>
                    <h4 style={{ fontSize: '15px', fontWeight: '600', color: colors.text, margin: '0 0 4px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{scan.filename}</h4>
                    <div style={{ height: '4px', backgroundColor: 'rgba(139, 146, 184, 0.2)', borderRadius: '2px', width: '100%', marginBottom: '6px' }}>
                      <div style={{ height: '100%', borderRadius: '2px', backgroundColor: riskColor, width: scan.risk_level === 'High Risk' ? '80%' : scan.risk_level === 'Medium Risk' ? '50%' : '20%' }} />
                    </div>
                    <p style={{ fontSize: '12px', color: colors.textSecondary, margin: 0 }}>{formatDate(scan.date)}</p>
                  </div>
                  
                  <div style={{ padding: '4px 10px', borderRadius: '12px', border: `1px solid ${riskColor}`, backgroundColor: riskColor + '15' }}>
                    <span style={{ fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', color: riskColor }}>{scan.risk_level}</span>
                  </div>
                  <ChevronRight size={16} color={colors.textSecondary} style={{ marginLeft: '8px' }} />
                </button>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
