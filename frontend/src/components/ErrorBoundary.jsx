import { Component } from 'react';
import Button from './Button.jsx';
import ErrorState from './ui/ErrorState.jsx';

/** Last line of defence: a render error shows a calm recovery screen instead of a blank page or a stack trace. */
export default class ErrorBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error) {
    // Details stay in the developer console only; nothing technical is shown to users.
    if (import.meta.env.DEV) console.error(error);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <main className="center-screen" id="main">
        <ErrorState title="Something went wrong" message="The page hit an unexpected problem. Reloading usually fixes it.">
          <Button size="sm" onClick={() => window.location.reload()}>Reload page</Button>
        </ErrorState>
      </main>
    );
  }
}
