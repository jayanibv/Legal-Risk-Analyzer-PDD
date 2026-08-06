import React from 'react';
import { FileText, Download } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { motion } from 'framer-motion';

const TEMPLATES = [
  {
    id: '1',
    title: 'Mutual Non-Disclosure Agreement',
    description: 'A standard mutual NDA to protect confidential information shared between two parties (via Cooley GO).',
    url: 'https://www.cooleygo.com/documents/mutual-non-disclosure-agreement/'
  },
  {
    id: '2',
    title: 'Independent Contractor Agreement',
    description: 'Agreement for hiring freelancers or independent contractors for specific projects.',
    url: 'https://www.dol.gov/sites/dolgov/files/WHD/legacy/files/whdfs13.pdf'
  },
  {
    id: '3',
    title: 'Y-Combinator SAFE',
    description: 'Simple Agreement for Future Equity, standard for early-stage startup fundraising.',
    url: 'https://www.ycombinator.com/documents'
  },
  {
    id: '4',
    title: 'Employment Offer Letter',
    description: 'A standard offer letter for full-time employment with standard clauses.',
    url: 'https://www.dir.ca.gov/dlse/lc_2810.5_notice.pdf'
  }
];

export default function TemplatesScreen() {
  const { colors, isDark } = useTheme();

  return (
    <div style={{ flex: 1, minHeight: '100vh', background: `linear-gradient(180deg, ${colors.bg} 0%, ${colors.cardAlt} 100%)`, padding: '24px' }}>
      <h1 style={{ fontSize: '24px', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 'bold', color: colors.text, margin: '0 0 8px 0' }}>Contract Templates</h1>
      <p style={{ fontSize: '15px', lineHeight: '22px', color: colors.textSecondary, marginBottom: '24px', fontFamily: 'Inter, sans-serif' }}>
        Safe, standard legal templates vetted for common use cases. Click to download.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {TEMPLATES.map((item, idx) => (
          <motion.div 
            key={item.id} 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: idx * 0.1 }}
            style={{ 
              padding: '20px', 
              borderRadius: '16px', 
              backgroundColor: colors.card, 
              boxShadow: `0 6px 12px ${isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.05)'}`,
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '12px', background: `linear-gradient(45deg, #00E5FF, #00F5A0)`, display: 'flex', justifyContent: 'center', alignItems: 'center', marginRight: '16px', flexShrink: 0 }}>
                <FileText size={24} color="#1B1F3B" />
              </div>
              <div>
                <h4 style={{ fontSize: '17px', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 'bold', color: colors.text, margin: '0 0 6px 0' }}>{item.title}</h4>
                <p style={{ fontSize: '13px', lineHeight: '18px', color: colors.textSecondary, margin: 0, fontFamily: 'Inter, sans-serif' }}>{item.description}</p>
              </div>
            </div>
            
            <a 
              href={item.url} 
              target="_blank" 
              rel="noopener noreferrer" 
              style={{ 
                textDecoration: 'none', 
                display: 'flex', 
                height: '48px', 
                borderRadius: '12px', 
                justifyContent: 'center', 
                alignItems: 'center', 
                backgroundColor: colors.cardAlt,
                color: colors.primary,
                fontSize: '15px',
                fontWeight: '600',
                fontFamily: 'Inter, sans-serif',
                transition: 'background 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = colors.divider}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = colors.cardAlt}
            >
              <Download size={18} style={{ marginRight: '8px' }} />
              Download Template
            </a>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
