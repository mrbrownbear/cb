#!/usr/bin/env python3
from __future__ import annotations

from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from urllib.parse import urljoin, urlsplit, urlunsplit
import html
import json
import re
import subprocess

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "source.html"
INDEX = ROOT / "index.html"
BASE = "https://www.cbwebsitedesign.co.uk/"
HOSTS = {"www.cbwebsitedesign.co.uk", "cbwebsitedesign.co.uk"}
ASSET_EXTS = {
    ".js", ".css", ".woff", ".woff2", ".ttf", ".otf", ".eot",
    ".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg", ".avif",
    ".mp4", ".webm", ".ico", ".json", ".bin"
}
TEXT_EXTS = {".js", ".css", ".json", ".svg"}
SKIP_PATH_PREFIXES = (
    "/wp-admin/", "/wp-json/", "/xmlrpc.php", "/cdn-cgi/challenge-platform/",
    "/cdn-cgi/rum", "/__sitecloner/", "/__external__/"
)

ATTR_RE = re.compile(r'''(?:src|href|poster|data-src|data-lazy-src|data-poster)\s*=\s*["']([^"']+)["']''', re.I)
SRCSET_RE = re.compile(r'''(?:srcset|data-srcset)\s*=\s*["']([^"']+)["']''', re.I)
CSS_URL_RE = re.compile(r'''url\(\s*["']?([^"')\s]+)''', re.I)
IMPORT_RE = re.compile(r'''@import\s+(?:url\()?\s*["']?([^"')\s;]+)''', re.I)
STRING_ASSET_RE = re.compile(r'''["']((?:(?:https?:)?//|/|\.\.?/)[^"']+\.(?:js|css|woff2?|ttf|otf|eot|png|jpe?g|webp|gif|svg|avif|mp4|webm|ico|json)(?:\?[^"']*)?)["']''', re.I)
ABS_RE = re.compile(r'''https?://(?:www\.)?cbwebsitedesign\.co\.uk/[^\s"'<>\\)]+''', re.I)


def run(cmd: list[str]) -> subprocess.CompletedProcess:
    return subprocess.run(cmd, capture_output=True, text=True)


def normalize_url(raw: str, base: str = BASE) -> str | None:
    if not raw:
        return None
    raw = html.unescape(raw.strip()).replace("\\/", "/")
    if len(raw) > 800 or any(c in raw for c in "\r\n\t{}[]"):
        return None
    if raw.startswith(("data:", "blob:", "about:", "mailto:", "tel:", "javascript:", "#")):
        return None
    if raw.startswith("//"):
        raw = "https:" + raw
    absolute = urljoin(base, raw)
    p = urlsplit(absolute)
    if p.hostname not in HOSTS:
        return None
    path = p.path.replace("/index.htmlwp-content/", "/wp-content/").replace("/index.htmlwp-includes/", "/wp-includes/")
    if path.startswith(SKIP_PATH_PREFIXES):
        return None
    ext = Path(path).suffix.lower()
    if ext not in ASSET_EXTS:
        return None
    return urlunsplit(("https", "www.cbwebsitedesign.co.uk", path, p.query, ""))


def local_path(url: str) -> Path:
    return ROOT / urlsplit(url).path.lstrip("/")


def extract_urls(text: str, base: str = BASE, suffix: str = "") -> set[str]:
    found: set[str] = set()
    for m in ATTR_RE.finditer(text):
        u = normalize_url(m.group(1), base)
        if u:
            found.add(u)
    for m in SRCSET_RE.finditer(text):
        for part in m.group(1).split(","):
            ref = part.strip().split()[0] if part.strip() else ""
            u = normalize_url(ref, base)
            if u:
                found.add(u)

    regexes = [STRING_ASSET_RE, ABS_RE]
    if suffix.lower() in {"", ".html", ".css", ".svg"}:
        regexes.extend([CSS_URL_RE, IMPORT_RE])
    for regex in regexes:
        for m in regex.finditer(text):
            ref = m.group(1) if m.lastindex else m.group(0)
            u = normalize_url(ref, base)
            if u:
                found.add(u)
    return found


def remove_tag_blocks(text: str, tag: str, predicate) -> str:
    pattern = re.compile(rf'''<{tag}\b(?P<attrs>[^>]*)>(?P<body>.*?)</{tag}\s*>''', re.I | re.S)
    def repl(m):
        return "" if predicate(m.group("attrs"), m.group("body")) else m.group(0)
    return pattern.sub(repl, text)


