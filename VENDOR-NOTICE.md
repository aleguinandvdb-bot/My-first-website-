# Contact & ordering links

All real:

- **Phone** `(667) 324-7743` → `tel:+16673247743` (header drawer, hero, visit section, footer, floating call button).
- **Email** `chateauderockvillecafe@gmail.com` (footer).
- **Address** The Shops at Congressional Village, 1701 Rockville Pike, Suite A-11, Rockville, MD 20852 (visit section, footer, "Get Directions" map-search link).
- **DoorDash** pickup/delivery — direct store link (nav drawer, visit section, footer).
- **Instagram** [@chateauderockville](https://www.instagram.com/chateauderockville/) (nav drawer, footer).
- **Yelp** [reviews page](https://m.yelp.com/biz/chateau-de-rockville-cafe-rockville) (nav drawer, footer) — used a generic star icon rather than Yelp's trademarked logo mark.

Facebook and TikTok icons were removed rather than left as dead `#` links — say the word (with the handles) and they go back in.

# Possible name mismatch — worth checking

The DoorDash and Yelp URLs you sent both use the slug **"chateau-de-rockville"** (e.g. "Chateau de Rockville Bakery & Cafe" on DoorDash), which matches the email address, but the site's displayed name is currently **"Chateau Rockville"** (title, nav wordmark, hero copy, footer, and all EN/FR/ES translations). If the business actually goes by "Chateau de Rockville," say so and I'll rename it everywhere — it's a find/replace across `index.html` and `js/i18n.js`, not a redesign.

# Third-party code

Vendored under `js/vendor/` (no CDN dependency, works offline):

| File | Package | Version | License |
| --- | --- | --- | --- |
| `three.module.min.js` | [three.js](https://threejs.org) | 0.160.0 | MIT |
| `gsap.min.js`, `ScrollTrigger.min.js` | [GSAP](https://gsap.com) | 3.12.5 | [Standard "no charge" license](https://gsap.com/standard-license) — free for this kind of client site |
| `vanilla-tilt.min.js` | [vanilla-tilt.js](https://micku7zu.github.io/vanilla-tilt.js/) | 1.8.1 | MIT |

Fonts (Fraunces, IBM Plex Sans, Geist Mono) are loaded from Google Fonts at runtime — no local files needed.
