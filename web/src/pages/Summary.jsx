import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { X, AlertCircle, Share, ChevronRight, Globe } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { getAnalysisById } from '../services/api';
import { GlobalStore } from '../services/store';
import { motion } from 'framer-motion';

export default function SummaryScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { colors } = useTheme();

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        if (GlobalStore.currentAnalysis && GlobalStore.currentAnalysis.id === id) {
          setResult(GlobalStore.currentAnalysis);
        } else if (id) {
          const data = await getAnalysisById(id);
          setResult(data);
        } else {
          setError('No analysis data found');
        }
      } catch (e) {
        setError(e.message || 'Failed to load analysis');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id]);

  const getRiskColor = (level) => {
    switch (level?.toLowerCase()) {
      case 'high risk': return colors.error;
      case 'medium risk': return colors.warning || '#FFB020';
      case 'low risk': return colors.success;
      default: return colors.primary;
    }
  };

  const getTimelineIcon = (type) => {
    switch(type) {
      case 'Contract Signed': return '📝';
      case 'Effective Date': return '🚀';
      case 'Payment Due': return '💰';
      case 'Renewal Date': return '🔄';
      case 'Notice Period': return '⏳';
      case 'Termination': return '⚠️';
      case 'Expiry': return '📅';
      case 'Delivery': return '📦';
      default: return '📆';
    }
  };

  if (loading) {
    return (
      <div style={{ flex: 1, minHeight: '100vh', background: colors.bg, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div className="spinner" style={{ width: '40px', height: '40px', borderRadius: '20px', border: `3px solid ${colors.primary}40`, borderTopColor: colors.primary, animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div style={{ flex: 1, minHeight: '100vh', background: colors.bg, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <AlertCircle size={64} color={colors.error} style={{ marginBottom: '16px' }} />
          <p style={{ fontSize: '16px', color: colors.error, marginBottom: '20px' }}>{error || 'Result not found'}</p>
          <button onClick={() => navigate('/dashboard')} style={{ padding: '12px 24px', borderRadius: '12px', background: colors.primary, color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>Go Home</button>
        </div>
      </div>
    );
  }

  const riskColor = getRiskColor(result.risk_level);
  const overviewData = result.summaries || result.summary || [];

  const handleShare = async () => {
    const url = window.location.href;
    const shareData = {
      title: 'LegalRisk AI - Document Summary',
      text: `Check out this document risk summary (Score: ${result?.risk_score}/100)`,
      url: url,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(url);
        alert('Link copied to clipboard!');
      }
    } catch (err) {
      console.log('Error sharing:', err);
    }
  };

  return (
    <div style={{ flex: 1, minHeight: '100vh', background: colors.bg, display: 'flex', flexDirection: 'column' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', backgroundColor: colors.card, borderBottom: `1px solid ${colors.divider}`, position: 'sticky', top: 0, zIndex: 10 }}>
        <button onClick={() => navigate('/dashboard')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
          <X size={24} color={colors.text} />
        </button>
        <h1 style={{ fontSize: '20px', fontWeight: '800', color: colors.text, margin: 0 }}>Risk Summary</h1>
        <button onClick={handleShare} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
          <Share size={24} color={colors.primary} />
        </button>
      </div>

      <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
        {/* Score Circle */}
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '30px', marginTop: '10px' }}>
          <div style={{ width: '160px', height: '160px', borderRadius: '80px', border: `8px solid ${riskColor}`, backgroundColor: colors.card, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', marginBottom: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
            <span style={{ fontSize: '48px', fontWeight: '800', color: riskColor, lineHeight: 1 }}>{result.risk_score}</span>
            <span style={{ fontSize: '16px', fontWeight: '600', marginTop: '4px', color: colors.textSecondary }}>/ 100</span>
          </div>
          <div style={{ padding: '8px 16px', borderRadius: '20px', backgroundColor: riskColor + '20' }}>
            <span style={{ fontSize: '14px', fontWeight: '800', letterSpacing: '1px', color: riskColor }}>{result.risk_level?.toUpperCase()}</span>
          </div>
        </motion.div>

        {/* At a Glance */}
        {result.at_a_glance && (
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} style={{ marginBottom: '30px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px', color: colors.text }}>At a Glance</h2>
            <div style={{ borderRadius: '20px', padding: '20px', backgroundColor: colors.card, border: `1px solid ${colors.divider}`, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px' }}>
              <div>
                <div style={{ fontSize: '13px', marginBottom: '4px', color: colors.textSecondary }}>Document Type</div>
                <div style={{ fontSize: '15px', fontWeight: '700', color: colors.text }}>{result.at_a_glance.document_type || 'Unknown'}</div>
              </div>
              <div>
                <div style={{ fontSize: '13px', marginBottom: '4px', color: colors.textSecondary }}>Pages</div>
                <div style={{ fontSize: '15px', fontWeight: '700', color: colors.text }}>{result.at_a_glance.pages || 'N/A'}</div>
              </div>
              <div>
                <div style={{ fontSize: '13px', marginBottom: '4px', color: colors.textSecondary }}>Risk Level</div>
                <div style={{ fontSize: '15px', fontWeight: '700', color: riskColor }}>{result.at_a_glance.risk_level || result.risk_level}</div>
              </div>
              <div>
                <div style={{ fontSize: '13px', marginBottom: '4px', color: colors.textSecondary }}>Important Dates</div>
                <div style={{ fontSize: '15px', fontWeight: '700', color: colors.text }}>{result.at_a_glance.important_dates || 0}</div>
              </div>
              <div>
                <div style={{ fontSize: '13px', marginBottom: '4px', color: colors.textSecondary }}>Critical Clauses</div>
                <div style={{ fontSize: '15px', fontWeight: '700', color: colors.error }}>{result.at_a_glance.critical_clauses || 0}</div>
              </div>
              <div>
                <div style={{ fontSize: '13px', marginBottom: '4px', color: colors.textSecondary }}>Missing Clauses</div>
                <div style={{ fontSize: '15px', fontWeight: '700', color: colors.warning || '#FFB020' }}>{result.at_a_glance.missing_clauses || 0}</div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Contract Timeline */}
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} style={{ marginBottom: '30px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px', color: colors.text }}>📅 Contract Timeline</h2>
          <div style={{ borderRadius: '20px', padding: '20px', backgroundColor: colors.card, border: `1px solid ${colors.divider}` }}>
            {result.important_dates && result.important_dates.length > 0 ? (
              result.important_dates.map((date, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', marginBottom: idx === result.important_dates.length - 1 ? 0 : '16px' }}>
                  <span style={{ fontSize: '24px', marginRight: '16px' }}>{getTimelineIcon(date.type)}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', marginBottom: '2px', color: colors.textSecondary }}>{date.type}</div>
                    <div style={{ fontSize: '16px', fontWeight: '700', color: colors.text }}>{date.value}</div>
                  </div>
                </div>
              ))
            ) : (
              <p style={{ color: colors.textSecondary, margin: 0 }}>No important contractual dates were detected.</p>
            )}
          </div>
        </motion.div>

        {/* Document Overview */}
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} style={{ marginBottom: '30px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px', color: colors.text }}>Document Overview</h2>
          <div style={{ borderRadius: '20px', padding: '20px', backgroundColor: colors.card, border: `1px solid ${colors.divider}` }}>
            {overviewData.length > 0 ? overviewData.map((point, idx) => (
              <div key={idx} style={{ display: 'flex', marginBottom: idx === overviewData.length - 1 ? 0 : '12px' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '3px', marginTop: '8px', marginRight: '12px', flexShrink: 0, backgroundColor: colors.primary }} />
                <p style={{ fontSize: '15px', lineHeight: '22px', margin: 0, color: colors.textSecondary }}>{point}</p>
              </div>
            )) : <p style={{ color: colors.textSecondary, margin: 0 }}>No overview available.</p>}
          </div>
        </motion.div>

        {/* Legal Translator Card */}
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.35 }} style={{ marginBottom: '30px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px', color: colors.text, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Globe size={20} color={colors.primary} />
            Legal Translator
          </h2>
          <div style={{ borderRadius: '20px', padding: '20px', backgroundColor: colors.card, border: `1px solid ${colors.divider}` }}>
            <p style={{ fontSize: '15px', lineHeight: '22px', margin: '0 0 16px 0', color: colors.textSecondary }}>
              Translate this analyzed legal document into another language while preserving legal terminology.
            </p>
            <button
              onClick={() => {
                GlobalStore.currentAnalysis = result;
                const docText = GlobalStore.textContent || (result.summaries ? result.summaries.join('\n\n') : '');
                if (docText) sessionStorage.setItem('last_document_text', docText);
                navigate('/translator', { state: { text: docText } });
              }}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '12px',
                backgroundColor: colors.primary,
                color: '#FFFFFF',
                border: 'none',
                fontSize: '15px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Globe size={18} />
              Open Legal Translator
            </button>
          </div>
        </motion.div>

        {/* Decision Button */}
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }}>
          <button 
            onClick={() => { GlobalStore.currentAnalysis = result; navigate(`/verdict/${result.id}`); }}
            style={{ width: '100%', padding: '18px', borderRadius: '16px', backgroundColor: '#10b981', border: '1px solid #059669', color: '#fff', fontSize: '16px', fontWeight: '800', cursor: 'pointer', marginBottom: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
          >
            Contract Decision Support ⭐⭐⭐⭐⭐
          </button>
        </motion.div>

        {/* Details Button */}
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }}>
          <button 
            onClick={() => { GlobalStore.currentAnalysis = result; navigate(`/details/${result.id}`); }}
            style={{ width: '100%', padding: '18px', borderRadius: '16px', backgroundColor: colors.primary, border: 'none', color: '#fff', fontSize: '16px', fontWeight: '700', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
          >
            <span style={{ marginRight: '8px' }}>View Detailed Risks</span>
            <ChevronRight size={20} color="#FFFFFF" />
          </button>
        </motion.div>

      </div>
    </div>
  );
}
