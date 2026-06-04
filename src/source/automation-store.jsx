// Automations store — persists user-created chains + toggle/cadence state in localStorage,
// layered on top of the seed BIZBOOST_AUTOMATIONS data.

(function () {
  const KEY = "bb_automations_v1";
  const listeners = new Set();

  function load() {
    try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; }
  }
  let saved = load(); // { created: [...], toggles: {id:bool}, cadence: "daily", detail: {id:[steps]} }
  saved.created = saved.created || [];
  saved.toggles = saved.toggles || {};
  saved.detail = saved.detail || {};
  saved.patches = saved.patches || {};
  saved.graphs = saved.graphs || {};

  function persist() { localStorage.setItem(KEY, JSON.stringify(saved)); listeners.forEach(fn => fn()); }

  const Store = {
    subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },

    // merged chains = seed (with persisted toggle overrides) + created
    chains() {
      const A = window.BIZBOOST_AUTOMATIONS;
      const apply = c => ({ ...c, ...(saved.patches[c.id] || {}), enabled: saved.toggles[c.id] != null ? saved.toggles[c.id] : c.enabled });
      const seed = A.chains.map(apply);
      const created = saved.created.map(apply);
      return [...created, ...seed];
    },

    patchChain(id, patch) {
      const isCreated = saved.created.some(c => c.id === id);
      if (isCreated) saved.created = saved.created.map(c => c.id === id ? { ...c, ...patch } : c);
      else saved.patches[id] = { ...(saved.patches[id] || {}), ...patch };
      persist();
    },

    cadence() { return saved.cadence || window.BIZBOOST_AUTOMATIONS.optimiser.cadence; },
    setCadence(v) { saved.cadence = v; persist(); },

    toggle(id) {
      const cur = this.chains().find(c => c.id === id);
      saved.toggles[id] = !(cur && cur.enabled);
      persist();
    },

    detailSteps(id) {
      if (saved.detail[id]) return saved.detail[id];
      const A = window.BIZBOOST_AUTOMATIONS;
      return A.chainDetail[id] || null;
    },
    setDetailSteps(id, steps) { saved.detail[id] = steps; persist(); },

    graph(id) { return saved.graphs[id] || null; },
    setGraph(id, g) { saved.graphs[id] = g; persist(); },

    connected() { saved.connected = saved.connected || {}; return saved.connected; },
    isConnected(tool) { return !!(saved.connected && saved.connected[tool]); },
    connectTool(tool, meta) { saved.connected = saved.connected || {}; saved.connected[tool] = meta || { at: Date.now() }; persist(); },
    disconnectTool(tool) { if (saved.connected) delete saved.connected[tool]; persist(); },

    create(chain) {
      const id = "auto_" + Date.now().toString(36);
      const full = {
        id, runs: 0, ok: true, lastRun: "just now", enabled: true, created: true,
        accent: chain.accent || "var(--lime)", icon: chain.icon || "bolt",
        ...chain
      };
      saved.created.unshift(full);
      // seed its expanded steps for the detail drawer
      if (chain.steps) saved.detail[id] = chain.steps;
      persist();
      return full;
    },

    remove(id) {
      saved.created = saved.created.filter(c => c.id !== id);
      delete saved.toggles[id];
      delete saved.detail[id];
      persist();
    },

    isCreated(id) { return saved.created.some(c => c.id === id); }
  };

  function useAutomations() {
    const [, force] = React.useReducer(x => x + 1, 0);
    React.useEffect(() => Store.subscribe(force), []);
    return Store;
  }

  window.AutomationStore = Store;
  window.useAutomations = useAutomations;
})();
