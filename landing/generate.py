"""Static landing-page generator.

Reads a JSON config for one client, renders a mobile-first single-page HTML
that you can drop on any static host (Cloudflare Pages, Netlify, Vercel, a
GitHub Page, a subdomain on the client's existing site, etc.).

Usage:
    python -m landing.generate landing/clients/deluxe-builders.json
    # → writes landing/dist/deluxe-builders/index.html
"""
from __future__ import annotations

import argparse
import html
import json
import sys
from pathlib import Path


def esc(s: object) -> str:
    return html.escape(str(s), quote=True)


def render(config: dict) -> str:
    slug = config["slug"]
    client = config["client_name"]
    headline = config["headline"]
    usp = config["usp"]
    cta = config.get("cta_text", "Get a Free Quote")
    cta_short = config.get("cta_short", "free quote")
    phone = config.get("phone", "")
    area = config.get("area", "")
    accent = config.get("accent_color", "#ff6b35")
    form_endpoint = config.get("form_endpoint", "https://example.com/leads")
    proof_points = config.get("proof_points", [])
    services = config.get("services", [])
    photos = config.get("photos", [])
    reviews = config.get("reviews", [])

    proof_html = "\n".join(
        f'        <li class="proof-item"><span class="check">✓</span> {esc(p)}</li>'
        for p in proof_points
    )
    services_html = "\n".join(f'              <option>{esc(s)}</option>' for s in services)
    photos_html = "\n".join(
        f'        <img src="{esc(p)}" alt="{esc(client)} project" loading="lazy">'
        for p in photos
    )
    reviews_html = "\n".join(
        f'      <blockquote class="review"><p>"{esc(r["quote"])}"</p><cite>— {esc(r["name"])}, {esc(r.get("area", ""))}</cite></blockquote>'
        for r in reviews
    )

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{esc(client)} — {esc(headline)}</title>
<meta name="description" content="{esc(usp)}">
<meta property="og:title" content="{esc(client)} — {esc(headline)}">
<meta property="og:description" content="{esc(usp)}">
<style>
  *{{margin:0;padding:0;box-sizing:border-box}}
  html{{scroll-behavior:smooth}}
  body{{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;color:#1a1a1a;line-height:1.5;background:#fff;padding-bottom:80px}}
  img{{max-width:100%;display:block;border-radius:8px}}
  .container{{max-width:720px;margin:0 auto;padding:0 20px}}
  .hero{{background:linear-gradient(135deg,#1a1a1a 0%,#2a2a2a 100%);color:#fff;padding:56px 0;text-align:center}}
  .hero h1{{font-size:2rem;margin-bottom:12px;line-height:1.2}}
  .hero .usp{{font-size:1.1rem;opacity:.9;margin-bottom:28px;max-width:520px;margin-left:auto;margin-right:auto}}
  .cta{{display:inline-block;background:{accent};color:#fff;padding:16px 32px;border-radius:10px;text-decoration:none;font-weight:600;font-size:1.1rem;box-shadow:0 4px 14px rgba(0,0,0,.18);transition:transform .15s}}
  .cta:hover{{transform:translateY(-2px)}}
  .cta:active{{transform:translateY(0)}}
  section{{padding:48px 0}}
  section + section{{border-top:1px solid #eee}}
  h2{{font-size:1.5rem;margin-bottom:20px}}
  .proof{{list-style:none;display:grid;gap:14px}}
  .proof-item{{background:#f8f8f8;padding:18px;border-radius:10px;display:flex;align-items:flex-start;gap:12px}}
  .check{{color:{accent};font-weight:700;font-size:1.2rem;flex-shrink:0}}
  .gallery{{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:8px}}
  .gallery img{{width:100%;height:160px;object-fit:cover}}
  .review{{background:#f8f8f8;padding:20px;border-radius:10px;margin-bottom:14px;border-left:4px solid {accent}}}
  .review p{{font-style:italic;margin-bottom:8px}}
  .review cite{{font-style:normal;opacity:.7;font-size:.9rem}}
  .form{{background:#f8f8f8;padding:24px;border-radius:12px}}
  .form label{{display:block;margin-bottom:12px;font-weight:500}}
  .form input,.form select{{width:100%;padding:14px;margin-top:4px;border:1px solid #ddd;border-radius:8px;font-size:1rem;background:#fff}}
  .form input:focus,.form select:focus{{outline:none;border-color:{accent}}}
  .form button{{width:100%;border:none;cursor:pointer;margin-top:8px}}
  footer{{padding:32px 0;text-align:center;color:#666;font-size:.875rem}}
  footer a{{color:#666}}
  .sticky-cta{{position:fixed;bottom:0;left:0;right:0;background:{accent};color:#fff;padding:18px;text-align:center;font-weight:600;text-decoration:none;box-shadow:0 -2px 14px rgba(0,0,0,.18);z-index:100;font-size:1.05rem}}
  @media (min-width:600px){{
    .sticky-cta{{display:none}}
    body{{padding-bottom:0}}
    .hero h1{{font-size:2.5rem}}
  }}
</style>
</head>
<body>

<section class="hero">
  <div class="container">
    <h1>{esc(headline)}</h1>
    <p class="usp">{esc(usp)}</p>
    <a href="#quote" class="cta">{esc(cta)}</a>
  </div>
</section>

<section>
  <div class="container">
    <h2>Why {esc(client)}</h2>
    <ul class="proof">
{proof_html}
    </ul>
  </div>
</section>

<section>
  <div class="container">
    <h2>Recent work</h2>
    <div class="gallery">
{photos_html}
    </div>
  </div>
</section>

{f'''<section>
  <div class="container">
    <h2>What customers say</h2>
{reviews_html}
  </div>
</section>''' if reviews else ''}

<section id="quote">
  <div class="container">
    <h2>Get your {esc(cta_short)}</h2>
    <form class="form" action="{esc(form_endpoint)}" method="post">
      <input type="hidden" name="client_slug" value="{esc(slug)}">
      <label>Your name<input name="name" required autocomplete="name"></label>
      <label>Phone number<input name="phone" type="tel" required autocomplete="tel" inputmode="tel"></label>
      <label>Postcode or area<input name="postcode" required></label>
      {f'''<label>Project type<select name="project_type" required>
              <option value="">Choose…</option>
{services_html}
            </select></label>''' if services else ''}
      <button type="submit" class="cta">{esc(cta)}</button>
    </form>
  </div>
</section>

<footer>
  <div class="container">
    <p>{esc(client)}{f' · <a href="tel:{esc(phone)}">{esc(phone)}</a>' if phone else ''}{f' · {esc(area)}' if area else ''}</p>
  </div>
</footer>

<a href="#quote" class="sticky-cta">{esc(cta)} →</a>

</body>
</html>
"""


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("config", help="Path to client JSON config")
    parser.add_argument("--out", help="Output directory", default="landing/dist")
    args = parser.parse_args()

    config_path = Path(args.config)
    config = json.loads(config_path.read_text())
    slug = config["slug"]

    out_dir = Path(args.out) / slug
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / "index.html"
    out_path.write_text(render(config), encoding="utf-8")

    print(f"Wrote {out_path} ({out_path.stat().st_size:,} bytes)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
