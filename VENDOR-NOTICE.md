# Two versions, for two offers

- **Full site** — `index.html` at the repo root. 3D hero coffee, scroll-driven
  bean and grinder/steam-wand scenes, language switcher, GSAP animation.
- **Simple site** — `simple/index.html`. Same real content (menu, hours,
  address, phone, DoorDash, Instagram, Yelp) with no JavaScript at all —
  the mobile nav is a pure CSS checkbox toggle. No 3D, no animation, no
  language switcher. Meant as the lower-cost option if the full build is
  more than they want to pay for.

Once deployed, the simple version sits at `/simple/` under the same
GitHub Pages URL — no separate hosting needed.

# Contact & ordering links

All real:

- **Phone** `(667) 324-7743` → `tel:+16673247743` (header drawer, hero, visit section, footer, floating call button).
- **Email** `chateauderockvillecafe@gmail.com` (footer).
- **Address** The Shops at Congressional Village, 1701 Rockville Pike, Suite A-11, Rockville, MD 20852 (visit section, footer, "Get Directions" map-search link).
- **DoorDash** pickup/delivery — direct store link (nav drawer, visit section, footer).
- **Instagram** [@chateauderockville](https://www.instagram.com/chateauderockville/) (nav drawer, footer).
- **Yelp** [reviews page](https://m.yelp.com/biz/chateau-de-rockville-cafe-rockville) (nav drawer, footer) — uses a generic star icon rather than Yelp's trademarked logo mark.

Facebook and TikTok icons were removed rather than left as dead `#` links — send the handles and they go back in.

# Brand

The business's real name is **Chateau de Rockville** (confirmed by its logo and the DoorDash/Yelp listings) — renamed throughout the site (title, nav wordmark, hero/about copy, footer, all EN/FR/ES translations).

The real logo (a teal crest with two horses and a croissant) is cropped from the photo you sent into `assets/logo.png` (512×512, transparent background) and used as:
- the header wordmark icon (`.wordmark__logo`)
- the footer mark (`.footer__mark`)
- the browser favicon (`assets/favicon-32.png`, `favicon.png` at 64px, `favicon-180.png` as the Apple touch icon)

The site is re-themed around the logo's teal — every color is an OKLCH token anchored to hue 215, sampled directly from the logo (`--color-accent: oklch(35% 0.061 215)`). Paper, ink, rules, and the dark footer panel all share that hue at different lightness/chroma, per `css/style.css`'s `:root` block. The 3D hero coffee was rebuilt to match the real cup photo you sent — teal glazed ceramic, a gold handle, and an actual latte-art heart baked into the coffee's texture, instead of a plain crema ring.

# Third-party code

Vendored under `js/vendor/` (no CDN dependency, works offline):

| File | Package | Version | License |
| --- | --- | --- | --- |
| `three.module.min.js` | [three.js](https://threejs.org) | 0.160.0 | MIT |
| `gsap.min.js`, `ScrollTrigger.min.js` | [GSAP](https://gsap.com) | 3.12.5 | [Standard "no charge" license](https://gsap.com/standard-license) — free for this kind of client site |
| `vanilla-tilt.min.js` | [vanilla-tilt.js](https://micku7zu.github.io/vanilla-tilt.js/) | 1.8.1 | MIT |

Fonts (Fraunces, IBM Plex Sans, Geist Mono) are loaded from Google Fonts at runtime — no local files needed.
