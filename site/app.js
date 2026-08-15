const pad = (n) => String(n).padStart(2, "0");
const CAPTURE_KEY = "bree-capture-mode";

let ALL_TRACKS = [];

const CARD = {
  bg: "#050505",
  panel: "#0c0c0c",
  ink: "#f3ebe1",
  muted: "#8f8578",
  sand: "#cbb39a",
  line: "rgba(203, 179, 154, 0.32)",
};

const linkLabels = [
  ["direct", "Listen"],
  ["spotify", "Spotify"],
  ["apple", "Apple"],
  ["lyrics", "Lyrics"],
];

function renderIndex(tracks, root) {
  root.innerHTML = tracks
    .map(
      (t) => `
      <li>
        <a href="#letter-${t.n}">
          <span class="track-num">${pad(t.n)}</span>
          <span class="track-title">${escapeHtml(t.title)}</span>
          <span class="track-artist">${escapeHtml(t.artist)}</span>
        </a>
      </li>`
    )
    .join("");
}

function renderLetters(tracks, root) {
  root.innerHTML = tracks
    .map((t, i) => {
      const prev = tracks[i - 1];
      const next = tracks[i + 1];

      const links = linkLabels
        .filter(([key]) => t[key])
        .map(
          ([key, label]) =>
            `<a href="${escapeAttr(t[key])}" target="_blank" rel="noopener noreferrer">${label}</a>`
        )
        .join("");

      const body = t.paragraphs
        .map((p) => `<p>${escapeHtml(p)}</p>`)
        .join("");

      const prevLink = prev
        ? `<a class="letter-nav-link" href="#letter-${prev.n}"><span aria-hidden="true">←</span> ${pad(prev.n)} ${escapeHtml(prev.title)}</a>`
        : `<span class="letter-nav-link is-disabled">Start of playlist</span>`;

      const nextLink = next
        ? `<a class="letter-nav-link" href="#letter-${next.n}">${pad(next.n)} ${escapeHtml(next.title)} <span aria-hidden="true">→</span></a>`
        : `<span class="letter-nav-link is-disabled">End of playlist</span>`;

      const art = t.spotifyId
        ? `<div class="letter-art">
            <iframe
              title="${escapeAttr(t.title)} on Spotify"
              src="https://open.spotify.com/embed/track/${encodeURIComponent(t.spotifyId)}?utm_source=generator&theme=0"
              width="100%"
              height="152"
              frameborder="0"
              loading="lazy"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            ></iframe>
          </div>`
        : "";

      return `
        <article class="letter is-in" id="letter-${t.n}" data-num="${pad(t.n)}">
          <div class="letter-inner">
            <div class="letter-meta">
              <span>Letter ${pad(t.n)}</span>
              <span>of 32</span>
            </div>
            ${art}
            <h2 class="letter-title">${escapeHtml(t.title)}</h2>
            <p class="letter-artist">${escapeHtml(t.artist)}</p>
            <div class="letter-body">
              <p><em>Bree,</em></p>
              ${body}
            </div>
            <p class="letter-sign">Yours,<br />Holiday</p>
            ${links ? `<div class="letter-links">${links}</div>` : ""}

            <aside class="bree-thoughts" aria-labelledby="bree-thoughts-${t.n}">
              <div class="bree-thoughts-head">
                <p class="bree-thoughts-label" id="bree-thoughts-${t.n}">Bree’s thoughts</p>
                <p class="bree-thoughts-hint">
                  Your reply to this letter. Write whatever this song brings up —
                  it stays on this phone or computer only.
                </p>
              </div>
              <label class="visually-hidden" for="thought-${t.n}">Write your thoughts for ${escapeHtml(t.title)}</label>
              <textarea
                id="thought-${t.n}"
                class="bree-thoughts-input"
                data-track="${t.n}"
                rows="5"
                placeholder="Type here, Bree…"
                spellcheck="true"
                enterkeyhint="done"
                autocomplete="off"
              ></textarea>
              <div class="bree-thoughts-foot">
                <button type="button" class="bree-thoughts-save" data-track="${t.n}">
                  Save my thoughts
                </button>
                <button type="button" class="bree-thoughts-export" data-track="${t.n}">
                  Save as image
                </button>
                <span class="bree-thoughts-status" data-status-for="${t.n}" aria-live="polite"></span>
              </div>
            </aside>

            <nav class="letter-nav" aria-label="Nearby letters">
              ${prevLink}
              <a class="letter-nav-link" href="#index">All songs</a>
              ${nextLink}
            </nav>
          </div>
        </article>`;
    })
    .join("");
}

