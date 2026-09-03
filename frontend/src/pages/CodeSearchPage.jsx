import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { IconSearch } from '@tabler/icons-react';
import PageContainer from '../components/PageContainer.jsx';
import TraceLine from '../components/TraceLine.jsx';
import { fadeUp, stagger, transitions } from '../utils/motionTokens.js';
import { searchCode } from '../features/ai/aiApi.js';

function ResultCard({ result, index }) {
  return (
      <motion.div
          variants={fadeUp}
          transition={{ ...transitions.base, delay: index * stagger.list }}
          style={{
            padding: 16,
            borderRadius: 'var(--radius)',
            border: '1px solid var(--border)',
            background: 'var(--surface-1)',
            marginBottom: 12,
          }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>
            {result.filePath}
            <span style={{ color: 'var(--text-muted)' }}> : {result.startLine}-{result.endLine}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {result.language && (
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{result.language}</span>
            )}
            <span
                style={{
                  fontFamily: 'var(--font-mono)', fontSize: 11, padding: '3px 7px',
                  borderRadius: 'var(--radius-sm)', background: 'var(--signal-dim)', color: 'var(--signal)',
                }}
            >
            {(result.relevance * 100).toFixed(0)}%
          </span>
          </div>
        </div>
        <pre
            className="mono"
            style={{
              fontSize: 12, lineHeight: 1.6, color: 'var(--text-secondary)',
              background: 'var(--surface-0)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)', padding: 12, overflowX: 'auto',
              margin: 0, whiteSpace: 'pre',
            }}
        >
        {result.snippet}
      </pre>
      </motion.div>
  );
}

export default function CodeSearchPage() {
  const { id: repositoryId } = useParams();
  const [input, setInput] = useState('');
  const [query, setQuery] = useState('');

  const searchQuery = useQuery({
    queryKey: ['search', repositoryId, query],
    queryFn: () => searchCode(repositoryId, query),
    enabled: query.length > 0,
  });

  const handleSearch = () => {
    if (input.trim()) setQuery(input.trim());
  };

  return (
      <PageContainer>
        <h2 style={{ marginBottom: 4 }}>Semantic code search</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 20 }}>
          Search by meaning, not just keywords — results are ranked by relevance to the indexed source.
        </p>

        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Where are JWT tokens generated and validated?"
              style={{
                flex: 1, padding: '12px 14px', borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-strong)', background: 'var(--surface-2)',
                color: 'var(--text-primary)', fontSize: 14,
              }}
          />
          <button
              onClick={handleSearch}
              style={{
                width: 44, borderRadius: 'var(--radius-sm)', border: '1px solid var(--ember)',
                background: 'var(--ember)', color: '#1a0e05', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
          >
            <IconSearch size={18} />
          </button>
        </div>

        {searchQuery.isLoading && (
            <div style={{ width: 200 }}>
              <TraceLine active tone="signal" />
            </div>
        )}

        {searchQuery.isError && (
            <p style={{ color: 'var(--critical)', fontSize: 13 }}>
              Search failed — check that ai-service, Qdrant, and Ollama are running.
            </p>
        )}

        {searchQuery.data?.length === 0 && (
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No results found for that query.</p>
        )}

        {searchQuery.data?.length > 0 && (
            <motion.div initial="initial" animate="animate" variants={{ animate: { transition: { staggerChildren: stagger.list } } }}>
              {searchQuery.data.map((result, i) => (
                  <ResultCard key={`${result.filePath}-${result.startLine}`} result={result} index={i} />
              ))}
            </motion.div>
        )}
      </PageContainer>
  );
}
