// Live business-metric registry. KRs can bind to one of these and auto-track.
// Each metric computes live from BIZBOOST_DATA so progress moves on its own.

window.BIZBOOST_KPIS = (function () {
  const fmtK = n => n >= 1000 ? "€" + (n / 1000).toFixed(n >= 10000 ? 0 : 1) + "k" : "€" + n;
  const clients = () => (window.BIZBOOST_DATA.clients || []);
  const sum = (arr, f) => arr.reduce((a, c) => a + (f(c) || 0), 0);

  const list = [
    { id: "mrr", label: "Total MRR", group: "Revenue", icon: "euro",
      get: () => sum(clients(), c => c.mrr), format: n => fmtK(n), unit: "€" },
    { id: "revenue30", label: "Client revenue · 30d", group: "Revenue", icon: "trend",
      get: () => sum(clients(), c => c.revenue30), format: n => fmtK(n), unit: "€" },
    { id: "domination", label: "Domination clients", group: "Accounts", icon: "crown",
      get: () => clients().filter(c => c.plan === "Domination").length, format: n => "" + n, unit: "" },
    { id: "growth", label: "Growth clients", group: "Accounts", icon: "users",
      get: () => clients().filter(c => c.plan === "Growth").length, format: n => "" + n, unit: "" },
    { id: "clients", label: "Total clients", group: "Accounts", icon: "users",
      get: () => clients().length, format: n => "" + n, unit: "" },
    { id: "liveClients", label: "Live (not onboarding)", group: "Accounts", icon: "check",
      get: () => clients().filter(c => !(c.onboarding && c.onboarding.active)).length, format: n => "" + n, unit: "" },
    { id: "leads30", label: "Leads · 30d (all)", group: "Pipeline", icon: "inbox",
      get: () => sum(clients(), c => c.leads30), format: n => "" + n, unit: "" },
    { id: "bookings30", label: "Bookings · 30d (all)", group: "Pipeline", icon: "calendar",
      get: () => sum(clients(), c => c.bookings30), format: n => "" + n, unit: "" },
    { id: "reviews", label: "Total 5★ reviews", group: "Reputation", icon: "star",
      get: () => sum(clients(), c => (c.reviews && c.reviews.count) || 0), format: n => "" + n, unit: "" },
    { id: "avgHealth", label: "Avg account health", group: "Quality", icon: "pulse",
      get: () => { const a = clients(); return a.length ? Math.round(sum(a, c => c.health) / a.length) : 0; }, format: n => n + "%", unit: "%" },
    { id: "avgRoas", label: "Avg ROAS", group: "Quality", icon: "trend",
      get: () => { const a = clients().filter(c => c.roas > 0); return a.length ? +(sum(a, c => c.roas) / a.length).toFixed(1) : 0; }, format: n => n + "x", unit: "x" }
  ];

  const byId = {};
  list.forEach(m => byId[m.id] = m);

  return {
    list,
    get: id => byId[id],
    value: id => { const m = byId[id]; return m ? m.get() : 0; },
    format: (id, n) => { const m = byId[id]; return m ? m.format(n != null ? n : m.get()) : String(n); }
  };
})();
