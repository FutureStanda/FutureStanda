// Page AI panel — reads the page content, talks to real Claude, can insert blocks.

function placeCaretEnd(el) {
  try {
    const r = document.createRange(); r.selectNodeContents(el); r.collapse(false);
    const s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
  } catch (e) {}
}

function docPlainText(doc, title) {
  const strip = h => (h || "").replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").trim();
  const lines = [title ? "# " + title : ""];
  (doc.blocks || []).forEach(b => {
    if (b.type === "divider") return lines.push("---");
    if (b.type === "synced") { const s = (window.__bbSynced || {})[b.syncId]; return s && lines.push(strip(s.html)); }
    if (b.type === "subpage") return lines.push("→ " + (b.title || "sub-page"));
    const t = strip(b.html);
    if (b.type === "h1") lines.push("\n# " + t);
    else if (b.type === "h2") lines.push("\n## " + t);
    else if (b.type === "h3") lines.push("\n### " + t);
    else if (b.type === "bullet") lines.push("• " + t);
    else if (b.type === "numbered") lines.push("1. " + t);
    else if (b.type === "todo") lines.push("[" + (b.checked ? "x" : " ") + "] " + t);
    else if (b.type === "toggle") lines.push("▸ " + t + (b.body ? "\n   " + strip(b.body) : ""));
    else if (b.type === "callout") lines.push("» " + t);
    else if (b.type === "quote") lines.push("> " + t);
    else if (t) lines.push(t);
  });
  return lines.filter(x => x !== undefined).join("\n");
}

const PAGE_AI_PROMPTS = [
  { label: "Summarise this page", q: "Summarise this page in 3-4 tight bullet points." },
  { label: "Tighten the writing", q: "Suggest a tighter, punchier rewrite of the key sections. Keep my voice." },
  { label: "Find weak spots", q: "I'm a sales agency owner. Poke holes in this — where would a prospect push back, and how should I respond?" },
  { label: "Add an objection", q: "Write one more objection-handling response in the same style as the others on this page." }
];

