import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { IconSend } from '@tabler/icons-react';
import PageContainer from '../components/PageContainer.jsx';
import TraceLine from '../components/TraceLine.jsx';
import { fadeUp, transitions, stagger } from '../utils/motionTokens.js';
import { askQuestion, getChatHistory } from '../features/ai/aiApi.js';

const WELCOME_MESSAGE = {
    role: 'assistant',
    text: 'Ask anything about this repository — I only answer from indexed source, with citations.',
    sources: [],
};

function formatSource(source) {
    // History returns plain "path:start-end" strings; a fresh answer returns
    // {filePath, startLine, endLine} objects — normalize both to one display string.
    if (typeof source === 'string') return source;
    return `${source.filePath}:${source.startLine}-${source.endLine}`;
}

function ChatMessage({ role, text, sources, grounded }) {
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
                    border: `1px solid ${!isUser && grounded === false ? 'var(--border-strong)' : 'var(--border)'}`,
                    fontSize: 14,
                    lineHeight: 1.6,
                }}
            >
                {text}
            </div>

            {!isUser && sources?.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    transition={{ ...transitions.base, delay: 0.15 }}
                    style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 6 }}
                >
                    {sources.map((source, i) => (
                        <motion.span
                            key={formatSource(source)}
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
                            {formatSource(source)}
                        </motion.span>
                    ))}
                </motion.div>
            )}
        </motion.div>
    );
}

export default function CodebaseChatPage() {
    const { id: repositoryId } = useParams();
    const queryClient = useQueryClient();
    const [input, setInput] = useState('');
    const scrollRef = useRef(null);

    const historyQuery = useQuery({
        queryKey: ['chat', repositoryId, 'history'],
        queryFn: () => getChatHistory(repositoryId),
    });

    const askMutation = useMutation({
        mutationFn: (message) => askQuestion(repositoryId, message),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['chat', repositoryId, 'history'] });
        },
    });

    const messages = [
        WELCOME_MESSAGE,
        ...(historyQuery.data ?? []).map((m) => ({ role: m.role, text: m.content, sources: m.sources, grounded: m.grounded })),
    ];

    // Optimistically show the just-sent question + a "thinking" placeholder
    // while the mutation is in flight, since history only updates once the
    // full round-trip (embed -> search -> generate) completes.
    const pendingQuestion = askMutation.isPending ? askMutation.variables : null;

    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages.length, pendingQuestion]);

    const handleSend = () => {
        const question = input.trim();
        if (!question || askMutation.isPending) return;
        setInput('');
        askMutation.mutate(question);
    };

    return (
        <PageContainer style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - var(--topnav-height))' }}>
            <div style={{ marginBottom: 16 }}>
                <h2 style={{ marginBottom: 4 }}>Codebase chat</h2>
                <TraceLine active={askMutation.isPending} tone="ember" />
            </div>

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 16 }}>
                <AnimatePresence>
                    {messages.map((message, i) => (
                        <ChatMessage key={i} {...message} />
                    ))}
                    {pendingQuestion && <ChatMessage key="pending" role="user" text={pendingQuestion} sources={[]} />}
                </AnimatePresence>

                {askMutation.isPending && (
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

                {askMutation.isError && (
                    <p style={{ color: 'var(--critical)', fontSize: 13 }}>
                        Could not get an answer — check that ai-service, Qdrant, and Ollama are running.
                    </p>
                )}

                <div ref={scrollRef} />
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
