# Khurana Electronics — Digital Job Sheet Portal

A mobile-first web app that replaces the paper "JOBSHEET" carbon form used by Khurana
Electronics field engineers, and generates a clean, branded PDF that can be sent to the
customer from site over WhatsApp.

> **This document is a complete build brief.** It is self-contained: everything needed to
> build the application — the field spec, the data model, the UX rules, the PDF layout and
> the build order — is described below. No access to the original paper forms is required.

---

## 1. The problem

Khurana Electronics is a CCTV and security-systems dealer in Sonipat, Haryana. Engineers
are dispatched to client sites to install, service and repair equipment. Every visit is
recorded on a pre-printed A4 carbon-copy form titled **JOBSHEET**.

Three real completed sheets were reviewed. They show three consistent failure modes:

**1. The form is filled incompletely.** `DATE`, `JOB NO.`, `MOB NO.` and `CONTACT PERSON`
are routinely left blank. The `DATE OF WORK IS DONE` field and the second `ENGG. NAME`
column (inside the products table header) are almost never filled at all. The engineer is
standing at a site, often outdoors, and fills only what feels essential in the moment.

**2. The handwriting cannot be read back.** Model numbers, quantities and the mixed
Hindi/English remarks are frequently illegible to the office staff who process the sheet
later. The `RETURN MAT.` and `CONSUMED MAT.` columns — which drive inventory reconciliation —
get transposed or left ambiguous, because they are two narrow adjacent boxes filled with
single digits in ballpoint.

**3. The customer never receives a clean record.** The customer gets a smudged carbon copy.
The office gets a phone photo of the sheet, sometimes taken on a car bonnet in direct
sunlight, at an angle, partially shadowed by the photographer's hand.

### What the portal must actually do

It is not enough to put the same form on a screen. The product value is in making an
incomplete or unreadable submission **structurally impossible**:

- Fields that get skipped must be auto-filled, not merely marked required.
- Data that gets misread must come from a dropdown, not from a pen.
- The finished record must leave the site as a clean PDF, in the customer's hands, before
  the engineer drives away.

---

## 2. Scope

This build is a **demo intended to win the client's business**. It must be genuinely
working software — a real form producing a real PDF, with seeded data so no screen is ever
empty — deployable to Vercel and demonstrable in 90 seconds.

It is explicitly structured so it can grow into the production system without a rewrite.
Items deferred to production are marked **`PRODUCTION TODO`** throughout.

---

## 3. Tech stack

| Concern | Choice |
|---|---|
| Framework | Next.js 16, App Router, TypeScript, Turbopack |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Database | **PostgreSQL** (Neon or Supabase free tier) via Prisma |
| PDF | `@react-pdf/renderer` |
| Signature | `react-signature-canvas` |
| File uploads | **Vercel Blob** (local disk in dev only — see 5.10) |
| Reverse geocoding | OpenStreetMap Nominatim, server-side (see 5.7) |
| PDF fonts | **Mukta** (SIL OFL), committed to `/public/fonts/` — see 6.1 for why not Noto |
| Deployment | Vercel |

### Prisma 7 setup notes

Prisma 7 changed three things that break older tutorials and prior assumptions:

- **No `url` in `schema.prisma`.** The datasource block declares only the provider. The
  connection string lives in `prisma.config.ts` for migrations, and reaches the client
  through a driver adapter (`@prisma/adapter-pg`) in `src/lib/prisma.ts`.
- **The generator must declare an `output` path.** Use `provider = "prisma-client"` with
  `output = "../src/generated/prisma"`. Without it no client is emitted at all. The
  generated directory is gitignored; run `npx prisma generate` after cloning.
- **Pin `prisma` and `@prisma/client` to the same exact version.** npm otherwise resolves
  the CLI to an 8.x release candidate against a stable 7.x client, which fails to generate.

Seeding runs through `tsx`: `npx tsx --env-file=.env prisma/seed.ts`.

### Database — Postgres, not SQLite

