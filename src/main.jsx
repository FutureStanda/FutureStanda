import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import ReactDOM from 'react-dom/client';
import './styles.css';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { LoginPage } from './auth/LoginPage';

// ── make React hooks available globally ──────────────────────────────
window.React = React;
window.useState = useState;
window.useEffect = useEffect;
window.useCallback = useCallback;
window.useRef = useRef;
window.useMemo = useMemo;
// Fragment shorthand used in JSX files
window.Fragment = React.Fragment;

// ── stub window.claude for AI calls (no-op in production without API key) ──
if (!window.claude) {
  window.claude = {
    complete: async (prompt, opts) => {
      // Return a helpful message when no AI key is configured
      return "AI responses require an API key. Configure VITE_CLAUDE_API_KEY in your environment.";
    }
  };
}

// ── import all source files in dependency order ──────────────────────
// Data layer
import './source/data-core.jsx';
import './source/data-leads.jsx';
import './source/data-onboarding.jsx';
import './source/data-pages.js';
import './source/data-automations.jsx';

// UI primitives & icons
import './source/icons.jsx';
import './source/ui.jsx';
import './source/charts.jsx';
import './source/metrics-engine.jsx';

// Layout
import './source/sidebar.jsx';
import './source/topbar.jsx';

// Stores
import './source/brand-store.jsx';
import './source/task-store.jsx';
import './source/objective-store.jsx';
import './source/metrics-registry.jsx';
import './source/resource-store.jsx';
import './source/automation-store.jsx';
import './source/agents-store.jsx';

// Feature components
import './source/admin-drill.jsx';
import './source/research-dossier.jsx';
import './source/client-onboarding.jsx';
import './source/consent-flow.jsx';
import './source/admin-connect.jsx';
import './source/client-extras.jsx';
import './source/lead-intake.jsx';
import './source/task-composer.jsx';
import './source/objective-composer.jsx';
import './source/objective-coach.jsx';
import './source/kr-detail.jsx';
import './source/page-editor-parts.jsx';
import './source/page-ai.jsx';
import './source/page-editor.jsx';
import './source/automation-canvas.jsx';
import './source/optimiser-engine.jsx';
import './source/overlays.jsx';
import './source/tweaks-panel.jsx';

// Pages
import './source/pages/briefing.jsx';
import './source/pages/clients.jsx';
import './source/pages/client-detail.jsx';
import './source/pages/client-automations.jsx';
import './source/pages/client-portal.jsx';
import './source/pages/portal-metric-detail.jsx';
import './source/pages/leads.jsx';
import './source/pages/tasks-views.jsx';
import './source/pages/tasks.jsx';
import './source/pages/marketing.jsx';
import './source/pages/objectives.jsx';
import './source/pages/resources.jsx';
import './source/pages/docs.jsx';
import './source/pages/integrations.jsx';
import './source/pages/automations.jsx';
import './source/pages/agents.jsx';

// Main app (last — depends on everything above)
import './source/app.jsx';

// ── Auth-aware root ──────────────────────────────────────────────────
function Root() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0A0B0A' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: '#CFFF3A', display: 'grid', placeItems: 'center' }}>
            <svg viewBox="0 0 100 100" width="28" height="28"><path d="M54 26 36 56h16l-3 18 22-30H53l4-18Z" fill="#0A0B0A"/></svg>
          </div>
          <div style={{ color: '#8E938A', fontSize: 13 }}>Loading…</div>
        </div>
      </div>
    );
  }

  if (!session) {
    return <LoginPage />;
  }

  // Pass user context to the app so it can show real name
  // The App component is mounted on window by app.jsx
  // We re-render it here inside our auth wrapper
  const AppComponent = window.__BizBoostApp;
  if (!AppComponent) {
    return <div style={{ color: 'white', padding: 40 }}>App loading…</div>;
  }
  return <AppComponent session={session} />;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <AuthProvider>
    <Root />
  </AuthProvider>
);
