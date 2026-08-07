# Bree's Playlist

Thirty-two songs, collected from screenshots one at a time, each with a short letter about why
it's on the list.

**Site:** [bree-s-playlist.vercel.app](https://bree-s-playlist.vercel.app) — black, letter-first reading experience in `site/`.

## What's here

| File | What it is |
|---|---|
| [LETTERS.md](LETTERS.md) | **Start here.** One letter per song, in playlist order. This is the point of the repo. |
| [PLAYLIST.md](PLAYLIST.md) | The track list, plus links to play each song and read its lyrics. |
| [site/](site/) | The Vercel site (hero, playlist index, all 32 letters). |

## How to read the link table

`PLAYLIST.md` carries five link columns per song. The label on each link tells you what it opens
and how much to trust it:

| Label | Meaning |
|---|---|
| `track` / `single` | Direct link to that exact recording |
| `album` | The album page — no stable single-track link existed |
| `video` / `audio` / `lyrics vid` | A `music.youtube.com` link confirmed as an artist or label upload |
| `yt` | A `youtube.com` link supplied by hand and **not machine-verified** |
| `search` | A search query — tap the top result |
| `lyrics` | Genius page or search |
| `—` | Not available on that platform |

## Coverage

- **32** songs, **32** letters
- **Spotify** — direct track link on all 29 rows where the song is available
- **Apple Music** — direct link on 28 of 29, all on the South African (`/za/`) storefront
- **YouTube** — direct link on all 32: 16 confirmed on `music.youtube.com`, 16 unverified (`yt`)
- **Lyrics** — Genius links on 29 rows; the three Selaelo Selota tracks have none by choice

## Known limits

Lyrics are linked, never reproduced — the words themselves aren't in this repo.

Spotify and YouTube Music URLs carry no region segment and resolve to the listener's own
account region. Only Apple Music bakes the storefront into the path, which is why those
are pinned to `/za/`.

The 16 rows labelled `yt` were taken on trust and could point at a re-upload or the wrong
version. If a song plays back oddly, that label is where to look first.
