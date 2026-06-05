// App — routing, shell, keyboard shortcuts, tweaks.

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "#CFFF3A",
  "density": "regular",
  "aiDocked": false,
  "showActivity": true
}/*EDITMODE-END*/;

const ACCENTS = {
  "#CFFF3A": { name: "Lime", soft: "#CFFF3A33" },
  "#4FE3C1": { name: "Mint", soft: "#4FE3C133" },
  "#8B7CFF": { name: "Violet", soft: "#8B7CFF33" },
  "#5BCEFA": { name: "Sky", soft: "#5BCEFA33" }
};

function PageTitle({ route }) {
  // build crumb in topbar instead
  return null;
}

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [route, setRoute] = useState({ page: "briefing" });
  const [collapsed, setCollapsed] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);
  const [leadOpen, setLeadOpen] = useState(false);
  const [clientOpen, setClientOpen] = useState(false);
  const [taskCompose, setTaskCompose] = useState(null); // null=closed, {}=new, task=edit
  const [aiOpen, setAiOpen] = useState(t.aiDocked);
  const scrollRef = useRef(null);

  // apply accent
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--lime", t.accent);
    root.style.setProperty("--lime-soft", (ACCENTS[t.accent] || {}).soft || "#CFFF3A33");
    root.style.setProperty("--lime-glow", "0 0 40px " + t.accent + "30");
  }, [t.accent]);

  // density
  useEffect(() => {
    const root = document.documentElement;
    const map = { compact: ["38px", "16px"], regular: ["44px", "22px"], comfy: ["52px", "28px"] };
    const [rh, px] = map[t.density] || map.regular;
    root.style.setProperty("--row-h", rh);
    root.style.setProperty("--pad-x", px);
  }, [t.density]);

  useEffect(() => { setAiOpen(t.aiDocked); }, [t.aiDocked]);

  // body classes for layout
  useEffect(() => {
    document.body.classList.toggle("with-ai", aiOpen);
    document.body.classList.toggle("sidebar-collapsed", collapsed);
  }, [aiOpen, collapsed]);

  // keyboard
  useEffect(() => {
    function onKey(e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setCmdOpen(o => !o); }
      else if (e.key === "Escape") { setCmdOpen(false); setQuickOpen(false); }
      else if (!e.metaKey && !e.ctrlKey && e.key.toLowerCase() === "c" && document.activeElement.tagName !== "INPUT") {
        // 'c' quick add (notion-ish) — avoid when typing
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const go = useCallback((r) => {
    setRoute(r);
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, []);

  // breadcrumb
  const crumbMap = {
    briefing: [{ label: "Briefing" }],
    clients: [{ label: "Clients" }],
    leads: [{ label: "Leads" }],
    tasks: [{ label: "Tasks" }],
    marketing: [{ label: "Marketing" }],
    objectives: [{ label: "Objectives" }],
    automations: [{ label: "Automations" }],
    agents: [{ label: "Agents" }],
    resources: [{ label: "Resources" }],
    docs: [{ label: "Pages" }],
    integrations: [{ label: "Integrations" }]
  };
  let crumb = crumbMap[route.page] || [{ label: "Briefing" }];
  if (route.page === "client") {
    const c = getClient(route.id);
    crumb = [{ label: "Clients", onClick: () => go({ page: "clients" }) }, { label: c ? c.name : "Client" }];
  }

  function renderPage() {
    switch (route.page) {
      case "briefing": return <Briefing go={go} onTask={(init) => setTaskCompose(init || {})} />;
      case "clients": return <Clients go={go} onNewClient={() => setClientOpen(true)} />;
      case "leads": return <Leads go={go} sub={route.sub} onNewLead={() => setLeadOpen(true)} />;
      case "client": return <ClientDetail id={route.id} go={go} />;
      case "tasks": return <Tasks go={go} onNewTask={() => setTaskCompose({})} />;
      case "marketing": return <Marketing go={go} />;
      case "objectives": return <Objectives go={go} />;
      case "automations": return <Automations go={go} />;
      case "agents": return <AgentsPage go={go} />;
      case "resources": return <Resources go={go} />;
      case "docs": return <Docs go={go} />;
      case "integrations": return <Integrations go={go} />;
      default: return <Briefing go={go} />;
    }
  }

  // full-screen client portal — no admin chrome
  if (route.page === "client-portal") {
    return <ClientPortal id={route.id} go={go} />;
  }

  return (
    <React.Fragment>
      <div id="app">
        <Sidebar route={route} go={go} onQuickAdd={() => setQuickOpen(true)} collapsed={collapsed} setCollapsed={setCollapsed} />

        <div className="col" style={{ height: "100vh", overflow: "hidden", minWidth: 0 }}>
          <Topbar route={route} go={go} crumb={crumb} onCmdK={() => setCmdOpen(true)} onToggleAI={() => setAiOpen(o => !o)} aiOpen={aiOpen} />
          <main ref={scrollRef} style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "28px var(--pad-x, 22px)" }}>
            {renderPage()}
          </main>
        </div>

        {aiOpen && <AIPanel open={aiOpen} onClose={() => setAiOpen(false)} />}
      </div>

      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} go={go} onNewLead={() => setLeadOpen(true)} onNewClient={() => setClientOpen(true)} onNewTask={() => setTaskCompose({})} />
      <QuickAdd open={quickOpen} onClose={() => setQuickOpen(false)} go={go} onNewLead={() => { setQuickOpen(false); setLeadOpen(true); }} onNewClient={() => { setQuickOpen(false); setClientOpen(true); }} onNewTask={() => { setQuickOpen(false); setTaskCompose({}); }} />
      <LeadIntake open={leadOpen} onClose={() => setLeadOpen(false)} onCreated={() => go({ page: "leads" })} />
      <ClientOnboarding open={clientOpen} onClose={() => setClientOpen(false)} onCreated={(c) => go({ page: "client", id: c.id })} />
      <TaskComposer open={!!taskCompose} initial={taskCompose} onClose={() => setTaskCompose(null)} onSaved={() => { if (route.page !== "tasks") go({ page: "tasks" }); }} />

      <TweaksPanel>
        <TweakSection label="Brand" />
        <TweakColor label="Accent" value={t.accent} options={Object.keys(ACCENTS)} onChange={v => setTweak("accent", v)} />
        <TweakSection label="Layout" />
        <TweakRadio label="Density" value={t.density} options={["compact", "regular", "comfy"]} onChange={v => setTweak("density", v)} />
        <TweakToggle label="Dock AI panel" value={t.aiDocked} onChange={v => setTweak("aiDocked", v)} />
      </TweaksPanel>
    </React.Fragment>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
