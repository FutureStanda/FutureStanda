// Metrics engine — gates each dashboard metric behind the account that feeds it.
// Connect a source -> its metrics light up accurately. Disconnect -> they go dark.

window.BIZBOOST_METRICS = (() => {

  // which connected source(s) feed each metric. Any one present = metric live.
  const SOURCES = {
    leads30:   { any: ["meta", "gads", "gbp", "wa"], label: "Leads", needs: "an ad or lead source" },
    bookings30:{ any: ["wa", "cal"],                 label: "Bookings", needs: "WhatsApp or Calendar" },
    revenue30: { any: ["stripe"],                    label: "Revenue", needs: "Stripe" },
    roas:      { any: ["meta", "gads"],              label: "ROAS", needs: "an ad account" },
    adSpend:   { any: ["meta", "gads"],              label: "Ad spend", needs: "an ad account" },
    reviews:   { any: ["gbp"],                       label: "Reviews", needs: "Google Business Profile" },
    website:   { any: ["ga4", "site"],               label: "Website", needs: "Google Analytics" },
    social:    { any: ["meta"],                      label: "Social", needs: "Meta Business" },
    missedCalls:{ any: ["wa"],                        label: "Missed calls", needs: "WhatsApp" }
  };

  // source -> friendly name (for "Connect X" prompts)
  const NAME = {
    meta: "Meta", gads: "Google Ads", ga4: "Google Analytics", gbp: "Google Business Profile",
    site: "Website", stripe: "Stripe", wa: "WhatsApp", cal: "Calendar"
  };

  function connectedSet(c) {
    return new Set(c && c.connected ? c.connected : []);
  }

  // is a metric live for this client?
  function live(c, key) {
    const s = SOURCES[key];
    if (!s) return true;
    // legacy/fully-onboarded clients have no `connected` array -> everything live
    if (!c || !Array.isArray(c.connected)) return true;
    const set = connectedSet(c);
    return s.any.some(id => set.has(id));
  }

  // which source to suggest connecting for a dark metric
  function suggestion(key) {
    const s = SOURCES[key];
    if (!s) return null;
    return { ids: s.any, name: s.needs, primary: NAME[s.any[0]] };
  }

  // count of live vs total core metrics — for a "data completeness" readout
  function completeness(c) {
    const keys = Object.keys(SOURCES);
    const liveN = keys.filter(k => live(c, k)).length;
    return { live: liveN, total: keys.length, pct: liveN / keys.length };
  }

  return { SOURCES, NAME, live, suggestion, connectedSet, completeness };
})();
