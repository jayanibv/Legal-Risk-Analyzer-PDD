import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, FolderOpen } from 'lucide-react';
import { getHistory } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { motion } from 'framer-motion';

const formatDate = (dateString) => {
  if (!dateString) return "Just now";
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  } catch (e) {
    return dateString;
  }
};

export default function HistoryScreen() {
  const navigate = useNavigate();
  const { colors } = useTheme();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const data = await getHistory();
        if (Array.isArray(data)) setHistory(data);
      } catch (e) {
        console.log("History fetch failed");
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const getRiskColor = (level) => {
    switch (level?.toLowerCase()) {
      case 'high risk': return colors.error;
      case 'medium risk': return colors.warning || '#FFB020';
      case 'low risk': return colors.success;
      default: return colors.textSecondary;
    }
  };

  return (
    <div style={{ flex: 1, minHeight: '100vh', background: colors.bg, padding: '24px' }}>
      <h1 style={{ fontSize: '28px', fontWeight: '800', color: colors.text, marginBottom: '24px' }}>Document History</h1>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '50px' }}>
          <div className="spinner" style={{ width: '40px', height: '40px', borderRadius: '20px', border: `3px solid ${colors.primary}40`, borderTopColor: colors.primary, animation: 'spin 1s linear infinite' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : history.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {history.map((item, idx) => (
            <motion.div 
              key={item.id} 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: idx * 0.05 }}
              onClick={() => navigate(`/summary/${item.id}`)}
              style={{ display: 'flex', alignItems: 'center', padding: '16px', borderRadius: '20px', border: `1px solid ${colors.divider}`, backgroundColor: colors.card, cursor: 'pointer', transition: 'transform 0.2s', ':hover': { transform: 'scale(1.02)' } }}
            >
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', marginRight: '16px', backgroundColor: getRiskColor(item.risk_level) + '15' }}>
                <FileText size={24} color={getRiskColor(item.risk_level)} />
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ fontSize: '16px', fontWeight: '700', color: colors.text, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.filename}</h4>
                <p style={{ fontSize: '12px', color: colors.textSecondary, marginTop: '4px', margin: 0 }}>{formatDate(item.date)}</p>
              </div>
              <div style={{ padding: '4px 10px', borderRadius: '8px', backgroundColor: getRiskColor(item.risk_level) + '10' }}>
                <span style={{ fontSize: '10px', fontWeight: '800', color: getRiskColor(item.risk_level) }}>{item.risk_level?.toUpperCase()}</span>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '100px' }}>
          <FolderOpen size={64} color={colors.divider} />
          <p style={{ marginTop: '16px', fontSize: '16px', color: colors.textSecondary }}>No documents found.</p>
        </div>
      )}
    </div>
  );
}
