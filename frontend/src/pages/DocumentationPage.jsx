import { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { IconFileText, IconSparkles, IconRefresh, IconClock } from '@tabler/icons-react';
import PageContainer from '../components/PageContainer.jsx';
import TraceLine from '../components/TraceLine.jsx';
import { fadeUp, transitions } from '../utils/motionTokens.js';
import { generateDocument, listDocuments } from '../features/documentation/documentationApi.js';

const DOC_TYPES = [
    { key: 'README', label: 'README', blurb: 'Overview, features, setup' },
    { key: 'ARCHITECTURE', label: 'Architecture', blurb: 'Services, components, data flow' },
    { key: 'API', label: 'API', blurb: 'Endpoints by controller' },
    { key: 'ONBOARDING', label: 'Onboarding', blurb: 'Getting a new dev running locally' },
];

export default function DocumentationPage() {
    const { id: repositoryId } = useParams();
    const queryClient = useQueryClient();
    const [selectedType, setSelectedType] = useState('README');

    const listQuery = useQuery({
        queryKey: ['documentation', repositoryId],
        queryFn: () => listDocuments(repositoryId),
    });

    const docsByType = useMemo(() => {
        const map = {};
        for (const doc of listQuery.data ?? []) map[doc.docType] = doc;
        return map;
    }, [listQuery.data]);

    const generateMutation = useMutation({
        mutationFn: (docType) => generateDocument(repositoryId, docType),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['documentation', repositoryId] });
        },
    });

    const selectedDoc = docsByType[selectedType];
    const isGeneratingSelected = generateMutation.isPending && generateMutation.variables === selectedType;

    return (
        <PageContainer>
            <motion.div initial={fadeUp.initial} animate={fadeUp.animate} transition={transitions.base}>
                <h2 style={{ marginBottom: 4 }}>Documentation</h2>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
                    Generate README, architecture, API, and onboarding docs grounded in this repository&apos;s indexed source.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 24, alignItems: 'start' }}>
                    {/* Left: doc type list */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {DOC_TYPES.map((type) => {
                            const exists = !!docsByType[type.key];
                            const active = selectedType === type.key;
                            return (
                                <button
                                    key={type.key}
                                    onClick={() => setSelectedType(type.key)}
                                    style={{
                                        display: 'flex', flexDirection: 'column', gap: 2,
                                        padding: '10px 12px',
                                        borderRadius: 'var(--radius-sm)',
                                        border: `1px solid ${active ? 'var(--border-strong)' : 'var(--border)'}`,
                                        background: active ? 'var(--surface-2)' : 'transparent',
                                        color: 'var(--text-primary)',
                                        textAlign: 'left',
                                        cursor: 'pointer',
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <IconFileText size={13} color={exists ? 'var(--signal)' : 'var(--text-muted)'} />
                                        <span style={{ fontSize: 13, fontWeight: 500 }}>{type.label}</span>
                                    </div>
                                    <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 19 }}>{type.blurb}</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Right: selected doc content */}
                    <div
                        style={{
                            padding: 20,
                            borderRadius: 'var(--radius)',
                            border: '1px solid var(--border)',
                            background: 'var(--surface-1)',
                            minHeight: 300,
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                            <h3 style={{ fontSize: 15 }}>{DOC_TYPES.find((t) => t.key === selectedType)?.label}</h3>

                            {selectedDoc && (
                                <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <IconClock size={12} />
                                    {new Date(selectedDoc.generatedAt).toLocaleString()}
                </span>
                            )}

                            <motion.button
                                onClick={() => generateMutation.mutate(selectedType)}
                                whileTap={{ scale: 0.97 }}
                                disabled={generateMutation.isPending}
                                style={{
                                    marginLeft: 'auto',
                                    display: 'flex', alignItems: 'center', gap: 6,
                                    padding: '7px 12px',
                                    borderRadius: 'var(--radius-sm)',
                                    border: '1px solid var(--ember)',
                                    background: isGeneratingSelected ? 'transparent' : 'var(--ember)',
                                    color: isGeneratingSelected ? 'var(--ember)' : '#1a0e05',
                                    fontSize: 12,
                                    fontWeight: 500,
                                    cursor: generateMutation.isPending ? 'default' : 'pointer',
                                }}
                            >
                                {selectedDoc ? <IconRefresh size={13} /> : <IconSparkles size={13} />}
                                {selectedDoc ? 'Regenerate' : 'Generate'}
                            </motion.button>
                        </div>

                        {isGeneratingSelected && (
                            <div style={{ marginBottom: 16 }}>
                                <TraceLine active tone="ember" />
                                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6, fontFamily: 'var(--font-mono)' }}>
                                    retrieving context, writing document… this can take a minute on CPU-only inference
                                </p>
                            </div>
                        )}

                        {generateMutation.isError && generateMutation.variables === selectedType && (
                            <p style={{ fontSize: 12, color: 'var(--critical)', marginBottom: 12 }}>
                                Couldn&apos;t generate this document — the repository may not have enough indexed content yet.
                            </p>
                        )}

                        {!selectedDoc && !isGeneratingSelected && (
                            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                                No {DOC_TYPES.find((t) => t.key === selectedType)?.label} generated yet. Click Generate to create one
                                grounded in this repository&apos;s indexed source.
                            </p>
                        )}

                        {selectedDoc && !isGeneratingSelected && (
                            <pre
                                style={{
                                    whiteSpace: 'pre-wrap',
                                    wordBreak: 'break-word',
                                    fontFamily: 'var(--font-mono)',
                                    fontSize: 12.5,
                                    lineHeight: 1.6,
                                    color: 'var(--text-primary)',
                                    background: 'var(--surface-2)',
                                    border: '1px solid var(--border)',
                                    borderRadius: 'var(--radius-sm)',
                                    padding: 16,
                                    maxHeight: 520,
                                    overflowY: 'auto',
                                }}
                            >
                {selectedDoc.content}
              </pre>
                        )}
                    </div>
                </div>
            </motion.div>
        </PageContainer>
    );
}
