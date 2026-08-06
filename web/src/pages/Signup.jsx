import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Mail, Lock, Eye, EyeOff, Calendar, ShieldQuestion, CheckCircle2 } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { signup } from '../services/api';
import { saveToken } from '../services/auth';
import AnimatedButton from '../components/AnimatedButton';

export default function SignupScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [dob, setDob] = useState(''); // YYYY-MM-DD
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [isMajor, setIsMajor] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, label: 'Weak', color: '#EF4444' });

  const { colors, isDark } = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    validatePasswordStrength(password);
  }, [password]);

  const validatePasswordStrength = (pass) => {
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;

    if (score === 0) setPasswordStrength({ score: 0, label: 'Weak', color: '#EF4444' });
    else if (score === 1) setPasswordStrength({ score: 1, label: 'Fair', color: '#F59E0B' });
    else if (score === 2) setPasswordStrength({ score: 2, label: 'Good', color: '#3B82F6' });
    else setPasswordStrength({ score: 3, label: 'Strong', color: '#10B981' });
  };

  const handleSignup = async () => {
    if (!name || !email || !password || !confirmPassword || !dob || !securityAnswer) {
      setErrorMsg('Please fill in all fields');
      return;
    }
    if (!isMajor) {
      setErrorMsg('You must confirm you are of legal age');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      const data = await signup(name, email, password, isMajor, dob, securityAnswer);
      if (data.access_token) {
        saveToken(data.access_token);
        navigate('/dashboard');
      }
    } catch (error) {
      setErrorMsg(error.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    backgroundColor: colors.cardAlt,
    borderRadius: '12px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: '16px',
    border: `1px solid ${colors.border}`
  };

  const textInputStyle = {
    flex: 1,
    marginLeft: '12px',
    backgroundColor: 'transparent',
    border: 'none',
    outline: 'none',
    color: colors.text,
    fontSize: '16px',
    fontFamily: 'inherit',
    width: '100%'
  };

  return (
    <div style={{ flex: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column', background: `linear-gradient(180deg, ${colors.bg} 0%, ${colors.cardAlt} 100%)` }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        
        <div style={{ width: '100%', maxWidth: '400px' }}>
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', damping: 20 }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '40px' }}
          >
            <div style={{ width: '80px', height: '80px', borderRadius: '40px', backgroundColor: colors.primary + '15', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '24px' }}>
              <User size={40} color={colors.primary} strokeWidth={1.5} />
            </div>
            <h1 style={{ fontSize: '32px', fontWeight: '800', color: colors.text, marginBottom: '8px' }}>Create Account</h1>
            <p style={{ fontSize: '16px', color: colors.textSecondary }}>Sign up to analyze contracts securely</p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', damping: 20, delay: 0.1 }}
            style={{ 
              backgroundColor: colors.card, 
              padding: '32px', 
              borderRadius: '24px',
              boxShadow: isDark ? '0 10px 25px rgba(0,0,0,0.5)' : `0 10px 25px ${colors.primary}1A`
            }}
          >
            <div style={inputStyle}>
              <User size={20} color={colors.textSecondary} />
              <input style={textInputStyle} type="text" placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>

            <div style={inputStyle}>
              <Mail size={20} color={colors.textSecondary} />
              <input style={textInputStyle} type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>

            <div style={inputStyle}>
              <Calendar size={20} color={colors.textSecondary} />
              <input style={textInputStyle} type="date" placeholder="Date of Birth" value={dob} onChange={(e) => setDob(e.target.value)} />
            </div>

            <div style={inputStyle}>
              <ShieldQuestion size={20} color={colors.textSecondary} />
              <input style={textInputStyle} type="text" placeholder="Security Answer (Mother's maiden name)" value={securityAnswer} onChange={(e) => setSecurityAnswer(e.target.value)} />
            </div>

            <div style={inputStyle}>
              <Lock size={20} color={colors.textSecondary} />
              <input style={textInputStyle} type={showPassword ? "text" : "password"} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
              <button onClick={() => setShowPassword(!showPassword)} style={{ padding: '4px', cursor: 'pointer' }}>
                {showPassword ? <EyeOff size={20} color={colors.textSecondary} /> : <Eye size={20} color={colors.textSecondary} />}
              </button>
            </div>

            {password.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', marginBottom: '16px', paddingLeft: '8px' }}>
                <div style={{ flex: 1, height: '4px', backgroundColor: colors.border, borderRadius: '2px', marginRight: '8px', overflow: 'hidden' }}>
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(passwordStrength.score + 1) * 25}%` }}
                    style={{ height: '100%', backgroundColor: passwordStrength.color }}
                  />
                </div>
                <span style={{ fontSize: '12px', fontWeight: '600', color: passwordStrength.color }}>{passwordStrength.label}</span>
              </div>
            )}

            <div style={inputStyle}>
              <Lock size={20} color={colors.textSecondary} />
              <input style={textInputStyle} type={showConfirmPassword ? "text" : "password"} placeholder="Confirm Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
              <button onClick={() => setShowConfirmPassword(!showConfirmPassword)} style={{ padding: '4px', cursor: 'pointer' }}>
                {showConfirmPassword ? <EyeOff size={20} color={colors.textSecondary} /> : <Eye size={20} color={colors.textSecondary} />}
              </button>
            </div>

            <button onClick={() => setIsMajor(!isMajor)} style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', marginBottom: '24px', cursor: 'pointer', textAlign: 'left' }}>
              <div style={{ marginRight: '12px' }}>
                {isMajor ? <CheckCircle2 size={24} color={colors.primary} /> : <div style={{ width: '24px', height: '24px', borderRadius: '12px', border: `2px solid ${colors.textSecondary}` }} />}
              </div>
              <span style={{ fontSize: '14px', color: colors.textSecondary, lineHeight: '20px' }}>I confirm that I am at least 18 years old and agree to the Terms of Service.</span>
            </button>

            <AnimatedButton title="Sign Up" onPress={handleSignup} loading={loading} />

            {errorMsg && <p style={{ color: colors.error, textAlign: 'center', marginTop: '16px', fontSize: '14px' }}>{errorMsg}</p>}

            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '24px', fontSize: '15px' }}>
              <span style={{ color: colors.textSecondary }}>Already have an account? </span>
              <Link to="/login" style={{ color: colors.primary, fontWeight: '600', marginLeft: '4px' }}>
                Sign In
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