const storageKey = (n) => `bree-thought-${n}`;

function loadThoughts() {
  document.querySelectorAll(".bree-thoughts-input").forEach((el) => {
    const n = el.dataset.track;
    const saved = localStorage.getItem(storageKey(n));
    if (saved) el.value = saved;
  });
}

function setStatus(n, message, isError = false) {
  const status = document.querySelector(`[data-status-for="${n}"]`);
  if (!status) return;
  status.textContent = message;
  status.classList.toggle("is-error", isError);
}

function saveThought(n, input) {
  try {
    const value = input.value.trim();
    if (value) localStorage.setItem(storageKey(n), value);
    else localStorage.removeItem(storageKey(n));
    setStatus(n, value ? "Saved on this device." : "Cleared.");
  } catch {
    setStatus(n, "Couldn’t save — check browser storage.", true);
  }
}

function bindThoughts() {
  loadThoughts();

  document.querySelectorAll(".bree-thoughts-save").forEach((btn) => {
    btn.addEventListener("click", () => {
      const n = btn.dataset.track;
      const input = document.getElementById(`thought-${n}`);
      if (input) saveThought(n, input);
    });
  });

  document.querySelectorAll(".bree-thoughts-export").forEach((btn) => {
    btn.addEventListener("click", () => exportNote(btn.dataset.track));
  });

  document.querySelectorAll(".bree-thoughts-input").forEach((input) => {
    let timer;
    input.addEventListener("input", () => {
      const n = input.dataset.track;
      setStatus(n, "Typing…");
      clearTimeout(timer);
      timer = setTimeout(() => saveThought(n, input), 700);
    });

    input.addEventListener("focus", () => {
      document.body.classList.add("is-composing");
      window.setTimeout(() => {
        input.scrollIntoView({ block: "center", behavior: "smooth" });
      }, 280);
    });

    input.addEventListener("blur", () => {
      document.body.classList.remove("is-composing");
    });
  });
}

/* ---------- shareable note card ---------- */