**Do not use SQLite.** The app deploys to Vercel, where the filesystem is read-only and
ephemeral. A SQLite file is wiped on every deploy and on every cold start, so all job
sheets would silently disappear. Use hosted Postgres from the start — the Prisma schema and
all client code are identical either way, so there is no cost to doing this correctly now.

Create `.env.example`:

```env
# PostgreSQL connection string — use Neon (neon.tech) or Supabase (supabase.com), both free tier.
# DO NOT use SQLite: Vercel's filesystem is read-only and ephemeral, so a SQLite
# database file is destroyed on every deploy and every cold start, losing all job sheets.
DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"

# Public base URL, used to build shareable PDF links for WhatsApp.
NEXT_PUBLIC_BASE_URL="http://localhost:3000"

# Google review link, rendered as a QR code in the PDF footer.
# CLIENT TO SUPPLY — see section 12.
NEXT_PUBLIC_GOOGLE_REVIEW_URL=""
```

---

## 4. Field specification

This is a faithful transcription of the paper form. The app must capture every field
below, so the staff recognise the digital version as the same document they already know.

### 4.1 Header block

| Field | Type | Behaviour |
|---|---|---|
| `DATE` | date | **Auto** — today's date, editable |
| `JOB NO.` | text | **Auto** — generated, read-only (see 5.1) |
| `ENGG. NAME` | text | **Auto** — from the selected engineer |
| `CONTACT PERSON` | text | Required |
| `MOB NO.` | tel | Required, 10-digit validation |
| `SITE & FIRM NAME` | text | Required, autocomplete from saved clients |
| `ADDRESS` | textarea | Required, auto-filled when a saved client is picked |
| `DATE OF WORK IS DONE` | date | **Auto** — defaults to today, editable |
| `CHECKED AND HAND OVER REPORT BY ENGG.` | textarea | Free text. Sits to the right of the address block on the paper form |

> **Note on `REF. NO.` vs `JOB NO.`** — the blank letterhead template prints this field as
> `REF. NO.`, while the printed pads actually in use by the staff print `JOB NO.`. **Use
> `JOB NO.`** throughout the app and PDF, since that is what the engineers currently write.
> Flag this discrepancy to the client so they can confirm which label they want on the
> final artwork.

### 4.2 Products table — "NEW PRODUCT / DESCRIPTION"

Ten numbered rows on paper. In the app, start with three rows and let the engineer add rows
up to ten.

| Column | Type | Behaviour |
|---|---|---|
| `S.NO.` | auto | Row index |
| `NEW PRODUCT / DESCRIPTION` | combobox | Autocomplete from product catalogue, free text allowed |
| `MODEL NO.` | combobox | Auto-fills when a catalogue product is chosen, free text allowed |
| `QTY.` | stepper | Integer, default `0` |
| `RETURN MAT.` | stepper | Integer, default `0` |
| `CONSUMED MAT.` | stepper | Integer, default `0` |

### 4.3 Faulty material table — "FAULTY MATERIAL RECEIVED FROM CLIENT"

Five numbered rows on paper. Start with two rows in the app, expandable to five.

| Column | Type | Behaviour |
|---|---|---|
| `S.NO.` | auto | Row index |
| Description | textarea | **Must accept Hindi and English.** On the real sheets this block is where engineers write mixed-script notes such as "मुख्य द्वार पर कैमरा नया लगा दिया" |
| `QTY.` | stepper | Integer, default `0` |
| `CLIENT NAME` | text | Auto-filled from the selected client |

### 4.4 Footer blocks

| Field | Type | Behaviour |
|---|---|---|
| `REMARKS IF ANY` | textarea | Free text, Hindi + English, with quick-chips (see 5.5) |
| `PRODUCTS/PARTS WORTH AND OTHER MATERIALS WHICH ARE IN CLIENT'S OTHER` | textarea | Free text. Sits beside Remarks in the footer of the paper form |
| `SIGNATURE WITH STAMP OF CLIENT` | signature pad | Required — cannot submit without it (see 5.6) |
| `LOCATION` | GPS | **Auto-captured** (see 5.7) |

### 4.5 Fixed letterhead text

