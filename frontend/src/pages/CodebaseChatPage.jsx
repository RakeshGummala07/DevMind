import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IconSend } from '@tabler/icons-react';
import PageContainer from '../components/PageContainer.jsx';
import TraceLine from '../components/TraceLine.jsx';
import { fadeUp, transitions, stagger } from '../utils/motionTokens.js';

function ChatMessage({ role, text, sources, isStreaming }) {
  const isUser = role === 'user';
  return (
    <motion.div
      initial={fadeUp.initial}
      animate={fadeUp.animate}
      transition={transitions.base}
      style={{
        alignSelf: isUser ? 'flex-end' : 'flex-start',
        maxWidth: '72%',
      }}
    >
      <div
        style={{
          padding: '12px 16px',
          borderRadius: 'var(--radius)',
          background: isUser ? 'var(--surface-3)' : 'var(--surface-1)',
          border: '1px solid var(--border)',
          fontSize: 14,
          lineHeight: 1.6,
        }}
      >
        {text}
      </div>

      {!isUser && !isStreaming && sources?.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={{ ...transitions.base, delay: 0.15 }}
          style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 6 }}
        >
          {sources.map((source, i) => (
            <motion.span
              key={source}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * stagger.list }}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                padding: '4px 8px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--signal-dim)',
                color: 'var(--signal)',
                border: '1px solid var(--signal-dim)',
              }}
            >
              {source}
            </motion.span>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}

export default function CodebaseChatPage() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: 'Ask anything about this repository — I only answer from indexed source, with citations.',
      sources: [],
    },
  ]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);

  const handleSend = () => {
    if (!input.trim()) return;
    const question = input.trim();
    setMessages((prev) => [...prev, { role: 'user', text: question }]);
    setInput('');
    setThinking(true);

    // Placeholder for POST /api/repositories/{id}/chat — wired up once ai-service exists (Phase 5).
    // Simulated RAG round-trip so the interaction pattern is real even before the backend is.
    setTimeout(() => {
      setThinking(false);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: 'Authentication starts at JwtAuthenticationFilter, which validates the bearer token on every request before it reaches a controller.',
          sources: ['JwtAuthenticationFilter.java', 'JwtService.java', 'SecurityConfig.java'],
        },
      ]);
    }, 1400);
  };

  return (
    <PageContainer style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - var(--topnav-height))' }}>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ marginBottom: 4 }}>Codebase chat</h2>
        <TraceLine active={thinking} tone="ember" />
      </div>

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 16 }}>
        <AnimatePresence>
          {messages.map((message, i) => (
            <ChatMessage key={i} {...message} />
          ))}
        </AnimatePresence>

        {thinking && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              alignSelf: 'flex-start',
              fontSize: 13,
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            retrieving relevant chunks from qdrant…
          </motion.div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Explain how authentication works in this repository…"
          style={{
            flex: 1,
            padding: '12px 14px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-strong)',
            background: 'var(--surface-2)',
            color: 'var(--text-primary)',
            fontSize: 14,
          }}
        />
        <motion.button
          onClick={handleSend}
          whileTap={{ scale: 0.95 }}
          style={{
            width: 44,
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--ember)',
            background: 'var(--ember)',
            color: '#1a0e05',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <IconSend size={18} />
        </motion.button>
      </div>
    </PageContainer>
  );
}