function seedFrom(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function trackedText(ctx, text, x, y, tracking) {
  let cursor = x;
  for (const ch of text) {
    ctx.fillText(ch, cursor, y);
    cursor += ctx.measureText(ch).width + tracking;
  }
}

function trackedWidth(ctx, text, tracking) {
  let w = 0;
  for (const ch of text) w += ctx.measureText(ch).width + tracking;
  return w - tracking;
}

function wrapLines(ctx, text, maxWidth) {
  const out = [];
  for (const para of String(text).split(/\n+/)) {
    const words = para.split(/\s+/).filter(Boolean);
    if (!words.length) continue;
    let line = "";
    for (const word of words) {
      const next = line ? `${line} ${word}` : word;
      if (ctx.measureText(next).width > maxWidth && line) {
        out.push(line);
        line = word;
      } else {
        line = next;
      }
    }
    if (line) out.push(line);
  }
  return out;
}

/* A generated motif, unique per song. Album covers are copyrighted and the
   Spotify player is a cross-origin iframe, so neither can be drawn here. */
function drawMotif(ctx, x, y, size, seed) {
  ctx.save();
  roundRect(ctx, x, y, size, size, 18);
  ctx.clip();

  const grad = ctx.createLinearGradient(x, y, x + size, y + size);
  grad.addColorStop(0, "rgba(203, 179, 154, 0.22)");
  grad.addColorStop(1, "rgba(203, 179, 154, 0.04)");
  ctx.fillStyle = grad;
  ctx.fillRect(x, y, size, size);

  let s = seed;
  const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);

  for (let i = 0; i < 4; i++) {
    const cx = x + size * (0.2 + rnd() * 0.6);
    const cy = y + size * (0.2 + rnd() * 0.6);
    const r = size * (0.18 + rnd() * 0.3);
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(243, 235, 225, ${0.08 + rnd() * 0.16})`;
    ctx.lineWidth = 1.5 + rnd() * 2;
    ctx.stroke();
  }

  ctx.beginPath();
  ctx.moveTo(x, y + size * (0.3 + rnd() * 0.4));
  ctx.lineTo(x + size, y + size * (0.3 + rnd() * 0.4));
  ctx.strokeStyle = "rgba(203, 179, 154, 0.35)";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.restore();
  ctx.strokeStyle = CARD.line;
  ctx.lineWidth = 1.5;
  roundRect(ctx, x, y, size, size, 18);
  ctx.stroke();
}

function buildNoteCanvas(track, note) {
  const W = 1080;
  const PAD = 40;
  const IN = 104;
  const maxText = W - IN * 2;
  const MAX_LINES = 22;

  const measure = document.createElement("canvas").getContext("2d");
  measure.font = "300 34px 'Newsreader', Georgia, serif";
  let noteLines = wrapLines(measure, note, maxText);
  let truncated = false;
  if (noteLines.length > MAX_LINES) {
    noteLines = noteLines.slice(0, MAX_LINES);
    noteLines[MAX_LINES - 1] += "…";
    truncated = true;
  }

  measure.font = "400 62px 'Newsreader', Georgia, serif";
  const titleLines = wrapLines(measure, track.title, maxText).slice(0, 2);

  const motif = 200;
  let h = 150 + motif + 84 + titleLines.length * 74 + 52 + 70 + 56 + 46;
  h += noteLines.length * 54 + 90 + 60;
  const H = Math.max(1350, Math.round(h));

  const dpr = 2;
  const canvas = document.createElement("canvas");
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  const ctx = canvas.getContext("2d");
  ctx.scale(dpr, dpr);
  ctx.textBaseline = "alphabetic";

  ctx.fillStyle = CARD.bg;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = CARD.panel;
  roundRect(ctx, PAD, PAD, W - PAD * 2, H - PAD * 2, 30);
  ctx.fill();
  ctx.strokeStyle = CARD.line;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  let y = 132;

  ctx.font = "500 21px 'IBM Plex Mono', ui-monospace, monospace";
  ctx.fillStyle = CARD.sand;
  trackedText(ctx, "BREE'S PLAYLIST", IN, y, 3.4);

  y += 46;
  drawMotif(ctx, IN, y, motif, seedFrom(`${track.title}${track.artist}`));
  y += motif + 84;

  ctx.font = "400 62px 'Newsreader', Georgia, serif";
  ctx.fillStyle = CARD.ink;
  for (const line of titleLines) {
    ctx.fillText(line, IN, y);
    y += 74;
  }

  ctx.font = "300 italic 34px 'Newsreader', Georgia, serif";
  ctx.fillStyle = CARD.muted;
  ctx.fillText(track.artist, IN, y);
  y += 70;

  ctx.beginPath();
  ctx.moveTo(IN, y);
  ctx.lineTo(W - IN, y);
  ctx.strokeStyle = CARD.line;
  ctx.lineWidth = 1;
  ctx.stroke();
  y += 56;

  ctx.font = "500 20px 'IBM Plex Mono', ui-monospace, monospace";
  ctx.fillStyle = CARD.sand;
  trackedText(ctx, "HER NOTE", IN, y, 3.2);
  y += 46;

  ctx.font = "300 34px 'Newsreader', Georgia, serif";
  ctx.fillStyle = CARD.ink;
  for (const line of noteLines) {
    ctx.fillText(line, IN, y);
    y += 54;
  }

  ctx.font = "400 20px 'IBM Plex Mono', ui-monospace, monospace";
  ctx.fillStyle = CARD.muted;
  const footer = `LETTER ${pad(track.n)} OF ${ALL_TRACKS.length || 32}`;
  trackedText(ctx, footer, IN, H - 108, 3);
  const right = "FROM HOLIDAY";
  const rw = trackedWidth(ctx, right, 3);
  trackedText(ctx, right, W - IN - rw, H - 108, 3);

  return { canvas, truncated };
}

async function exportNote(n) {
  const track = ALL_TRACKS.find((t) => String(t.n) === String(n));
  const input = document.getElementById(`thought-${n}`);
  const note = (input?.value || "").trim();

  if (!track) return;
  if (!note) {
    setStatus(n, "Write something first, then save the image.", true);
    input?.focus();
    return;
  }

  try {
    setStatus(n, "Making your image…");
    if (document.fonts?.ready) await document.fonts.ready;

    const { canvas, truncated } = buildNoteCanvas(track, note);
    const blob = await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/png")
    );
    if (!blob) throw new Error("no blob");

    const slug = String(track.title)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    const filename = `bree-${pad(track.n)}-${slug || "note"}.png`;
    const done = truncated ? "Image saved (long note trimmed)." : "Image saved.";

    const file = new File([blob], filename, { type: "image/png" });
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file] });
        setStatus(n, "Shared.");
        return;
      } catch (err) {
        if (err?.name === "AbortError") {
          setStatus(n, "");
          return;
        }
      }
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    setStatus(n, done);
  } catch {
    setStatus(n, "Couldn’t make the image on this browser.", true);
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function escapeAttr(value) {
  return escapeHtml(value).replaceAll("'", "&#39;");
}

function setCaptureMode(on) {
  document.body.classList.toggle("is-capture", on);
  const toggle = document.getElementById("capture-toggle");
  const exit = document.getElementById("capture-exit");
  if (toggle) {
    toggle.setAttribute("aria-pressed", on ? "true" : "false");
    toggle.textContent = on ? "Clean on" : "Clean shot";
  }
  if (exit) exit.hidden = !on;
  try {
    localStorage.setItem(CAPTURE_KEY, on ? "1" : "0");
  } catch {
    /* ignore */
  }
  const url = new URL(location.href);
  if (on) url.searchParams.set("capture", "1");
  else url.searchParams.delete("capture");
  history.replaceState(null, "", url);
}

function initCaptureMode() {
  const params = new URLSearchParams(location.search);
  let on = params.get("capture") === "1";
  if (!on) {
    try {
      on = localStorage.getItem(CAPTURE_KEY) === "1";
    } catch {
      on = false;
    }
  }
  setCaptureMode(on);

  document.getElementById("capture-toggle")?.addEventListener("click", () => {
    setCaptureMode(!document.body.classList.contains("is-capture"));
  });
  document.getElementById("capture-exit")?.addEventListener("click", () => {
    setCaptureMode(false);
  });
}

function settleHeroForScreenshots() {
  // After entrance animations finish, freeze final state so captures aren't mid-fade.
  window.setTimeout(() => {
    document.body.classList.add("is-settled");
  }, 1600);
}

function markFontsReady() {
  const ready = () => document.documentElement.classList.add("fonts-ready");
  if (document.fonts?.ready) {
    document.fonts.ready.then(ready).catch(ready);
  } else {
    ready();
  }
  // Safety: never leave the page waiting on fonts forever.
  window.setTimeout(ready, 2500);
}

function scrollToHash() {
  const raw = location.hash.replace(/^#/, "");
  if (!raw || raw === "capture") return;
  const id = decodeURIComponent(raw);
  const el = document.getElementById(id);
  if (!el) return;
  // Instant jump is more reliable for screenshot framing than smooth scroll.
  const behavior = document.body.classList.contains("is-capture")
    ? "auto"
    : "smooth";
  el.scrollIntoView({ behavior, block: "start" });
}

function setLoadStatus(message, isError = false) {
  const status = document.getElementById("track-list-status");
  if (!status) return;
  if (!message) {
    status.hidden = true;
    status.textContent = "";
    return;
  }
  status.hidden = false;
  status.textContent = message;
  status.classList.toggle("is-error", isError);
}

async function main() {
  markFontsReady();
  settleHeroForScreenshots();
  initCaptureMode();

  setLoadStatus("Loading the playlist…");
  const res = await fetch("./tracks.json", { cache: "no-cache" });
  if (!res.ok) throw new Error(`tracks.json ${res.status}`);
  const tracks = await res.json();
  if (!Array.isArray(tracks) || tracks.length === 0) {
    throw new Error("Playlist is empty");
  }

  ALL_TRACKS = tracks;
  renderIndex(tracks, document.getElementById("track-list"));
  renderLetters(tracks, document.getElementById("letter-stack"));
  setLoadStatus("");
  bindThoughts();
  scrollToHash();
  window.addEventListener("hashchange", scrollToHash);
}

main().catch((err) => {
  console.error(err);
  setLoadStatus("Couldn’t load the playlist. Refresh and try again.", true);
  document.getElementById("letter-stack").innerHTML =
    "<p class='load-status is-error' style='padding:2rem'>Couldn’t load the letters.</p>";
});
