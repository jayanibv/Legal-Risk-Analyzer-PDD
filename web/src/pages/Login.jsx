import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Mail, Eye, EyeOff } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { login, resetPassword } from '../services/api';
import { saveToken } from '../services/auth';
import AnimatedButton from '../components/AnimatedButton';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotDob, setForgotDob] = useState('');
  const [forgotSecurity, setForgotSecurity] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [modalError, setModalError] = useState('');
  const [modalSuccess, setModalSuccess] = useState('');

  const { colors, isDark } = useTheme();
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!email || !password) {
      setErrorMsg('Please fill in all fields');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    try {
      const data = await login(email, password);
      if (data.access_token) {
        saveToken(data.access_token);
        navigate('/dashboard');
      }
    } catch (error) {
      setErrorMsg(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!forgotEmail || !forgotDob || !forgotSecurity || !newPassword) {
      setModalError('Please fill in all fields');
      return;
    }
    setLoading(true);
    setModalError('');
    try {
      await resetPassword(forgotEmail, forgotDob, forgotSecurity, newPassword);
      setModalSuccess('Password reset successfully!');
      setTimeout(() => {
        setShowForgotModal(false);
        setModalSuccess('');
        setForgotEmail('');
        setForgotDob('');
        setForgotSecurity('');
        setNewPassword('');
      }, 2000);
    } catch (error) {
      setModalError(error.message);
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
    fontFamily: 'inherit'
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
              <Lock size={40} color={colors.primary} strokeWidth={1.5} />
            </div>
            <h1 style={{ fontSize: '32px', fontWeight: '800', color: colors.text, marginBottom: '8px' }}>Welcome Back</h1>
            <p style={{ fontSize: '16px', color: colors.textSecondary }}>Sign in to access your reports</p>
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
              <Mail size={20} color={colors.textSecondary} />
              <input
                style={textInputStyle}
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div style={inputStyle}>
              <Lock size={20} color={colors.textSecondary} />
              <input
                style={textInputStyle}
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button onClick={() => setShowPassword(!showPassword)} style={{ padding: '4px', cursor: 'pointer' }}>
                {showPassword ? <EyeOff size={20} color={colors.textSecondary} /> : <Eye size={20} color={colors.textSecondary} />}
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
              <button onClick={() => setShowForgotModal(true)} style={{ color: colors.textSecondary, fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
                Forgot Password?
              </button>
            </div>

            <AnimatedButton
              title="Sign In"
              onPress={handleLogin}
              loading={loading}
            />

            {errorMsg && <p style={{ color: colors.error, textAlign: 'center', marginTop: '16px', fontSize: '14px' }}>{errorMsg}</p>}

            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '24px', fontSize: '15px' }}>
              <span style={{ color: colors.textSecondary }}>Don't have an account? </span>
              <Link to="/signup" style={{ color: colors.primary, fontWeight: '600', marginLeft: '4px' }}>
                Sign Up
              </Link>
            </div>
          </motion.div>
        </div>
      </div>

      {showForgotModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '24px' }}>
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{ width: '100%', maxWidth: '400px', backgroundColor: colors.card, padding: '32px', borderRadius: '24px' }}
          >
            <h2 style={{ fontSize: '24px', fontWeight: '700', color: colors.text, marginBottom: '24px', textAlign: 'center' }}>Reset Password</h2>
            
            <div style={inputStyle}>
              <input style={textInputStyle} type="email" placeholder="Email" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} />
            </div>
            <div style={inputStyle}>
              <input style={textInputStyle} type="date" placeholder="Date of Birth" value={forgotDob} onChange={(e) => setForgotDob(e.target.value)} />
            </div>
            <div style={inputStyle}>
              <input style={textInputStyle} type="text" placeholder="Security Answer (Mother's maiden name)" value={forgotSecurity} onChange={(e) => setForgotSecurity(e.target.value)} />
            </div>
            <div style={inputStyle}>
              <input style={textInputStyle} type={showNewPassword ? "text" : "password"} placeholder="New Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
              <button onClick={() => setShowNewPassword(!showNewPassword)} style={{ padding: '4px' }}>
                {showNewPassword ? <EyeOff size={20} color={colors.textSecondary} /> : <Eye size={20} color={colors.textSecondary} />}
              </button>
            </div>

            {modalError && <p style={{ color: colors.error, textAlign: 'center', marginBottom: '16px', fontSize: '14px' }}>{modalError}</p>}
            {modalSuccess && <p style={{ color: colors.success, textAlign: 'center', marginBottom: '16px', fontSize: '14px' }}>{modalSuccess}</p>}

            <AnimatedButton title="Reset Password" onPress={handleResetPassword} loading={loading} />
            <button onClick={() => setShowForgotModal(false)} style={{ width: '100%', textAlign: 'center', marginTop: '16px', color: colors.textSecondary, fontWeight: '600' }}>Cancel</button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