This text is pre-printed on the form and must appear verbatim in the generated PDF:

```
IT IS HEREBY CONFIRMED THAT THE ABOVE MENTIONED
INSTALLTION HAS BEEN COMPLETED TO OUR SATISFACTION
ADDRESS :- 1456-HBC-SEC-14-BEHIND GANDHI PARK SONIPAT-131001
0130-4018060 - 9053000270
```

```
PRODUCT IS PRAISE WORTHY AND WILL NOT HESITATE RECOMMEND TO OTHERS
```

```
DEALS IN : HIKVISION | TVT | DAHUA | CP PLUS | AHUJA | JBL | BOSCH
```

> The spelling `INSTALLTION` and the phrasing of these lines are reproduced exactly as they
> appear on the printed form. Do not silently correct them — ask the client first, since
> this is their existing letterhead copy.

---

## 5. UX rules that solve the problem

**These rules are the product.** A generic CRUD form would not fix anything. Implement each
of the following deliberately.

### 5.1 Auto job number, date and engineer

The three most-skipped fields are eliminated rather than validated:

- **Job number** — auto-generated as `KE-YYYYMMDD-NNN`, where `NNN` is a zero-padded
  daily sequence (`KE-20260904-001`). Read-only in the UI.

  **Handle the race condition.** The daily sequence is derived by counting that day's
  existing rows, so two engineers submitting at the same moment would compute the same
  number. `jobNo` is `@unique` in the schema (section 8) — keep it that way, and wrap
  generation in a retry loop that catches the unique-constraint violation (Prisma error
  `P2002`), recomputes the sequence and retries, **up to 5 attempts** before surfacing an
  error. Never let a duplicate job number reach the database.
- **Date** — defaults to today.
- **Engineer name** — taken from the engineer selected on app open (see 5.8).

### 5.2 Step wizard, not one long form

A single long scrolling form on a phone invites skipped fields. Split into five steps, each
validating before advancing, with a visible progress indicator:

1. **Job info** — client, contact person, mobile, site & firm name, address, handover report
2. **Work done** — products table
3. **Faulty material** — faulty material table
4. **Remarks & photos** — remarks, client's-other-materials block, site photos
5. **Sign off** — signature pad, GPS location capture, submit

### 5.3 Product catalogue dropdowns — this is what kills the handwriting problem

Model numbers are the single most misread thing on the sheets. The engineer must select
rather than write. Provide a searchable combobox backed by a seeded `Product` table, which
auto-fills the model number on selection, with free-text entry always available as a
fallback so an unlisted item never blocks a submission.

Seed roughly 30 products across the brands the company actually deals in — Hikvision, CP
Plus, TVT, Dahua, Bosch, JBL and Ahuja — covering DVRs/NVRs, dome and bullet cameras, hard
disks, SMPS/power supplies, cable reels, BNC and DC connectors, memory cards, camera
mounting boxes, and PA/audio items.

### 5.4 Quantity steppers, never blank

`QTY.`, `RETURN MAT.` and `CONSUMED MAT.` are `+`/`−` steppers with a default of `0`, tap
targets at least 44px. A blank is never submitted, so the office can always reconcile
inventory. Label the three columns clearly in the UI — on paper they are unlabelled narrow
boxes, which is why they get transposed.

### 5.5 Hindi + English remarks with quick-chips

The remarks and faulty-material blocks must accept Devanagari and Latin script in the same
field. Offer tappable quick-chips that append common phrases, drawn from what recurs across
the real sheets:

- `Recording OK`
- `Date & Time set`
- `Camera focus adjusted`
- `HDD replaced`
- `Power supply checked`
- `कैमरा नया लगा दिया`
- `सभी कैमरे चेक कर दिए`

### 5.6 Mandatory customer signature

The customer signs with a finger on the engineer's phone using `react-signature-canvas`,
stored as a base64 PNG and embedded in the PDF. **Submission is blocked until a signature
is captured** — this is what makes the digital sheet a stronger record than the paper one,
not a weaker one.

### 5.7 GPS location capture — a deliberate demo highlight

