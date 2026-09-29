import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { IconSearch, IconZoomQuestion, IconFileSearch } from '@tabler/icons-react';
import PageContainer from '../components/PageContainer.jsx';
import TraceLine from '../components/TraceLine.jsx';
import Button from '../components/Button.jsx';
import Badge from '../components/ui/Badge.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import ErrorState from '../components/ui/ErrorState.jsx';
import { m } from '../components/Motion.jsx';
import { fadeUp, stagger, transitions } from '../utils/motionTokens.js';
import { usePageTitle } from '../hooks/usePageTitle.js';
import { searchCode } from '../features/ai/aiApi.js';

const EXAMPLES = ['Where are JWT tokens generated and validated?', 'How are pull requests fetched from GitHub?', 'Where is the retry logic for failed jobs?'];

function ResultCard({ result, index }) {
  return (
      <m.li
          variants={fadeUp}
          transition={{ ...transitions.base, delay: Math.min(index, 10) * stagger.list }}
          className="card card--tight result"
      >
        <div className="result__head">
          <div className="mono result__path">
            {result.filePath}
            <span className="result__lines"> : {result.startLine}-{result.endLine}</span>
          </div>
          <div className="result__badges">
            {result.language && <span className="result__lang">{result.language}</span>}
            <Badge tone="signal" className="badge--mono" title="Relevance to your query">
              {(result.relevance * 100).toFixed(0)}%<span className="sr-only"> relevance</span>
            </Badge>
          </div>
        </div>
        <pre className="code" tabIndex={0} aria-label={`Code from ${result.filePath}`}>
          <code>{result.snippet}</code>
        </pre>
      </m.li>
  );
}

export default function CodeSearchPage() {
  usePageTitle('Search');
  const { id: repositoryId } = useParams();
  const [input, setInput] = useState('');
  const [query, setQuery] = useState('');

  const searchQuery = useQuery({
    queryKey: ['search', repositoryId, query],
    queryFn: () => searchCode(repositoryId, query),
    enabled: query.length > 0,
  });

  const runSearch = (text) => {
    if (text.trim()) setQuery(text.trim());
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    runSearch(input);
  };

  return (
      <PageContainer bare>
        <h2 className="sub-title">Semantic code search</h2>
        <p className="sub-lead">Search by meaning, not just keywords — results are ranked by relevance to the indexed source.</p>

        <form className="searchbar" onSubmit={handleSubmit} role="search">
          <label htmlFor="code-search" className="sr-only">Search this repository</label>
          <input
              id="code-search"
              className="input"
              type="search"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Where are JWT tokens generated and validated?"
              autoComplete="off"
          />
          <Button type="submit" icon={IconSearch} loading={searchQuery.isFetching && query.length > 0} aria-label="Search">
            <span className="hide-mobile">Search</span>
          </Button>
        </form>

        {searchQuery.isFetching && (
            <div className="trace-slot" style={{ marginBottom: 16 }}>
              <TraceLine active tone="signal" label="Searching" />
            </div>
        )}

        {query.length === 0 && (
          <EmptyState
            compact
            icon={IconFileSearch}
            title="Describe what you’re looking for"
            description="Ask in plain language. Try one of these:"
            action={EXAMPLES.map((e) => (
              <button key={e} type="button" className="chip" onClick={() => { setInput(e); setQuery(e); }}>
                {e}
              </button>
            ))}
          />
        )}

        {searchQuery.isError && (
            <ErrorState
              title="Search didn’t complete"
              message="The search service didn’t respond. Make sure this repository has finished indexing, then try again."
              onRetry={() => searchQuery.refetch()}
              retrying={searchQuery.isFetching}
            />
        )}

        {searchQuery.data?.length === 0 && (
            <EmptyState compact icon={IconZoomQuestion} title="No results for that query" description="Try different wording, or describe the behaviour rather than a name." />
        )}

        {searchQuery.data?.length > 0 && (
            <>
              <p className="muted-text" role="status" style={{ marginBottom: 12 }}>
                {searchQuery.data.length} result{searchQuery.data.length === 1 ? '' : 's'}
              </p>
              <m.ul initial="initial" animate="animate" variants={{ animate: { transition: { staggerChildren: stagger.list } } }} className="plain-list plain-list--gap">
                {searchQuery.data.map((result, i) => (
                    <ResultCard key={`${result.filePath}-${result.startLine}`} result={result} index={i} />
                ))}
              </m.ul>
            </>
        )}
      </PageContainer>
  );
}
