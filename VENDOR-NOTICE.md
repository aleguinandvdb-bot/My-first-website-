# Third-party code

Vendored under `js/vendor/` (no CDN dependency, works offline):

| File | Package | Version | License |
| --- | --- | --- | --- |
| `three.module.min.js` | [three.js](https://threejs.org) | 0.160.0 | MIT |
| `gsap.min.js`, `ScrollTrigger.min.js` | [GSAP](https://gsap.com) | 3.12.5 | [Standard "no charge" license](https://gsap.com/standard-license) — free for this kind of client site |
| `vanilla-tilt.min.js` | [vanilla-tilt.js](https://micku7zu.github.io/vanilla-tilt.js/) | 1.8.1 | MIT |

Fonts (Fraunces, IBM Plex Sans, Geist Mono) are loaded from Google Fonts at runtime — no local files needed.

# Placeholder data — replace before going live

This build ships with clearly fictional placeholders so nothing here can be mistaken for a real business's real contact details:

- **Phone number** `(301) 555-0142` — the `555-01xx` block is reserved for fiction/placeholder use in the US. Replace every `tel:+13015550142` (header drawer, hero, visit section, footer, floating call button) with the café's real number.
- **Address** — only a generic "Rockville Town Center, Rockville, MD" is used, with a note in the Visit section saying the exact address is still a placeholder. Add the real street address once known, and consider embedding a real map.
- **Email** `bonjour@chateaurockvillecafe.example` — the `.example` TLD is reserved by IANA and never resolves. Replace with a real address.
- **Social links** (Instagram / Facebook / TikTok, in the nav drawer and footer) all point to `#`. Swap in the café's real profile URLs.

Search the codebase for these strings to find every spot:
`+13015550142`, `chateaurockvillecafe.example`, `href="#" ... data-social`.