The paper form has a `LOCATION` box beside the signature that is almost never filled and
could never be verified anyway. Replace it with automatic capture via the browser
Geolocation API on the sign-off step: store latitude and longitude, reverse-geocode to a
human-readable address, and print both on the PDF.

**Call this out explicitly in the pitch.** It is proof the visit happened, at that address,
at that time — a capability the paper form fundamentally cannot have. Handle permission
denial gracefully by falling back to manual text entry.

**Reverse geocoding provider.** The browser Geolocation API returns only latitude and
longitude — it does not return an address. Convert coordinates to a readable address using
**OpenStreetMap Nominatim** (free, no API key required):

- Call it from a **server-side route handler** (`/api/geocode`), never from the browser —
  Nominatim's usage policy requires an identifying `User-Agent` header, which the browser
  will not let you set.
- Send `User-Agent: KhuranaElectronics-JobSheet/1.0 (contact@khuranaelectronics.example)`.
  **`CLIENT TO SUPPLY`:** a real contact email for this header.
- Endpoint: `https://nominatim.openstreetmap.org/reverse?format=jsonp&lat={lat}&lon={lon}`
- **Respect the 1 request/second rate limit.** Cache results keyed on coordinates rounded
  to 4 decimal places (~11m), so repeat visits to the same site cost nothing.
- **Fall back to displaying the raw coordinates** if the lookup fails or times out. A
  missing address must never block submission — the lat/long is the evidentiary part.

**`PRODUCTION TODO`:** if volume grows or accuracy in rural Haryana proves insufficient,
switch to the Google Geocoding API — paid, keyed, but with better Indian address coverage.
Keep the lookup behind a single `reverseGeocode()` function so this is a one-file swap.

### 5.8 One-tap engineer selection — no login

A login screen is friction in a 90-second pitch. On app open, show a simple grid of
engineer cards; one tap selects the engineer and persists the choice to `localStorage`. A
small "switch engineer" control sits in the header.

Keep the `Engineer` table and route all reads through a single `getCurrentEngineer()`
helper, so real authentication drops in behind it later.

**`PRODUCTION TODO`:** replace one-tap selection with NextAuth (credentials or phone OTP),
plus admin/engineer role separation.

### 5.9 Draft autosave and offline tolerance

Sites frequently have poor mobile signal. Persist the in-progress wizard state to
`localStorage` on every change, restore it on reload, and clear it on successful submit.
Show a "Draft restored" notice when recovering. Submission failures must retain the draft
and offer retry — never lose a filled sheet.

### 5.10 Site photo capture

The engineer attaches **2–5 photos** of the completed installation, taken directly from the
phone camera (`<input type="file" accept="image/*" capture="environment">`). Photos are
compressed client-side before upload and render in a grid on page 2 of the PDF.

This directly replaces the "office receives a smudged phone photo of a paper form" failure
mode with a structured photo record attached to the job. It is a key selling point —
feature it in the demo.

**Use Vercel Blob for the demo, not just for production.** Vercel's filesystem is read-only
at runtime — the same constraint that rules out SQLite in section 3 — so writing to
`/public/uploads` fails in the deployed demo and photo upload breaks in front of the client.
Vercel Blob is free tier and is roughly ten lines behind the `uploadFile()` abstraction.

Isolate all upload logic behind a single `uploadFile()` module. That module writes to
`/public/uploads` **only when running locally** (no `BLOB_READ_WRITE_TOKEN` present) and to
Vercel Blob otherwise. Local disk is a development convenience, never the deployed path.

Add to `.env.example`:

```env
# Vercel Blob storage token — required for photo uploads on any deployed environment.
# Vercel's filesystem is read-only at runtime, so /public/uploads works ONLY in local dev.
BLOB_READ_WRITE_TOKEN=""
```

---

## 6. PDF specification

A4 portrait, generated with `@react-pdf/renderer`, reproducing the printed letterhead so
the customer receives something recognisably from Khurana Electronics.

### 6.1 Devanagari font registration — CRITICAL, do not skip

