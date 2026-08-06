import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Moon, Shield, HelpCircle, Mail, LogOut, ChevronRight, X } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { removeToken } from '../services/auth';
import { getUserProfile, updateProfile } from '../services/api';

export default function SettingsScreen() {
  const navigate = useNavigate();
  const { colors, isDark, toggleTheme } = useTheme();

  const [userName, setUserName] = useState('User');
  const [userEmail, setUserEmail] = useState('');
  const [userDob, setUserDob] = useState('');
  const [loading, setLoading] = useState(true);
  
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [contentModal, setContentModal] = useState({ visible: false, title: '', content: [] });
  
  const [newName, setNewName] = useState('');
  const [newDob, setNewDob] = useState('');
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState('');

  useEffect(() => {
    const loadCachedProfile = () => {
      try {
        const cachedStr = localStorage.getItem('cached_profile');
        if (cachedStr) {
          const profile = JSON.parse(cachedStr);
          setUserName(profile.name || 'User');
          setUserEmail(profile.email || '');
          setUserDob(profile.dob || '');
          setNewName(profile.name || '');
          setNewDob(profile.dob || '');
          setLoading(false);
        }
      } catch (e) {}
    };

    const fetchProfile = async () => {
      try {
        const profile = await getUserProfile();
        if (profile) {
          setUserName(profile.name || 'User');
          setUserEmail(profile.email || '');
          setUserDob(profile.dob || '');
          setNewName(profile.name || '');
          setNewDob(profile.dob || '');
          localStorage.setItem('cached_profile', JSON.stringify(profile));
        }
      } catch (e) {
      } finally {
        setLoading(false);
      }
    };

    loadCachedProfile();
    fetchProfile();
  }, []);

  const handleLogout = () => {
    removeToken();
    navigate('/onboarding');
  };

  const showContent = (type) => {
    const data = {
      privacy: {
        title: 'Privacy & Security',
        content: [
          { q: 'Is my data safe?', a: 'Yes, we use AES-256 encryption. Your documents are processed in a secure sandbox and are never shared with third parties.' },
          { q: 'Do you train AI on my files?', a: 'No. Your documents are used only for your specific analysis and are not used for training any public models.' }
        ]
      },
      help: {
        title: 'Help Center & FAQ',
        content: [
          { q: 'How do I upload a document?', a: 'Go to the Dashboard and click the "New Document Scan" button. You can upload a PDF or paste raw text.' },
          { q: 'What does the Risk Score mean?', a: 'The score (0-100) measures how favorable or predatory the terms are. Higher scores indicate more risks.' },
          { q: 'Can I see old reports?', a: 'Yes, all your previous scans are saved in the "History" tab for easy access anytime.' }
        ]
      },
      support: {
        title: 'Contact Support',
        content: [
          { q: 'Email Support', a: 'support@legalrisk.ai' },
          { q: 'Business Hours', a: 'Mon-Fri, 9:00 AM - 6:00 PM IST' },
          { q: 'Response Time', a: 'Typically within 24 hours.' }
        ]
      }
    };
    setContentModal({ visible: true, ...data[type] });
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!newName || !newDob) {
      setModalError("Please fill in all fields");
      return;
    }
    setSaving(true);
    setModalError('');
    try {
      await updateProfile(newName, newDob);
      setUserName(newName);
      setUserDob(newDob);
      setEditModalVisible(false);
      alert("Profile updated successfully!");
    } catch (e) {
      setModalError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const SettingRow = ({ icon: Icon, title, showToggle, toggleValue, onToggle, onClick }) => (
    <div 
      onClick={!showToggle ? onClick : undefined}
      style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        padding: '18px 0', 
        borderBottom: `1px solid ${colors.divider}`,
        cursor: showToggle ? 'default' : 'pointer'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <Icon size={22} color={colors.textSecondary} style={{ marginRight: '16px' }} />
        <span style={{ fontSize: '16px', fontWeight: '600', color: colors.text }}>{title}</span>
      </div>
      {showToggle ? (
        <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
          <div style={{ position: 'relative', width: '48px', height: '24px' }}>
            <input type="checkbox" checked={toggleValue} onChange={onToggle} style={{ position: 'absolute', opacity: 0, width: 0, height: 0, margin: 0 }} />
            <div style={{ width: '100%', height: '100%', backgroundColor: toggleValue ? colors.primary : '#CBD5E1', borderRadius: '12px', transition: 'background-color 0.2s' }} />
            <div style={{ position: 'absolute', top: '2px', left: toggleValue ? '26px' : '2px', width: '20px', height: '20px', backgroundColor: '#FFF', borderRadius: '50%', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }} />
          </div>
        </label>
      ) : (
        <ChevronRight size={18} color="#CBD5E1" />
      )}
    </div>
  );

  return (
    <div style={{ flex: 1, minHeight: '100vh', background: colors.bg, padding: '24px', display: 'flex', flexDirection: 'column' }}>
      <h1 style={{ fontSize: '32px', fontWeight: '800', color: colors.text, marginBottom: '32px' }}>Settings</h1>

      <div style={{ display: 'flex', alignItems: 'center', padding: '20px', borderRadius: '24px', border: `1px solid ${colors.divider}`, backgroundColor: colors.card, marginBottom: '32px' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '32px', backgroundColor: colors.primary + '15', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <span style={{ fontSize: '24px', fontWeight: '800', color: colors.primary }}>{userName.charAt(0).toUpperCase()}</span>
        </div>
        <div style={{ flex: 1, marginLeft: '16px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '800', color: colors.text, margin: 0 }}>{userName}</h2>
          <p style={{ fontSize: '14px', color: colors.textSecondary, margin: '4px 0 0 0' }}>{userEmail}</p>
        </div>
        <button 
          onClick={() => { setNewName(userName); setNewDob(userDob); setModalError(''); setEditModalVisible(true); }}
          style={{ padding: '8px 16px', borderRadius: '12px', border: `1px solid ${colors.primary}`, background: 'transparent', color: colors.primary, fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}
        >
          Edit
        </button>
      </div>

      <div style={{ marginBottom: '32px' }}>
        <h3 style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '16px', marginLeft: '4px', color: colors.textSecondary }}>App Settings</h3>
        <SettingRow icon={Moon} title="Dark Mode" showToggle toggleValue={isDark} onToggle={toggleTheme} />
      </div>

      <div style={{ marginBottom: '32px' }}>
        <h3 style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '16px', marginLeft: '4px', color: colors.textSecondary }}>Support & Legal</h3>
        <SettingRow icon={Shield} title="Privacy & Security" onClick={() => showContent('privacy')} />
        <SettingRow icon={HelpCircle} title="Help Center & FAQ" onClick={() => showContent('help')} />
        <SettingRow icon={Mail} title="Contact Support" onClick={() => showContent('support')} />
      </div>

      <button 
        onClick={handleLogout}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', borderRadius: '20px', backgroundColor: '#FEF2F2', border: 'none', cursor: 'pointer', marginTop: '10px' }}
      >
        <LogOut size={24} color="#EF4444" />
        <span style={{ marginLeft: '12px', color: '#EF4444', fontSize: '16px', fontWeight: '700' }}>Logout Account</span>
      </button>

      <p style={{ textAlign: 'center', color: '#94A3B8', fontSize: '12px', marginTop: '40px' }}>Version 1.0.0 (Production)</p>

      {/* Edit Profile Modal */}
      {editModalVisible && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px', zIndex: 100 }}>
          <div style={{ width: '100%', maxWidth: '400px', backgroundColor: colors.card, padding: '24px', borderRadius: '24px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: '800', color: colors.text, margin: '0 0 20px 0' }}>Edit Profile</h2>
            {modalError && <p style={{ color: '#EF4444', marginBottom: '16px', textAlign: 'center' }}>{modalError}</p>}
            
            <form onSubmit={handleUpdateProfile}>
              <input 
                type="text" 
                placeholder="Full Name" 
                value={newName} 
                onChange={(e) => setNewName(e.target.value)}
                style={{ width: '100%', height: '56px', borderRadius: '16px', border: `1px solid ${colors.divider}`, padding: '0 16px', marginBottom: '16px', fontSize: '16px', backgroundColor: colors.bg, color: colors.text, boxSizing: 'border-box' }}
              />
              <input 
                type="date" 
                placeholder="Date of Birth" 
                value={newDob} 
                onChange={(e) => setNewDob(e.target.value)}
                style={{ width: '100%', height: '56px', borderRadius: '16px', border: `1px solid ${colors.divider}`, padding: '0 16px', marginBottom: '24px', fontSize: '16px', backgroundColor: colors.bg, color: colors.text, boxSizing: 'border-box', colorScheme: isDark ? 'dark' : 'light' }}
              />
              
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
                <button type="button" onClick={() => setEditModalVisible(false)} style={{ flex: 1, height: '50px', borderRadius: '12px', backgroundColor: colors.divider, border: 'none', color: colors.text, cursor: 'pointer', fontWeight: 'bold' }}>Cancel</button>
                <button type="submit" disabled={saving} style={{ flex: 1, height: '50px', borderRadius: '12px', backgroundColor: colors.primary, border: 'none', color: '#fff', cursor: 'pointer', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  {saving ? <div className="spinner" style={{ width: '20px', height: '20px', borderRadius: '10px', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', animation: 'spin 1s linear infinite' }} /> : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Content Modal */}
      {contentModal.visible && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px', zIndex: 100 }}>
          <div style={{ width: '100%', maxWidth: '500px', maxHeight: '80vh', backgroundColor: colors.card, padding: '24px', borderRadius: '24px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E2E8F0', paddingBottom: '15px' }}>
              <h2 style={{ fontSize: '22px', fontWeight: '800', color: colors.text, margin: 0 }}>{contentModal.title}</h2>
              <button onClick={() => setContentModal({ ...contentModal, visible: false })} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                <X size={28} color={colors.textSecondary} />
              </button>
            </div>
            
            <div style={{ overflowY: 'auto', marginTop: '20px', paddingRight: '10px' }}>
              {contentModal.content.map((item, idx) => (
                <div key={idx} style={{ marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px', color: colors.text, margin: '0 0 8px 0' }}>{item.q}</h3>
                  <p style={{ fontSize: '15px', lineHeight: '22px', color: colors.textSecondary, margin: 0 }}>{item.a}</p>
                </div>
              ))}
            </div>

            <button 
              onClick={() => setContentModal({ ...contentModal, visible: false })}
              style={{ width: '100%', height: '56px', borderRadius: '16px', backgroundColor: colors.primary, color: '#fff', border: 'none', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer', marginTop: '20px' }}
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
