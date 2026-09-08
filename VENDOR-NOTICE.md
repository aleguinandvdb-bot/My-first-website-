# Contact data

Real business details are wired in:

- **Phone** `(667) 324-7743` → `tel:+16673247743` (header drawer, hero, visit section, footer, floating call button).
- **Email** `chateauderockvillecafe@gmail.com` (footer).
- **Address** The Shops at Congressional Village, 1701 Rockville Pike, Suite A-11, Rockville, MD 20852 (visit section, footer, "Get Directions" map-search link).
- **DoorDash** pickup/delivery link (nav drawer, visit section, footer) currently points to a DoorDash *search* results page (`doordash.com/search/?query=Chateau+Rockville+Cafe...`) rather than a direct store page, since the exact DoorDash store URL wasn't provided. Send the real store link and I'll swap it in as a direct deep link — search for `doordash.com/search` in `index.html` to find all three spots.

# Still placeholder — needs real data

- **Social links** (Instagram / Facebook / TikTok, in the nav drawer and footer) all point to `#`. Send the café's real profile URLs (or say if a different platform — Yelp, X, OpenTable — should be used instead) and I'll wire them in. Search for `data-social` in `index.html`.

# Third-party code

Vendored under `js/vendor/` (no CDN dependency, works offline):

| File | Package | Version | License |
| --- | --- | --- | --- |
| `three.module.min.js` | [three.js](https://threejs.org) | 0.160.0 | MIT |
| `gsap.min.js`, `ScrollTrigger.min.js` | [GSAP](https://gsap.com) | 3.12.5 | [Standard "no charge" license](https://gsap.com/standard-license) — free for this kind of client site |
| `vanilla-tilt.min.js` | [vanilla-tilt.js](https://micku7zu.github.io/vanilla-tilt.js/) | 1.8.1 | MIT |

Fonts (Fraunces, IBM Plex Sans, Geist Mono) are loaded from Google Fonts at runtime — no local files needed.
