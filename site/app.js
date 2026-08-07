const pad = (n) => String(n).padStart(2, "0");

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
        <article class="letter" id="letter-${t.n}" data-num="${pad(t.n)}">
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
      // Keep the reply box above the mobile keyboard / dock.
      window.setTimeout(() => {
        input.scrollIntoView({ block: "center", behavior: "smooth" });
      }, 280);
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

function observeLetters() {
  const letters = document.querySelectorAll(".letter");
  if (!("IntersectionObserver" in window)) {
    letters.forEach((el) => el.classList.add("is-in"));
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        }
      }
    },
    { threshold: 0.08, rootMargin: "0px 0px -8% 0px" }
  );

  letters.forEach((el) => io.observe(el));
}

function scrollToHash() {
  const id = decodeURIComponent(location.hash.replace(/^#/, ""));
  if (!id) return;
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
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
  observeLetters();
  scrollToHash();
  window.addEventListener("hashchange", scrollToHash);
}

main().catch((err) => {
  console.error(err);
  setLoadStatus("Couldn’t load the playlist. Refresh and try again.", true);
  document.getElementById("letter-stack").innerHTML =
    "<p class='load-status is-error' style='padding:2rem'>Couldn’t load the letters.</p>";
});
