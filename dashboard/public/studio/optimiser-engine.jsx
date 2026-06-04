// Optimiser engine — reads LIVE data (objectives, KRs, tasks, clients) and produces
// real, ranked recommendations. Each can be applied → mutates the actual stores.

window.BIZBOOST_OPTIMISER = (function () {

  function pct(n) { return Math.round(n * 100); }

  // Build the list of live findings. Pure read — no side effects.
  function analyse() {
    const OS = window.ObjectiveStore;
    const TS = window.TaskStore;
    const D = window.BIZBOOST_DATA;
    const recs = [];
    if (!OS || !TS) return recs;

    const objectives = OS.all();
    const today = TS.all().filter(t => /today/i.test(t.due || ""));
    const doneToday = today.filter(t => t.status === "done").length;

    // 1) Objectives behind pace — surface the lagging KR + a concrete task
    objectives.forEach(o => {
      const prog = OS.liveProgress(o);
      (o.keyResults || []).forEach((kr, idx) => {
        const r = OS.krLiveProgress(kr);
        // task-measured KR with open linked tasks → push the most urgent one
        if ((kr.measure === "tasks") && r < 1) {
          const linked = (kr.taskIds || []).map(id => TS.all().find(t => t.id === id)).filter(Boolean);
          const open = linked.filter(t => t.status !== "done");
          const urgent = open.sort((a, b) => (a.priority || "P2").localeCompare(b.priority || "P2"))[0];
          if (urgent && urgent.priority !== "P0") {
            recs.push({
              id: "esc-" + urgent.id, tone: "info", icon: "checkSquare",
              title: "Escalate task driving “" + shorten(kr.kr) + "”",
              detail: "“" + shorten(urgent.title, 46) + "” is the open task on this key result (" + pct(r) + "%). Bumping it to Urgent moves the objective fastest.",
              impact: "→ P0",
              apply: () => { TS.patch(urgent.id, { priority: "P0" }); },
              applied: () => (TS.all().find(t => t.id === urgent.id) || {}).priority === "P0"
            });
          }
        }
        // metric-measured KR within striking distance → flag the lever
        if (kr.measure === "metric" && r > 0.5 && r < 1) {
          recs.push({
            id: "lever-" + o.id + "-" + idx, tone: "win", icon: "trend",
            title: "“" + shorten(kr.kr) + "” is " + pct(r) + "% there",
            detail: "Close to target on a live KPI — one more closed deal or upsell tips it over. Worth a focused push this week.",
            impact: "+" + (100 - pct(r)) + "% to go", info: true
          });
        }
      });
    });

    // 2) At-risk clients not yet getting a save action today
    (D.clients || []).forEach(c => {
      if ((c.flag === "At risk" || c.health < 62) && !(c.onboarding && c.onboarding.active)) {
        const hasSave = TS.all().some(t => t.client === c.id && t.status !== "done" && /retention|save|call/i.test(t.title));
        if (!hasSave) {
          recs.push({
            id: "save-" + c.id, tone: "warn", icon: "shield",
            title: "Spin up a save play for " + c.name.split(" ")[0],
            detail: c.name + " is at risk (health " + c.health + (c.roas ? ", ROAS " + c.roas.toFixed(1) + "x" : "") + ") with no retention task open. Create one and put it top of today.",
            impact: "new P0 task",
            apply: () => { TS.add({ title: "Retention call — " + c.name, client: c.id, priority: "P0", due: "Today", category: "Account", status: "todo" }); },
            applied: () => TS.all().some(t => t.client === c.id && /retention call —/i.test(t.title))
          });
        }
      }
    });

    // 3) Scale winners — high ROAS + rising leads
    (D.clients || []).forEach(c => {
      if (c.roas >= 6 && c.leadsΔ > 0.15) {
        recs.push({
          id: "scale-" + c.id, tone: "win", icon: "trend",
          title: "Scale spend on " + c.name.split(" ")[0],
          detail: c.name + " is at " + c.roas.toFixed(1) + "x ROAS with leads up " + pct(c.leadsΔ) + "%. Headroom to push budget and accelerate the leads goal.",
          impact: "+15% budget",
          apply: () => { TS.add({ title: "Increase ad budget +15% — " + c.name, client: c.id, priority: "P1", due: "Today", category: "Ads", status: "todo" }); },
          applied: () => TS.all().some(t => t.client === c.id && /increase ad budget/i.test(t.title))
        });
      }
    });

    // 4) Daily focus — too many P0s open
    const openP0 = TS.active().filter(t => t.priority === "P0").length;
    if (openP0 >= 4) {
      recs.push({
        id: "focus", tone: "info", icon: "target",
        title: "Today is overloaded — " + openP0 + " urgent open",
        detail: "You've cleared " + doneToday + " today. " + openP0 + " P0s is more than one person ships in a day — consider delegating or deferring the lowest-leverage two.",
        impact: "focus", info: true
      });
    }

    // rank: warn → win(apply) → info
    const order = { warn: 0, win: 1, info: 2 };
    recs.sort((a, b) => (order[a.tone] - order[b.tone]) || ((a.apply ? 0 : 1) - (b.apply ? 0 : 1)));
    return recs;
  }

  function shorten(s, n = 30) { s = s || ""; return s.length > n ? s.slice(0, n - 1) + "…" : s; }

  // snapshot of what the optimiser is steering toward (for the header stats)
  function snapshot() {
    const OS = window.ObjectiveStore, TS = window.TaskStore;
    if (!OS || !TS) return { objAvg: 0, objCount: 0, doneToday: 0, openP0: 0 };
    const objs = OS.all();
    const objAvg = objs.length ? objs.reduce((a, o) => a + OS.liveProgress(o), 0) / objs.length : 0;
    const today = TS.all().filter(t => /today/i.test(t.due || ""));
    return {
      objAvg, objCount: objs.length,
      doneToday: today.filter(t => t.status === "done").length,
      openP0: TS.active().filter(t => t.priority === "P0").length
    };
  }

  return { analyse, snapshot, shorten };
})();