`@react-pdf/renderer` defaults to Helvetica, **which contains no Devanagari glyphs.** Hindi
is a headline feature of this product, so getting this wrong is visible to the client in the
generated PDF.

**Use Mukta (SIL OFL), not Noto Sans Devanagari.** This is not a style preference — it is a
workaround for a real library bug found during the build:

- `fontkit` 2.0.4 (bundled with `@react-pdf/renderer` 4.9, and the latest release) **throws**
  `Cannot read properties of null (reading 'xCoordinate')` while shaping certain Devanagari
  clusters in Noto Sans Devanagari. `रे` (U+0930 U+0947) is one of them, so the everyday word
  **कैमरे** ("cameras") crashes PDF generation outright. Both the hinted and unhinted Noto
  builds fail identically, so it is the library, not the font file.
- Plain **Noto Sans is worse**: it does not throw, it silently renders Devanagari codepoints
  as overlapping Latin glyphs. The PDF generates "successfully" and looks like garbage.
- **Mukta** shapes every string this app ships, in both weights, and covers Latin as well —
  so one family serves the whole document.

```ts
import { Font } from '@react-pdf/renderer'

Font.register({
  family: 'Mukta',
  fonts: [
    { src: path.join(dir, 'Mukta-Regular.ttf'), fontWeight: 'normal' },
    { src: path.join(dir, 'Mukta-Bold.ttf'),    fontWeight: 'bold'   },
  ],
})
Font.registerHyphenationCallback((word) => [word]) // never break mid-cluster
```

Requirements:

- **Commit the `.ttf` files to `/public/fonts/`** and read them from disk. Do **not** load
  from a CDN — a network failure at render time silently reintroduces the bug, and the demo
  may run on venue wifi.
- Apply `fontFamily: 'Mukta'` to **every `Text` node**, since any of them may carry Hindi.

**Verification gate — Phase 5 is not complete until this passes.** Generate a PDF containing
`मुख्य द्वार पर कैमरा नया लगा दिया` and **look at the rendered page** — render it to an image
and inspect it. Do **not** accept "no exception was thrown" or a plausible byte count as
proof: the Noto Sans failure mode produces a valid, correctly-sized PDF full of garbage
glyphs. Include `कैमरे` in the test string specifically, since that is the cluster that
breaks.

### 6.2 Letterhead — use image assets, do not hand-code the geometry

The printed form has a blue geometric header band with the Khurana Electronics and BILLS
logos, and a footer strip of brand logos (Hikvision, Ahuja, TVT, CP Plus, JBL, Bosch).

**Do not attempt to reconstruct this artwork with `@react-pdf/renderer` primitives.** It
would consume disproportionate effort for a demo and still look approximate. Instead:

- Use **one header image asset** and **one footer brand-strip image asset**, positioned
  absolutely at the top and bottom of the page.
- Hand-build only the **table structures and the filled data**, which is where the actual
  value of this product lies.

Until the client supplies artwork, use placeholder images at the correct aspect ratio
(header approximately 2480×400px, footer strip approximately 2480×200px at 300dpi A4 width).

**`CLIENT TO SUPPLY`:** the original letterhead artwork. Their printer will have the source
file (AI, CDR, or print-ready PDF). Dropping it in replaces the placeholders with no code
change.

### 6.3 Page 1 layout

1. Header image, absolutely positioned
2. `JOBSHEET` title and `KHURANA ELECTRONICS` wordmark
3. Header block — Date, Job No., Engg. Name, Contact Person, Mob No., Site & Firm Name,
   Address, Date of Work Done, Checked and Hand Over Report by Engg.
4. Products table — all filled rows with visible borders, matching the paper column order:
   S.No. | New Product/Description | Model No. | Qty. | Return Mat. | Consumed Mat.
5. Faulty material table — S.No. | Description | Qty. | Client Name
6. Remarks block and the client's-other-materials block, side by side
7. Fixed letterhead confirmation text and address block (section 4.5, verbatim)
8. Signature image, with the captured GPS location and reverse-geocoded address printed
   beneath it under the label `LOCATION`
