import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Search, ShieldCheck } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const ONBOARDING_STEPS = [
  {
    title: 'Analyze Contracts in Seconds',
    subtitle: 'Upload any legal document and let AI find hidden risks instantly.',
    icon: FileText,
  },
  {
    title: 'AI-Powered Risk Detection',
    subtitle: 'Instantly spot unfair clauses, missing terms, and critical obligations.',
    icon: Search,
  },
  {
    title: 'Bank-Grade Security',
    subtitle: 'Your documents are encrypted, secure, and never shared with third parties.',
    icon: ShieldCheck,
  }
];

export default function OnboardingScreen() {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();
  const { colors } = useTheme();

  const handleNext = () => {
    if (step < ONBOARDING_STEPS.length - 1) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    localStorage.setItem('has_seen_onboarding', 'true');
    navigate('/signup');
  };

  const handleSkip = () => {
    navigate('/login');
  };

  const CurrentIcon = ONBOARDING_STEPS[step].icon;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: colors.bg, padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '20px' }}>
        <button onClick={handleSkip} style={{ fontSize: '16px', fontWeight: '600', color: colors.textSecondary }}>
          Skip
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, justifyContent: 'center' }}>
        <div style={{ 
          width: '200px', height: '200px', borderRadius: '100px', 
          backgroundColor: colors.primary + '15', 
          display: 'flex', justifyContent: 'center', alignItems: 'center', 
          marginBottom: '40px' 
        }}>
          <CurrentIcon size={100} color={colors.primary} strokeWidth={1.5} />
        </div>
        <h1 style={{ fontSize: '28px', fontWeight: '800', textAlign: 'center', marginBottom: '16px', color: colors.primary }}>
          {ONBOARDING_STEPS[step].title}
        </h1>
        <p style={{ fontSize: '16px', textAlign: 'center', lineHeight: '24px', padding: '0 20px', color: colors.textSecondary }}>
          {ONBOARDING_STEPS[step].subtitle}
        </p>
      </div>

      <div style={{ paddingBottom: '40px' }}>
        <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center', marginBottom: '30px' }}>
          {ONBOARDING_STEPS.map((_, i) => (
            <div 
              key={i} 
              style={{ 
                width: step === i ? '24px' : '8px', 
                height: '8px', 
                borderRadius: '4px', 
                margin: '0 4px', 
                backgroundColor: step === i ? colors.primary : colors.border,
                transition: 'width 0.3s ease, background-color 0.3s ease'
              }} 
            />
          ))}
        </div>
        <button 
          onClick={handleNext}
          style={{ 
            width: '100%', padding: '18px 0', borderRadius: '12px', 
            backgroundColor: colors.primary, color: '#FFFFFF', 
            fontSize: '16px', fontWeight: '700', 
            boxShadow: `0px 4px 8px ${colors.primary}33`,
            cursor: 'pointer',
            border: 'none',
            display: 'flex', justifyContent: 'center'
          }}
        >
          {step === ONBOARDING_STEPS.length - 1 ? 'Get Started' : 'Next'}
        </button>
      </div>
    </div>
  );
}