def strip_external_runtime_resources(source: str) -> str:
    external = r'''(?:https?:)?//'''
    source = re.sub(
        rf'''<script\b(?=[^>]*\bsrc\s*=\s*["']{external})[^>]*>.*?</script\s*>''',
        "", source, flags=re.I | re.S
    )
    source = re.sub(
        rf'''<iframe\b(?=[^>]*\bsrc\s*=\s*["']{external})[^>]*>.*?</iframe\s*>''',
        "", source, flags=re.I | re.S
    )
    source = re.sub(
        rf'''<link\b(?=[^>]*\bhref\s*=\s*["']{external})[^>]*>''',
        "", source, flags=re.I
    )
    source = re.sub(
        rf'''<(?:img|source)\b(?=[^>]*\bsrc\s*=\s*["']{external})[^>]*>''',
        "", source, flags=re.I
    )
    source = re.sub(
        rf'''\s(?:srcset|data-srcset)\s*=\s*["'][^"']*{external}[^"']*["']''',
        "", source, flags=re.I
    )

    def strip_media_src(m: re.Match) -> str:
        tag = m.group(0)
        return re.sub(rf'''\s+src\s*=\s*["']{external}[^"']*["']''', "", tag, flags=re.I)

    source = re.sub(r'''<(?:video|audio)\b[^>]*>''', strip_media_src, source, flags=re.I)
    return source


def rewrite_internal_navigation(source: str) -> str:
    def repl(m: re.Match) -> str:
        before, quote, href = m.group(1), m.group(2), html.unescape(m.group(3).strip())
        if not href.startswith("/") or href.startswith("//"):
            return m.group(0)
        parsed = urlsplit(href)
        if parsed.path in {"", "/", "/index.html"} or parsed.fragment:
            return m.group(0)
        if Path(parsed.path).suffix.lower() in ASSET_EXTS:
            return m.group(0)
        absolute = "https://www.cbwebsitedesign.co.uk" + href
        return f"<a{before}href={quote}{absolute}{quote}"

    return re.sub(r'''<a([^>]*?)href\s*=\s*(["'])([^"']+)\2''', repl, source, flags=re.I)


def clean_html(source: str) -> str:
    bad_markers = (
        "googletagmanager", "google-analytics", "doubleclick", "googleadservices",
        "hs-scripts", "hs-banner", "hscollectedforms", "usemessages", "hubspot",
        "cookieyes", "cloudflareinsights", "challenge-platform", "__cf$cv$params",
        "cdn-cgi/rum", "microsoft", "clarity.ms", "bat.bing", "sitecloner"
    )

    def bad_script(attrs: str, body: str) -> bool:
        blob = (attrs + " " + body).lower()
        return any(x in blob for x in bad_markers)

    source = remove_tag_blocks(source, "script", bad_script)
    source = re.sub(r'''<link\b[^>]*\brel=["'][^"']*(?:dns-prefetch|preconnect)[^"']*["'][^>]*>''', "", source, flags=re.I)
    source = source.replace("/index.htmlwp-content/", "/wp-content/")
    source = source.replace("/index.htmlwp-includes/", "/wp-includes/")
    source = re.sub(r'''https?://(?:www\.)?cbwebsitedesign\.co\.uk(?=/)''', "", source, flags=re.I)
    source = strip_external_runtime_resources(source)
    source = rewrite_internal_navigation(source)

    guard = r'''<script id="local-only-runtime">(function(){
const own=u=>{try{const x=new URL(String(u&&u.url?u.url:u),location.href);return x.origin===location.origin||['data:','blob:','about:'].includes(x.protocol)}catch(_){return true}};
if(window.fetch){const f=window.fetch.bind(window);window.fetch=(u,o)=>own(u)?f(u,o):Promise.resolve(new Response('',{status:204,statusText:'Offline'}))}
const xo=XMLHttpRequest.prototype.open;XMLHttpRequest.prototype.open=function(m,u){if(!own(u))return xo.call(this,m,'/__offline__/blocked');return xo.apply(this,arguments)};
if(navigator.sendBeacon){const b=navigator.sendBeacon.bind(navigator);navigator.sendBeacon=(u,d)=>own(u)?b(u,d):false}
const blockSetter=(C,p)=>{try{const d=Object.getOwnPropertyDescriptor(C.prototype,p);if(d&&d.set)Object.defineProperty(C.prototype,p,{...d,set(v){return d.set.call(this,own(v)?v:'')}})}catch(_){}};
[[HTMLImageElement,'src'],[HTMLScriptElement,'src'],[HTMLLinkElement,'href'],[HTMLIFrameElement,'src'],[HTMLVideoElement,'src'],[HTMLAudioElement,'src'],[HTMLSourceElement,'src']].forEach(x=>blockSetter(x[0],x[1]));
try{navigator.serviceWorker&&navigator.serviceWorker.getRegistrations&&navigator.serviceWorker.getRegistrations().then(rs=>rs.forEach(r=>r.unregister()))}catch(_){}
})();</script>'''
    failsafe = r'''<style id="capture-failsafe">html,body{visibility:visible!important;opacity:1!important}.cky-consent-container,.cky-overlay,.hubspot-overlay,#hubspot-messages-iframe-container,[class*="cf-chl"],.challenge-platform{display:none!important}</style>'''
    source = re.sub(r'''<head([^>]*)>''', lambda m: "<head" + m.group(1) + ">" + guard, source, count=1, flags=re.I)
    source = re.sub(r'''</head\s*>''', failsafe + "</head>", source, count=1, flags=re.I)
    return source


