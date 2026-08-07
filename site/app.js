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
          </div>
        </article>`;
    })
    .join("");
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
  observeLetters();
}

main().catch((err) => {
  console.error(err);
  document.getElementById("letter-stack").innerHTML =
    "<p style='padding:2rem'>Could not load the letters.</p>";
});
