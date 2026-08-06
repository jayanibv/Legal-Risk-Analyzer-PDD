import React, { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { chatWithBot } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';

export default function ChatScreen() {
  const { colors, isDark } = useTheme();
  
  const [messages, setMessages] = useState([
    { id: '1', text: "Hello! I am your Legal Assistant. How can I help you today?", isUser: false }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const sendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!input.trim() || loading) return;
    
    const userMsg = { id: Date.now().toString(), text: input.trim(), isUser: true };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const responseText = await chatWithBot(userMsg.text);
      const botMsg = { id: (Date.now() + 1).toString(), text: responseText, isUser: false };
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      const errorMsg = { id: (Date.now() + 1).toString(), text: "Sorry, I couldn't reach the server.", isUser: false };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const renderMessageText = (text, isUser) => {
    const boldParts = text.split(/(\*\*.*?\*\*)/g);
    return (
      <span style={{ fontSize: '15px', fontFamily: 'Inter, sans-serif', lineHeight: '22px', color: isUser ? '#1B1F3B' : colors.text }}>
        {boldParts.map((bPart, bIndex) => {
          if (bPart.startsWith('**') && bPart.endsWith('**')) {
            return <strong key={bIndex}>{bPart.slice(2, -2)}</strong>;
          }
          const italicParts = bPart.split(/(\*[^\n*]+\*)/g);
          return italicParts.map((iPart, iIndex) => {
            if (iPart.startsWith('*') && iPart.endsWith('*') && iPart.length > 2) {
              return <em key={`${bIndex}-${iIndex}`}>{iPart.slice(1, -1)}</em>;
            }
            return <React.Fragment key={`${bIndex}-${iIndex}`}>{iPart}</React.Fragment>;
          });
        })}
      </span>
    );
  };

  return (
    <div style={{ flex: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column', background: `linear-gradient(180deg, ${colors.bg} 0%, ${colors.cardAlt} 100%)` }}>
      {/* Header */}
      <div style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', borderBottom: `1px solid ${colors.divider}`, backgroundColor: colors.card, position: 'sticky', top: 0, zIndex: 10 }}>
        <img src="/mascot.jpg" alt="Mascot" style={{ width: '44px', height: '44px', borderRadius: '22px' }} onError={(e) => e.target.style.display='none'} />
        <div style={{ flex: 1, marginLeft: '12px' }}>
          <h2 style={{ fontSize: '20px', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 'bold', margin: 0, color: colors.text }}>AI Legal Assistant</h2>
          <span style={{ color: colors.success, fontSize: '12px', fontWeight: '600' }}>● Online</span>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column' }}>
        <AnimatePresence>
          {messages.map((item) => (
            <motion.div 
              key={item.id}
              initial={{ opacity: 0, x: item.isUser ? 20 : -20 }}
              animate={{ opacity: 1, x: 0 }}
              style={{
                alignSelf: item.isUser ? 'flex-end' : 'flex-start',
                maxWidth: '85%',
                padding: '16px',
                borderRadius: '16px',
                borderBottomRightRadius: item.isUser ? '6px' : '16px',
                borderBottomLeftRadius: item.isUser ? '16px' : '6px',
                backgroundColor: item.isUser ? colors.primary : colors.cardAlt,
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                marginBottom: '12px'
              }}
            >
              {renderMessageText(item.text, item.isUser)}
            </motion.div>
          ))}
        </AnimatePresence>

        {loading && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              alignSelf: 'flex-start',
              padding: '16px',
              borderRadius: '16px',
              borderBottomLeftRadius: '6px',
              backgroundColor: colors.cardAlt,
              marginBottom: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '70px',
              height: '44px'
            }}
          >
            <div className="dot-typing" style={{ display: 'flex', gap: '4px' }}>
              <div style={{ width: '6px', height: '6px', backgroundColor: colors.primary, borderRadius: '50%', animation: 'bounce 1s infinite alternate' }} />
              <div style={{ width: '6px', height: '6px', backgroundColor: colors.primary, borderRadius: '50%', animation: 'bounce 1s infinite alternate 0.2s' }} />
              <div style={{ width: '6px', height: '6px', backgroundColor: colors.primary, borderRadius: '50%', animation: 'bounce 1s infinite alternate 0.4s' }} />
            </div>
            <style>{`@keyframes bounce { to { transform: translateY(-4px); } }`}</style>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div style={{ backgroundColor: colors.card, borderTop: `1px solid ${colors.divider}` }}>
        <form onSubmit={sendMessage} style={{ display: 'flex', alignItems: 'center', padding: '16px', paddingBottom: '8px' }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a legal question..."
            style={{
              flex: 1,
              minHeight: '48px',
              borderRadius: '24px',
              padding: '0 20px',
              fontSize: '15px',
              fontFamily: 'Inter, sans-serif',
              backgroundColor: colors.bg,
              color: colors.text,
              border: 'none',
              outline: 'none',
              marginRight: '12px'
            }}
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '24px',
              border: 'none',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              background: input.trim() ? `linear-gradient(45deg, #00E5FF, #00F5A0)` : colors.divider,
              cursor: input.trim() ? 'pointer' : 'not-allowed',
              boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
            }}
          >
            <Send size={20} color={input.trim() ? "#1B1F3B" : colors.textSecondary} />
          </button>
        </form>
        <p style={{ fontSize: '11px', fontFamily: 'Inter, sans-serif', textAlign: 'center', margin: '4px 0 16px 0', color: colors.textSecondary }}>
          AI can make mistakes. Please verify important information.
        </p>
      </div>
    </div>
  );
}
