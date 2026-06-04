// Task store — persistent, reactive. Layers on top of BIZBOOST_DATA.tasks.
// localStorage holds overrides (status/done), new tasks, and deletions.

(function () {
  const KEY = "bb_tasks_v1";
  const subs = new Set();
  let state = null;

  function load() {
    const D = window.BIZBOOST_DATA;
    let saved = {};
    try { saved = JSON.parse(localStorage.getItem(KEY) || "{}"); } catch (e) {}
    // seed = data.js tasks; overlay saved patches; append created; drop deleted
    const deleted = new Set(saved.deleted || []);
    const patches = saved.patches || {};
    const created = saved.created || [];
    const seed = D.tasks.filter(t => !deleted.has(t.id)).map(t => ({ ...t, ...(patches[t.id] || {}) }));
    const createdLive = created.filter(t => !deleted.has(t.id));
    return { list: [...createdLive, ...seed], _saved: { deleted: [...deleted], patches, created } };
  }

  function persist() {
    try { localStorage.setItem(KEY, JSON.stringify(state._saved)); } catch (e) {}
  }
  function emit() { subs.forEach(fn => fn()); }

  function ensure() { if (!state) state = load(); return state; }

  const Store = {
    all() { return ensure().list; },
    subscribe(fn) { subs.add(fn); return () => subs.delete(fn); },
    add(task) {
      ensure();
      const id = "t_" + Math.random().toString(36).slice(2, 8);
      const full = { id, status: "todo", priority: "P2", category: "Account", due: "Today", assignee: "Bartek", client: null, ...task };
      state._saved.created.unshift(full);
      state.list = [full, ...state.list];
      persist(); emit();
      return full;
    },
    patch(id, patch) {
      ensure();
      // is it a created task?
      const ci = state._saved.created.findIndex(t => t.id === id);
      if (ci >= 0) state._saved.created[ci] = { ...state._saved.created[ci], ...patch };
      else state._saved.patches[id] = { ...(state._saved.patches[id] || {}), ...patch };
      state.list = state.list.map(t => t.id === id ? { ...t, ...patch } : t);
      persist(); emit();
    },
    toggle(id) {
      const t = ensure().list.find(x => x.id === id);
      if (!t) return;
      Store.patch(id, { status: t.status === "done" ? "todo" : "done" });
    },
    move(id, status) { Store.patch(id, { status }); },
    remove(id) {
      ensure();
      if (!state._saved.deleted.includes(id)) state._saved.deleted.push(id);
      state._saved.created = state._saved.created.filter(t => t.id !== id);
      state.list = state.list.filter(t => t.id !== id);
      persist(); emit();
    },
    forClient(clientId) { return ensure().list.filter(t => t.client === clientId); },
    forObjective(objId) { return ensure().list.filter(t => t.objective === objId); },
    active() { return ensure().list.filter(t => t.status !== "done"); },
    completed() { return ensure().list.filter(t => t.status === "done"); }
  };

  window.TaskStore = Store;
})();

// Hook
function useTasks() {
  const [, force] = useState(0);
  useEffect(() => window.TaskStore.subscribe(() => force(x => x + 1)), []);
  return window.TaskStore;
}
window.useTasks = useTasks;
