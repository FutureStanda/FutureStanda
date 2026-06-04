// Agents store — the people + AI agents tasks can be offloaded to. Creatable, persistent.
(function () {
  const KEY = "bb_agents_v1";
  const subs = new Set();
  const SEED = [
    { id: "bartek", name: "Bartek", kind: "person", role: "Founder", color: "#CFFF3A", icon: "users" },
    { id: "niamh", name: "Niamh", kind: "person", role: "Account manager", color: "#5BCEFA", icon: "users" },
    { id: "research", name: "Research Agent", kind: "agent", role: "Competitor & market research", color: "#8B7CFF", icon: "sparkle", tools: ["webhook", "google", "notion"], can: ["Research competitors", "Pull market data", "Write a findings brief"], status: "active", runs: 142 },
    { id: "content", name: "Content Agent", kind: "agent", role: "Drafts & schedules posts", color: "#4FE3C1", icon: "megaphone", tools: ["meta", "ig", "content"], can: ["Draft posts", "Schedule content", "Repurpose reviews"], status: "active", runs: 318 },
    { id: "outreach", name: "Outreach Agent", kind: "agent", role: "Follow-ups & booking", color: "#FFB547", icon: "msg", tools: ["wa", "sms", "cal"], can: ["Reply to enquiries", "Qualify leads", "Book calls"], status: "active", runs: 506 },
    { id: "reputation", name: "Reputation Agent", kind: "agent", role: "Reviews & replies", color: "#FF7A8A", icon: "star", tools: ["gbp", "meta"], can: ["Request reviews", "Reply to reviews", "Flag bad ones"], status: "active", runs: 211 }
  ];
  let saved = {}; try { saved = JSON.parse(localStorage.getItem(KEY) || "{}"); } catch (e) {}
  saved.created = saved.created || [];
  function persist() { localStorage.setItem(KEY, JSON.stringify(saved)); subs.forEach(f => f()); }

  const Store = {
    subscribe(fn) { subs.add(fn); return () => subs.delete(fn); },
    all() { saved.patches = saved.patches || {}; return [...SEED.map(a => saved.patches[a.id] ? { ...a, ...saved.patches[a.id] } : a), ...saved.created]; },
    get(id) { return this.all().find(a => a.id === id); },
    agents() { return this.all().filter(a => a.kind === "agent"); },
    people() { return this.all().filter(a => a.kind === "person"); },
    create(a) {
      const id = "ag_" + Date.now().toString(36);
      const colors = ["#8B7CFF", "#4FE3C1", "#FFB547", "#FF7A8A", "#5BCEFA", "#CFFF3A"];
      const full = { id, kind: "agent", icon: "sparkle", color: colors[saved.created.length % colors.length], role: "Custom agent", tools: [], can: [], status: "active", runs: 0, ...a };
      saved.created.unshift(full); persist(); return full;
    },
    patch(id, p) {
      const base = SEED.find(a => a.id === id);
      if (base) { saved.patches = saved.patches || {}; saved.patches[id] = { ...(saved.patches[id] || {}), ...p }; }
      else saved.created = saved.created.map(a => a.id === id ? { ...a, ...p } : a);
      persist();
    },
    remove(id) { saved.created = saved.created.filter(a => a.id !== id); persist(); }
  };
  function useAgents() { const [, f] = useState(0); useEffect(() => Store.subscribe(() => f(x => x + 1)), []); return Store; }
  window.AgentStore = Store;
  window.useAgents = useAgents;
})();
