# Hyperframes Composition Brief: Maqbool (marketing-site hero)

## Objective
Create a short, polished, logo-led motion-graphic launch video for Maqbool, to be the hero video on the marketing site (`artifacts/maqbool-site`).

## Output
- Composition directory: `brag-output/composition/`
- Rendered video: `brag-output/brag.mp4` (also delivered to `public/video/` as maqbool-hero.mp4 / .webm / poster.jpg)
- Format: landscape, 1920x1080
- Duration: 25s

## Source Material
- Project root: `artifacts/maqbool` (app) and `artifacts/maqbool-site` (marketing site)
- Primary files read: `index.html`, `src/pages/auth.tsx`, `src/pages/candidate/interview.tsx`, `src/lib/mock-data.ts`, `src/styles/theme.css`, `src/components/shared/logo.tsx`, `public/favicon.svg`
- Product name: Maqbool
- Tagline: "Hiring, heard clearly."
- Key UI to recreate: async interview recorder (REC, countdown, waveform, question text), AI-ranked shortlist with score rings and AI reasoning, comparison matrix, completion monitor, the circle-and-check logo and Barlow wordmark lockup
- Copy that must appear verbatim: "Hiring, heard clearly."; "Try the live demo"; "How do you balance user needs with technical constraints and business goals?"; "Strong match for Senior Product Designer. Extensive experience with B2B platforms and design systems."
- Candidate names/scores are the app's own mock data (fictional).

## Creative Direction
- Tone preset: polished
- Creative direction: quiet premium product film, logo-led
- Angle: the logo's ring is drawn first, becomes a viewfinder, and the check motif recurs as the AI "approves" (Top match, Best match); the lockup returns for the CTA.
- Hook: ring draws, check strokes in, lockup resolves, tagline holds
- Outro: lockup + tagline + "Try the live demo" pill, simulated click
- Avoid: generic SaaS language, abstract filler, unrequested claims or statistics

## Visual Identity
- Background: #00236f navy; Accent: #eb9c2c amber (record/viewfinder only); steel #0058be / #7db6f2
- Text: #ffffff on navy, #111c2d on light cards
- Fonts: Inter (UI/headlines), Barlow 500 (wordmark only, embedded), JetBrains Mono (timers, scores)

## Storyboard
See `brag-plan.md`. Scenes: 1 mark (0-3.5) · 2 async interview (3.5-9) · 3 AI shortlist (9-15) · 4 compare (15-19) · 5 completion monitor (19-22) · 6 lockup + CTA (22-25).

## Audio
- Role: sparse professional accents over a warm bed
- Music: `assets/music/vol9.mp3` (Happy Beats / Business Moves vol. 9, ~115 BPM), fade-in 0-1.4s, swell at 3.7s, duck at 23.4s, fade-out to 25s via a `data-automation` volume lane
- Cue guidance: bundled preset; beat-locked at 3.70, 10.54, 12.65, 23.17; row/bar reveals on every other beat (~1.05s)
- Audio-reactive: subtle; bass drives the ambient glows (per-frame sampled), no visualizer graphics
- SFX: click2, bong_001, select_008, card-slide-1, impactBell_heavy_000; chosen from low-HF-risk picks in sfx-analysis.md and timed to the visual events
