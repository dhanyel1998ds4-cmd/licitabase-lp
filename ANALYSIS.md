# SaaPilot — reverse engineering and implementation report

## 1. Executive summary

The supplied page is a long-form conversion landing page for a no-code AI customer-support agent. Its persuasion sequence is: product promise → trust → company story and metrics → feature proof → three-step workflow → benefits → testimonials → editorial authority → primary CTA → objections/FAQ → free-trial capture.

The reference is a Framer site with a very dark blue-black base, saturated mint accent, Poppins typography, low-opacity mint borders, radial glows, small grid textures, pinned navigation, scroll reveal, an unusually tall pinned “How it works” sequence, and dense responsive reflow. The reconstruction implements that system in dependency-free HTML/CSS/JS and preserves the public copy and visual assets needed for high fidelity.

- Reference stack: Framer, generator build `bee8ea6` (confirmed in public HTML).
- Reference HTML response: 916,142 bytes (confirmed by HTTP inspection on 2026-08-06).
- Local stack: semantic HTML5, CSS custom properties/Grid/Flexbox/sticky positioning, vanilla JavaScript, small Node static server.
- Complexity: medium-high because of the pinned scroll story, responsive height choreography, card stack carousel, animation states, and 11,000–15,000 px page height.
- Final fidelity: high. It is not labeled pixel-perfect because the proprietary Framer motion curves and all intermediate scroll states cannot be reproduced exactly from public output alone.
- Confidence: high for structure, typography, colors, content, images, breakpoints, and dimensions; medium-high for animation timing/easing.

## 2. Scope analyzed

- URL: `https://saapilot.framer.website/`.
- Reference viewports captured: 1440×900, 1280×800, 768×1024, 390×844.
- Reference states observed: initial hero, fixed header while scrolling, scroll-revealed sections, pinned workflow sequence, stacked testimonial carousel, open/closed FAQ states, desktop and mobile navigation treatment.
- Local states tested: desktop render, mobile render, mobile menu open/closed, invalid subscription email, successful subscription, FAQ semantics, scroll reveal, testimonial dots/autoplay, reduced-motion fallback.
- Public source inspected: initial HTML, metadata, computed styles, visible DOM text, image URLs/natural dimensions, page dimensions, stylesheets, console output.
- Limitations: no private Framer project/source was available; hover timings and every point of the scroll-linked animation are therefore reconstructed from observed behavior. Viewports beyond the four representative captures use the same fluid rules but were not individually screenshot-tested.

Reference page heights:

| Viewport | Width | Rendered height |
| --- | ---: | ---: |
| Desktop | 1440 | 11,835 px |
| Desktop | 1280 | 11,835 px |
| Tablet | 768 | 14,695 px |
| Mobile | 390 | 15,757 px |

## 3. Complete page map

1. Fixed floating navigation with brand, pill menu, and demo CTA.
2. Hero with announcement, three-line H1, two CTAs, avatar proof, and dashboard visual.
3. Scrolling customer-logo strip.
4. About panel with narrative, CTA, and four animated metrics.
5. Feature introduction and five-card bento grid.
6. Scroll-pinned, three-step “How Our AI Agent Works” story.
7. Six-card advantage grid.
8. Stacked testimonial carousel.
9. Three editorial/blog cards.
10. Split analytics CTA.
11. Two-column FAQ accordion.
12. Trial/newsletter capture.
13. Four-column footer and social/legal row.

## 4. Section-by-section analysis

### Navigation

- Confirmed layout: fixed at 17 px from the top on desktop; 1,136 px container; 52 px menu pill.
- Desktop: logo left, four-item center pill, mint CTA right.
- Mobile: logo plus circular menu trigger; menu becomes a blurred full-width panel.
- Local behavior: hover/focus styling, Escape-to-close, `aria-expanded`, `aria-controls`, and menu auto-close after navigation.

### Hero

- Confirmed reference bounds: 1,440×803 px at desktop.
- H1: 56 px/600/72.8 px on desktop; 36 px on mobile.
- Copy column: about 588 px; product visual begins around x=680 and intentionally overflows the right edge.
- Background: grid texture plus mint radial light. Primary CTA uses `#03f7b5`; secondary CTA is a mint outline.
- Local implementation uses the reference dashboard visual with explicit high fetch priority and preserves the mobile vertical composition.

### Trust and About

- Company logos are desaturated and horizontally repeated.
- About is a 1,136 px bordered surface with grid texture and a centered lower mint glow.
- Narrative uses 24 px/500 desktop type and turns the second clause gray to control reading hierarchy.
- Four metric cards animate when at least 70% visible. Values: 597M+, 249+, 99.57%, 129M+.

