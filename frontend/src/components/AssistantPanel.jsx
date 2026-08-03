import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { MessageSquare, Send, X, RefreshCw, Loader2, Bot, User } from 'lucide-react';

export default function AssistantPanel({ isOpen, onClose }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sessionId, setSessionId] = useState(() => localStorage.getItem('chatSessionId'));
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Automatically scroll chat messages to the bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setLoading(true);

    // Optimistically add user message to list
    const tempUserMsg = {
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempUserMsg]);

    try {
      const data = await api.sendChatMessage(userMessage, sessionId);
      
      // Update session ID if new session was initialized
      if (data.session_id && data.session_id !== sessionId) {
        setSessionId(data.session_id);
        localStorage.setItem('chatSessionId', data.session_id);
      }
      
      setMessages(data.history);
    } catch (err) {
      console.error(err);
      const errorMsg = {
        role: 'assistant',
        content: 'An error occurred while connecting to the assistant. Please try again.',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleResetSession = () => {
    setSessionId(null);
    localStorage.removeItem('chatSessionId');
    setMessages([]);
  };

  if (!isOpen) return null;

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        width: '380px',
        backgroundColor: 'var(--surface)',
        borderLeft: '1px solid var(--border)',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: 'var(--elevation-lg)',
        animation: 'slide-in 0.3s ease-out'
      }}
    >
      {/* Header */}
      <div 
        style={{ 
          padding: 'var(--space-md)', 
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MessageSquare size={16} style={{ color: 'var(--primary)' }} />
          <span className="label-sm" style={{ color: 'var(--on-surface)' }}>AI Research Assistant</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button 
            onClick={handleResetSession} 
            title="Reset Chat Session"
            style={{ 
              background: 'none', 
              color: 'var(--on-surface-faint)', 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center' 
            }}
          >
            <RefreshCw size={14} />
          </button>
          <button 
            onClick={onClose} 
            style={{ 
              background: 'none', 
              color: 'var(--on-surface-faint)', 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center' 
            }}
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Messages Viewport */}
      <div 
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: 'var(--space-md)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-md)'
        }}
      >
        {messages.length === 0 && !loading && (
          <div style={{ textAlign: 'center', marginTop: '40px', padding: '0 20px' }}>
            <span className="label-sm" style={{ color: 'var(--on-surface-faint)', fontSize: '0.625rem' }}>Start a Conversation</span>
            <p className="body-md" style={{ fontSize: '0.875rem', marginTop: '8px' }}>
              Ask me about your tech stack choice, specific research papers, vector embeddings, or requested backend models.
            </p>
          </div>
        )}

        {messages.map((msg, idx) => {
          const isUser = msg.role === 'user';
          return (
            <div 
              key={idx} 
              style={{
                alignSelf: isUser ? 'flex-end' : 'flex-start',
                maxWidth: '85%',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                alignItems: isUser ? 'flex-end' : 'flex-start'
              }}
            >
              {/* Header/Role icon identifier */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--on-surface-faint)' }}>
                {isUser ? <User size={10} /> : <Bot size={10} style={{ color: 'var(--primary)' }} />}
                <span className="label-sm" style={{ fontSize: '0.55rem', letterSpacing: '0.04em' }}>
                  {isUser ? 'USER' : 'ASSISTANT'}
                </span>
              </div>
              
              {/* Speech bubble */}
              <div 
                style={{
                  backgroundColor: isUser ? 'var(--elevated)' : 'var(--background)',
                  border: `1px solid ${isUser ? 'var(--border-strong)' : 'var(--border)'}`,
                  color: 'var(--on-surface)',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  borderTopRightRadius: isUser ? '2px' : '12px',
                  borderTopLeftRadius: isUser ? '12px' : '2px',
                  fontSize: '0.875rem',
                  lineHeight: 1.4,
                  wordBreak: 'break-word',
                  whiteSpace: 'pre-wrap'
                }}
              >
                {msg.content}
              </div>
            </div>
          );
        })}

        {loading && (
          <div style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--on-surface-faint)' }}>
            <Loader2 className="animate-spin" size={14} style={{ color: 'var(--primary)' }} />
            <span className="label-sm" style={{ fontSize: '0.625rem' }}>Assistant is typing...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Tray */}
      <form 
        onSubmit={handleSend}
        style={{
          padding: 'var(--space-md)',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          gap: 'var(--space-sm)'
        }}
      >
        <input 
          type="text" 
          placeholder="Ask a follow-up question..." 
          className="input-field"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
          style={{ height: '40px' }}
        />
        <button 
          type="submit" 
          className="btn-primary" 
          style={{ width: '40px', height: '40px', padding: 0, borderRadius: 'var(--radius-md)', flexShrink: 0 }}
          disabled={!input.trim() || loading}
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
