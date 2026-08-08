import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Globe, Copy, Share2, Check, AlertCircle, Sparkles, FileText, ArrowRight } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { translateDocument } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';

const LANGUAGES = [
  { id: 'Spanish', label: 'Spanish', flag: '🇪🇸' },
  { id: 'Mandarin', label: 'Mandarin (Chinese)', flag: '🇨🇳' },
  { id: 'German', label: 'German', flag: '🇩🇪' },
  { id: 'Italian', label: 'Italian', flag: '🇮🇹' },
  { id: 'Portuguese', label: 'Portuguese', flag: '🇵🇹' }
];

export default function LegalTranslatorScreen() {
  const { colors, isDark } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const [documentText, setDocumentText] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('Spanish');
  const [translatedText, setTranslatedText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);



  const handleTranslate = async () => {
    const textToTranslate = documentText.trim();
    if (!textToTranslate) {
      setError('Please provide or analyze a document before translating.');
      return;
    }

    setLoading(true);
    setError('');
    setTranslatedText('');

    try {
      const res = await translateDocument(textToTranslate, selectedLanguage);
      if (res && res.translated_text) {
        setTranslatedText(res.translated_text);
      } else {
        throw new Error('No translated text returned from AI server.');
      }
    } catch (e) {
      const errMsg = e.message || 'Translation failed. Please check if local Ollama is running.';
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!translatedText) return;
    try {
      await navigator.clipboard.writeText(translatedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Failed to copy', e);
    }
  };

  const handleShare = async () => {
    if (!translatedText) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Legal Document Translation (${selectedLanguage})`,
          text: translatedText
        });
      } catch (e) {
        console.log('Share canceled');
      }
    } else {
      handleCopy();
      alert('Text copied to clipboard!');
    }
  };

  return (
    <div style={{ flex: 1, minHeight: '100vh', background: `linear-gradient(180deg, ${colors.bg} 0%, ${colors.cardAlt} 100%)`, padding: '32px 24px 60px 24px', fontFamily: 'Inter, sans-serif' }}>
      
      {/* Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <Globe size={28} color={colors.primary} />
        <h1 style={{ fontSize: '26px', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 'bold', color: colors.text, margin: 0 }}>Legal Translator</h1>
      </div>

      {/* Document Preview Section */}
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '700', color: colors.text, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileText size={18} color={colors.primary} />
          Document Preview
        </h3>

        <div style={{
          backgroundColor: colors.card,
          border: `1px solid ${colors.border}`,
          borderRadius: '16px',
          padding: '12px',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <textarea
            value={documentText}
            onChange={(e) => setDocumentText(e.target.value)}
            placeholder="Paste or type the text you want to translate here..."
            style={{
              width: '100%',
              minHeight: '160px',
              backgroundColor: 'transparent',
              border: 'none',
              outline: 'none',
              fontSize: '14px',
              lineHeight: '22px',
              color: colors.text,
              resize: 'vertical',
              fontFamily: 'inherit'
            }}
          />
        </div>
      </div>

      {/* Language Selector */}
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '700', color: colors.text, marginBottom: '12px' }}>
          🌐 Translate To
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '10px' }}>
          {LANGUAGES.map((lang) => {
            const isSelected = selectedLanguage === lang.id;
            return (
              <button
                key={lang.id}
                onClick={() => setSelectedLanguage(lang.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px 14px',
                  borderRadius: '12px',
                  border: `1px solid ${isSelected ? colors.primary : colors.border}`,
                  backgroundColor: isSelected ? colors.primary : colors.card,
                  color: isSelected ? '#FFFFFF' : colors.text,
                  fontWeight: isSelected ? '700' : '500',
                  cursor: 'pointer',
                  fontSize: '14px',
                  transition: 'all 0.2s ease',
                  textAlign: 'left'
                }}
              >
                <span style={{ fontSize: '18px', marginRight: '10px' }}>{lang.flag}</span>
                {lang.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Translate Button */}
      <button
        onClick={handleTranslate}
        disabled={loading || !documentText.trim()}
        style={{
          width: '100%',
          height: '52px',
          borderRadius: '14px',
          backgroundColor: colors.primary,
          color: '#FFFFFF',
          border: 'none',
          fontSize: '16px',
          fontWeight: '700',
          cursor: loading || !documentText.trim() ? 'not-allowed' : 'pointer',
          opacity: loading || !documentText.trim() ? 0.7 : 1,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '24px',
          boxShadow: `0 4px 12px ${isDark ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.1)'}`
        }}
      >
        {loading ? (
          <>
            <div className="spinner" style={{
              width: '20px', height: '20px', border: '3px solid rgba(255,255,255,0.3)', borderTop: '3px solid #fff', borderRadius: '50%', animation: 'spin 1s linear infinite'
            }} />
            Translating Document...
          </>
        ) : (
          <>
            <Sparkles size={20} />
            Translate Document
          </>
        )}
      </button>

      {/* Error display */}
      {error && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '14px',
          borderRadius: '12px',
          backgroundColor: `${colors.error}15`,
          border: `1px solid ${colors.error}`,
          color: colors.error,
          marginBottom: '24px',
          fontSize: '14px'
        }}>
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      {/* Output Display */}
      {translatedText && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: colors.text, margin: 0 }}>
              ✨ Translated Document ({selectedLanguage})
            </h3>
          </div>

          <div style={{
            backgroundColor: colors.card,
            border: `2px solid ${colors.primary}`,
            borderRadius: '16px',
            padding: '20px'
          }}>
            <div style={{
              maxHeight: '300px',
              overflowY: 'auto',
              fontSize: '15px',
              lineHeight: '24px',
              color: colors.text,
              whiteSpace: 'pre-wrap',
              marginBottom: '16px'
            }}>
              {translatedText}
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px',
              paddingTop: '14px',
              borderTop: `1px solid ${colors.border}`
            }}>
              <button
                onClick={handleCopy}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '10px 16px',
                  borderRadius: '10px',
                  backgroundColor: colors.cardAlt,
                  color: copied ? colors.success : colors.primary,
                  border: 'none',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? 'Copied!' : 'Copy'}
              </button>

              <button
                onClick={handleShare}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '10px 16px',
                  borderRadius: '10px',
                  backgroundColor: colors.cardAlt,
                  color: colors.primary,
                  border: 'none',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                <Share2 size={16} />
                Share
              </button>
            </div>
          </div>
        </motion.div>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