def download(url: str) -> tuple[str, bool, str]:
    dest = local_path(url)
    if dest.exists() and dest.stat().st_size > 0:
        return url, True, "existing"
    dest.parent.mkdir(parents=True, exist_ok=True)
    tmp = dest.with_name(dest.name + ".part")
    cmd = [
        "curl", "--fail", "--location", "--silent", "--show-error", "--compressed",
        "--retry", "3", "--retry-all-errors", "--retry-delay", "1",
        "--connect-timeout", "20", "--max-time", "240",
        "-A", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/153 Safari/537.36",
        "-H", "Accept: */*", "-o", str(tmp), url,
    ]
    r = run(cmd)
    if r.returncode != 0:
        tmp.unlink(missing_ok=True)
        return url, False, r.stderr.strip()[-500:]
    if not tmp.exists() or tmp.stat().st_size == 0:
        tmp.unlink(missing_ok=True)
        return url, False, "empty response"
    head = tmp.read_bytes()[:512].lstrip().lower()
    if dest.suffix.lower() not in {".svg", ".json"} and (head.startswith(b"<!doctype html") or head.startswith(b"<html")):
        tmp.unlink(missing_ok=True)
        return url, False, "received HTML instead of asset"
    tmp.replace(dest)
    return url, True, "downloaded"


def rewrite_local_references(path: Path, source_url: str) -> set[str]:
    try:
        text = path.read_text(encoding="utf-8")
    except Exception:
        return set()
    discovered = extract_urls(text, source_url, path.suffix)
    original = text
    text = text.replace("/index.htmlwp-content/", "/wp-content/").replace("/index.htmlwp-includes/", "/wp-includes/")
    text = re.sub(r'''https?://(?:www\.)?cbwebsitedesign\.co\.uk(?=/)''', "", text, flags=re.I)
    if text != original:
        path.write_text(text, encoding="utf-8")
    return discovered


def main() -> None:
    if not SOURCE.exists():
        raise SystemExit("source.html missing")
    raw = SOURCE.read_text(encoding="utf-8", errors="ignore")
    if len(raw) < 30000 or re.search(r'''just a moment|cf-chl|attention required''', raw, re.I):
        raise SystemExit("Source capture is incomplete or Cloudflare challenged")

    cleaned = clean_html(raw)
    INDEX.write_text(cleaned, encoding="utf-8")

    pending = extract_urls(raw, BASE, ".html") | extract_urls(cleaned, BASE, ".html")
    done: set[str] = set()
    failures: dict[str, str] = {}
    passes = 0

    while pending - done and passes < 8:
        passes += 1
        batch = sorted(pending - done)
        print(f"Pass {passes}: {len(batch)} assets")
        results = {}
        with ThreadPoolExecutor(max_workers=12) as pool:
            futures = {pool.submit(download, u): u for u in batch}
            for n, fut in enumerate(as_completed(futures), 1):
                u = futures[fut]
                try:
                    _, ok, detail = fut.result()
                except Exception as exc:
                    ok, detail = False, repr(exc)
                results[u] = (ok, detail)
                if n % 25 == 0 or n == len(batch):
                    print(f"  {n}/{len(batch)}")

        found: set[str] = set()
        for u in batch:
            ok, detail = results[u]
            if ok:
                failures.pop(u, None)
                p = local_path(u)
                if p.suffix.lower() in TEXT_EXTS:
                    found |= rewrite_local_references(p, u)
            else:
                failures[u] = detail
            done.add(u)
        pending |= found

    report = {
        "passes": passes,
        "assets_seen": len(done),
        "assets_ok": len(done) - len(failures),
        "failed_count": len(failures),
        "failed": failures,
    }
    (ROOT / "asset-localization-report.json").write_text(json.dumps(report, indent=2, sort_keys=True) + "\n")
    print(json.dumps(report, indent=2))

    core = [
        ROOT / "wp-content/themes/cbd/dist/core.bundle.js",
        ROOT / "wp-content/themes/cbd/fonts/Matter-TRIAL-Bold.woff2",
    ]
    missing = [str(p.relative_to(ROOT)) for p in core if not p.exists()]
    if missing:
        raise SystemExit("Missing core assets: " + ", ".join(missing))

    SOURCE.unlink(missing_ok=True)
    for name in ("status.txt", "headers.txt"):
        (ROOT / name).unlink(missing_ok=True)


if __name__ == "__main__":
    main()
