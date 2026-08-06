import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GlobalStore } from '../services/store';
import { analyzeText, analyzePDF } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ScanningScreen() {
  const navigate = useNavigate();
  const { colors, isDark } = useTheme();

  useEffect(() => {
    const runAnalysis = async () => {
      try {
        let data;
        if (GlobalStore.selectedFile) {
          const file = GlobalStore.selectedFile;
          // React Web file object is just file.file
          data = await analyzePDF(file.file, file.name);
        } else if (GlobalStore.textContent) {
          data = await analyzeText(GlobalStore.textContent);
        } else {
          throw new Error("No input provided");
        }

        if (data.detail) throw new Error(data.detail);

        GlobalStore.currentAnalysis = data;
        navigate(`/summary/${data.id}`);

      } catch (error) {
        alert("Analysis Failed: " + (error.message || "Could not reach server."));
        navigate('/upload');
      }
    };

    runAnalysis();
  }, [navigate]);

  return (
    <div style={{ flex: 1, minHeight: '100vh', background: colors.bg, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '40px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: '400px', textAlign: 'center' }}>
        
        <motion.div 
          animate={{ scale: [1, 1.1, 1], opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          style={{ 
            width: '120px', 
            height: '120px', 
            borderRadius: '60px', 
            backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(30, 58, 138, 0.1)', 
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.2)' : 'rgba(30, 58, 138, 0.2)'}`,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: '40px'
          }}
        >
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>
            <Loader2 size={48} color={colors.primary} />
          </motion.div>
        </motion.div>
        
        <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '16px', color: colors.text }}>Analyzing Document...</h2>
        <p style={{ fontSize: '16px', lineHeight: '24px', color: colors.textSecondary }}>AI is scanning for hidden risks, unfair clauses, and critical obligations.</p>
        
      </div>
    </div>
  );
}
