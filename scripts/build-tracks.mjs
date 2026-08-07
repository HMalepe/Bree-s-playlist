import fs from "node:fs";

const text = fs.readFileSync("LETTERS.md", "utf8").replace(/\r\n/g, "\n");
const play = fs.readFileSync("PLAYLIST.md", "utf8").replace(/\r\n/g, "\n");

const links = {};
for (const m of play.matchAll(
  /\| (\d+) \| ([^|]+) \| ([^|]+) \| (?:\[.*?\]\(([^)]+)\)|—) \| (?:\[.*?\]\(([^)]+)\)|—) \| (?:\[.*?\]\(([^)]+)\)|—) \| (?:\[.*?\]\(([^)]+)\)|—) \| (?:\[.*?\]\(([^)]+)\)|—) \|/g
)) {
  links[+m[1]] = {
    spotify: m[4] || null,
    apple: m[5] || null,
    ytm: m[6] || null,
    direct: m[7] || null,
    lyrics: m[8] || null,
  };
}

const parts = text.split(/\n---\n/).slice(1);
const tracks = [];

for (const p of parts) {
  const hm = p.match(/\*\*(\d+)\.\s*(.+?)\s+—\s+(.+?)\*\*/);
  if (!hm) continue;
  const n = +hm[1];
  let body = p.replace(/^[\s\S]*?\*\*\d+\.[^*]+\*\*\s*/, "").trim();
  body = body.replace(/^Bree,\s*/, "").replace(/\s*Yours,\s*Holiday\s*$/, "").trim();
  if (body.startsWith("*Thirty")) continue;
  const paragraphs = body
    .split(/\n\n+/)
    .map((s) => s.replace(/\n/g, " ").trim())
    .filter(Boolean);
  tracks.push({
    n,
    title: hm[2].trim(),
    artist: hm[3].trim(),
    paragraphs,
    ...links[n],
  });
}

fs.mkdirSync("site", { recursive: true });
fs.writeFileSync("site/tracks.json", JSON.stringify(tracks, null, 2));
console.log(`Wrote ${tracks.length} tracks to site/tracks.json`);