9. Footer brand-strip image
10. **Google review QR code** in the footer — printed on the paper form and both filled
    sheets. Generate from `NEXT_PUBLIC_GOOGLE_REVIEW_URL` using the `qrcode` package.
    **`CLIENT TO SUPPLY`:** the Google review URL.

### 6.4 Page 2 — site photos

Rendered only when photos are attached. A titled grid of the site photos, two per row, each
captioned with its capture timestamp, with the job number repeated in the page header.

---

## 7. Sharing

After a successful submit, the confirmation screen offers three actions:

1. **Download PDF** — direct download
2. **Copy link** — public URL at `/job/[shareToken]/pdf`
3. **Send on WhatsApp** — a `wa.me` deep link, pre-filled with the client's mobile number
   and a message containing the job number and the public PDF URL:

```
https://wa.me/91XXXXXXXXXX?text=<url-encoded message>
```

Message template:

```
Namaste {contactPerson},

Your job sheet from Khurana Electronics is ready.
Job No: {jobNo}
Date: {date}

View / download: {pdfUrl}

Thank you for your business.
Khurana Electronics, Sonipat
0130-4018060 | 9053000270
```

WhatsApp was chosen over email deliberately: the customer base uses it universally, and it
needs no email service, no domain verification and no per-message cost.

### 7.1 Public links must use an unguessable token, not the job number

Job numbers are sequential and therefore trivially enumerable: a customer who receives
`KE-20260904-001` can change the final digits and read **every other customer's job sheet**,
exposing names, site addresses and mobile numbers. This is a privacy defect, not a
theoretical one.

- Add `shareToken String @unique` to `JobSheet` (section 8), generated at submit time with
  `nanoid()` (21 characters, URL-safe).
- The **public** route is `/job/[shareToken]/pdf` and looks the sheet up by token only.
  It must never accept a job number.
- **Internal** routes (`/jobs`, `/jobs/[id]`) continue to use the job number and the record
  id — those sit behind engineer selection and, in production, behind authentication.

**`PRODUCTION TODO`:** consider expiring tokens, and a per-sheet revoke action for the
office.

---

## 8. Data model (Prisma)

```prisma
model Engineer {
  id        String     @id @default(cuid())
  name      String
  phone     String?
  active    Boolean    @default(true)
  jobSheets JobSheet[]
  createdAt DateTime   @default(now())
}

model Client {
  id        String     @id @default(cuid())
  firmName  String
  contactPerson String?
  phone     String?
  address   String?
  jobSheets JobSheet[]
  createdAt DateTime   @default(now())
}

model Product {
  id       String  @id @default(cuid())
  name     String
  modelNo  String?
  brand    String?
  category String?
  active   Boolean @default(true)
}

model JobSheet {
  id              String   @id @default(cuid())
  jobNo           String   @unique          // KE-YYYYMMDD-NNN — internal, sequential
  shareToken      String   @unique          // nanoid(21) — the ONLY id used in public URLs
  date            DateTime
  dateOfWorkDone  DateTime?

  engineerId      String
  engineer        Engineer @relation(fields: [engineerId], references: [id])

  clientId        String?
  client          Client?  @relation(fields: [clientId], references: [id])

  // Header block — denormalised so the sheet is an immutable record of what was
  // submitted, even if the Client row is edited later.
  siteFirmName    String
  contactPerson   String
  mobileNo        String
  address         String
  handoverReport  String?                   // CHECKED AND HAND OVER REPORT BY ENGG.

  // Footer blocks
  remarks         String?
  clientOtherMaterials String?              // PRODUCTS/PARTS WORTH AND OTHER MATERIALS...

  // Sign-off
  signatureData   String?                   // base64 PNG
  latitude        Float?
  longitude       Float?
  locationAddress String?                   // reverse-geocoded

  lineItems       JobLineItem[]
  faultyItems     FaultyItem[]
  photos          JobPhoto[]

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model JobLineItem {
  id          String   @id @default(cuid())
  jobSheetId  String
  jobSheet    JobSheet @relation(fields: [jobSheetId], references: [id], onDelete: Cascade)
  sortOrder   Int
  description String
  modelNo     String?
  qty         Int      @default(0)
  returnMat   Int      @default(0)
  consumedMat Int      @default(0)
}

model FaultyItem {
  id          String   @id @default(cuid())
  jobSheetId  String
  jobSheet    JobSheet @relation(fields: [jobSheetId], references: [id], onDelete: Cascade)
  sortOrder   Int
  description String                        // Hindi + English
  qty         Int      @default(0)
  clientName  String?
}

model JobPhoto {
  id         String   @id @default(cuid())
  jobSheetId String
  jobSheet   JobSheet @relation(fields: [jobSheetId], references: [id], onDelete: Cascade)
  url        String
  caption    String?
  takenAt    DateTime @default(now())
}
```