function PageAI({ doc, title, onClose, onInsert }) {
  const [msgs, setMsgs] = useState([{ role: "ai", text: "I can see this whole page. Ask me to summarise, tighten, rewrite a section, or draft something new — I'll use what's here." }]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef(null);
  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [msgs, busy]);

  async function send(text) {
    const q = (text || input).trim();
    if (!q || busy) return;
    setInput(""); setBusy(true);
    setMsgs(m => [...m, { role: "user", text: q }]);
    const context = docPlainText(doc, title);
    const prompt = `You are an AI assistant embedded in a Notion-style page editor inside "BizBoost", a marketing-agency command centre. The user owns the agency.\n\nHere is the current page content:\n"""\n${context.slice(0, 6000)}\n"""\n\nUser request: ${q}\n\nBe concise, practical and write in a confident, plain-spoken voice. Use short paragraphs or bullet lines. Do not use markdown headers.`;
    try {
      let reply;
      if (window.claude && window.claude.complete) {
        reply = await window.claude.complete({ messages: [{ role: "user", content: prompt }] });
      } else {
        reply = "(Live AI runs inside the app preview.) Based on the page, here's a quick take: lead with the guarantee earlier, cut the warm-up, and make the close a single clear next step.";
      }
      setMsgs(m => [...m, { role: "ai", text: (reply || "").trim() || "I couldn't generate a response — try rephrasing." }]);
    } catch (e) {
      setMsgs(m => [...m, { role: "ai", text: "Something went wrong reaching the model. Try again in a moment." }]);
    }
    setBusy(false);
  }

  function insertReply(text) {
    const P = window.BIZBOOST_PAGES;
    const blocks = text.split(/\n+/).map(line => line.trim()).filter(Boolean).map(line => {
      if (/^[-•]\s+/.test(line)) return { id: P.uid(), type: "bullet", html: line.replace(/^[-•]\s+/, "") };
      if (/^\d+[.)]\s+/.test(line)) return { id: P.uid(), type: "numbered", html: line.replace(/^\d+[.)]\s+/, "") };
      return { id: P.uid(), type: "text", html: line };
    });
    onInsert(blocks);
  }

  return (
    <aside style={{ position: "fixed", right: 0, top: 56, bottom: 0, width: 340, zIndex: 50, borderLeft: "1px solid var(--line)", background: "linear-gradient(180deg,#0d0f0d,#0a0b0a)", display: "flex", flexDirection: "column" }}>
      <div className="row between" style={{ padding: "13px 16px", borderBottom: "1px solid var(--line)" }}>
        <div className="row gap-2">
          <span style={{ width: 26, height: 26, borderRadius: 8, background: "var(--lime)", color: "#0a0a0a", display: "grid", placeItems: "center" }}><Icon name="sparkle" cls="ic-sm" /></span>
          <div className="col" style={{ gap: 0 }}>
            <span style={{ font: "600 13px var(--sans)" }}>Page AI</span>
            <span style={{ fontSize: 10.5, color: "var(--mute)" }}>knows this page</span>
          </div>
        </div>
        <button onClick={onClose} className="btn-ghost" style={{ width: 28, height: 28, borderRadius: 8, border: "none", cursor: "pointer", display: "grid", placeItems: "center", color: "var(--mute)" }}><Icon name="x" cls="ic-sm" /></button>
      </div>

      <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: 14, display: "flex", flexDirection: "column", gap: 12 }}>
        {msgs.map((m, i) => (
          <div key={i} style={{ alignSelf: m.role === "user" ? "flex-end" : "flex-start", maxWidth: "92%" }}>
            {m.role === "ai" && <div className="row gap-2" style={{ marginBottom: 5, color: "var(--mute)", fontSize: 10 }}><Icon name="sparkle" cls="ic-sm" />Page AI</div>}
            <div style={{ padding: "10px 13px", borderRadius: 13, fontSize: 12.5, lineHeight: 1.55, whiteSpace: "pre-wrap",
              background: m.role === "user" ? "var(--lime)" : "var(--bg-2)", color: m.role === "user" ? "#0a0a0a" : "var(--ink-2)",
              border: m.role === "user" ? "none" : "1px solid var(--line)", fontWeight: m.role === "user" ? 500 : 400 }}>{m.text}</div>
            {m.role === "ai" && i > 0 && (
              <button onClick={() => insertReply(m.text)} className="btn btn-ghost" style={{ height: 24, marginTop: 5, fontSize: 11, color: "var(--lime)" }}><Icon name="plus" cls="ic-sm" />Insert into page</button>
            )}
          </div>
        ))}
        {busy && <div style={{ alignSelf: "flex-start", color: "var(--mute)", fontSize: 12 }} className="row gap-2"><span className="live-dot" style={{ background: "#8B7CFF" }}></span>thinking…</div>}
      </div>

      <div style={{ padding: 12, borderTop: "1px solid var(--line)" }}>
        <div className="col gap-2" style={{ marginBottom: 9 }}>
          {PAGE_AI_PROMPTS.map((p, i) => (
            <button key={i} onClick={() => send(p.q)} disabled={busy} style={{ textAlign: "left", padding: "7px 11px", borderRadius: 9, cursor: busy ? "default" : "pointer", background: "var(--bg-2)", border: "1px solid var(--line)", color: "var(--ink-2)", font: "500 11.5px var(--sans)", opacity: busy ? .5 : 1 }}
              onMouseEnter={e => { if (!busy) e.currentTarget.style.borderColor = "#cfff3a55"; }}
              onMouseLeave={e => e.currentTarget.style.borderColor = "var(--line)"}>{p.label}</button>
          ))}
        </div>
        <div className="row gap-2" style={{ background: "var(--bg-2)", border: "1px solid var(--line)", borderRadius: 12, padding: "6px 6px 6px 12px" }}>
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter") send(); }} placeholder="Ask about this page…" style={{ flex: 1, background: "none", border: "none", outline: "none", color: "var(--ink)", font: "400 12.5px var(--sans)" }} />
          <button onClick={() => send()} disabled={busy} className="btn btn-primary" style={{ width: 32, height: 32, padding: 0, justifyContent: "center", opacity: busy ? .5 : 1 }}><Icon name="arrowR" cls="ic-sm" /></button>
        </div>
      </div>
    </aside>
  );
}

Object.assign(window, { PageAI, placeCaretEnd, docPlainText });
