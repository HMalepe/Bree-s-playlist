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
    .map((t) => {
      const links = linkLabels
        .filter(([key]) => t[key])
        .map(
          ([key, label]) =>
            `<a href="${t[key]}" target="_blank" rel="noopener noreferrer">${label}</a>`
        )
        .join("");

      const body = t.paragraphs
        .map((p) => `<p>${escapeHtml(p)}</p>`)
        .join("");

      return `
        <article class="letter" id="letter-${t.n}" data-num="${pad(t.n)}">
          <div class="letter-inner">
            <div class="letter-meta">
              <span>Letter ${pad(t.n)}</span>
              <span>of 32</span>
            </div>
            <h3>${escapeHtml(t.title)}</h3>
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
              ></textarea>
              <div class="bree-thoughts-foot">
                <button type="button" class="bree-thoughts-save" data-track="${t.n}">
                  Save my thoughts
                </button>
                <span class="bree-thoughts-status" data-status-for="${t.n}" aria-live="polite"></span>
              </div>
            </aside>
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
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
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
    { threshold: 0.28 }
  );

  letters.forEach((el) => io.observe(el));
}

async function main() {
  const res = await fetch("./tracks.json");
  const tracks = await res.json();
  renderIndex(tracks, document.getElementById("track-list"));
  renderLetters(tracks, document.getElementById("letter-stack"));
  bindThoughts();
  observeLetters();
}

main().catch((err) => {
  console.error(err);
  document.getElementById("letter-stack").innerHTML =
    "<p style='padding:2rem'>Could not load the letters.</p>";
});
