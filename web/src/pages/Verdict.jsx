import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertTriangle, CheckCircle } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { GlobalStore } from '../services/store';
import { motion } from 'framer-motion';

export default function VerdictScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { colors } = useTheme();

  let result = GlobalStore.currentAnalysis;

  if (!result || !result.verdict) {
    return (
      <div style={{ flex: 1, minHeight: '100vh', background: colors.bg, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <p style={{ fontSize: '16px', color: colors.error, marginBottom: '20px' }}>No decision support available.</p>
          <button onClick={() => navigate(-1)} style={{ padding: '12px 24px', borderRadius: '12px', background: colors.primary, color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>Go Back</button>
        </div>
      </div>
    );
  }

  const verdict = result.verdict;

  const getRecommendationColor = (rec) => {
    const l = rec?.toLowerCase() || '';
    if (l.includes('caution')) return colors.warning || '#FFB020';
    if (l.includes('do not') || l.includes('reject') || l.includes('danger')) return colors.error;
    return colors.success;
  };

  const recColor = getRecommendationColor(verdict.recommendation);

  const renderProgressBar = (label, value, color) => (
    <div style={{ marginBottom: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
        <span style={{ fontSize: '16px', fontWeight: '600', color: colors.text }}>{label}</span>
        <span style={{ fontSize: '16px', fontWeight: '800', color }}>{value}%</span>
      </div>
      <div style={{ height: '8px', borderRadius: '4px', backgroundColor: colors.divider, overflow: 'hidden' }}>
        <motion.div initial={{ width: 0 }} animate={{ width: `${value}%` }} transition={{ duration: 1, ease: 'easeOut' }} style={{ height: '100%', backgroundColor: color }} />
      </div>
    </div>
  );

  return (
    <div style={{ flex: 1, minHeight: '100vh', background: colors.bg, display: 'flex', flexDirection: 'column' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', backgroundColor: colors.card, borderBottom: `1px solid ${colors.divider}`, position: 'sticky', top: 0, zIndex: 10 }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
          <ArrowLeft size={24} color={colors.text} />
        </button>
        <h1 style={{ fontSize: '20px', fontWeight: '800', color: colors.text, margin: 0 }}>Decision Support</h1>
        <div style={{ width: '32px' }} />
      </div>

      <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
        {/* Banner */}
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} style={{ padding: '24px', borderRadius: '20px', border: `2px solid ${recColor}`, backgroundColor: recColor + '15', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '800', color: recColor, margin: 0, textAlign: 'center' }}>{verdict.recommendation}</h2>
        </motion.div>

        {/* Metrics Grid */}
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} style={{ borderRadius: '20px', padding: '24px', backgroundColor: colors.card, border: `1px solid ${colors.divider}`, boxShadow: '0 4px 6px rgba(0,0,0,0.05)', marginBottom: '32px' }}>
          {renderProgressBar("Confidence", verdict.confidence || 0, colors.primary)}
          {renderProgressBar("Fairness", verdict.fairness || 0, colors.success)}
          {renderProgressBar("Completeness", verdict.completeness || 0, colors.primary)}
        </motion.div>

        {/* Top Concerns */}
        <h3 style={{ fontSize: '18px', fontWeight: '800', color: colors.text, marginBottom: '16px' }}>Top Concerns</h3>
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} style={{ borderRadius: '20px', padding: '20px', backgroundColor: colors.card, border: `1px solid ${colors.divider}`, boxShadow: '0 4px 6px rgba(0,0,0,0.05)', marginBottom: '32px' }}>
          {verdict.top_concerns && verdict.top_concerns.length > 0 ? (
            verdict.top_concerns.map((c, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', marginBottom: idx === verdict.top_concerns.length - 1 ? 0 : '12px' }}>
                <AlertTriangle size={20} color={colors.warning || '#FFB020'} style={{ marginTop: '2px', marginRight: '12px', flexShrink: 0 }} />
                <p style={{ fontSize: '15px', lineHeight: '22px', margin: 0, color: colors.textSecondary }}>{c}</p>
              </div>
            ))
          ) : (
            <p style={{ fontSize: '15px', margin: 0, color: colors.textSecondary }}>No major concerns detected.</p>
          )}
        </motion.div>

        {/* Recommended Actions */}
        <h3 style={{ fontSize: '18px', fontWeight: '800', color: colors.text, marginBottom: '16px' }}>Recommended Actions</h3>
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} style={{ borderRadius: '20px', padding: '20px', backgroundColor: colors.card, border: `1px solid ${colors.divider}`, boxShadow: '0 4px 6px rgba(0,0,0,0.05)', marginBottom: '32px' }}>
          {verdict.recommended_actions && verdict.recommended_actions.length > 0 ? (
            verdict.recommended_actions.map((a, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', marginBottom: idx === verdict.recommended_actions.length - 1 ? 0 : '12px' }}>
                <CheckCircle size={20} color={colors.success} style={{ marginTop: '2px', marginRight: '12px', flexShrink: 0 }} />
                <p style={{ fontSize: '15px', lineHeight: '22px', margin: 0, color: colors.textSecondary }}>{a}</p>
              </div>
            ))
          ) : (
            <p style={{ fontSize: '15px', margin: 0, color: colors.textSecondary }}>No specific actions required.</p>
          )}
        </motion.div>

        {/* Disclaimer */}
        <div style={{ marginTop: '40px', padding: '16px', textAlign: 'center' }}>
          <p style={{ fontSize: '12px', fontStyle: 'italic', lineHeight: '18px', margin: 0, color: colors.textSecondary }}>
            This assessment is AI-generated and intended to assist document review. It is not legal advice and should not replace consultation with a qualified legal professional.
          </p>
        </div>

      </div>
    </div>
  );
}
