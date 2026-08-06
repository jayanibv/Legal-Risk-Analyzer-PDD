import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText, File, Globe } from 'lucide-react';
import { GlobalStore } from '../services/store';
import { useTheme } from '../context/ThemeContext';

export default function UploadScreen() {
  const navigate = useNavigate();
  const { colors, isDark } = useTheme();
  
  const [activeTab, setActiveTab] = useState('upload');
  const [text, setText] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  const [isShimmering, setIsShimmering] = useState(false);
  
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setText('');
      setUploadProgress(0);
      let progress = 0;
      const interval = setInterval(() => {
        progress += 5;
        setUploadProgress(progress);
        if (progress >= 100) clearInterval(interval);
      }, 30);
    }
  };

  const handleContinue = () => {
    if (!text && !selectedFile) {
      alert("Please upload a document or paste text to analyze.");
      return;
    }
    
    setIsShimmering(true);
    
    setTimeout(() => {
      GlobalStore.selectedFile = selectedFile ? { file: selectedFile, name: selectedFile.name, size: selectedFile.size } : null;
      GlobalStore.textContent = text;
      navigate('/scanning');
    }, 750);
  };

  return (
    <div style={{ flex: 1, minHeight: '100vh', background: `linear-gradient(180deg, ${colors.bg} 0%, ${colors.cardAlt} 100%)`, display: 'flex', flexDirection: 'column' }}>
      
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: `1px solid ${colors.divider}` }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
          <X size={24} color={colors.text} />
        </button>
        <h1 style={{ fontSize: '24px', fontFamily: 'Space Grotesk, sans-serif', color: colors.text, margin: 0 }}>New Scan</h1>
        <div style={{ width: '32px' }} />
      </motion.div>

      <div style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
        {/* Tabs */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} style={{ display: 'flex', padding: '4px', borderRadius: '12px', border: `1px solid ${colors.border}`, backgroundColor: colors.card }}>
          <button 
            style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', background: activeTab === 'upload' ? colors.primary : 'transparent', color: activeTab === 'upload' ? '#1B1F3B' : colors.textSecondary, fontSize: '14px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }}
            onClick={() => setActiveTab('upload')}
          >
            Upload File
          </button>
          <button 
            style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', background: activeTab === 'paste' ? colors.primary : 'transparent', color: activeTab === 'paste' ? '#1B1F3B' : colors.textSecondary, fontSize: '14px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }}
            onClick={() => setActiveTab('paste')}
          >
            Paste Text
          </button>
        </motion.div>

        {/* Upload Tab */}
        {activeTab === 'upload' && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ flex: 1, marginTop: '24px', display: 'flex', flexDirection: 'column' }}>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".pdf,.doc,.docx" style={{ display: 'none' }} />
            
            <button
              onClick={() => !selectedFile && fileInputRef.current.click()}
              style={{
                flex: 1,
                border: `1px solid ${selectedFile ? colors.primary : colors.border}`,
                borderRadius: '24px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '24px',
                background: selectedFile ? colors.primary + '10' : colors.card,
                cursor: selectedFile ? 'default' : 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {!selectedFile ? (
                <>
                  <motion.div animate={{ y: [-12, 0, -12] }} transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}>
                    <FileText size={64} color={colors.primary} style={{ marginBottom: '16px' }} />
                  </motion.div>
                  <h3 style={{ fontSize: '18px', fontFamily: 'Space Grotesk, sans-serif', color: colors.text, margin: '0 0 8px 0' }}>Tap to browse or drag file here</h3>
                  <p style={{ fontSize: '14px', color: colors.textSecondary, margin: 0 }}>PDF, DOCX — Max 10MB</p>
                </>
              ) : (
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                  <File size={48} color={colors.primary} style={{ marginBottom: '12px' }} />
                  <h3 style={{ fontSize: '18px', fontFamily: 'Space Grotesk, sans-serif', color: colors.text, margin: '0 0 4px 0', maxWidth: '80%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedFile.name}</h3>
                  <p style={{ fontSize: '14px', color: colors.textSecondary, margin: '0 0 24px 0' }}>
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  
                  <div style={{ width: '80%', height: '8px', borderRadius: '4px', backgroundColor: colors.divider, overflow: 'hidden' }}>
                    <div style={{ height: '100%', backgroundColor: colors.primary, width: `${uploadProgress}%`, transition: 'width 0.1s' }} />
                  </div>
                  <p style={{ color: colors.primary, marginTop: '12px', fontWeight: '600', fontSize: '13px' }}>
                    {uploadProgress}% Uploaded
                  </p>

                  <button onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }} style={{ position: 'absolute', top: '-20px', right: '-10px', background: 'none', border: 'none', cursor: 'pointer', padding: '8px' }}>
                    <X size={28} color={colors.error} />
                  </button>
                </div>
              )}
            </button>
          </motion.div>
        )}

        {/* Paste Tab */}
        {activeTab === 'paste' && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ flex: 1, marginTop: '24px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ 
              flex: 1, 
              border: `1px solid ${isFocused ? colors.primary : colors.border}`, 
              borderRadius: '16px', 
              overflow: 'hidden', 
              backgroundColor: colors.card,
              boxShadow: isFocused ? `0 0 10px ${colors.primary}4D` : 'none',
              transition: 'all 0.2s',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <textarea
                style={{ flex: 1, padding: '20px', fontSize: '16px', fontFamily: 'inherit', color: colors.text, background: 'transparent', border: 'none', outline: 'none', resize: 'none' }}
                placeholder="Paste legal clauses or agreement text here..."
                value={text}
                onChange={(e) => { setText(e.target.value); if (e.target.value) setSelectedFile(null); }}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', borderTop: `1px solid ${colors.divider}` }}>
                <div style={{ display: 'flex', alignItems: 'center', padding: '4px 8px', borderRadius: '12px', backgroundColor: colors.primary + '15', opacity: text ? 1 : 0, transition: 'opacity 0.2s' }}>
                  <Globe size={14} color={colors.primary} style={{ marginRight: '4px' }} />
                  <span style={{ fontSize: '12px', fontWeight: '600', color: colors.primary }}>English Detected</span>
                </div>
                <span style={{ fontSize: '12px', color: colors.textSecondary }}>{text.length} chars</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Analyze Button */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} style={{ marginTop: '24px' }}>
          <button 
            disabled={!text && !selectedFile} 
            onClick={handleContinue} 
            style={{ 
              width: '100%', 
              height: '60px', 
              borderRadius: '12px', 
              background: (!text && !selectedFile) ? colors.divider : `linear-gradient(45deg, #00E5FF, #00F5A0)`, 
              border: 'none', 
              cursor: (!text && !selectedFile) ? 'not-allowed' : 'pointer',
              color: (!text && !selectedFile) ? colors.textSecondary : '#1B1F3B',
              fontSize: '18px',
              fontFamily: 'Space Grotesk, sans-serif',
              fontWeight: 'bold',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            Analyze Document →
            {isShimmering && (
              <motion.div 
                initial={{ x: '-100%' }}
                animate={{ x: '200%' }}
                transition={{ duration: 0.7, ease: "easeInOut" }}
                style={{ 
                  position: 'absolute', 
                  top: 0, 
                  bottom: 0, 
                  width: '50%', 
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)' 
                }} 
              />
            )}
          </button>
        </motion.div>
      </div>
    </div>
  );
}
