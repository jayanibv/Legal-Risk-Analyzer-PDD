import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { GlobalStore } from '../services/store';
import { motion } from 'framer-motion';

export default function DetailsScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { colors } = useTheme();

  let result = GlobalStore.currentAnalysis;

  if (!result) {
    return (
      <div style={{ flex: 1, minHeight: '100vh', background: colors.bg, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <p style={{ fontSize: '16px', color: colors.error, marginBottom: '20px' }}>No details found.</p>
          <button onClick={() => navigate(-1)} style={{ padding: '12px 24px', borderRadius: '12px', background: colors.primary, color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>Go Back</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, minHeight: '100vh', background: colors.bg, display: 'flex', flexDirection: 'column' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', backgroundColor: colors.card, borderBottom: `1px solid ${colors.divider}`, position: 'sticky', top: 0, zIndex: 10 }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
          <ArrowLeft size={24} color={colors.text} />
        </button>
        <h1 style={{ fontSize: '20px', fontWeight: '800', color: colors.text, margin: 0 }}>Detailed Risks</h1>
        <div style={{ width: '32px' }} />
      </div>

      <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '800', color: colors.text, marginBottom: '20px' }}>Critical Concerns</h3>
        {result.risks && result.risks.length > 0 ? (
          result.risks.map((risk, idx) => (
            <motion.div key={idx} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: idx * 0.1 }} style={{ borderRadius: '20px', padding: '20px', marginBottom: '16px', borderLeft: `6px solid ${colors.error}`, borderTop: `1px solid ${colors.divider}`, borderRight: `1px solid ${colors.divider}`, borderBottom: `1px solid ${colors.divider}`, backgroundColor: colors.card, boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                <AlertCircle size={20} color={colors.error} />
                <h4 style={{ fontSize: '17px', fontWeight: '700', marginLeft: '10px', color: colors.text, margin: 0 }}>{risk.type || 'Potential Issue'}</h4>
              </div>
              <p style={{ fontSize: '14px', lineHeight: '22px', margin: 0, color: colors.textSecondary }}>{risk.description}</p>
            </motion.div>
          ))
        ) : (
          <p style={{ fontStyle: 'italic', fontSize: '15px', color: colors.textSecondary, margin: 0 }}>No specific risks detected.</p>
        )}

        <h3 style={{ fontSize: '18px', fontWeight: '800', color: colors.text, marginTop: '32px', marginBottom: '20px' }}>Detected Clauses</h3>
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          {result.clauses && result.clauses.map((clause, idx) => (
            <div key={idx} style={{ padding: '8px 16px', borderRadius: '12px', backgroundColor: colors.primary + '15' }}>
              <span style={{ fontSize: '13px', fontWeight: '700', color: colors.primary }}>{clause}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