### Feature bento grid

- Desktop geometry: two 556 px cards, one 1,136 px full-width card, then two 556 px cards; 24 px gutters.
- Card heights are about 480–506 px. Headings use 24 px/500; supporting copy uses 16 px with subdued gray.
- Background treatment repeats a faint 4 px grid and mint radial glow.
- Mobile converts all five items to a single column; typography becomes 19 px headings and 12 px supporting copy.

### How it works

- Confirmed reference section begins near y=3,988 and consumes about 2,700 px on desktop although the visible stage remains approximately one viewport high.
- A three-node dashed progress line and horizontally advancing cards create the perceived step sequence.
- Local implementation uses `position: sticky` plus a requestAnimationFrame scroll calculation. On tablet/mobile the sticky choreography is removed and cards stack, preventing inaccessible off-screen content.

### Advantages

- Six cards in a 3×2 desktop grid, one column on mobile.
- Each item uses a 58 px mint icon disc, 20 px title, low-contrast border, and a small hover lift.
- Purpose: translate technical capability into outcome language immediately before trust proof.

### Testimonials

- 1,136 px textured panel with a 470 px central card and four progressively rotated cards behind it.
- Local carousel supports five direct-selection controls, autoplay every five seconds, paused motion under `prefers-reduced-motion`, and `aria-live` status.

### Blog

- Three 357 px columns. The first and third are offset 80 px downward on desktop.
- Source photography has very large natural dimensions, so the local URLs request Framer’s 1,024 px derivative and use lazy loading.
- Mobile uses a single column with consistent 320 px image crops.

### CTA, FAQ, and Footer

- CTA: 1,136×448 px split card. The left analytics art is cropped; the right side contains one concise promise and primary action.
- FAQ: two columns with five questions each; reference initially exposes one answer in each column. Local implementation uses native `details/summary` for keyboard and screen-reader behavior.
- Footer: trial capture first, then brand and three link groups. The local form provides deterministic validation and success feedback; no backend submission was inferred from the public page.

## 5. Extracted design system

| Token | Value | Evidence/confidence |
| --- | --- | --- |
| `color.background.default` | `#04050e` | computed, confirmed |
| `color.surface.default` | `#080911` | computed, confirmed |
| `color.accent` | `#03f7b5` | computed, confirmed |
| `color.text.primary` | `#ffffff` | computed, confirmed |
| `color.text.secondary` | `#85868b` | computed, confirmed |
| `color.text.mutedLight` | `#ceced1` | computed, confirmed |
| `color.border.default` | `rgba(3,247,181,.16)` | reconstructed from repeated computed borders |
| `font.family.heading/body` | Poppins | computed, confirmed |
| `font.size.display` | 56 px desktop / 36 px mobile | computed, confirmed |
| `font.size.sectionTitle` | 32 px desktop / 20 px mobile | computed, confirmed |
| `font.size.cardTitle` | 24 px desktop / 19 px mobile | computed, confirmed |
| `font.size.body` | 16 px desktop / 12–13 px mobile | computed and reconstructed |
| `font.weight.medium` | 500 | computed, confirmed |
| `font.weight.semibold` | 600 | computed, confirmed |
| `spacing.base` | 4 px | repeated texture and spacing basis, highly probable |
| `spacing.scale` | 8, 12, 16, 24, 32, 48, 64, 96 px | repeated measurements, highly probable |
| `radius.card` | 20–24 px | computed/reconstructed |
| `radius.pill` | 999 px | computed/reconstructed |
| `container.xl` | 1,136 px | measured, confirmed |
| `duration.fast` | 180–240 ms | reconstructed |
| `duration.reveal` | about 700 ms | observed, highly probable |
| `easing.enter` | `cubic-bezier(.22,1,.36,1)` | reconstructed |

## 6. Component tree

```text
Page
├── SiteHeader
│   ├── Brand
│   ├── DesktopNavigation
│   └── MobileNavigation
├── Main
│   ├── HeroSection
│   ├── CompanyLogoStrip
│   ├── AboutPanel
│   │   └── MetricCard ×4
│   ├── FeatureSection
│   │   └── FeatureCard ×5
│   ├── HowItWorks
│   │   └── ProcessCard ×3
│   ├── AdvantageGrid
│   │   └── AdvantageCard ×6
│   ├── TestimonialCarousel
│   │   └── TestimonialCard ×5
│   ├── BlogGrid
│   │   └── BlogCard ×3
│   ├── AnalyticsCTA
│   └── FAQ
│       └── AccordionItem ×10
└── Footer
    ├── TrialForm
    ├── FooterNavigation
    └── SocialLegalRow
```

## 7. Interactions and animations

