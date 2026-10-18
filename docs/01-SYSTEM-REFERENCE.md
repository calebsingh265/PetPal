# PetPal — Complete System Reference

**Everything this system is, does, and is built from.**

This document is the single source of truth for the PetPal application. It is
written for someone who did not build it and needs to understand it completely —
to write the project documentation, to answer questions in a presentation, to
maintain it, or to extend it.

Nothing in this document is aspirational. Every statement describes code that
exists in this repository and behaviour you can verify by running it. Where a
thing was built one way rather than another, the reason is given, because "why"
is what a supervisor asks after "what".

---

## How to use this document

| If you need to… | Read |
|---|---|
| Explain the project in one minute | Part 1 |
| Write the Planning phase document | Parts 1, 2, 3, 11 + `02-PHASE-2-PLANNING.md` |
| Write the Analysis phase document | Parts 4, 6, 7 + `03-PHASE-3-ANALYSIS.md` |
| Write the Design phase document | Parts 5, 6, 8, 9 + `04-PHASE-4-DESIGN.md` |
| Write the Implementation phase document | Parts 10, 12, 13 + `05-PHASE-5-IMPLEMENTATION.md` |
| Change the code | Parts 3, 5, 8, 9 |
| Answer "why did you…" in a viva | Part 14 |

---

## Contents