---

## 9. Screens

| Route | Purpose |
|---|---|
| `/` | Engineer selection grid (one tap, persisted to `localStorage`) |
| `/jobs` | Job list — Today / All tabs, search by job no. or client name |
| `/jobs/new` | Five-step wizard (section 5.2) |
| `/jobs/[id]` | Job detail with embedded PDF preview and the three share actions |
| `/job/[shareToken]/pdf` | Public PDF route — the URL shared on WhatsApp (see 7.1) |
| `/admin/engineers` | Engineer CRUD |
| `/admin/clients` | Client CRUD |
| `/admin/products` | Product catalogue CRUD |
| `/demo/comparison` | **Before/after comparison** (section 10) |

---

## 10. Demo comparison screen

A dedicated page showing, side by side:

- **Left** — a photo of the original handwritten job sheet, with the illegible model number
  and the blank Date / Job No. / Mob No. fields visibly annotated
- **Right** — the generated PDF for the same job, fully filled, legible, signed, GPS-stamped

On mobile, stack vertically with a swipe toggle.

**Required asset:** the handwritten sheet photo must exist at
`/public/demo/original-sheet.jpg`. **`CLIENT TO SUPPLY`** — see section 12. Until it is
provided, commit a clearly labelled placeholder image at the same path bearing the text
"PLACEHOLDER — client to supply photo of completed handwritten job sheet", so the route
always renders rather than shipping an empty page or a broken image.

This is the single most persuasive moment in the pitch — it makes the problem and the
solution visible simultaneously, without anyone having to explain either. Place a clear
entry point to it from the job list.

---

## 11. Seed data

Nothing in the demo should ever appear empty.

**Engineers — use placeholders.** The names on the source sheets were handwritten and could
not be read reliably. Seed generic placeholders and mark them clearly:

```ts
// TODO: replace with actual engineer names from Khurana Electronics
const engineers = [
  { name: 'Engineer 1' },
  { name: 'Engineer 2' },
  { name: 'Engineer 3' },
  { name: 'Engineer 4' },
]
```

**`CLIENT TO SUPPLY`:** the real staff list, with mobile numbers.

Also seed:

- **~8 clients** — plausible Sonipat-area firm names with addresses and mobile numbers
- **~30 products** — across Hikvision, CP Plus, TVT, Dahua, Bosch, JBL and Ahuja, spanning
  the categories listed in section 5.3
- **5 completed job sheets** — spread across recent dates, with line items, faulty items,
  remarks, signatures, `shareToken`s and GPS coordinates in the Sonipat area, so the job
  list, PDF preview and comparison screen all have real content on first load. **At least
  one seeded sheet must contain Hindi text** in its remarks and faulty-material rows, so the
  Devanagari font path (section 6.1) is exercised the first time anyone generates a PDF.

---

## 12. Client to supply

Collect these from Khurana Electronics before the production build. The demo works with
placeholders for all of them.

| Item | Used for |
|---|---|
| Letterhead artwork (AI / CDR / print-ready PDF) | PDF header and footer brand strip (6.2) |
| Google review URL | QR code in the PDF footer (6.3) |
| **Photo of a completed handwritten job sheet**, placed at `/public/demo/original-sheet.jpg` | Comparison screen (section 10) |
| Contact email for the Nominatim `User-Agent` header | Reverse geocoding (5.7) |
| Real engineer names and mobile numbers | Seed data (section 11) |
| Existing client list | Client table pre-population |
| Actual product/model catalogue | Product dropdowns (5.3) |
| Confirmation of `JOB NO.` vs `REF. NO.` | Field label (4.1) |
| Confirmation of letterhead copy, including the `INSTALLTION` spelling | Fixed PDF text (4.5) |

