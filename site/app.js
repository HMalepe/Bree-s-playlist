const pad = (n) => String(n).padStart(2, "0");
const CAPTURE_KEY = "bree-capture-mode";

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

      return `
        <article class="letter is-in" id="letter-${t.n}" data-num="${pad(t.n)}">
          <div class="letter-inner">
            <div class="letter-meta">
              <span>Letter ${pad(t.n)}</span>
              <span>of 32</span>
            </div>
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