| Element | Trigger | Initial state | Final state | Duration | Easing | Technology |
| --- | --- | --- | --- | ---: | --- | --- |
| Header | scroll | transparent/no shadow | drop shadow | 240 ms | ease | CSS + JS class |
| Mobile menu | click/Escape | hidden | open panel | 180 ms | ease | JS + CSS |
| Section reveal | viewport entry | opacity 0, y+28 | opacity 1, y0 | 700 ms | enter curve | IntersectionObserver |
| Metric values | 70% viewport entry | 0 | target value | 1,300 ms | cubic-out | requestAnimationFrame |
| Logo strip | continuous | x0 | x−32% | 24 s | linear | CSS keyframes |
| Workflow cards | page scroll | x0 | translated left | scroll-linked | linear | sticky + JS rAF |
| Advantage cards | hover/focus | neutral | y−5, stronger border | 200 ms | enter curve | CSS |
| Testimonials | timer/dot click | stacked card | next card active | 620 ms | enter curve | JS + CSS transforms |
| FAQ | summary click | closed | answer exposed | native | native | `details/summary` |
| Trial form | submit | empty/error | validation or success status | immediate | n/a | Constraint Validation API |

All non-essential motion is disabled or reduced under `prefers-reduced-motion: reduce`.

## 8. Responsive matrix

| Element | Desktop ≥901 px | Tablet 601–900 px | Mobile ≤600 px | Breakpoint confidence |
| --- | --- | --- | --- | --- |
| Header | three-part fixed row | logo + drawer trigger | compact logo + drawer | local confirmed; reference behavior confirmed |
| Hero | 51/49 split with overflow visual | centered copy, large overflow visual | stacked, 36 px H1, visual below | confirmed |
| About metrics | four columns | two columns | one column | reconstructed/validated |
| Feature grid | 2/1/2 bento | two columns with wide card stacked | one column | confirmed/validated |
| Workflow | pinned horizontal scroll | two-column static cards | one-column static cards | confirmed/validated |
| Advantages | 3×2 | 2×3 | one column | confirmed/validated |
| Testimonials | 470 px fan stack | scaled fan stack | 280 px compact fan | confirmed/validated |
| Blog | three staggered columns | two columns | one column | confirmed/validated |
| FAQ | two columns | two columns | one column | confirmed/validated |
| Footer | four columns | two columns | centered single column | confirmed/validated |

## 9. Asset inventory

The reference exposes all used files through `framerusercontent.com`. Important assets retained by URL in the local implementation:

| Asset | Type | Role | Local loading |
| --- | --- | --- | --- |
| `YaV91…GkeSA.png` | PNG | hero dashboard | eager/high priority |
| `nXWp1…pu7Y.png` | PNG | hero grid texture | CSS background |
| `kc4wo…hNew.svg` | SVG | LLM feature diagram | lazy |
| `Obv3U…lasAo.svg` | SVG | deployment feature diagram | lazy |
| `99Qtv…ihnDnE.svg` | SVG | data-sync diagram | lazy |
| `0USfH…BiIMo.svg` | SVG | reporting graph | lazy |
| `PBshW…74qo.png` | PNG | analytics CTA | lazy |
| `UqFTH…8uiAc.jpg` | JPEG | hospitality article | 1,024 px derivative, lazy |
| `iMvPv…6mRzc.jpg` | JPEG | healthcare article | 1,024 px derivative, lazy |
| `ovNRY…gtme4.jpg` | JPEG | small-business article | 1,024 px derivative, lazy |
| Five portrait URLs | PNG/JPEG | testimonial avatars | below fold |
| Five logo URLs | PNG | company proof strip | decorative |

Licensing status is not determinable from public HTML. The URLs are retained for fidelity, but ownership/redistribution permission must be confirmed before commercial publication.

## 10. Stack and technical architecture

Reference evidence:

- `<meta name="generator" content="Framer bee8ea6">`.
- Framer image CDN, search-index JSON, generated inline styles, and published-page scripts.
- Poppins is the dominant computed font; Geist is also declared in the public head.
- Heavy generated DOM and many repeated image/style nodes explain the 916 KB initial document.

Local architecture intentionally avoids framework overhead:

- `index.html`: semantic structure, copy, assets, SEO metadata.
- `styles.css`: tokens, layout, components, motion, responsive rules.
- `script.js`: isolated progressive enhancements.
- `server.cjs`: safe local static serving with MIME types and path confinement.
- `scripts/capture-reference*.cjs`: repeatable reference capture and inspection.
- `scripts/verify-local.cjs`: browser QA, screenshots, console/runtime/network checks, interaction assertions.

## 11. Accessibility

