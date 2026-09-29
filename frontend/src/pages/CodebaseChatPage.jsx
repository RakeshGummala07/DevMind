import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { IconSend, IconMessageCircle, IconCircleCheck, IconAlertCircle } from '@tabler/icons-react';
import PageContainer from '../components/PageContainer.jsx';
import TraceLine from '../components/TraceLine.jsx';
import Button from '../components/Button.jsx';
import Badge from '../components/ui/Badge.jsx';
import ErrorState from '../components/ui/ErrorState.jsx';
import { Skeleton, LoadingRegion } from '../components/ui/Skeleton.jsx';
import { m } from '../components/Motion.jsx';
import { fadeUp, transitions, stagger } from '../utils/motionTokens.js';
import { usePageTitle } from '../hooks/usePageTitle.js';
import { useReducedMotion } from '../hooks/useReducedMotion.js';
import { askQuestion, getChatHistory } from '../features/ai/aiApi.js';

const WELCOME_MESSAGE = {
    role: 'assistant',
    text: 'Ask anything about this repository — I only answer from indexed source, with citations.',
    sources: [],
};

const SUGGESTIONS = [
    'Explain how authentication works in this repository.',
    'Where are JWT tokens generated and validated?',
    'What are the main services and how do they talk to each other?',
];

function formatSource(source) {
    // History returns plain "path:start-end" strings; a fresh answer returns
    // {filePath, startLine, endLine} objects — normalize both to one display string.
    if (typeof source === 'string') return source;
    return `${source.filePath}:${source.startLine}-${source.endLine}`;
}

function ChatMessage({ role, text, sources, grounded }) {
    const isUser = role === 'user';
    return (
        <m.div
            initial={fadeUp.initial}
            animate={fadeUp.animate}
            transition={transitions.base}
            className={`msg ${isUser ? 'msg--user' : 'msg--assistant'}`}
        >
            <span className="sr-only">{isUser ? 'You said:' : 'DevMind answered:'}</span>
            <div className={`msg__bubble${!isUser && grounded === false ? ' is-ungrounded' : ''}`}>{text}</div>

            {!isUser && grounded === false && (
                <div className="msg__flag">
                    <Badge tone="neutral" title="No matching indexed source was found for this answer">
                        <IconAlertCircle size={12} aria-hidden="true" /> Not grounded in indexed source
                    </Badge>
                </div>
            )}

            {!isUser && sources?.length > 0 && (
                <m.ul
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    transition={{ ...transitions.base, delay: 0.15 }}
                    className="msg__sources"
                    aria-label="Sources"
                >
                    {sources.map((source, i) => (
                        <m.li
                            key={formatSource(source)}
                            initial={{ opacity: 0, x: -6 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 + i * stagger.list }}
                            className="source-chip"
                        >
                            <IconCircleCheck size={12} aria-hidden="true" />
                            {formatSource(source)}
                        </m.li>
                    ))}
                </m.ul>
            )}
        </m.div>
    );
}

export default function CodebaseChatPage() {
    usePageTitle('Chat');
    const { id: repositoryId } = useParams();
    const queryClient = useQueryClient();
    const reduced = useReducedMotion();
    const [input, setInput] = useState('');
    const listRef = useRef(null);

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
        ...(historyQuery.data ?? []).map((h) => ({ role: h.role, text: h.content, sources: h.sources, grounded: h.grounded })),
    ];

    // Optimistically show the just-sent question + a "thinking" placeholder
    // while the mutation is in flight, since history only updates once the
    // full round-trip (embed -> search -> generate) completes.
    const pendingQuestion = askMutation.isPending ? askMutation.variables : null;

    // Scroll only the message list (not the whole page) to the newest message.
    useEffect(() => {
        const el = listRef.current;
        if (el) el.scrollTo({ top: el.scrollHeight, behavior: reduced ? 'auto' : 'smooth' });
    }, [messages.length, pendingQuestion, reduced]);

    const handleSend = (event) => {
        event?.preventDefault();
        const question = input.trim();
        if (!question || askMutation.isPending) return;
        setInput('');
        askMutation.mutate(question);
    };

    const hasHistory = (historyQuery.data?.length ?? 0) > 0;

    return (
        <PageContainer bare>
            <div className="chat">
                <div className="chat__head">
                    <h2 className="sub-title">Codebase chat</h2>
                    <TraceLine active={askMutation.isPending} tone="ember" label="Generating answer" />
                </div>

                <div className="chat__list" ref={listRef} tabIndex={0} role="log" aria-label="Conversation" aria-live="polite">
                    {historyQuery.isLoading && (
                        <LoadingRegion label="Loading conversation">
                            <Skeleton width="55%" height={44} radius={12} />
                        </LoadingRegion>
                    )}

                    {historyQuery.isError && (
                        <ErrorState
                            compact
                            title="Couldn’t load earlier messages"
                            message="You can still ask a new question."
                            onRetry={() => historyQuery.refetch()}
                            retrying={historyQuery.isFetching}
                        />
                    )}

                    {messages.map((message, i) => (
                        <ChatMessage key={i} {...message} />
                    ))}
                    {pendingQuestion && <ChatMessage key="pending" role="user" text={pendingQuestion} sources={[]} />}

                    {askMutation.isPending && (
                        <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="chat__thinking mono" role="status">
                            retrieving relevant source and drafting an answer…
                        </m.div>
                    )}

                    {askMutation.isError && (
                        <ErrorState
                            compact
                            title="Couldn’t get an answer"
                            message="The AI service didn’t respond. Your question wasn’t lost — try sending it again."
                            onRetry={() => askMutation.mutate(askMutation.variables)}
                        />
                    )}

                    {!hasHistory && !historyQuery.isLoading && !askMutation.isPending && (
                        <div className="chat__suggest">
                            <p>Try asking</p>
                            <ul>
                                {SUGGESTIONS.map((s) => (
                                    <li key={s}>
                                        <button type="button" className="chip" onClick={() => setInput(s)}>
                                            <IconMessageCircle size={14} aria-hidden="true" /> {s}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                <form className="chat__form" onSubmit={handleSend}>
                    <label htmlFor="chat-input" className="sr-only">Ask a question about this repository</label>
                    <input
                        id="chat-input"
                        className="input"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Explain how authentication works in this repository…"
                        autoComplete="off"
                    />
                    <Button type="submit" icon={IconSend} disabled={!input.trim() || askMutation.isPending} aria-label="Send question">
                        <span className="hide-mobile">Send</span>
                    </Button>
                </form>
            </div>
        </PageContainer>
    );
}
