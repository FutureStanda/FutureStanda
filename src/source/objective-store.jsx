// Objective store — persistent, reactive. Layers on top of BIZBOOST_DATA.objectives.

(function () {
  const KEY = "bb_objectives_v2";
  const subs = new Set();
  let state = null;

  function load() {
    const D = window.BIZBOOST_DATA;
    let saved = {};
    try { saved = JSON.parse(localStorage.getItem(KEY) || "{}"); } catch (e) {}
    const deleted = new Set(saved.deleted || []);
    const patches = saved.patches || {};
    const created = saved.created || [];
    const seed = (D.objectives || []).filter(o => !deleted.has(o.id)).map(o => ({ ...o, ...(patches[o.id] || {}) }));
    const createdLive = created.filter(o => !deleted.has(o.id));
    return { list: [...createdLive, ...seed], _saved: { deleted: [...deleted], patches, created } };
  }

  function persist() { try { localStorage.setItem(KEY, JSON.stringify(state._saved)); } catch (e) {} }
  function emit() { subs.forEach(fn => fn()); }
  function ensure() { if (!state) state = load(); return state; }

  // task-completion ratio for an objective (live from TaskStore)
  function taskProgress(id) {
    const T = window.TaskStore;
    if (!T) return { done: 0, total: 0, ratio: 0 };
    const tasks = T.forObjective(id);
    const done = tasks.filter(t => t.status === "done").length;
    return { done, total: tasks.length, ratio: tasks.length ? done / tasks.length : 0 };
  }

  // ---- per-KR live progress, measure-aware ----
  function krTaskRatio(kr) {
    const T = window.TaskStore;
    const ids = kr.taskIds || [];
    if (!T || !ids.length) return { done: 0, total: ids.length, ratio: 0 };
    const all = T.all();
    const linked = all.filter(t => ids.includes(t.id));
    const done = linked.filter(t => t.status === "done").length;
    return { done, total: linked.length, ratio: linked.length ? done / linked.length : 0 };
  }

  function krMetricValue(kr) {
    const M = window.BIZBOOST_KPIS;
    if (!M || !kr.metric) return 0;
    return M.value(kr.metric);
  }

  function krLiveProgress(kr) {
    const measure = kr.measure || "manual";
    if (measure === "tasks") return krTaskRatio(kr).ratio;
    if (measure === "metric") {
      const start = +kr.startNum || 0, target = +kr.targetNum || 0, val = krMetricValue(kr);
      if (target === start) return val >= target ? 1 : 0;
      return Math.max(0, Math.min(1, (val - start) / (target - start)));
    }
    return Math.max(0, Math.min(1, kr.progress || 0));
  }

  // human-readable current / target for a KR, measure-aware
  function krDisplay(kr) {
    const M = window.BIZBOOST_KPIS;
    const measure = kr.measure || "manual";
    if (measure === "tasks") { const r = krTaskRatio(kr); return { cur: r.done + "", tgt: r.total + " tasks", ratio: r.ratio }; }
    if (measure === "metric" && M) {
      const val = krMetricValue(kr);
      return { cur: M.format(kr.metric, val), tgt: M.format(kr.metric, +kr.targetNum || 0), ratio: krLiveProgress(kr), live: true };
    }
    return { cur: kr.current || "—", tgt: kr.target || "—", ratio: krLiveProgress(kr) };
  }

  // key-results average (live, measure-aware)
  function krProgress(o) {
    const krs = o.keyResults || [];
    if (!krs.length) return 0;
    return Math.min(1, krs.reduce((a, k) => a + krLiveProgress(k), 0) / krs.length);
  }

  // stored progress (used as the cached "manual"/seed value)
  function computeProgress(o) {
    const mode = o.progressMode || "kr";
    if (mode === "manual") return o.progress || 0;
    return krProgress(o);
  }

  // LIVE progress, mode-aware — call this at render time
  function liveProgress(o) {
    const mode = o.progressMode || "kr";
    if (mode === "tasks") return taskProgress(o.id).ratio;
    if (mode === "manual") return o.progress || 0;
    return krProgress(o);
  }

  const Store = {
    all() { return ensure().list; },
    get(id) { return ensure().list.find(o => o.id === id); },
    liveProgress,
    taskProgress,
    krProgress,
    krLiveProgress,
    krDisplay,
    // ---- per-KR mutations ----
    patchKR(objId, idx, patch) {
      const o = this.get(objId); if (!o) return;
      const krs = (o.keyResults || []).map((k, i) => i === idx ? { ...k, ...patch } : k);
      this.patch(objId, { keyResults: krs });
    },
    addKR(objId, kr) {
      const o = this.get(objId); if (!o) return;
      const full = { kr: "New key result", measure: "manual", progress: 0, current: "0", target: "100", taskIds: [], checkpoints: [], ...kr };
      this.patch(objId, { keyResults: [...(o.keyResults || []), full] });
    },
    removeKR(objId, idx) {
      const o = this.get(objId); if (!o) return;
      this.patch(objId, { keyResults: (o.keyResults || []).filter((_, i) => i !== idx) });
    },
    addCheckpoint(objId, idx, cp) {
      const o = this.get(objId); if (!o) return;
      const krs = (o.keyResults || []).map((k, i) => i === idx ? { ...k, checkpoints: [{ at: "just now", ...cp }, ...(k.checkpoints || [])] } : k);
      this.patch(objId, { keyResults: krs });
    },
    linkTaskToKR(objId, idx, taskId) {
      const o = this.get(objId); if (!o) return;
      const krs = (o.keyResults || []).map((k, i) => {
        if (i !== idx) return k;
        const ids = k.taskIds || [];
        return { ...k, taskIds: ids.includes(taskId) ? ids.filter(x => x !== taskId) : [...ids, taskId] };
      });
      this.patch(objId, { keyResults: krs });
    },
    subscribe(fn) { subs.add(fn); return () => subs.delete(fn); },
    add(obj) {
      ensure();
      const id = "o_" + Math.random().toString(36).slice(2, 8);
      const full = { id, owner: "Bartek", keyResults: [], current: "", target: "", ...obj };
      full.progress = computeProgress(full);
      state._saved.created.unshift(full);
      state.list = [full, ...state.list];
      persist(); emit();
      return full;
    },
    patch(id, patch) {
      ensure();
      const apply = o => { const next = { ...o, ...patch }; next.progress = computeProgress(next); return next; };
      const ci = state._saved.created.findIndex(o => o.id === id);
      if (ci >= 0) state._saved.created[ci] = apply(state._saved.created[ci]);
      else { const base = state.list.find(o => o.id === id) || {}; const prev = state._saved.patches[id] || {}; const merged = apply({ ...base, ...prev }); const stored = { ...prev, ...patch, progress: merged.progress }; if (patch.keyResults) stored.keyResults = patch.keyResults; state._saved.patches[id] = stored; }
      state.list = state.list.map(o => o.id === id ? apply(o) : o);
      persist(); emit();
    },
    remove(id) {
      ensure();
      if (!state._saved.deleted.includes(id)) state._saved.deleted.push(id);
      state._saved.created = state._saved.created.filter(o => o.id !== id);
      state.list = state.list.filter(o => o.id !== id);
      persist(); emit();
    }
  };

  window.ObjectiveStore = Store;
})();

function useObjectives() {
  const [, force] = useState(0);
  useEffect(() => window.ObjectiveStore.subscribe(() => force(x => x + 1)), []);
  return window.ObjectiveStore;
}
window.useObjectives = useObjectives;