1. [What PetPal is](#part-1--what-petpal-is)
2. [The technology stack](#part-2--the-technology-stack)
3. [Repository map — every folder and file](#part-3--repository-map)
4. [Every screen, in detail](#part-4--every-screen)
5. [The database](#part-5--the-database)
6. [How data moves through the system](#part-6--how-data-moves)
7. [Requirements](#part-7--requirements)
8. [The algorithms](#part-8--the-algorithms)
9. [The 3D system](#part-9--the-3d-system)
10. [Security](#part-10--security)
11. [Deployment and environments](#part-11--deployment-and-environments)
12. [Testing](#part-12--testing)
13. [Known limitations and honest caveats](#part-13--known-limitations)
14. [Design decisions and their reasons](#part-14--design-decisions)
15. [Glossary](#part-15--glossary)

---

# Part 1 — What PetPal is

## 1.1 One paragraph

PetPal is a web application that brings the everyday parts of pet care into one
place. A pet owner can calculate exactly how much to feed an animal using the
same energy formulas a veterinarian uses, check whether a food or household
plant is dangerous before the animal eats it, find real veterinary practices
near them, run a guided wellness check, follow a week-by-week care plan for a
new animal, read care guides, and ask a question that a verified veterinary
professional answers. It supports dogs, cats, rabbits, birds, fish, reptiles and
small pets, and it runs in a browser on a phone or a computer.

## 1.2 The problem

Pet care information is scattered, inconsistent and often wrong. Three specific
failures motivated this project:

**Portion sizes are guessed.** Most owners feed by scoop, by the picture on the
bag, or by what the previous owner did. Feeding guides on packaging are given in
broad weight bands and take no account of life stage, neutering, activity or
body condition. Over-feeding is the most common preventable health problem in
companion animals.

**Toxicity information is unreliable and slow.** An owner whose dog has just
eaten something searches the web and receives contradictory answers from forums,
content farms and pages written for a different country's products. The moment
they need a clear answer is the moment they are least able to evaluate sources.

**Finding a vet under pressure is hard.** In an emergency an owner needs a real
practice, a real address and a real phone number, quickly. General search engines
return sponsored listings, closed businesses and aggregator pages.

## 1.3 What PetPal does about each

| Problem | PetPal's answer |
|---|---|
| Guessed portions | A calculator using published RER/MER veterinary energy formulas, taking species, weight, life stage, activity and body condition |
| Unreliable toxicity info | A curated database of 88 foods, plants and household substances, each with a verdict, the clinical reason, and what to actually do |
| Finding a vet | Real practices from OpenStreetMap, sorted by distance, with a map — showing only facts the source actually holds |
| No professional input | Ask a Vet: owners post questions, administrator-verified veterinary professionals answer |
| Nothing tracks the animal | Pet profiles with a weight log and dated reminders, a wellness check, and a week-by-week care plan |
| Owners feel alone | An anonymous community wall |

## 1.4 Scope — what it is not

Stating this explicitly protects you in a viva.

- It is **not** a diagnostic tool. It gives guidance and says so on every screen
  that touches health.
- It is **not** a booking system. It finds practices; it does not make
  appointments.
- It is **not** a shop. There are no payments anywhere in the system.
- It is **not** a social network. The community wall is anonymous and has no
  profiles, followers or messaging.
- It does **not** rank, rate or endorse individual veterinary practices.

## 1.5 The users (your actors)

| Actor | Who they are | What they can do |
|---|---|---|
| **Visitor** | Anyone, not signed in | Browse the home page, use Food Safety, Nutrition Planner, Find a Vet, Care Guides, read Ask a Vet and the community wall |
| **Pet owner** | A registered user | Everything a visitor can, plus save, edit and delete pet profiles, keep a weight log and reminders for each pet, post to the wall, ask questions, change their password and delete their account |
| **Veterinary professional** | A registered user with a `vet_profiles` record | Everything an owner can, plus the Vet Console. Can only *answer* questions once verified |
| **Administrator** | A user whose `profiles.role` is `admin` | Everything an owner can, plus the Admin Panel: verify vets, moderate the wall, view registered accounts |

### 1.5.1 The critical design decision about user types

**A vet is a pet owner who also happens to be a vet.** There is one account
type, not two.

This matters and you will be asked about it. The alternative — separate owner
accounts and vet accounts — fails immediately on a real case: most veterinarians
own animals. Under a two-account model a vet would need two logins, or would
lose the nutrition planner and the food-safety checker for their own pets simply
because they ticked "professional" at signup.

So instead:

- Every tool is available to every signed-in user.
- Being a professional **adds** the Vet Console. It takes nothing away.
- The Vet Console appears when the user has a row in `vet_profiles`, not based
  on a role string.
- Being an administrator is a separate axis again (`profiles.role = 'admin'`).

The consequence is that **one account can be an owner, a vet and an
administrator simultaneously**, which falls naturally out of the model rather
than being a special case.

---

# Part 2 — The technology stack

## 2.1 The layers

```
┌──────────────────────────────────────────────────────────┐
│  BROWSER (the client)                                    │
│  Next.js 16 + React 19 + TypeScript + Tailwind CSS 4     │
│  Three.js + React Three Fiber (home page 3D)             │
│  Framer Motion for animation · Lenis for smooth scroll   │
│  Recharts for charts · Leaflet for maps                  │
└──────────────────────────────────────────────────────────┘
                          ↕ HTTPS
┌──────────────────────────────────────────────────────────┐
│  VERCEL (the application server)                         │
│  Serves pages, runs server components, hosts /api/vets   │
└──────────────────────────────────────────────────────────┘
                          ↕ HTTPS
┌──────────────────────────────────────────────────────────┐
│  SUPABASE (the database and authentication)              │
│  PostgreSQL + Row-Level Security + GoTrue auth           │
└──────────────────────────────────────────────────────────┘
                          ↕ HTTPS
┌──────────────────────────────────────────────────────────┐
│  OPENSTREETMAP (external data, no key, no account)       │
│  Overpass API for practices · tile server for the map    │
└──────────────────────────────────────────────────────────┘
```

## 2.2 Every dependency and why it is there

| Package | Version | Why |
|---|---|---|
| `next` | 16.2.9 | The framework. Routing, server rendering, bundling, the API route |
| `react` / `react-dom` | 19.2.4 | The UI library Next is built on |
| `typescript` | 5 | Types. Catches a whole class of bug before the code runs |
| `tailwindcss` | 4 | Styling without a separate stylesheet per component |
| `@supabase/supabase-js` | 2.108 | Talking to the database and authentication |
| `@supabase/ssr` | 0.12 | Supabase sessions that work with server rendering |
| `three` | 0.186 | The 3D feeding bowl on the home page |
| `@react-three/fiber` | 9.8 | Lets the home page's 3D scene be written as React components, with a per-frame loop that bypasses React |
| `@react-three/drei` | 10.7 | Ready-made helpers for that scene: studio lighting (`Environment`, `Lightformer`), rounded boxes, and `PerformanceMonitor` |
| `lenis` | 1.3 | Smooth wheel scrolling on the home page only; touch scrolling stays native |
| `framer-motion` | 12.42 | Page and element animation, and the reduce-motion switch |
| `recharts` | 3.9 | Charts on the dashboard, nutrition page and vet console |
| `leaflet` / `react-leaflet` | 1.9 / 5.0 | The map on Find a Vet |
| `lucide-react` | 1.21 | Icons |
| `sonner` | 2.0 | Toast notifications |
| `date-fns` | 4.4 | Date formatting |
| `clsx` / `tailwind-merge` | — | Combining CSS class names safely |

### 2.2.1 Dependencies that are installed but unused

Be honest about these if asked. `@fullcalendar/*`, `@tiptap/*`, `cmdk`,
`react-dropzone` and `shadcn` are present in `package.json` but no application
code imports them. They were inherited from the project this repository was
forked from. They do not affect the built output — Next.js only bundles what is
actually imported — but they do slow `npm install`.

## 2.3 Why these choices (use this in your feasibility study)

**Why Next.js rather than plain React?** Server rendering means the first page a
visitor sees is delivered as finished HTML rather than a blank page that then
fetches. File-based routing means the folder structure *is* the site map, which
makes the project easier for a team to navigate. It also gives us one place to
put a server-side API route, which we needed.

**Why Supabase rather than building a backend?** Authentication, a PostgreSQL
database, and row-level security in one managed service with a free tier. Writing
our own authentication would have consumed most of the project's time and would
have been less secure than a maintained implementation.

**Why PostgreSQL rather than a document database?** The data is relational —
owners have pets, questions have answers, vets have replies. Foreign keys and
constraints let the *database* enforce correctness rather than trusting every
piece of application code to remember.

**Why Tailwind?** Styles live next to the markup they style, so a component can
be understood in one place. No separate stylesheet to keep in sync.

**Why React Three Fiber on top of Three.js?** The home page's scene is a
scene graph, not a single object: a bowl, an instanced pile of kibble, seven
food models, an engraved ID tag, studio lighting, a floor and a camera rig, and
several of them respond to what the visitor types or chooses. Writing that as
components keeps each piece in its own file and lets it load inside React's
`Suspense`. The per-frame work still bypasses React entirely — see §9.2 — so
the wrapper costs nothing while the page animates. (The earlier particle-animal
landing page used Three.js directly, which suited a single object with a single
draw call; it was replaced, see Part 9.)

**Why OpenStreetMap rather than Google Maps?** No API key, no billing account, no
per-request cost, and the data is openly licensed. A student project cannot rely
on a service that requires a credit card.

---

# Part 3 — Repository map

Total application source: **12,900 lines** of TypeScript/TSX across `app/`,
`components/` and `lib/`.

## 3.1 Top level

```
demo-master/
├── app/                  Pages and routes
├── components/           Reusable interface pieces
├── lib/                  Logic with no user interface
├── public/               Static files served as-is
├── supabase/
│   └── schema.sql        The complete database definition
├── docs/                 This documentation
├── SETUP.md              How to deploy it from scratch
├── PROJECT-GUIDE.md      Earlier orientation guide
├── package.json          Dependencies and scripts
├── next.config.ts        Next.js configuration
├── tsconfig.json         TypeScript configuration
├── eslint.config.mjs     Linting rules
├── postcss.config.mjs    CSS pipeline (Tailwind)
└── proxy.ts              Runs before every request
```

### 3.1.1 A note on `proxy.ts`

In Next.js 16 the file that runs before every request is called `proxy.ts`. In
earlier versions it was `middleware.ts`. If you read a tutorial that mentions
`middleware.ts`, it was written for an older version. This is the kind of detail
that wastes an afternoon if nobody writes it down.

## 3.2 `app/` — the pages

Next.js uses **file-based routing**: the folder path becomes the URL.

| Path | URL | What it is |
|---|---|---|
| `app/page.tsx` | `/` | The public home page, "The Bowl" (365 lines; server-rendered sections) |
| `app/layout.tsx` | — | The shell wrapped around every page |
| `app/globals.css` | — | Design tokens, themes, shared styles |
| `app/auth/login/` | `/auth/login` | Sign in |
| `app/auth/signup/` | `/auth/signup` | Create an account (owner or professional) |
| `app/auth/forgot-password/` | `/auth/forgot-password` | Password reset request |
| `app/auth/callback/` | `/auth/callback` | Where Supabase returns after email confirmation |
| `app/setup/` | `/setup` | Connection diagnostics |
| `app/api/vets/route.ts` | `/api/vets` | Server-side veterinary practice lookup |
| `app/(dashboard)/dashboard/` | `/dashboard` | Signed-in overview |
| `app/(dashboard)/pets/` | `/pets` | Saved animals |
| `app/(dashboard)/pets/[id]/` | `/pets/<id>` | One pet: details, weight log, reminders (474 lines) |
| `app/(dashboard)/add-pet/` | `/add-pet` | Add an animal |
| `app/(dashboard)/nutrition/` | `/nutrition` | Feeding calculator |
| `app/(dashboard)/food-safety/` | `/food-safety` | Toxicity checker |
| `app/(dashboard)/wellness/` | `/wellness` | Guided health check |
| `app/(dashboard)/care-plan/` | `/care-plan` | Week-by-week plan |
| `app/(dashboard)/vet-finder/` | `/vet-finder` | Practice finder and map |
| `app/(dashboard)/ask/` | `/ask` | Ask a Vet |
| `app/(dashboard)/wall/` | `/wall` | Community wall |
| `app/(dashboard)/resources/` | `/resources` | Care guides |
| `app/(dashboard)/vet/` | `/vet` | **Vet Console** (828 lines) |
| `app/(dashboard)/admin/` | `/admin` | **Admin Panel** |
| `app/(dashboard)/settings/` | `/settings` | Account and appearance |

### 3.2.1 What the brackets mean

`(dashboard)` in parentheses is a **route group**. It groups pages so they can
share a layout — in this case the sidebar — *without* adding `/dashboard` to
every URL. `/nutrition` is the URL, not `/dashboard/nutrition`.

## 3.3 `lib/` — the logic

This folder contains everything that is pure logic with no interface. Keeping it
separate is what makes the system testable: these functions can be run and
checked without a browser.

| File | Lines | Responsibility |
|---|---|---|
| `food-safety.ts` | 771 | The 88-item toxicity database and its search |
| `vets.ts` | 267 | Practice lookup, distance maths, offline fallback |
| `guides.ts` | 219 | The 20 care guides (screens count this list rather than typing a number) |
| `nutrition.ts` | 216 | The feeding calculation |
| `types.ts` | 172 | Shared type definitions and species labels |
| `health.ts` | 112 | Pet-record helpers: per-species weight limits (`MAX_KG`), validation, due-date wording, the pre-filled planner link |
| `wellness.ts` | 73 | Wellness questions and scoring, including the red-flag answers |
| `storage.ts` | 137 | Reading and writing browser local storage safely |
| `supabase/client.ts` | — | Browser database client |
| `supabase/server.ts` | — | Server-side database client |
| `supabase/errors.ts` | 164 | Turning database errors into readable messages |
| `auth.ts` | 30 | Administrator check — trusts `app_metadata.role` or `profiles.role`, never the user-editable `user_metadata` |
| `use-client-value.ts` | — | Reading browser-only values without breaking server rendering |
| `vets-za.json` | — | 189 real practices, bundled for offline use |

## 3.4 `components/` — the interface pieces

| File | Lines | Responsibility |
|---|---|---|
| `landing/Landing.tsx` | 227 | Home page orchestrator: smooth scroll, scroll → scene time, quality tier, booting the 3D, the side chapter gauge |
| `landing/story.ts` | 80 | The one mutable object the 3D scene reads every frame (§9.2) |
| `landing/Portions.tsx` | 101 | The "Portion Facts" panel — runs `computePlan()` |
| `landing/FoodCheck.tsx` | 110 | The mini food check — runs `lookupFood()` and drops the food toward the bowl |
| `landing/JoinCard.tsx` | 44 | Closing sign-up card; the typed pet name is engraved on the 3D tag and stored nowhere |
| `landing/Headline.tsx` | 41 | Headlines whose words settle into place one by one |
| `landing/Photo.tsx` | 30 | Pre-optimised local photo with a blur placeholder and fixed size |
| `landing/SceneBoundary.tsx` | 25 | Error boundary: if the 3D fails, the page keeps its still poster |
| `landing/scene/BowlCanvas.tsx` | 164 | The WebGL canvas: lighting, quality settings, shader warm-up |
| `landing/scene/Bowl.tsx` | 58 | The glazed bowl (lathe geometry, speckled glaze shader) |
| `landing/scene/bowlShape.ts` | 101 | The bowl's profile, `innerRadiusAt()`, the seeded random generator and `packKibble()` |
| `landing/scene/Kibble.tsx` | 166 | All kibble as one instanced mesh, and the pour animation |
| `landing/scene/FoodDrop.tsx` | 162 | The food models and the safe / caution / toxic drop |
| `landing/scene/Tag.tsx` | 109 | The bone-shaped steel ID tag and its engraving |
| `landing/scene/Rig.tsx` | 95 | The camera choreography |
| `public/Navbar.tsx` | 162 | Top navigation for signed-out pages |
| `public/Logo.tsx` | 89 | The paw mark |
| `layout/DashboardSidebar.tsx` | 211 | Signed-in navigation |
| `layout/PageHeader.tsx` | 109 | Shared tool-page header: serif headline and a gram-scale ruler drawn in SVG (no 3D) |
| `layout/AppChrome.tsx` | — | Chooses sidebar or public navigation |
| `layout/PreferencesProvider.tsx` | 114 | Applies theme, accent, reduce-motion, high-contrast |
| `layout/MotionProvider.tsx` | — | Carries reduce-motion into Framer Motion |
| `VetMap.tsx` | 147 | The Leaflet map |
| `SiteEffects.tsx` | — | Scroll progress bar and cursor glow |
| `ui/*` | — | Generic building blocks: button, card, dialog, table, etc. |

---

# Part 4 — Every screen

For each screen: what a user sees, what they can do, where the data comes from,
and what happens when things go wrong.

## 4.1 Home page (`/`) — "The Bowl"

**Purpose.** Explain the product to someone who has never heard of it, and get
them to sign up.

**The idea.** Everything in caring for a pet passes through one feeding bowl.
The page is a short story told around a single 3D bowl: what goes in
(portions), what must never go in (food safety), then the paper side of care
(records, vets, community), and a name tag at the end. It replaced the earlier
particle-animal landing page; why is in `06-FINAL-REVIEW-FIXES.md` §7.

**How it is built.** `app/page.tsx` is a Server Component: every section's text
arrives as finished HTML. `components/landing/Landing.tsx` wraps those sections
in the browser and adds only what needs a browser — smooth scrolling, the
scroll-to-scene mapping, the 3D layer and, on wide screens, a side gauge that
lists the chapters and jumps to them.

**Chapters, in order:**

0. **The bowl (hero)** — headline "Feed them right. Keep them *safe.*", a
   sub-paragraph, two calls to action ("Add your pet" → sign-up, "See a
   portion" → chapter 1), and three figures, each counted from the code: foods
   and plants checked (`FOOD_DB.length`, currently 88), species in the planner
   (`SPECIES_CFG`, 6) and care guides (`GUIDE_COUNT`, 20).
1. **Portions** — one cited statistic (more than half of dogs in a US vet
   survey were overweight — APOP, 2018) and the **Portion Facts** panel, styled
   like the nutrition label on a bag of pet food. It runs the same
   `computePlan()` as `/nutrition` for a dog, cat or rabbit, and the 3D bowl
   fills with **one meal** of what it calculates. One visible piece stands for
   about 1.5 g, and the panel says so. A link opens the full planner pre-filled.
2. **Safe or not** — a miniature food check using the real `lookupFood()`. The
   food drops toward the bowl: safe food lands, "only a little" shrinks to a
   taste, toxic food is knocked off with a red flash of the rim. An item the
   database does not hold drops nothing, and the page says so.
3. **Records** (paper) — reminders, the weight log and the wellness check, beside
   an example pet page labelled "Example profile". It also says plainly that
   reminders show in the app and PetPal does not send emails.
4. **Vets** (paper) — OpenStreetMap practices sorted by distance, no invented
   ratings; a contour-map drawing labelled "Illustration"; links to Find a Vet
   and Ask a Vet.
5. **Together** (paper) — a photo grid, four tool cards (care guides, the
   four-week plan, wellness check, community) and a five-question FAQ.
6. **Join** — a sign-up card. Typing a pet's name engraves it live on a 3D
   steel ID tag. Nothing typed there is stored or sent; the account is created
   on `/auth/signup`.

Then the footer.

**Behind everything:** the 3D scene, fixed behind the page. It changes with
scroll position and pauses while an opaque paper section covers it. Part 9
explains it in full.

**Navigation bar.** Transparent over the opening scene, firms up once you
scroll, and on the home page slides out of the way while you scroll down and
returns the moment you scroll up. It has no backdrop blur on the home page,
because re-blurring a live WebGL canvas every frame was measurably expensive.

**Type and photography.** The public site has its own type: Newsreader (an
editorial serif, with italic accent words) for headlines, Archivo Black for the
label-style panels, and Geist Mono for read-outs. They are loaded in
`app/layout.tsx` as `--font-pp-*` variables, and the page's styles are scoped
under `.pp` in `globals.css`, so the signed-in app's type and colours are
unchanged. Eight licensed photographs (Unsplash and Pexels) are bundled as
pre-optimised WebP at 800 and 1600 px wide with a tiny blurred placeholder;
seven appear on the page. Each has its width and height set, so nothing shifts
as it loads. Credits are in `docs/image-credits.md`.

**Data source.** None stored. The Portion Facts panel and the food check run
the same `lib/` functions as the full tools; the sign-up card keeps nothing.

### 4.1.1 What was removed from the landing page, and why

Under NFR-19 (no invented data presented as real), the following were removed:
"Loved by 120,000+ pet parents", "4.9 avg rating" and "18k+ pets tracked" with
stock-photo faces; a whole Testimonials section of three invented quotes; the
unsourced "70% of owners miss a vaccine date"; and a hard-coded "742 kcal" in
the hero that contradicted the planner's own 740 for the same dog. The FAQ
answer about location was also corrected: it used to say the location was
"never sent to us", but it does pass through PetPal's server (`/api/vets`) to
OpenStreetMap for one search and is then discarded — the answer now says so.

Later, the particle-animal page itself was replaced by the current design, and
its code deleted: the 3D animals and the code that generated them, the small 3D
motif in every tool page header, and the old hero section. The full list is in
`06-FINAL-REVIEW-FIXES.md` §7. The testimonials did not come back: there are
still no testimonials, user counts or ratings anywhere on the page.

## 4.2 Sign up (`/auth/signup`)

**Two account kinds, chosen by a toggle:**

- **Pet owner** — email, password, display name.
- **Veterinary professional** — additionally requires full name and registration
  number, and optionally a practice name.

**What happens on submit:**

1. The form validates locally (password at least 8 characters; a professional
   must supply a name and registration number).
2. `supabase.auth.signUp()` is called with the details, and the role, practice
   name and registration number are attached as **user metadata**.
3. Supabase creates the account and sends a confirmation email; the link comes
   back through `/auth/callback`. If email confirmation is switched off in
   Supabase, `signUp()` returns a session straight away and the user is signed
   in directly rather than being told to check their email.
4. A **database trigger** (`handle_new_user`) creates the `profiles` row, and —
   if the metadata says `role = vet` — the `vet_profiles` row as well, with
   `verified = false`.

The page no longer carries the "Join 120,000+ pet parents" line, which was never
a measured figure.

### 4.2.1 Why the trigger, and not the client

This is one of the more instructive bugs in the project's history, and it is
worth putting in your documentation.

The original code inserted the `vet_profiles` row from the browser immediately
after `signUp()` returned. It failed **every single time**, silently.

The reason: with email confirmation enabled — Supabase's default — `signUp()`
returns a user object but **no session**. The user is not signed in yet. The
row-level security policy on `vet_profiles` is `with check (auth.uid() = id)`,
and with no session `auth.uid()` is `null`, so the insert was refused. The
account was created, the professional details were discarded, and the vet could
never be verified because there was no record to verify.

The fix was to move the insert into the `handle_new_user` trigger, which is
declared `SECURITY DEFINER` — it runs with the rights of the user who defined it,
so row-level security does not apply inside it and no session is needed.

**The lesson, generalised:** a client-side write that depends on a session cannot
run before the session exists.

## 4.3 Sign in (`/auth/login`)

Email and password against Supabase authentication. Errors are translated into
readable messages by `lib/supabase/errors.ts` — "Failed to fetch" becomes an
explanation that the database is unreachable, with a link to `/setup`.

**Forgot password** (`/auth/forgot-password`) sends a reset email whose link
passes through `/auth/callback` and lands the now signed-in user on **Settings →
Password & Privacy** (`/settings?tab=security`), where they set the new
password. Previously the link led to a page with no way to set one.

## 4.4 Setup check (`/setup`)

**Purpose.** Diagnose a broken deployment without reading logs.

It checks, in order, and reports each result:

1. Is `NEXT_PUBLIC_SUPABASE_URL` set?
2. Is `NEXT_PUBLIC_SUPABASE_ANON_KEY` set?
3. Does the URL have the right shape (`https://<ref>.supabase.co`)?
4. Does the Supabase project respond?
5. Is the key accepted?
6. Do all nine tables — `profiles`, `pets`, `pet_reminders`, `pet_weights`,
   `confessions`, `vet_profiles`, `vet_replies`, `questions`, `answers` — exist
   and answer a query? A missing one usually means the database was set up from
   an older copy and `supabase/schema.sql` needs running again.

This page exists because the single most common deployment failure is a missing
or malformed environment variable, and the symptom — "Failed to fetch" on sign in
— tells you nothing about the cause.

## 4.5 Dashboard (`/dashboard`)

The signed-in overview: greeting, the user's own pets, their upcoming and
overdue reminders (from `pet_reminders`), a weight-trend chart drawn from real
weigh-ins (`pet_weights` — a pet needs at least two before it is charted), and
quick links to the tools. A new account sees empty states and an "Add a pet"
prompt, nothing else.

It used to show two example pets, "Biscuit" and "Luna", a hard-coded weight
chart for Biscuit and invented reminders — to every user. That was removed under
NFR-19. Administrators are no longer redirected to `/admin` on arrival; they see
a link to it instead, so an administrator who also owns pets can use the
dashboard.

## 4.6 My Pets (`/pets`), Add a Pet (`/add-pet`) and the pet page (`/pets/<id>`)

**My Pets** lists the user's real pets only, each linking to its own page. The
earlier "On plan" and "Current" badges, which meant nothing, were removed.

**Add a Pet** captures name, species, breed, age, weight and sex (Male, Female
or "Not sure"). It validates before saving: a name of 1–40 characters, and if a
weight is given, a number above zero no larger than a plausible maximum for the
species (`MAX_KG` in `lib/health.ts` — for example 15 kg for a cat, 120 kg for a
dog), which catches a typo like "45" for a 4.5 kg cat. If the save fails it
reports the real error — it used to announce that the pet "has joined your
family!" even when nothing had been saved. A starting weight is also logged as
the first weigh-in, and the user is taken to the new pet's page.

**The pet page** (`app/(dashboard)/pets/[id]/page.tsx`) has three parts:

- **Details** — edit name, species, breed, age, sex; delete the pet after a
  confirmation step. Deleting cascades to its reminders and weigh-ins.
- **Weight log** — add a weigh-in (kg and date, not in the future), remove one,
  and a chart of the trend. The pet's current weight is kept equal to the latest
  entry by the `sync_pet_weight` trigger (§5.9).
- **Reminders** — add one with a type (vaccine, vet visit, medication,
  deworming, grooming, other), a 2–80 character title (left blank, the type's
  name is used) and a due date from today onwards; tick it done; delete it.
  Overdue reminders are marked.

There is also a **"Nutrition plan for <pet>"** link that opens the planner
pre-filled (`/nutrition?species=…&weight=…`). Fish and "other" get no link,
because the planner has no formula for them and a plan for the wrong animal
would be worse than none.

All of this is stored in `pets`, `pet_weights` and `pet_reminders`, visible only
to the owner, enforced by row-level security. Photos are not supported yet; the
`photo_url` column exists but nothing uploads to it.

## 4.7 Nutrition Planner (`/nutrition`)

**The single most technically substantial owner feature.** Full algorithm in
Part 8.1.

**Inputs:** species, weight, life stage, activity level, body condition.

**Outputs:** daily calorie target, dry food weight in grams, wet food weight,
number of meals, grams per meal, daily water, and a macronutrient profile.

**Source of truth.** `lib/nutrition.ts`, function `computePlan()`. The same
function powers the home page's Portion Facts panel, so the two can never
disagree.

**Interface details.** The weight slider steps by 0.1 kg for every species whose
range tops out at 15 kg or less, and 0.5 kg for dogs (range to 90 kg), so the
number displayed is the number calculated — a 0.25 kg step used to show "4.3 kg"
while calculating for 4.25. Switching species resets the slider to that
species' default weight rather than carrying a dog's weight over to a budgie.
Activity hints are worded for any species ("Mostly resting or confined", "Daily
exercise and play", "Working, sporting or very active"). The page can be opened
pre-filled from a pet's page via `?species=` and `?weight=`.

## 4.8 Food Safety (`/food-safety`)

**Purpose.** Answer "can my animal eat this?" in one search.

**Data.** 88 curated entries in `lib/food-safety.ts`. Each carries: the item
name, aliases, a verdict (safe / caution / toxic), which species it applies to,
the clinical reason, and what to do. Counts shown anywhere in the app are
computed from `FOOD_DB.length`, so they cannot go stale.

**Two content corrections.** There used to be 89 entries: plain "peanut
butter" was rated *safe* while "xylitol free peanut butter" — the safer product
— was rated *caution*. They are now one *caution* entry covering all nut
butters, because some brands contain xylitol, which is lethal to dogs. And the
alias "weed" was removed from the cannabis entry, so "my dog ate a weed" no
longer produces a cannabis-poisoning emergency.

**The matching algorithm** is described in Part 8.2, and it is worth reading —
it was the source of the single worst bug in the project's history, where
searching "chicken" returned **TOXIC**.

## 4.9 Wellness Check (`/wellness`)

Eight guided questions — energy, appetite, body shape, coat and skin, exercise,
vaccinations and vet checks, mood, and toilet habits. Produces a score out of
100, a verdict, and a "Worth looking at" list of the areas that scored low.
Results are not saved. The questions and rules live in `lib/wellness.ts`; see
§8.4 for the scoring, including the red-flag answers that mean "See a vet"
whatever the score.

## 4.10 Care Plan (`/care-plan`)

A week-by-week checklist for the first four weeks with a new animal, with
separate tracks for puppies and kittens. Progress is stored in browser local
storage.

## 4.11 Find a Vet (`/vet-finder`)

**Purpose.** Show real veterinary practices near the user.

**How it works:**

1. The browser asks for the user's location. If refused, it falls back to
   Johannesburg and says so.
2. It calls `/api/vets` — **this application's own server**, not OpenStreetMap
   directly.
3. That route queries the Overpass API, trying four mirrors in turn.
4. Results are parsed into practice records, sorted by straight-line distance.
5. The page shows a list and a Leaflet map.

**What it deliberately does not show.** Ratings. Star scores. "Recommended"
badges. The footnote says so explicitly: *PetPal does not rank, rate or endorse
individual practices.* If OpenStreetMap does not hold a phone number, no Call
button appears — rather than a placeholder.

### 4.11.1 Two production failures worth documenting

**CORS.** The browser used to call Overpass directly. Overpass stopped returning
`Access-Control-Allow-Origin` headers, so the browser blocked every response and
the feature failed 100% of the time. Cross-origin restrictions are enforced by
*browsers*, not servers, so moving the call to our own server removed the problem
entirely. This is why `/api/vets` exists.

**Upstream outage.** Overpass is a donated public service. On one occasion all
four mirrors returned HTTP 504 or timed out within the same minute, from two
different networks. A core feature was therefore down for reasons entirely
outside this application. The fix was to bundle a 19KB extract of the 189 real
veterinary practices OpenStreetMap holds for South Africa. Live data is still
tried first; the extract is only reached when every mirror fails, and the page
then states plainly that it is showing a saved copy from a given date.

## 4.12 Ask a Vet (`/ask`)

The two-sided feature. Owners post a question (title, body, species). Verified
veterinary professionals answer. Questions and answers are public so the archive
is useful to everyone.

Posting a question requires an account. Answering requires a **verified**
professional account, and that gate is enforced in the database, not only in the
interface — see Part 10.3.

**A defect worth documenting.** Answers used to vanish on reload. The query
asked Supabase to embed `vet_profiles` inside each answer, but there is no
foreign key between `answers` and `vet_profiles` (both point at `auth.users`),
so the request failed — and the error was ignored, leaving an empty list. It is
now two queries: the answers, then the vets' names by id, joined in the browser.

**Availability.** The page shows how many verified vets are currently "taking
questions" — the switch in the Vet Console — so an owner knows whether anyone is
likely to answer soon.

**When the database is unreachable,** example questions are shown, labelled as
examples, and posting is disabled. The example answers carry no invented
doctors' names, no real practices' names and no "Verified vet" badge — an
example must not look like a real professional's advice.

## 4.13 Community Wall (`/wall`)

Anonymous posts with a mood tag and a heart count. No names, no profiles. Hearts
are incremented through a database function rather than a direct update, for the
reason given in Part 10.4.

Example posts appear only when the database is unreachable, and then posting and
hearts are disabled. A live wall with no posts shows an empty state rather than
being padded with examples.

## 4.14 Care Guides (`/resources`)

20 written guides, in `lib/guides.ts`, covering new arrivals, food labels,
training, grooming, vaccination, body language, senior care, first aid, toxic
foods, weight, dental care, microchipping, travel, separation anxiety,
socialisation, exercise, insurance, small pets and exotics, end of life, and
fleas, ticks and worms. Filterable by category. There were 21, but "Parasite
Prevention" repeated "Fleas, Ticks and Worms" and they were merged. Every count
of guides in the app is computed from the list.

## 4.15 Vet Console (`/vet`) — professionals only

**828 lines, the largest single page in the project.** Appears in the sidebar
only when the signed-in user has a `vet_profiles` row.

**Status strip.** Verification state, queue count, answers given, and an
availability toggle so a vet on leave can step out of the queue without deleting
anything.

**Four tabs:**

1. **Queue** — unanswered questions, searchable and filterable by species, each
   with the full question body and an inline composer. Answering happens here
   rather than on another screen. A bar chart shows what is waiting, by species,
   counted from the actual queue.
2. **My answers** — the professional's own history, each answer shown with the
   question it replied to.
3. **Saved replies** — the vet's own reusable text. The paragraph written for the
   twentieth time about post-operative feeding gets written once. They appear as
   one-click buttons above the composer on every question, ordered by how often
   each is used. Private to the author.
4. **Profile** — full name, practice, city, specialities and biography, all
   editable. The registration number is deliberately read-only: it is what
   verification is checked against, so it belongs to an administrator.

**Unverified professionals** see the queue and a plain explanation of why they
cannot answer yet, rather than a composer that would fail.

## 4.16 Admin Panel (`/admin`) — administrators only

Four tabs: Overview, Community, Vets, Accounts. Everything on it is live data.

**Overview.** Four counts the system can actually take: registered accounts,
community posts, verified vets, awaiting verification. Two charts: new accounts
in the last 14 days (from `profiles.created_at`) and Ask a Vet questions by
species, answered versus waiting.

**Community.** Moderate the wall; remove posts. The screen reports "removed"
only once the database confirms it. Before the schema gained an admin delete
policy, removal was silently refused while the screen said it had worked, and
the post came back on the next refresh.

**Vets.** Every registered professional with their practice, registration number
and status. **Verify** and **Revoke** write to the database. A registration
number used by more than one account is flagged on each row — "Same number as
another account — check before verifying". It is deliberately not blocked at
sign-up: a unique rule would make the second sign-up fail inside the trigger,
and Supabase would show that person only "Database error saving new user".

**Accounts.** Name, email, role and join date. (This tab used to be labelled
"Pet Owners", which was wrong — it lists every account.)

**What was removed.** The screen previously carried a "demonstration data"
banner over invented charts — sign-ups of up to 740 a day, 6,200 dogs — none of
which came from the database.

**Who can open it.** `lib/auth.ts` treats a user as an administrator only if
`app_metadata.role` (settable only on the server) or `profiles.role` (which users
cannot change — see §10.7) is `admin`. It used to accept `user_metadata.role`
too, which any signed-in user can set for themselves with one line in the
browser console. The database would still have refused their writes, but the
screen should not claim access the user does not have.

Pet records are deliberately **not** shown. Pets are personal data restricted to
their owner by row-level security, and running an administration screen does not
require seeing what animals somebody keeps.

## 4.17 Settings (`/settings`)

Four tabs: Profile, Password & Privacy, Appearance, Account.

**Profile** — display name, saved to both the login's metadata and `profiles`
(it used to update only the first, so the admin screen showed the old name).
Shows the real join date and the real number of pets.

**Password & Privacy** — change password (at least 8 characters, typed twice).
This is where the forgot-password email lands.

**Account** — sign out other sessions, and **delete account**: the user types
`DELETE` to enable the button, and it calls the `delete_my_account()` database
function (§5.9), which really removes the account. Before, the button said it
was "disabled in demo mode".

**Removed, because they were untrue or did nothing:** "Member since June 2026 ·
2 pets" (invented), "Last changed 3 months ago", a claim of "zero-knowledge
encryption" (PetPal does not do this), an unsaved bio field, and switches for
two-factor authentication, notifications, public profile, data sharing and
anonymous mode, none of which were connected to anything.

**Appearance** is the substantial one:

- **Theme** — system, light or dark. "System" follows the operating system and
  keeps following it.
- **Accent colour** — six choices, applied live across the entire interface.
- **Reduce motion** — genuinely stops the animations.
- **High contrast** — lifts muted text and strengthens borders.

---

# Part 5 — The database

## 5.1 Overview

**Nine tables, seven functions, four triggers, seven indexes, 32 row-level
security policies.** All defined in `supabase/schema.sql`, which is idempotent:
every statement uses `if not exists` or `drop ... if exists` first, so running
it twice repairs a partial setup rather than failing. That is also how an
existing database is upgraded: re-run the whole file.

```
auth.users  (managed by Supabase)
    │
    ├──1:1──▶ profiles          who you are, and your role
    │             │
    │             └──1:0..1──▶ vet_profiles    professional details
    │                              │
    │                              └──1:many──▶ vet_replies   saved text
    │
    ├──1:many──▶ pets           your animals
    │              │
    │              ├──1:many──▶ pet_reminders   dated reminders
    │              └──1:many──▶ pet_weights     weigh-ins
    │
    ├──1:many──▶ questions      questions you asked
    │
    └──1:many──▶ answers        answers you gave (as a vet)

questions ──1:many──▶ answers

confessions                     anonymous, belongs to nobody
```

(`pet_reminders` and `pet_weights` also carry an `owner_id` referencing
`auth.users`; §5.11 explains why.)

## 5.2 Table: `profiles`

One row per registered user, created automatically by a trigger on sign-up.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key, references `auth.users`, cascades on delete |
| `email` | text | Copied from the account |
| `display_name` | text | Defaults to "Pet Parent" |
| `avatar_url` | text | Optional |
| `role` | text | `user`, `vet` or `admin`, enforced by a check constraint. **Users cannot change it** |
| `created_at` | timestamptz | Defaults to now |

**Policies (4):** read own, update own, insert own (only with `role = 'user'`),
and *admin reads all*.

**Column grants.** The "update own" policy decides *which row* a user may
change; column-level grants decide *which columns*. Signed-in users may update
only `display_name` and `avatar_url`. Before this, a user could run
`update profiles set role = 'admin' where id = auth.uid()` from the browser
console, and `is_admin()` would have believed it.

## 5.3 Table: `pets`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key, generated |
| `owner_id` | uuid | References `auth.users`, cascades |
| `name` | text | Required; 1–40 characters once trimmed |
| `species` | text | One of nine values, enforced |
| `breed` | text | Optional |
| `age` | text | Free text — owners rarely know an exact date |
| `weight` | numeric | If present, greater than zero and at most 200. The *current* weight — kept equal to the latest `pet_weights` entry by a trigger |
| `sex` | text | `male`, `female` or `unknown` |
| `photo_url` | text | Optional; nothing uploads to it yet |
| `created_at` | timestamptz | |

**Index:** `(owner_id, created_at desc)` — the dashboard always filters by owner
and sorts by date.

**Policies (4):** the owner may read, insert, update and delete their own rows.
Nobody else can see them at all.

The name-length and 200 kg checks are added `not valid`: they apply to every new
or edited row without failing on rows written before they existed.

## 5.3a Table: `pet_reminders`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key, generated |
| `pet_id` | uuid | Required; references `pets`, cascades |
| `owner_id` | uuid | Required; references `auth.users`, cascades |
| `kind` | text | `vaccine`, `vet_visit`, `medication`, `deworming`, `grooming` or `other`; defaults to `other` |
| `title` | text | 2–80 characters once trimmed |
| `due_on` | date | Required |
| `done` | boolean | Defaults false |
| `created_at` | timestamptz | |

**Index:** `(owner_id, done, due_on)` — the dashboard asks for one owner's
unfinished reminders in date order.

**Policies (4):** the owner may read, insert, update and delete. Insert and
update also require that the pet belongs to the same owner — otherwise a user
could hang a reminder off somebody else's pet id.

## 5.3b Table: `pet_weights`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key, generated |
| `pet_id` | uuid | Required; references `pets`, cascades |
| `owner_id` | uuid | Required; references `auth.users`, cascades |
| `weight_kg` | numeric | Required; greater than 0, at most 200 |
| `measured_on` | date | Defaults to today; may not be in the future (the check allows one day for time-zone differences; the form refuses any future date) |
| `created_at` | timestamptz | |

**Index:** `(pet_id, measured_on)` — the chart reads one pet's entries in date
order.

**Policies (3):** the owner may read, insert and delete; insert requires the pet
to belong to the same owner. There is no update policy — a wrong entry is
removed and re-entered.

## 5.4 Table: `confessions` (the community wall)

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `text` | text | Between 10 and 280 characters |
| `mood` | text | `happy`, `proud`, `help` or `sad` |
| `hearts` | int | Must be zero or greater |
| `created_at` | timestamptz | |

**Policies (3):** anyone may read; anyone may insert, but only with
`hearts = 0` (otherwise a crafted request could publish a post claiming
thousands of hearts); **only an administrator may delete**. There is
deliberately **no update policy** — see Part 10.4.

The table is still named `confessions` because that is the name the deployed
application queries. Renaming it would require a code change and a data
migration, so it is left alone on purpose.

## 5.5 Table: `vet_profiles`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key, references `auth.users` |
| `full_name` | text | Required |
| `practice_name` | text | Optional |
| `city` | text | Optional |
| `country` | text | Defaults to South Africa |
| `registration_no` | text | Checked against the register by an administrator |
| `specialities` | text | Optional |
| `bio` | text | Optional |
| `verified` | boolean | Defaults **false** |
| `accepting` | boolean | Defaults true — whether they are taking questions |
| `created_at` | timestamptz | |

**Policies (4):** anyone may read (professional details appear beside answers);
the vet may insert their own row **only with `verified = false`**, and update
their own row; an administrator may update any row — which is what makes the
Verify button work.

**Trigger.** `guard_vet_profile` (§5.9) stops anyone but an administrator from
changing `verified` or `registration_no`. Without it, a vet could verify
themselves through the "update own row" policy, or be verified under one
registration number and then swap it for another.

**Shared registration numbers are not blocked** (there is no unique index):
blocking one inside the sign-up trigger would make the second person's sign-up
fail with "Database error saving new user". The Admin Panel flags them instead.

## 5.6 Table: `vet_replies`

A professional's private saved replies.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `vet_id` | uuid | References `auth.users`, cascades |
| `title` | text | 2–80 characters |
| `body` | text | 20–2000 characters |
| `uses` | int | How many times inserted; orders the list |
| `created_at` | timestamptz | |

**Policies (4):** the author may read, insert, update and delete. **Nobody else
can read them at all** — a half-written draft is not something an owner should
ever see.

## 5.7 Table: `questions`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `asker_id` | uuid | Who asked |
| `title` | text | 10–140 characters |
| `body` | text | 20–1200 characters |
| `species` | text | One of eight values |
| `resolved` | boolean | Defaults false; the author marks it done |
| `answer_count` | int | Maintained by a trigger, not by the client |
| `created_at` | timestamptz | |

**Policies (3):** anyone may read; a signed-in user may insert their own, but
only with `answer_count = 0` and `resolved = false`; the author may update their
own. Column grants limit that update to **`resolved` only** — otherwise an author
could rewrite `answer_count`, or reword a question a vet has already answered so
the answer no longer fits it.

## 5.8 Table: `answers`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `question_id` | uuid | Which question |
| `vet_id` | uuid | Which professional |
| `body` | text | 20–2000 characters |
| `created_at` | timestamptz | |

**Policies (3):** anyone may read; **only a verified vet may insert**; the author
may update their own — and column grants limit that to **`body` only**, because
moving an answer to a different question would leave both questions'
`answer_count` wrong.

## 5.9 The functions

**`handle_new_user()`** — `SECURITY DEFINER`, triggered after insert on
`auth.users`. Creates the `profiles` row with the correct role, and the
`vet_profiles` row when the metadata says the account is professional.

**`increment_hearts(cid uuid)`** — `SECURITY DEFINER`. Adds one heart to a
community post. Exists so that no update policy is needed on `confessions`.

**`is_admin()`** — `SECURITY DEFINER`, `stable`. Returns whether the caller is an
administrator.

**`bump_answer_count()`** — `SECURITY DEFINER`, trigger function. Keeps
`questions.answer_count` correct. Covered in §5.10.

**`sync_pet_weight()`** — `SECURITY DEFINER`, trigger function, after insert or
delete on `pet_weights`. Sets `pets.weight` to the latest entry (by
`measured_on`, then `created_at`). If the last entry is deleted, the pet keeps
the weight it had. Keeping this in the database means no screen can update the
log and forget the profile, or the other way round.

**`guard_vet_profile()`** — `SECURITY DEFINER`, trigger function, before update
on `vet_profiles`. Raises an error if anyone other than an administrator changes
`verified` or `registration_no`. It lets through calls with no signed-in user
(`auth.uid()` is null), which only happen from the SQL Editor or the service
role — both already trusted.

**`delete_my_account()`** — `SECURITY DEFINER`, called from Settings. The
browser cannot remove a login itself, so this deletes the caller's own
`auth.users` row and nobody else's (it refuses if no one is signed in, and only
signed-in users may execute it). Everything keyed to the user cascades: profile,
pets — and with them their reminders and weigh-ins — vet profile and saved
replies. Questions and answers stay in the public archive with the author
detached, because their foreign keys are `on delete set null`.

Four of these are attached to triggers: `handle_new_user()` on `auth.users`,
`sync_pet_weight()` on `pet_weights`, `guard_vet_profile()` on `vet_profiles`,
and `bump_answer_count()` on `answers`. The other three are called directly.

### 5.9.1 Why `is_admin()` must be a function

A policy **on** `profiles` that itself runs `select ... from profiles` recurses
infinitely: Postgres applies the policy to the subquery, which applies the policy
again, and so on. `SECURITY DEFINER` runs the lookup with the definer's rights,
so row-level security does not apply inside it and the recursion never begins.

## 5.10 The trigger on answers

`bump_answer_count()` keeps `questions.answer_count` correct without a round trip
from the client. It increments on insert and decrements on delete, and it is
declared `security definer` with `search_path` pinned to `public`.

## 5.11 Normalisation

The schema is in **Third Normal Form**.

- **1NF** — every column holds a single atomic value. No comma-separated lists.
- **2NF** — every non-key column depends on the whole key. All tables use a
  single-column primary key, so there are no partial dependencies.
- **3NF** — no non-key column depends on another non-key column. A vet's
  practice name lives in `vet_profiles`, not copied onto every answer they write.

**One deliberate denormalisation:** `questions.answer_count`. Strictly it is
derivable by counting rows in `answers`, which makes it redundant. It is stored
because the question list would otherwise need a count subquery per row on every
page load. It is kept correct by a database trigger, not by application code — so
it cannot drift when a client forgets to update it.

**Two more, introduced with the health records:**

- `pets.weight` repeats the latest `pet_weights` entry. It is stored so the pet
  list and planner link do not need the whole log, and the `sync_pet_weight`
  trigger keeps it correct.
- `pet_reminders.owner_id` and `pet_weights.owner_id` could be found through the
  pet, which strictly is a transitive dependency. They are stored so the
  row-level security rule is a direct `auth.uid() = owner_id` comparison rather
  than a join on every read, and the write policies check that they match the
  pet's real owner when the row is written.

State this in your documentation. Recognising a denormalisation and justifying it
scores better than pretending it is not there.

---

# Part 6 — How data moves

These descriptions map directly onto the data-flow diagrams your Analysis phase
needs.

## 6.1 Context diagram (Level 0)

```
    ┌──────────┐                                 ┌──────────────┐
    │   Pet    │──── details, questions ────────▶│              │
    │  Owner   │◀─── plans, verdicts, answers ───│              │
    └──────────┘                                 │              │
                                                 │    PetPal    │
    ┌──────────┐                                 │    System    │
    │   Vet    │──── answers, profile ──────────▶│              │
    │(verified)│◀─── question queue ─────────────│              │
    └──────────┘                                 │              │
                                                 │              │
    ┌──────────┐                                 │              │
    │  Admin   │──── verification decisions ────▶│              │
    └──────────┘◀─── accounts, posts ────────────│              │
                                                 └──────────────┘
                                                    ▲         │
                                    practice records│         │location
                                                    │         ▼
                                              ┌──────────────────┐
                                              │  OpenStreetMap   │
                                              └──────────────────┘
```

## 6.2 Level 1 — the main processes

| # | Process | Input | Output | Stores touched |
|---|---|---|---|---|
| 1.0 | Manage account | credentials | session | profiles, vet_profiles |
| 2.0 | Manage pets and health records | pet details, weigh-ins, reminders | pet list, weight trend, due and overdue reminders | pets, pet_weights, pet_reminders |
| 3.0 | Calculate feeding plan | species, weight, stage, activity, condition | calories, grams, meals | none |
| 4.0 | Check food safety | search text, species | verdict, reason, action | none |
| 5.0 | Find veterinary practice | coordinates | ranked practice list | none (external) |
| 6.0 | Run wellness check | eight answers | score, verdict | none |
| 7.0 | Ask and answer | question, answer | public thread | questions, answers |
| 8.0 | Post to community | text, mood | wall entry | confessions |
| 9.0 | Manage professional profile | profile fields, replies | saved profile | vet_profiles, vet_replies |
| 10.0 | Administer | verification decision, post removal | updated status, live counts and charts | vet_profiles, profiles, confessions, questions |

Note that processes 3.0, 4.0, 5.0 and 6.0 touch **no data store**. They are pure
calculations over inputs. This is worth stating: it means those features work
without an account and without a database, which is why the application degrades
gracefully when Supabase is unreachable.

## 6.3 Level 2 — Process 3.0, Calculate Feeding Plan

```
species ──┐
weight  ──┼──▶ [3.1 Validate inputs] ──▶ [3.2 Compute RER] ──┐
stage   ──┤          │                    70 × kg^0.75       │
activity──┤          │                                       ▼
condition─┘          │                         [3.3 Apply multipliers]
                     │                          activity × stage
                     ▼                          × species × condition
              clamp to species range                   │
                                                       ▼
                                              [3.4 Derive portions]
                                               calories ÷ density
                                                       │
                                                       ▼
                                          calories, grams, meals, water
```

## 6.4 Sequence — a professional answers a question

```
Vet            Browser          Vercel        Supabase
 │                │                │              │
 │ opens /vet     │                │              │
 │───────────────▶│                │              │
 │                │ getUser()      │              │
 │                │───────────────────────────────▶│
 │                │◀────────────── session ────────│
 │                │ select vet_profiles where id=me│
 │                │───────────────────────────────▶│
 │                │◀────────────── profile ────────│
 │                │ select questions where count=0 │
 │                │───────────────────────────────▶│
 │                │◀────────────── queue ──────────│
 │ types answer   │                │              │
 │───────────────▶│                │              │
 │ clicks Post    │ insert answers │              │
 │───────────────▶│───────────────────────────────▶│
 │                │                │   RLS checks: verified vet?
 │                │                │   trigger: bump_answer_count
 │                │◀───────────── inserted row ────│
 │◀── moved out of queue, into My answers          │
```

## 6.5 Sequence — finding a vet, including both failure paths

```
Browser              /api/vets            Overpass mirrors
   │                     │                       │
   │ GET ?lat&lng&radius │                       │
   │────────────────────▶│                       │
   │                     │ POST query ──────────▶│ mirror 1
   │                     │◀─── 504 ──────────────│
   │                     │ POST query ──────────▶│ mirror 2
   │                     │◀─── timeout ──────────│
   │                     │ POST query ──────────▶│ mirror 3
   │                     │◀─── timeout ──────────│
   │                     │ POST query ──────────▶│ mirror 4
   │                     │◀─── timeout ──────────│
   │                     │
   │                     │ in South Africa?  ──▶ bundled extract
   │◀── practices + stale:true, extracted date ──│
   │
   │ page shows results AND a banner saying it is a saved copy
```

---

# Part 7 — Requirements

## 7.1 Functional requirements

Written in the form a marker expects: numbered, testable, unambiguous.

### Account management

| ID | Requirement |
|---|---|
| FR-01 | The system shall allow a visitor to create an account with an email address and a password of at least 8 characters |
| FR-02 | The system shall allow an applicant to register as a veterinary professional, requiring a full name and a registration number |
| FR-03 | The system shall create a profile record automatically when an account is created |
| FR-04 | The system shall create a professional record automatically when the account is registered as a professional, with verification set to false |
| FR-05 | The system shall allow a registered user to sign in and sign out |
| FR-06 | The system shall allow a user to request a password reset by email |
| FR-07 | The system shall allow a user to sign out all other sessions |

### Pet management

| ID | Requirement |
|---|---|
| FR-08 | The system shall allow a signed-in user to create a pet profile with name, species, breed, age, weight and sex |
| FR-09 | The system shall allow a user to view only their own pets |
| FR-10 | The system shall allow a user to edit and delete their own pets |
| FR-11 | The system shall reject a pet weight that is zero or negative |
| FR-12 | The system shall reject a species outside the permitted list |

### Nutrition

| ID | Requirement |
|---|---|
| FR-13 | The system shall calculate a daily calorie target from species, weight, life stage, activity level and body condition |
| FR-14 | The system shall convert the calorie target into dry food weight, wet food weight, meal count and grams per meal |
| FR-15 | The system shall state the daily water requirement |
| FR-16 | The system shall constrain weight input to a plausible range for the selected species |
| FR-17 | The system shall produce identical results on the home page's Portion Facts panel and the full planner |

### Food safety

| ID | Requirement |
|---|---|
| FR-18 | The system shall allow a user to search for a food, plant or household substance |
| FR-19 | The system shall return a verdict of safe, caution or toxic |
| FR-20 | The system shall state the clinical reason for the verdict |
| FR-21 | The system shall state what the owner should do |
| FR-22 | The system shall indicate which species the verdict applies to |
| FR-23 | The system shall not return a verdict for an item it does not hold |

### Veterinary practice finder

| ID | Requirement |
|---|---|
| FR-24 | The system shall request the user's location and fall back to a stated default if refused |
| FR-25 | The system shall list real veterinary practices within a defined radius, sorted by distance |
| FR-26 | The system shall display practices on an interactive map |
| FR-27 | The system shall display only details the data source actually holds |
| FR-28 | The system shall not display ratings or rankings for any practice |
| FR-29 | The system shall serve bundled practice data when the live source is unavailable, and state that the data is a saved copy with its date |

### Ask a Vet

| ID | Requirement |
|---|---|
| FR-30 | The system shall allow a signed-in user to post a question with a title, body and species |
| FR-31 | The system shall allow only a verified veterinary professional to post an answer |
| FR-32 | The system shall display questions and answers publicly |
| FR-33 | The system shall display a verification badge beside a verified professional's answer |
| FR-34 | The system shall maintain an accurate answer count for each question |

### Vet console

| ID | Requirement |
|---|---|
| FR-35 | The system shall present a professional with the questions that have no answers |
| FR-36 | The system shall allow a professional to search and filter that queue by species |
| FR-37 | The system shall allow a verified professional to answer from within the console |
| FR-38 | The system shall allow a professional to create, use and delete private saved replies |
| FR-39 | The system shall allow a professional to mark themselves as not taking questions |
| FR-40 | The system shall allow a professional to edit their practice, city, specialities and biography |
| FR-41 | The system shall prevent a professional from editing their own registration number |

### Administration

| ID | Requirement |
|---|---|
| FR-42 | The system shall allow an administrator to view all registered professionals |
| FR-43 | The system shall allow an administrator to grant and revoke verification |
| FR-44 | The system shall allow an administrator to view registered accounts |
| FR-45 | The system shall allow an administrator to remove a community post |
| FR-46 | The system shall not expose pet records to administrators |

### Appearance and accessibility

| ID | Requirement |
|---|---|
| FR-47 | The system shall offer light, dark and system-following themes |
| FR-48 | The system shall apply a user-chosen accent colour across the interface |
| FR-49 | The system shall provide a reduce-motion setting that stops animation |
| FR-50 | The system shall provide a high-contrast setting |

### Health records and account (added with the pet page)

Numbered on from FR-50 rather than slotted into the groups above, so that every
earlier reference to FR-01 to FR-50 stays correct.

| ID | Requirement |
|---|---|
| FR-51 | The system shall reject a pet weight above a plausible maximum for the selected species |
| FR-52 | The system shall allow a user to record dated weigh-ins for their own pet, and shall reject a date in the future |
| FR-53 | The system shall chart a pet's weight trend once at least two weigh-ins exist, and keep the pet's current weight equal to its latest weigh-in |
| FR-54 | The system shall allow a user to create, complete and delete reminders for their own pet, each with a type, a title and a due date no earlier than today |
| FR-55 | The system shall show the user's upcoming and overdue reminders on the dashboard |
| FR-56 | The system shall allow a signed-in user to change their password |
| FR-57 | The system shall allow a signed-in user to delete their own account and personal data, after typing a confirmation word |
| FR-58 | The system shall flag, to an administrator, a registration number used by more than one professional account |

## 7.2 Non-functional requirements

| ID | Category | Requirement |
|---|---|---|
| NFR-01 | Performance | A page shall be interactive within 3 seconds on a mid-range mobile device over 4G |
| NFR-02 | Performance | The 3D layer shall not delay or freeze the page: text renders first, the scene loads afterwards, and every shader is compiled before the scene is shown |
| NFR-03 | Performance | The 3D scene's cost shall scale with the device: pixel ratio, kibble count, shadows and anti-aliasing are set by a quality tier, and the pixel ratio drops under load |
| NFR-04 | Security | All traffic shall be over HTTPS |
| NFR-05 | Security | A user shall be able to read only their own pets and profile |
| NFR-06 | Security | Access control shall be enforced by the database, not only the interface |
| NFR-07 | Security | Passwords shall never be stored by the application |
| NFR-08 | Security | The service-role key shall never be exposed to the browser |
| NFR-09 | Reliability | The application shall remain usable when the database is unreachable, for features that do not need it |
| NFR-10 | Reliability | The practice finder shall survive failure of its external data source |
| NFR-11 | Usability | Every destructive action shall require confirmation |
| NFR-12 | Usability | Every failure shall produce a message stating what went wrong and what to do |
| NFR-13 | Accessibility | The interface shall be usable at 200% zoom |
| NFR-14 | Accessibility | Animation shall be suppressible by setting or by operating-system preference |
| NFR-15 | Accessibility | Colour shall not be the sole carrier of meaning |
| NFR-16 | Portability | The application shall work on current Chrome, Firefox, Safari and Edge |
| NFR-17 | Portability | The interface shall be usable from 375px to 2560px wide |
| NFR-18 | Maintainability | All code shall pass TypeScript strict checking and ESLint with no errors |
| NFR-19 | Integrity | The system shall never display invented data as though it were real |

### 7.2.1 On NFR-19

This is an unusual requirement to write down, and it is the most important one in
the list. Several features in this project originally displayed fabricated
information: nine invented veterinary clinics with invented ratings and a single
made-up phone number; four invented clinics on the admin screen with an approve
button that changed nothing; four invented user accounts; growth statistics
computed from no data; and a food-safety bug that returned TOXIC for chicken.
A later audit found more: example pets, a hard-coded weight chart and invented
reminders on every user's dashboard; a "demonstration data" admin overview;
"120,000+ pet parents", a "4.9 rating" and three invented testimonials on the
landing page; and settings switches that saved nothing.

Every one of those has been removed. The principle that replaced them is simple
and worth stating in a viva: **where the system does not know something, it says
so.** A missing phone number shows no Call button. An unreachable directory shows
an honest error. A count that cannot be taken is not displayed.

## 7.3 Use cases

### UC-01 Calculate a feeding plan

- **Actor:** Pet owner (account not required)
- **Precondition:** None
- **Main flow:** Open Nutrition Planner → select species → set weight → select
  life stage → select activity → select body condition → read results
- **Postcondition:** Calorie target and portions displayed
- **Alternative:** Weight outside the species range → slider constrains it

### UC-02 Check whether a food is safe

- **Actor:** Pet owner (account not required)
- **Main flow:** Open Food Safety → type item → read verdict, reason and action
- **Alternative:** Item not in the database → system states it has no entry
  rather than guessing

### UC-03 Answer a question as a verified professional

- **Actor:** Veterinary professional
- **Precondition:** Signed in, has a `vet_profiles` row, `verified = true`
- **Main flow:** Open Vet Console → Queue → optionally filter → write answer,
  optionally inserting a saved reply → post
- **Postcondition:** Answer stored, `answer_count` incremented, item leaves the
  queue
- **Alternative:** Not verified → composer is not shown, with explanation

### UC-04 Verify a professional

- **Actor:** Administrator
- **Precondition:** `profiles.role = 'admin'`
- **Main flow:** Open Admin Panel → Vets → check registration number against the
  register → click Verify
- **Postcondition:** `verified = true`; the professional may now answer
- **Alternative:** Write refused → row rolls back and the error is reported

---

# Part 8 — The algorithms

## 8.1 The feeding calculation

**File:** `lib/nutrition.ts`, function `computePlan()`.

### Step 1 — Resting Energy Requirement

```
RER = 70 × (bodyweight in kg) ^ 0.75
```

This is the standard veterinary formula. The exponent 0.75 rather than 1.0 is
**metabolic scaling**: energy needs do not rise in direct proportion to mass. A
40kg dog does not need four times the calories of a 10kg dog; it needs about 2.8
times.

### Step 2 — Maintenance Energy Requirement

```
MER = RER × activity × lifeStage × species × bodyCondition
```

| Multiplier | Values |
|---|---|
| Activity | low 1.3, normal 1.6, high 2.0 |
| Life stage | young 2.0, adult 1.0, senior 0.9 |
| Species | dog 1.0, cat 0.9, rabbit 0.7, bird 1.3, reptile 0.35, small pet 1.1 |
| Body condition (score 1–5) | 1 very thin 1.2, 2 lean 1.1, 3 ideal 1.0, 4 overweight 0.9, 5 obese 0.8 |

**Two of these were corrected.** The senior factor was 1.1, which fed every
senior pet *more* than a younger adult of the same weight — contradicting the
care guides, which tell owners that older pets need less. And body condition had
only three values, so scores 1 and 2 (and 4 and 5) gave identical plans; now
every position on the slider means something.

### Step 3 — Portions

Calories are divided by food energy density to give grams, then split across
meals. Meals per day depend on species and life stage:

| Species | Young | Adult / senior |
|---|---|---|
| Dog | 3 | 2 |
| Cat | 4 | 2 |
| Rabbit | 2 | 2 |
| Bird | 2 | 2 |
| Reptile | 1 | 1 |
| Small pet | 2 | 2 |

(This used to be "3 if young, otherwise 2" for every species, which told
reptile owners to feed twice a day.)

### Worked example (verify this yourself)

A 12kg adult dog, normal activity, ideal condition:

```
RER = 70 × 12^0.75 = 70 × 6.447 = 451.3
MER = 451.3 × 1.6 × 1.0 × 1.0 × 1.0 = 722.1  →  722 kcal/day
Dry food = 722 ÷ 3.5 = 206 g, in 2 meals of 103 g
```

The planner shows **722 kcal/day** for this input. The same dog as a senior
gives 650 kcal/day (× 0.9).

You can check this on the home page: the Portion Facts panel opens on exactly
this dog — 12 kg, adult, moderate activity — and shows **722 kcal** and
**2 × 103 g**, because it calls `computePlan()`. (The old landing page had a
"Biscuit's plan" card for a 12.4 kg dog with "742 kcal" typed in by hand; the
planner gives 70 × 12.4^0.75 = 462.6, × 1.6 = **740**. The number was fixed to
come from the engine, and the card has since gone with the old page.)

## 8.2 Food safety matching — and the worst bug in the project

**File:** `lib/food-safety.ts`.

### The bug

The original matching logic was:

```
if (alias.includes(query)) → match
```

A user searched **"chicken"**. The database contains an entry for *chicken
bones*, which are genuinely dangerous. The alias `"chicken bones"` contains the
substring `"chicken"`, so the check matched, and the application told the owner
that chicken — an ordinary safe food — was **TOXIC**.

This is the single most dangerous class of bug in the whole system. A false
toxic verdict causes panic and an unnecessary emergency visit. A false safe
verdict is worse still.

### The fix

Matching is now **one-directional and whole-phrase**. The alias must appear in
the query as a complete phrase, not the reverse:

- Query "chicken bones" → matches the alias "chicken bones" ✓
- Query "chicken" → does **not** match the alias "chicken bones" ✓

Results are then ranked by specificity, so a longer, more specific alias wins
over a shorter one. 43 test cases cover this behaviour.

### The lesson

State it plainly in your documentation: **a substring match is not a search.**
Getting this wrong in a health-adjacent feature is a safety issue, not a
usability one.

## 8.3 Distance calculation

**File:** `lib/vets.ts`, function `haversine()`.

Great-circle distance between two points on a sphere:

```
a = sin²(Δφ/2) + cos φ₁ · cos φ₂ · sin²(Δλ/2)
d = 2R · asin(√a)        where R = 6371 km
```

This gives straight-line distance, not driving distance. The interface says
"away" rather than "drive", because claiming a road distance we have not computed
would be false.

## 8.4 Wellness scoring

**File:** `lib/wellness.ts`, function `assess()`.

Eight questions, each answer worth 0–3. Score = total ÷ 24 × 100, rounded.

| Score | Verdict |
|---|---|
| 80 or more | Thriving |
| 60–79 | Healthy |
| 40–59 | Needs attention |
| Below 40 | See a vet |

**Red flags override the score.** Four answers are flagged: *Lethargic*,
*Barely eating*, *Ribs, spine or hips stick out* and *Clearly abnormal*
toileting. Any one of them gives "See a vet", naming the sign, whatever the
total. Before this, the score was a plain average, so a pet that was barely
eating *and* lethargic could still come out "Healthy" or even "Thriving" —
the two answers that matter most were outvoted by coat shine and exercise.

The body-shape question also gained an underweight answer. Its options used to
run from "ribs easy to feel" (ideal) to "can't feel them" (overweight), so an
underweight pet had no honest answer and was scored as ideal.

The result also lists **"Worth looking at"**: every area whose answer scored 0
or 1.

The bands deliberately advise professional consultation at moderate scores rather
than only at severe ones, because the cost of a false reassurance is higher than
the cost of an unnecessary check-up.

---

# Part 9 — The 3D system

This is the most technically distinctive part of the project and the part most
likely to be asked about.

## 9.1 What it is

One 3D scene, on the home page only: a glazed stoneware feeding bowl, the kibble
in it, the foods the visitor checks, and — at the end — a steel ID tag. It sits
fixed behind the page and changes as the visitor scrolls through the seven
chapters described in §4.1.

| Scene time | Chapter | What the scene does |
|---|---|---|
| 0 | The bowl (hero) | The bowl beside the headline, with a generous serving (150 pieces) |
| 1 | Portions | The camera rises over the bowl, which now holds exactly one meal from the Portion Facts panel |
| 2 | Safe or not | The camera drops low; checked foods fall toward the bowl |
| 3–5 | Records, Vets, Together | Opaque paper sections slide over the scene; while one fills the screen, it stops drawing |
| 6 | Join | The camera has travelled to the ID tag, which engraves the name being typed |

There is no 3D anywhere else. Tool pages used to carry a second, smaller 3D
canvas in their header; `PageHeader.tsx` now draws a static gram-scale ruler in
SVG instead, so the site has at most one WebGL context, and only on `/`.

**Files:** `components/landing/story.ts` and `components/landing/scene/` —
`BowlCanvas.tsx` (the canvas, lighting, quality settings, warm-up), `Bowl.tsx`,
`bowlShape.ts`, `Kibble.tsx`, `FoodDrop.tsx`, `Tag.tsx`, `Rig.tsx`.
**Libraries:** `three` 0.186 through `@react-three/fiber` 9 and
`@react-three/drei` 10.

This replaced the earlier particle-animal landing page (five breeds drawn as
point clouds from signed distance fields). Why it was replaced is in
`06-FINAL-REVIEW-FIXES.md` §7.

## 9.2 One shared object, and no React state per frame

`story.ts` exports a single mutable object. Scroll, the pointer and the
interactive sections **write** to it — scene time, how many kibble pieces the
bowl should hold, the latest food dropped, the name on the tag, whether the
scene is covered. The 3D components **read** it inside `useFrame`, the
per-frame callback.

The reason: if scroll position or a slider value were React state, every scroll
tick would re-render the component tree, sixty times a second. Here a scroll
tick changes a number and nothing re-renders. React is used only where the DOM
must change, and only when the value actually changes: the active chapter in
the side gauge, and whether the canvas is paused. Inside the scene, the food
model re-renders only when a *new* food is dropped, and the tag's texture is
redrawn only when the name changes (a version counter, `tagVersion`).

## 9.3 Scroll position to scene time

Each chapter's `<section>` carries a `data-t` attribute (0 to 6). The page
measures the vertical midpoint of each section, takes the point halfway down the
viewport, and interpolates linearly between the two section midpoints either
side of it. A visitor halfway between the hero and Portions is at t = 0.5.

Why midpoints, rather than a fraction of the page height: sections are
different heights on different devices — on a phone the panels stack and the
page is much longer — so tying t to the sections themselves keeps the scene in
step with the copy on any screen. Positions are re-measured after a resize, once
web fonts have loaded, and once more after 1.5 seconds, because fonts and images
settling change section heights.

The bowl holds the hero serving while t < 0.55, and from then on exactly what
the Portion Facts panel says one meal is.

## 9.4 The camera

`Rig.tsx` holds camera keyframes keyed by scene time, in two sets: **wide**
screens put the bowl beside the copy, and **tall** screens (width ÷ height below
0.9) put it below the copy. Between keyframes the position is eased with a
smoothstep, and every frame the real camera is then damped towards that target
(by 1 − e^(−5·Δt) of the remaining distance), so scrolling fast or reversing
never snaps. The keyframe positions were worked out from the lens — a 32°
vertical field of view — so the bowl fills roughly 40% of a wide screen, with
the look-at point shifted along the camera's own right vector so the bowl sits
beside the text rather than behind it. A mouse adds a little parallax.

## 9.5 The bowl

The bowl is made the way a potter makes one: a hand-written profile turned on a
lathe (`LatheGeometry`, 96 segments). There are two profiles in
`bowlShape.ts` — the inside surface from the centre of the floor to the rim, and
the rolled lip, outside wall and foot ring.

The glaze is a `MeshPhysicalMaterial` with a full **clearcoat** — the wet,
glassy top layer of a fired glaze — and a few lines of shader injected through
`onBeforeCompile` that scatter iron speckles and faint mottling through the
colour, using a hash of the surface's object-space position. Because it is in
the shader and keyed to the object, the speckles stay on the bowl as it moves
and cost nothing per frame. The bowl sits on a soft contact shadow painted once
into a texture, so no extra shadow render pass is needed for it.

## 9.6 Packing the kibble

**File:** `bowlShape.ts`, `packKibble(count)`.

Kibble must sit *inside* the bowl, not intersect its walls or each other. The
positions are found by **Poisson-style rejection sampling** inside the bowl's
inner volume:

1. Pick a height, biased low so the floor fills before the walls.
2. Find the inside radius of the bowl at that height with `innerRadiusAt(y)`
   (linear interpolation along the inner profile), less half a piece so nothing
   pokes through the glaze. Above the rim the allowed radius narrows, which
   builds a gentle mound for a very full bowl.
3. Pick a point uniformly within that circle (the square root of a random number
   for the radius, so the centre is not over-crowded).
4. Reject it if it is closer than 0.82 of a piece to any piece already placed;
   otherwise keep it.

Then the pieces are **sorted bottom-up** — in layers, and from the middle
outwards within a layer. That ordering is what makes the whole feature work:
showing "the first N pieces" always looks like a bowl filled to a level, so one
number drives the picture.

The random numbers come from a small seeded generator (`prng`), so the pile is
the same on every visit. Packing runs once per quality tier and is memoised,
never per frame.

## 9.7 One draw call, and only moving pieces cost anything

All the kibble is a single `InstancedMesh` — one lumpy kibble geometry drawn up
to 420 times in one GPU submission, each with its own position, rotation and
shade of brown.

When the target count rises, pieces are released at 160 a second from a narrow
stream above the bowl; each falls for 0.62 s, spinning, and settles. When it
falls, the extra pieces shrink away. Per-piece state lives in typed arrays
(`Float32Array`), so the frame loop allocates nothing and causes no garbage
collection pauses. Only the pieces currently in flight are kept in an `active`
set and updated; when that set is empty the frame callback returns at once, so
**a settled bowl costs no CPU per frame**.

## 9.8 One meal, honestly scaled

The Portion Facts panel runs `computePlan()` with the species, weight and life
stage chosen, at moderate activity. The bowl then holds
`round(gramsPerMeal ÷ 1.5)` pieces — one piece stands for about 1.5 g. The
panel states this, because the picture is a proportion, not a photograph of the
exact food. If a meal needs more pieces than the bowl can show on that device,
the panel says it is drawn full. The default — a 12 kg adult dog — is 103 g a
meal, about 69 pieces.

## 9.9 The food drop

The food check uses the real `lookupFood()`. When it finds an entry, it
releases a drop with a model and a verdict. Grapes, chocolate, onion, carrot,
blueberries and apple have simple procedural models (spheres, lathed shapes,
rounded blocks); any other entry drops a rounded token in its verdict colour.

- **Safe** — lands and settles on the kibble.
- **Caution** — lands, then shrinks to a small taste ("only a little").
- **Toxic** — the rim flashes red and the food is knocked up and away.

An item the database does not hold drops **nothing**. That is the same rule as
the full checker: a wrong "safe" is worse than no answer.

## 9.10 The ID tag

A bone-shaped outline (a `Shape` with a hole for the split ring) is extruded
and bevelled into a steel tag. The engraving is a 1024 × 512 canvas with the
name in Newsreader italic and "PETPAL · IF FOUND, PLEASE CALL" below it, used
as both the colour map and the bump map, so the letters read as cut into
polished metal. The canvas is redrawn only when the name changes, and the name
is capped at 14 characters. Nothing typed is stored.

## 9.11 Quality tiers

The device is sorted into a tier once, on load:

| Tier | When | Pixel-ratio cap | Kibble pieces (max) | Shadows | Anti-aliasing |
|---|---|---|---|---|---|
| High | More than 6 cores, more than 4 GB memory, and a mouse or trackpad | 2 | 420 | Yes | Yes |
| Medium | Touch device, or ≤ 6 cores, or ≤ 4 GB | 1.5 | 320 | Yes | Yes |
| Low | ≤ 4 cores, ≤ 3 GB, or the browser's data-saver on | 1 | 220 | No | No |

The signals are `navigator.hardwareConcurrency`, `navigator.deviceMemory`, the
data-saver flag and the pointer type. `?tier=low|medium|high` forces a tier for
a demonstration on an unknown machine. On top of that, drei's
`PerformanceMonitor` watches the frame rate and lowers the pixel ratio in steps
when the device struggles, and raises it again, up to the tier's cap, when it
recovers.

## 9.12 Boot order

1. The server sends finished HTML and a **CSS poster** — a radial gradient that
   looks like the scene's lighting. No image to wait for.
2. The hero headline animates in pure CSS, because it is the largest element on
   screen and should not wait for JavaScript.
3. The 3D code is loaded with `next/dynamic` and `ssr: false`, and mounted only
   on the visitor's first pointer move, scroll or touch — or after 0.9 s
   (mouse) / 1.6 s (touch) of idle.
4. The canvas fades in only after the shader warm-up below has finished.

## 9.13 Shader warm-up — a measured fix

**Symptom.** Scrolling froze for 400–700 ms at a time, at the moments a new part
of the scene first came into view.

**Diagnosis.** A browser performance trace showed the long frames were spent in
the graphics driver linking shader programs (`GetProgramiv`). three.js compiles
a material's shader the first time it is drawn, and on this hardware that link
step blocked the main thread.

**Fix.** A `Warmup` component inside the canvas calls `renderer.compileAsync()`
over the whole scene before it is shown, with every food model mounted once,
out of sight, so the first "Drop it" does not stall either. It then renders one
frame to build the shadow-map programs, and only then does the canvas fade in.
Synchronous shader-error checking is also switched off in production, because
it stalls the main thread too.

**Result.** After the fix, the 95th-percentile frame time while scrolling was
about **17.6 ms** (≈ 60 frames a second) on a laptop with Intel Iris Plus
integrated graphics.

**An honest note on that number.** Later measurements on the same laptop read
about 23 ms — but a blank page measured 23.7 ms in the same session, so the
machine itself was throttled at the time. The page added no measurable cost on
top. Quote the 17.6 ms with the hardware, and do not present any of these as
benchmarks across devices: they come from one machine.

## 9.14 Other costs found and removed

- **Pausing.** While an opaque paper section covers the whole viewport, the
  canvas's render loop is set to `'never'`. There is no point drawing a scene
  nobody can see.
- **No blur over the canvas.** A `backdrop-filter` blur on the navigation bar
  re-blurred the live canvas every frame; on the home page the bar is near-opaque
  instead.
- **No blur in scroll reveals.** A blur filter on large text forced a costly
  repaint while scrolling. Reveals now animate only opacity and transform. (The
  hero keeps its blur, because it animates once on load.)

## 9.15 When the 3D cannot run

- **No WebGL.** The page checks for WebGL before mounting the scene, and the
  scene sits inside `SceneBoundary`, an error boundary. Previously, with WebGL
  disabled, the whole page crashed ("This page couldn't load"); now it keeps the
  CSS poster and every section works.
- **Software renderer.** If the browser is drawing WebGL on the CPU
  (SwiftShader, llvmpipe), the scene would be a slideshow, so the still layout
  is used instead. `?force3d` overrides this for testing.
- **Reduced motion** — the operating-system setting or PetPal's own setting.
  Lenis smooth scrolling is not loaded; the camera follows the scroll position
  directly, with no easing lag and no pointer parallax; the tag stops swaying;
  kibble appears in place without falling; and scroll reveals are shown
  immediately.

## 9.16 Mobile

Touch scrolling stays native — Lenis smooths the mouse wheel only — and the tall
camera set (§9.4) puts the bowl below the copy on a phone.

One bug is worth knowing about. Phones laid the whole page out **1440 px wide**
and zoomed out to fit. The cause was the curved top edge of the paper sections:
an absolutely positioned SVG takes its size from its own intrinsic width (its
`viewBox` is 1440 wide) and ignores `left`/`right` for sizing. The fix was
`width: 100%` on that SVG, plus `overflow-x: clip` on the page root so that no
element can widen the layout viewport again.

## 9.17 A deliberate lint exception

The React Compiler's lint rules (`react-hooks/immutability`, `refs`,
`use-memo`) assume ordinary React state. React Three Fiber's frame loop mutates
three.js objects — the camera, instance matrices, textures — in place, on
purpose: that is what keeps the animation out of React's render cycle. Those
three rules are switched off for `components/landing/scene/**` only, and
`eslint.config.mjs` says why. Everywhere else they apply.

---

# Part 10 — Security

## 10.1 The model

**The database enforces access, not the interface.** This is the central security
decision. Hiding a button stops a casual user. It does not stop anyone who opens
the browser console and calls the API directly. Every access rule in PetPal is a
row-level security policy in PostgreSQL, so it holds even if the front end has a
bug.

## 10.2 Authentication

Handled by Supabase (GoTrue). The application never sees, stores or transmits a
password of its own. Sessions are JSON Web Tokens held in cookies; `@supabase/ssr`
keeps them valid across server rendering.

## 10.3 The verification gate

The rule that only verified professionals may answer is written as:

```sql
create policy "verified vets answer" on answers for insert
  with check (auth.uid() = vet_id and exists (
    select 1 from vet_profiles v where v.id = auth.uid() and v.verified = true));
```

The interface also hides the composer from unverified vets, but that is a
courtesy, not the control. Even if someone bypassed the interface entirely, the
database would refuse the insert.

**Why this matters:** an answer carrying a professional's authority without the
register behind it is worse than no answer at all.

## 10.4 Why hearts go through a function

`confessions` has **no update policy**. Hearts are incremented through
`increment_hearts()` instead, for two reasons:

1. An update policy permissive enough to allow incrementing a counter would also
   allow rewriting the post text.
2. `hearts = hearts + 1` executed inside the database is atomic, so two people
   liking at the same moment cannot overwrite each other's count.

## 10.5 The two keys

| Key | Safe in the browser? | Used here? |
|---|---|---|
| Publishable / anon | ✅ Yes — constrained by row-level security | ✅ Yes |
| Secret / service_role | ❌ **Never** — bypasses every rule | ❌ No |

The publishable key is safe **because** row-level security limits it. That is the
whole argument, and it only holds if the policies are actually applied — which is
why `supabase/schema.sql` must be run before the application goes live, not
after.

Any variable prefixed `NEXT_PUBLIC_` is compiled into the JavaScript every
visitor downloads. A service-role key given that prefix would hand every visitor
full read and write access to the entire database.

## 10.6 Privacy decisions

- Community posts carry no author identifier at all. Anonymity is structural, not
  a setting.
- Pet records are not visible to administrators. Running the service does not
  require seeing what animals someone keeps.
- The settings screen states plainly that PetPal does not track sign-in locations,
  rather than inventing a device list.
- A user can delete their own account from Settings, and it really deletes their
  personal data (§5.9, `delete_my_account`).
- The user's location, when shared with Find a Vet, passes through PetPal's own
  server to OpenStreetMap for one search and is then discarded. It is not stored
  or linked to the account. (The FAQ used to say it was "never sent to us", which
  was not true.)

## 10.7 Holes found in the original rules, and how each was closed

Row-level security decides *which rows* a user may touch. An audit found that
several policies were correct about rows but said nothing about *which columns*
or *which values* — and from the browser console, that gap is enough.

| What was possible | How it is closed |
|---|---|
| Any signed-in user could set their own `profiles.role` to `admin` | Column-level grants: users may update only `display_name` and `avatar_url` |
| Anyone could insert their own `vet_profiles` row with `verified = true` | The insert policy requires `verified = false` |
| A vet could verify themselves, or change the registration number after being verified | The `guard_vet_profile` trigger: only an administrator may change either |
| A question could be inserted already "answered" or "resolved"; an author could edit `answer_count`, or reword a question after it was answered | Insert requires `answer_count = 0` and `resolved = false`; authors may update only `resolved` |
| A vet could move an answer to another question | Vets may update only an answer's `body` |
| A wall post could be inserted with any number of hearts | Insert requires `hearts = 0` |
| The admin's "remove post" did nothing — no delete policy existed — while the screen said it had worked | An admin-only delete policy on `confessions`; the screen waits for confirmation |
| Reminders or weigh-ins could be attached to someone else's pet id | Insert (and, for reminders, update) requires the pet to belong to the same owner |
| The admin screen opened for anyone who set `user_metadata.role = 'admin'` on themselves | `lib/auth.ts` reads only `app_metadata.role` or `profiles.role` |

Pets also gained check constraints — a name of 1–40 characters (trimmed) and a
weight of at most 200 kg — so the database enforces what the form checks.

One thing is **deliberately not enforced**: a unique registration number. A
unique rule would make the second sign-up fail inside the trigger with
"Database error saving new user", which tells the person nothing. The Admin
Panel flags the duplicate instead, so a human decides.

**How this was verified.** An automated test ran the real `supabase/schema.sql`
in PGlite — PostgreSQL compiled to WebAssembly — with Supabase's `auth` schema
stubbed, ran it twice to prove it is safe to re-run, and made 49 checks: the
sign-up trigger, constraints, the triggers, the policies, and the database
attacks in the table above (the last row is app code, not tested there) —
attacks which succeeded against the old schema. All 49 pass. The script is `tests/schema.test.mjs`; `npm test` runs it.

---

# Part 11 — Deployment and environments

## 11.1 The three services

| Service | Role | Cost |
|---|---|---|
| GitHub | Stores the source code | Free |
| Vercel | Builds and hosts the application | Free tier |
| Supabase | Database and authentication | Free tier |

## 11.2 The two environment variables

Only two are read by any code in the project:

```
NEXT_PUBLIC_SUPABASE_URL       https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY  the publishable / anon key
```

Both must be present in Vercel for **all three** environments, and **the project
must be redeployed after changing them** — environment variables are compiled in
at build time, so adding one without rebuilding changes nothing.

## 11.3 Build pipeline

```
git push to master
   → GitHub receives the commit
   → Vercel detects it, starts a build
   → npm install
   → next build   (TypeScript check, then compile, then prerender)
   → deploy to the production domain
```

## 11.4 Deployment failures actually encountered

Document these; they demonstrate real implementation experience.

**Framework preset wrong.** Vercel was set to serve the project as a static site
rather than as Next.js. The build *succeeded* every time — `npm run build` ran
fine — but Vercel then served the `public/` folder and discarded the entire
application. Every route returned 404. The diagnostic that proved it: `/globe.svg`
(a file that exists only in `public/`) returned **200** while `/` returned **404**.

**Settings applied at build time.** Changing the framework preset did not fix the
live site, because the production deployment had been built with the old setting.
Vercel bakes project settings in at build time; a new **production** deployment
was required. Redeploying a *preview* deployment does not change the live site.

**Deployment protection.** Vercel Authentication was enabled, so every visitor was
redirected to an SSO login. The site appeared broken to anyone outside the team.

---

# Part 12 — Testing

## 12.1 What was tested and how

| Layer | Method | Result |
|---|---|---|
| Types | `tsc --noEmit` | Clean |
| Linting | ESLint | Clean |
| Build | `next build` | Succeeds; 22 application routes (20 pages, 2 route handlers) |
| Food-safety matching | 43 test cases | All pass |
| Nutrition | Hand-verified worked examples | Match |
| Database schema | Executed against real PostgreSQL via PGlite | Executes, idempotent |
| Signup trigger | Inserted an auth user with no session | Profile and vet record both created |
| Answer counter | Insert then delete | 0 → 1 → 0 |
| Constraints | Deliberately invalid rows | 3/3 rejected |
| Security rules (current schema) | Automated script, real `schema.sql` in PGlite, 49 checks including the database attacks in §10.7 (`npm test`) | 49/49 pass; the attacks succeeded against the old schema |
| Offline vet data | Four cities plus one outside the region | Correct counts, correct empty |
| Home page 3D | Browser performance trace while scrolling; WebGL disabled; 375 px phone width | ~17.6 ms 95th-percentile frame after the shader fix (one laptop, §9.13); falls back to the still poster; no horizontal overflow |
| Live site | HTTP checks on every route | All 200 |

## 12.2 Notable test findings

**The schema would not run at all.** A shell heredoc had expanded `$$` into a
process ID when the file was written, leaving `as $` and `$;` instead of `as $$`
and `$$;`. Postgres hit an unterminated dollar-quote and refused the entire
script. Found by parsing the file with the real Postgres grammar rather than
reading it.

**Reduce motion did not work.** The setting applied a CSS class that killed every
CSS transition — and had no effect on Framer Motion, which animates inline styles
in JavaScript frame by frame. The setting stopped the small hover effects,
reported success, and left every large movement running. Verified in the browser
before fixing: the class was applied, computed `transition-duration` was
`1e-05s`, and Framer was still writing transforms.

---

# Part 13 — Known limitations

State these honestly. A marker rewards a candidate who knows the weaknesses of
their own system.

1. **The practice finder depends on a donated public service.** Overpass has no
   uptime guarantee. The bundled fallback covers South Africa only; a lookup
   elsewhere during an outage will fail.
2. **The bundled practice data goes stale.** It is dated in the interface, but it
   is a snapshot, not a feed.
3. **The food-safety database is 88 items.** It is curated rather than
   comprehensive, and it deliberately returns nothing for items it does not hold.
4. **Verification is a human check.** An administrator verifies from the Admin
   Panel, but checks the registration number against the register by hand.
   There is no integration with a veterinary register, and a number shared by
   two accounts is flagged, not blocked.
5. **Automated tests cover the database and the logic, not the screens.**
   `npm test` runs the 49-check PGlite schema test and 48 unit checks of the
   nutrition, food-safety, wellness and validation logic. Screens were verified
   by hand in the browser, and nothing runs the tests automatically on every
   change. A CI pipeline with Playwright for the screens would be the obvious
   next step.
6. **Administrator bootstrap requires SQL.** The first administrator must be
   created with a database query, because a "make me an administrator" button
   would be a security hole.
7. **The home page's 3D needs a graphics card.** Without WebGL, or on a
   software renderer, the page shows a still poster instead: the content is all
   there, the bowl is not. The performance figures in §9.13 come from one laptop,
   not from testing across devices.
8. **Unused dependencies remain in `package.json`.**
9. **The community wall has no moderation queue.** Posts appear immediately; an
   administrator removes them after the fact.
10. **Pets are not shared.** A household with two owners needs two accounts.
11. **Reminders are in-app only.** Nothing sends an email or push notification;
    an owner sees a due vaccine only when they open PetPal.
12. **No pet photos.** The `photo_url` column exists, but there is no upload.

---

# Part 14 — Design decisions

Each of these is a likely viva question. The answer is given in the form you
should give it: the decision, the alternative, and why.

**Why one account type rather than separate owner and vet accounts?**
Because most vets own animals. Two account types would force a vet to choose
between professional tools and the nutrition planner for their own dog. One
account with an additional professional surface removes the choice, and answers
the "what if an owner is also a vet" case without a special case.

**Why enforce access in the database rather than the interface?**
Because hiding a button is not access control. Anyone can open a browser console.
Row-level security holds even if the front end has a bug.

**Why is `answer_count` stored rather than counted?**
Performance: counting rows per question on every page load is expensive. It is
kept correct by a trigger rather than by application code, so it cannot drift.
This is a deliberate, justified denormalisation.

**Why does the food-safety search not match substrings?**
Because "chicken" is a substring of "chicken bones", and that made the system
report an ordinary safe food as toxic. In a health-adjacent feature that is a
safety bug, not a usability one.

**Why no ratings on veterinary practices?**
Because we have no rating data. Inventing one would be fabrication, and
displaying a rating we cannot substantiate on a screen someone uses in an
emergency is indefensible.

**Why bundle offline practice data?**
Because a core feature should not be down because somebody else's free server is.
The bundled data is real OpenStreetMap data with a stated extraction date — not
invented records — and the interface says it is a saved copy.

**Why is the 3D scene's state kept outside React?**
Because scroll position changes on every frame. As React state it would
re-render the page sixty times a second; as a field on one shared object
(`story.ts`) it costs nothing. React is used only where the DOM has to change.

**Why compile every shader before showing the scene?**
Because a performance trace showed 400–700 ms freezes mid-scroll, caused by the
driver linking each shader the first time it was drawn. Compiling them all up
front, asynchronously, while the CSS poster is still showing, removed them.

**Why does the light theme redefine utilities rather than rewrite them?**
Because the interface was built dark, with the ground and borders hard-coded into
roughly four hundred utility classes. Rewriting all of them was the riskier
change; redefining what those classes resolve to under a theme attribute achieves
the same result with a fraction of the surface area.

**Why React Three Fiber, when the old landing page used Three.js directly?**
The old particle system was a single object with a single draw call, where a
React layer added nothing. The bowl scene is a graph of a dozen parts, several
driven by what the visitor types or chooses, so composing it as components pays
for itself. The per-frame work still bypasses React (§9.2).

---

# Part 15 — Glossary

| Term | Meaning |
|---|---|
| **CORS** | Browser rule restricting requests to other origins |
| **Environment variable** | A setting supplied to the app at build or run time |
| **Error boundary** | A React component that catches a failure in its children and shows a fallback instead of crashing the page |
| **Foreign key** | A column that must match a row in another table |
| **Idempotent** | Safe to run more than once with the same result |
| **Instanced mesh** | One geometry drawn many times in a single GPU call, each copy with its own position and colour |
| **Lathe geometry** | A 3D shape made by spinning a 2D profile round an axis |
| **JWT** | JSON Web Token; the signed token proving a session |
| **MER** | Maintenance Energy Requirement; daily calories |
| **Normalisation** | Organising tables to remove redundancy |
| **Overpass API** | Query service for OpenStreetMap data |
| **Prop** | A value passed into a React component |
| **Rejection sampling** | Generating random candidates and discarding any that break a rule |
| **RER** | Resting Energy Requirement; calories at rest |
| **RLS** | Row-Level Security; per-row database access rules |
| **Route group** | A Next.js folder in parentheses that shares a layout without adding to the URL |
| **SECURITY DEFINER** | A database function running with its creator's rights |
| **Server component** | A React component rendered on the server |
| **Shader** | A small program run on the graphics card to draw a surface |

---

*End of System Reference.*