---

## 13. Build order

Each phase should end in something runnable and demonstrable.

**Phase 1 — Foundation**
Next.js + TypeScript + Tailwind + shadcn/ui. Prisma with Postgres. Full schema from
section 8. Seed script per section 11. `.env.example` per section 3.

**Phase 2 — Engineer selection and job list**
Engineer grid at `/`, `localStorage` persistence, `getCurrentEngineer()` helper. Job list
with Today/All tabs and search.

**Phase 3 — The wizard**
All five steps, per-step validation, auto job number with the retry loop from 5.1, product
comboboxes, quantity steppers, Hindi remark quick-chips, `localStorage` draft autosave and
restore.

**Phase 4 — Sign-off**
Signature pad with submit blocking. GPS capture with the Nominatim route handler, caching
and coordinate fallback per 5.7. Site photo capture with client-side compression, uploading
through the `uploadFile()` abstraction to Vercel Blob per 5.10.

**Phase 5 — PDF**
`@react-pdf/renderer` document per section 6, with placeholder header/footer images, all
tables, signature, GPS, QR code, and page 2 photo grid. Registered Devanagari font per 6.1,
including the verification gate. Public `/job/[shareToken]/pdf` route per 7.1.

**Phase 6 — Sharing**
Download, copy link, and `wa.me` deep link with the message template from section 7.

**Phase 7 — Admin**
Engineers, clients and products CRUD.

**Phase 8 — Demo polish**
The `/demo/comparison` screen, with the placeholder asset from section 10. Loading and empty
states. PWA manifest and icons so the app installs to the phone home screen. Deploy to
Vercel and **re-verify on the deployed URL** that photo upload and PDF generation both work
— these are the two paths that behave differently on Vercel than they do locally.

---

## 14. Demo script (90 seconds)

1. **Open on a phone.** Tap an engineer's name. No login, no friction. *(5s)*
2. **Tap "New Job".** Job number and date fill themselves — "these are the three fields
   that are blank on almost every paper sheet you showed me." *(10s)*
3. **Pick the client** from the list; address and contact fill in automatically. *(10s)*
4. **Add products.** Type "hik", select a camera from the dropdown — the model number fills
   itself. "This is the field the office can never read." Tap the quantity steppers. *(20s)*
5. **Faulty material.** Type a line in Hindi. Tap a quick-chip. *(10s)*
6. **Take two photos** of the installation with the phone camera. *(10s)*
7. **Customer signs** on the screen. GPS captures automatically — "proof of the visit, at
   that address, at that time. Your paper form can't do this." *(10s)*
8. **Submit.** PDF appears. Tap "Send on WhatsApp" — the message opens, pre-filled, ready
   to send to the customer, from site. *(10s)*
9. **Open the comparison screen.** The original handwritten sheet beside the generated PDF.
   Say nothing. *(5s)*

---

## 15. Production roadmap

Deferred from the demo, and worth naming in the pitch so the client sees the path forward:

- **Authentication** — NextAuth with phone OTP; admin and engineer roles
- **File storage** — the demo already uses Vercel Blob (5.10); migrate to S3 or Cloudflare R2
  only if volume or cost makes it worthwhile
- **Share link lifecycle** — token expiry and a per-sheet revoke action for the office (7.1)
- **Geocoding** — Google Geocoding API if Nominatim's rural coverage proves insufficient (5.7)
- **Reporting** — jobs per engineer, material consumption reconciliation, monthly summaries
- **Inventory** — deduct consumed material from a live stock table
- **Customer portal** — clients view their own service history
- **Offline-first** — a service worker with a background submission queue for dead-zone sites
- **AMC tracking** — contract expiry reminders and scheduled service visits