Reference issues observed:

- Heading hierarchy jumps from H1 to H3/H4; local implementation normalizes H1 → H2 → H3.
- Multiple reference images expose empty alt text even when informative; local diagrams and portraits have descriptive alt text while decorative assets are explicitly empty.
- Framer promotional badges overlap page content in reference captures; they are omitted locally.
- Focus visibility could not be confirmed consistently from public rendering; local controls use a 2 px mint focus ring.

Local provisions:

- Skip link, landmarks, labeled navigation, semantic buttons/links.
- Native FAQ disclosure controls.
- Menu state conveyed through ARIA.
- Form label, required/email constraints, error and success live status.
- Reduced-motion handling.
- No keyboard traps in tested flows.

## 12. Performance

Reference risks: 916 KB HTML, oversized natural blog images (up to 8,272×6,200), repeated decorative nodes, several large blur/pattern images, and substantial Framer runtime work.

Local improvements: zero npm/runtime dependencies, small CSS/JS payloads, lazy loading below fold, 1,024 px blog derivatives, eager loading only for the hero, no proprietary carousel or motion package, and no client-side rendering/hydration.

Remaining performance dependency: remote Google Fonts and Framer images. For production, download and optimize authorized assets, self-host Poppins as WOFF2, add immutable cache headers, and serve AVIF/WebP derivatives.

## 13. SEO

- Reference title and description were confirmed and mapped to a concise local title/description.
- Local page includes canonical semantic landmarks, one H1, ordered H2/H3 hierarchy, descriptive image alternatives, Open Graph title/description, and crawlable HTML content.
- No canonical production URL was added because the deployment destination is unknown.
- Recommended production follow-up: add canonical URL, OG image owned by the publisher, Organization/SoftwareApplication JSON-LD, sitemap, robots policy, and real article routes.

## 14. Implementation plan and status

| Phase | Status | Result |
| --- | --- | --- |
| Foundation | complete | static project and server |
| Tokens | complete | centralized CSS custom properties |
| Layout | complete | all 13 structural regions |
| Components | complete | reusable surface/card/button patterns |
| Content | complete | public landing copy represented |
| Interactions | complete | nav, reveal, counters, pinned steps, carousel, FAQ, form |
| Responsiveness | complete | desktop/tablet/mobile rules |
| Accessibility | complete | semantic/keyboard/ARIA/reduced-motion pass |
| Performance | complete for prototype | lazy/derived assets and no framework overhead |
| QA | complete | desktop/mobile browser verification and screenshots |

## 15. Implementation delivered

- Created `index.html`, `styles.css`, `script.js`, `server.cjs`, `package.json`, `README.md`, and this report.
- Added repeatable browser capture/verification utilities under `scripts/`.
- No dependencies were installed and no existing files were overwritten.
- Core decisions: semantic native elements, CSS-rendered branding and diagrams where practical, public reference assets only where they materially affect fidelity, and responsive fallback instead of pinned horizontal motion on narrow screens.

## 16. Validation

Final browser checks:

| Check | Result |
| --- | --- |
| Local HTTP | 200 |
| Meaningful body content | pass |
| Error overlay | none |
| Console errors | 0 |
| Page/runtime errors | 0 |
| Failed requests | 0 |
| Main sections detected | 10 |
| Interactive elements detected | 57 |
| Mobile menu | opens, reports `aria-expanded=true`, closes |
| Invalid email | clear validation message |
| Valid email | clear success message |

Final geometry:

| Viewport | Reference | Local | Difference |
| --- | ---: | ---: | ---: |
| 1440×900 | 11,835 px | 11,874 px | +39 px (+0.33%) |
| 390×844 | 15,757 px | 15,550 px | −207 px (−1.31%) |

Desktop section-title positions differ by approximately 22–124 px over an 11,874 px page; mobile headline positions are within 127 px except for intentional redistribution around Blog/CTA. No critical or high-impact visual differences remain in the verified states.

## 17. Real pending items

1. **Asset licensing:** confirm the right to redistribute the referenced Framer CDN images. Impact: commercial/legal, not runtime. Next action: replace URLs with authorized local masters before production.
2. **Real form/backend:** the public request did not provide an email or CRM endpoint, so submission is intentionally local feedback only. Impact: no lead persistence. Next action: supply the approved endpoint and consent/privacy requirements.
3. **Destination routes:** secondary footer/blog links remain in-page because no other pages were in scope. Impact: landing page is complete; multi-page navigation is not. Next action: provide the route list if those pages should be built.
4. **Production URL:** canonical, sitemap, and final social image depend on deployment host. Impact: production SEO completion. Next action: add the chosen domain during deployment.
