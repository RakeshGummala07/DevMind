import { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { IconFileText, IconSparkles, IconRefresh, IconClock, IconCopy, IconCheck } from '@tabler/icons-react';
import PageContainer from '../components/PageContainer.jsx';
import TraceLine from '../components/TraceLine.jsx';
import Button from '../components/Button.jsx';
import Badge from '../components/ui/Badge.jsx';
import ErrorState from '../components/ui/ErrorState.jsx';
import { Skeleton, LoadingRegion } from '../components/ui/Skeleton.jsx';
import { useToast } from '../components/ui/Toast.jsx';
import { formatDateTime } from '../utils/format.js';
import { usePageTitle } from '../hooks/usePageTitle.js';
import { generateDocument, listDocuments } from '../features/documentation/documentationApi.js';

const DOC_TYPES = [
    { key: 'README', label: 'README', blurb: 'Overview, features, setup' },
    { key: 'ARCHITECTURE', label: 'Architecture', blurb: 'Services, components, data flow' },
    { key: 'API', label: 'API', blurb: 'Endpoints by controller' },
    { key: 'ONBOARDING', label: 'Onboarding', blurb: 'Getting a new dev running locally' },
];

export default function DocumentationPage() {
    usePageTitle('Documentation');
    const { id: repositoryId } = useParams();
    const queryClient = useQueryClient();
    const toast = useToast();
    const [selectedType, setSelectedType] = useState('README');
    const [copied, setCopied] = useState(false);

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
        onSuccess: (_doc, docType) => {
            queryClient.invalidateQueries({ queryKey: ['documentation', repositoryId] });
            toast.success(`${DOC_TYPES.find((t) => t.key === docType)?.label ?? 'Document'} generated.`);
        },
        onError: () => toast.error('Couldn’t generate this document. The repository may not have enough indexed content yet.'),
    });

    const selectedDoc = docsByType[selectedType];
    const selectedMeta = DOC_TYPES.find((t) => t.key === selectedType);
    const isGeneratingSelected = generateMutation.isPending && generateMutation.variables === selectedType;

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(selectedDoc.content);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1800);
        } catch {
            toast.error('Couldn’t copy to the clipboard. Select the text and copy it manually.');
        }
    };

    return (
        <PageContainer bare>
            <h2 className="sub-title">Documentation</h2>
            <p className="sub-lead">
                Generate README, architecture, API, and onboarding docs grounded in this repository&apos;s indexed source.
            </p>

            <div className="split split--docs">
                {/* Left: doc type list */}
                <nav className="doc-types" aria-label="Document types">
                    {DOC_TYPES.map((type) => {
                        const exists = !!docsByType[type.key];
                        const active = selectedType === type.key;
                        return (
                            <button
                                type="button"
                                key={type.key}
                                onClick={() => setSelectedType(type.key)}
                                aria-current={active ? 'true' : undefined}
                                className={`doc-type${active ? ' is-active' : ''}`}
                            >
                                <span className="doc-type__title">
                                    <IconFileText size={14} aria-hidden="true" color={exists ? 'var(--signal)' : 'var(--text-muted)'} />
                                    {type.label}
                                    {exists && <span className="sr-only"> (generated)</span>}
                                </span>
                                <span className="doc-type__blurb">{type.blurb}</span>
                            </button>
                        );
                    })}
                </nav>

                {/* Right: selected doc content */}
                <section className="card doc-view" aria-label={`${selectedMeta?.label} document`}>
                    <div className="doc-view__head">
                        <h3>{selectedMeta?.label}</h3>

                        {selectedDoc && (
                            <span className="doc-view__time">
                                <IconClock size={13} aria-hidden="true" />
                                {formatDateTime(selectedDoc.generatedAt)}
                            </span>
                        )}
                        {selectedDoc && selectedDoc.grounded != null && (
                            <Badge tone={selectedDoc.grounded ? 'signal' : 'neutral'}>{selectedDoc.grounded ? 'grounded' : 'not grounded'}</Badge>
                        )}

                        <div className="doc-view__actions">
                            {selectedDoc && !isGeneratingSelected && (
                                <Button variant="ghost" size="sm" icon={copied ? IconCheck : IconCopy} onClick={copy}>
                                    {copied ? 'Copied' : 'Copy'}
                                </Button>
                            )}
                            <Button
                                size="sm"
                                icon={selectedDoc ? IconRefresh : IconSparkles}
                                onClick={() => generateMutation.mutate(selectedType)}
                                loading={isGeneratingSelected}
                                disabled={generateMutation.isPending && !isGeneratingSelected}
                            >
                                {isGeneratingSelected ? 'Generating…' : selectedDoc ? 'Regenerate' : 'Generate'}
                            </Button>
                        </div>
                    </div>

                    {listQuery.isLoading && (
                        <LoadingRegion label="Loading documents">
                            <Skeleton height={14} width="90%" />
                            <Skeleton height={14} width="75%" style={{ marginTop: 10 }} />
                            <Skeleton height={14} width="82%" style={{ marginTop: 10 }} />
                        </LoadingRegion>
                    )}

                    {listQuery.isError && (
                        <ErrorState compact title="Couldn’t load documents" onRetry={() => listQuery.refetch()} retrying={listQuery.isFetching} />
                    )}

                    {isGeneratingSelected && (
                        <div className="review__progress" role="status">
                            <TraceLine active tone="ember" label="Generating document" />
                            <p className="mono">retrieving context, writing document… this can take a minute on CPU-only inference</p>
                        </div>
                    )}

                    {generateMutation.isError && generateMutation.variables === selectedType && (
                        <div className="form-error" role="alert">
                            <span>Couldn&apos;t generate this document — the repository may not have enough indexed content yet.</span>
                        </div>
                    )}

                    {!listQuery.isLoading && !listQuery.isError && !selectedDoc && !isGeneratingSelected && (
                        <p className="muted-text">
                            No {selectedMeta?.label} generated yet. Click Generate to create one
                            grounded in this repository&apos;s indexed source.
                        </p>
                    )}

                    {selectedDoc && !isGeneratingSelected && (
                        <pre className="code code--doc" tabIndex={0} aria-label={`${selectedMeta?.label} content`}>
                            {selectedDoc.content}
                        </pre>
                    )}
                </section>
            </div>
        </PageContainer>
    );
}
