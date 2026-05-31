# CaribGateway — Database Schema

> **Stack:** Supabase (PostgreSQL 15) · TypeScript types in `caribgateway/lib/` · Migrations in `supabase/migrations/`

---

## Table of Contents

1. [Design Principles](#design-principles)
2. [Entity Relationship Overview](#entity-relationship-overview)
3. [Tables](#tables)
   - [countries](#countries)
   - [destinations](#destinations)
   - [categories](#categories)
   - [businesses](#businesses)
   - [business_images](#business_images)
   - [tags & business_tags](#tags--business_tags)
4. [Enums](#enums)
5. [JSONB Shapes](#jsonb-shapes)
6. [Indexes Strategy](#indexes-strategy)
7. [Row Level Security](#row-level-security)
8. [Migration Order](#migration-order)
9. [Future Expansion Hooks](#future-expansion-hooks)
10. [TypeScript Layer](#typescript-layer)

---

## Design Principles

| Principle | Implementation |
|-----------|---------------|
| **UUID everywhere** | `gen_random_uuid()` primary keys — safe for distributed inserts, no sequential leakage |
| **Soft deletes** | Every mutable table has `is_active BOOLEAN`. Hard deletes are avoided to preserve referential integrity |
| **Slugs on all user-facing entities** | Stable, human-readable URL identifiers. Generated client-side via the `slugify()` SQL function |
| **`updated_at` auto-stamped** | A shared `set_updated_at()` trigger is applied to every mutable table |
| **Extensible via JSONB** | `metadata JSONB` on `businesses` and `countries`/`destinations` avoids premature column proliferation |
| **RLS-first** | Row Level Security enabled on every table from day one. Policies start permissive-read / blocked-write and will tighten when auth lands |
| **Enum for closed sets, JSONB for open sets** | `business_type`, `price_range`, `publish_status` are enums. Type-specific attributes (star ratings, cuisine types) go in `metadata` |

---

## Entity Relationship Overview

```
countries
  └── destinations (country_id → countries.id)
        └── businesses (destination_id → destinations.id)
              ├── business_images (business_id → businesses.id, CASCADE DELETE)
              └── business_tags  (business_id → businesses.id, CASCADE DELETE)
                    └── tags    (tag_id → tags.id)

categories (self-referential: parent_id → categories.id)
  └── businesses (category_id → categories.id)
```

Cardinality summary:

- `countries` → `destinations` : 1 → N (Trinidad and Tobago has two island destinations)
- `destinations` → `businesses` : 1 → N
- `categories` → `categories` : 1 → N (parent → children, arbitrary depth)
- `categories` → `businesses` : 1 → N
- `businesses` → `business_images` : 1 → N (max one `is_primary = true`)
- `businesses` ↔ `tags` : M → N (via `business_tags`)

---

## Tables

### `countries`

Top-level geographic entities. One row per sovereign state or territory.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | `gen_random_uuid()` |
| `name` | TEXT | Full English name |
| `iso_code` | CHAR(2) UNIQUE | ISO 3166-1 alpha-2 |
| `iso_code_3` | CHAR(3) | ISO 3166-1 alpha-3 |
| `slug` | TEXT UNIQUE | URL key, e.g. `jamaica` |
| `flag_emoji` | TEXT | Single Unicode flag emoji |
| `description` | TEXT | Short editorial description |
| `capital` | TEXT | Capital city name |
| `currency_code` | CHAR(3) | ISO 4217 |
| `languages` | TEXT[] | Array of spoken languages |
| `timezone` | TEXT | IANA timezone identifier |
| `is_active` | BOOLEAN | Soft-delete flag |
| `metadata` | JSONB | Extensible attributes |

**Design note:** Countries are reference data — they change rarely. Adding a new Caribbean territory is a single INSERT with no schema change.

---

### `destinations`

Islands, towns, beaches, and geographic areas within a country.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `country_id` | UUID FK → `countries` | |
| `name` | TEXT | Display name |
| `slug` | TEXT UNIQUE | URL key, e.g. `grand-cayman` |
| `destination_type` | `destination_type` enum | island / town / beach / area / region |
| `short_description` | TEXT | 1–2 sentence summary |
| `description` | TEXT | Full editorial copy |
| `latitude` | DECIMAL(10,8) | WGS-84 |
| `longitude` | DECIMAL(11,8) | WGS-84 |
| `hero_image_url` | TEXT | Cover image URL |
| `is_featured` | BOOLEAN | Promoted on homepage |
| `sort_order` | SMALLINT | Manual ordering |
| `metadata` | JSONB | best_time_to_visit, airport_code, etc. |

**Design note:** Destinations are intentionally separate from countries so multi-island nations (Trinidad & Tobago, Saint Kitts & Nevis) are represented correctly. A `destination_type` of `town` or `area` enables city-level filtering in future.

---

### `categories`

Self-referential classification tree.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `parent_id` | UUID FK → `categories` nullable | NULL = top-level |
| `name` | TEXT | Display label |
| `slug` | TEXT UNIQUE | |
| `description` | TEXT | |
| `icon` | TEXT | Emoji or icon name |
| `color` | TEXT | Hex for UI theming |
| `sort_order` | SMALLINT | |
| `is_active` | BOOLEAN | |

Top-level categories (parent_id IS NULL) map 1-to-1 with `business_type` enum values:

| Category slug | Enum value |
|---|---|
| `hotels-accommodation` | `hotel` |
| `restaurants-dining` | `restaurant` |
| `attractions` | `attraction` |
| `tour-operators` | `tour_operator` |
| `transportation` | `transportation` |

Child categories (e.g. `all-inclusive-resorts`, `fine-dining`) allow UI-level filtering without requiring enum changes.

**Design note:** The self-referential pattern supports arbitrarily deep trees but two levels is sufficient for now. A recursive CTE can retrieve the full tree in one query.

---

### `businesses`

Central table. Every tourism listing — hotel, restaurant, attraction, tour operator, or transportation provider — is one row here.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `destination_id` | UUID FK → `destinations` | |
| `category_id` | UUID FK → `categories` | |
| `business_type` | `business_type` enum | Denormalised for indexed queries |
| `owner_id` | TEXT nullable | Future: Supabase `auth.users` UUID |
| `name` | TEXT | |
| `slug` | TEXT UNIQUE | |
| `short_description` | TEXT | Card copy (≤ 160 chars) |
| `description` | TEXT | Full detail page copy |
| `address_line1/2` | TEXT | |
| `city` | TEXT | |
| `latitude/longitude` | DECIMAL | WGS-84 |
| `phone/email/website` | TEXT | |
| `social_links` | JSONB | See [JSONB Shapes](#jsonb-shapes) |
| `price_range` | `price_range` enum | budget / moderate / upscale / luxury |
| `hours_of_operation` | JSONB | Per-day open/close times |
| `amenities` | TEXT[] | GIN-indexed for containment queries |
| `features` | TEXT[] | GIN-indexed |
| `is_verified` | BOOLEAN | Editorial verification badge |
| `is_featured` | BOOLEAN | Homepage/carousel promotion |
| `status` | `publish_status` enum | draft / published / archived |
| `avg_rating` | DECIMAL(3,2) | Denormalised; maintained by trigger (reviews migration) |
| `review_count` | INT | Denormalised; maintained by trigger |
| `metadata` | JSONB | Type-specific attributes (see below) |

**Why `business_type` is denormalised:** The category tree is hierarchical. Filtering all hotels in Jamaica would require a recursive CTE through categories. Storing `business_type` on `businesses` directly allows a simple `WHERE business_type = 'hotel'` with a B-tree index — critical for listing page performance.

---

### `business_images`

Images attached to a business, stored in Supabase Storage.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `business_id` | UUID FK → `businesses` ON DELETE CASCADE | |
| `url` | TEXT | Public CDN URL |
| `storage_path` | TEXT | Path inside Storage bucket for server-side ops |
| `alt_text` | TEXT | Accessibility & SEO |
| `caption` | TEXT | Optional display caption |
| `is_primary` | BOOLEAN | Hero image (enforced unique per business) |
| `sort_order` | SMALLINT | Gallery order |
| `width/height` | SMALLINT | Intrinsics for `<Image>` layout |
| `mime_type` | TEXT | e.g. `image/webp` |
| `file_size` | INT | Bytes |

**Partial unique index** on `(business_id) WHERE is_primary = true` guarantees each business has at most one primary image.

**No `updated_at`:** Images are immutable once uploaded. Replacing an image means inserting a new row and deleting the old one.

---

### `tags` & `business_tags`

Flat, cross-cutting editorial labels.

| `tags` column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `name` | TEXT UNIQUE | Display label |
| `slug` | TEXT UNIQUE | |
| `color` | TEXT | Hex for badge theming |

| `business_tags` column | Type | Notes |
|---|---|---|
| `business_id` | UUID FK → `businesses` CASCADE | |
| `tag_id` | UUID FK → `tags` CASCADE | |

Composite PK `(business_id, tag_id)` prevents duplicates.

**Tags vs Categories:** Categories are structural (hierarchical, owned by the taxonomy). Tags are editorial (flat, cross-type). Example tags seeded: `pet-friendly`, `eco-certified`, `adults-only`, `editors-choice`.

---

## Enums

```sql
business_type    hotel | restaurant | attraction | tour_operator | transportation
destination_type island | town | beach | area | region
price_range      budget | moderate | upscale | luxury
publish_status   draft | published | archived
```

To add a value to an enum in PostgreSQL: `ALTER TYPE business_type ADD VALUE 'spa';`
This is non-transactional in PostgreSQL — perform in a dedicated migration with no other DDL.

---

## JSONB Shapes

### `businesses.hours_of_operation`

```json
{
  "monday":    { "open": "09:00", "close": "17:00", "is_closed": false },
  "tuesday":   { "open": "09:00", "close": "17:00", "is_closed": false },
  "saturday":  { "open": "10:00", "close": "14:00", "is_closed": false },
  "sunday":    { "open": null,    "close": null,    "is_closed": true  },
  "exceptions": {
    "2026-12-25": { "open": null, "close": null, "is_closed": true }
  }
}
```

### `businesses.social_links`

```json
{
  "facebook":    "https://facebook.com/...",
  "instagram":   "https://instagram.com/...",
  "twitter":     "https://twitter.com/...",
  "tripadvisor": "https://tripadvisor.com/...",
  "google_maps": "https://maps.google.com/..."
}
```

### `businesses.metadata` (by business type)

| Type | Key shape |
|------|-----------|
| `hotel` | `{ star_rating, check_in, check_out, total_rooms, pool, gym, spa, beach_access, all_inclusive }` |
| `restaurant` | `{ cuisine_types[], reservation_required, outdoor_seating, delivery_available, halal, vegetarian_options }` |
| `attraction` | `{ duration_minutes, age_min, age_max, guided_only, outdoor }` |
| `tour_operator` | `{ tour_types[], max_group_size, languages_spoken[], pickup_available }` |
| `transportation` | `{ vehicle_types[], service_area, airport_transfers, driver_included }` |

---

## Indexes Strategy

### B-tree (equality / range)

| Table | Column(s) | Purpose |
|---|---|---|
| `countries` | `iso_code`, `slug` | Look-up by code or URL |
| `destinations` | `country_id`, `slug`, `destination_type` | Browse & routing |
| `categories` | `parent_id`, `slug` | Tree traversal |
| `businesses` | `destination_id`, `category_id`, `business_type`, `slug`, `status` | Core list queries |
| `businesses` | `(destination_id, business_type)` WHERE published | Main browse page composite |

### Partial (filtered)

`WHERE is_active = true` or `WHERE is_featured = true` on key tables — only indexes the rows the application actually reads, keeping index size small.

### GIN (array & JSONB containment)

| Column | Query pattern |
|---|---|
| `businesses.amenities` | `amenities @> ARRAY['pool','gym']` |
| `businesses.features` | `features @> ARRAY['sea-view']` |
| `businesses.metadata` | `metadata @> '{"pool": true}'` |

### Trigram (ILIKE / full-text search)

| Column | Query pattern |
|---|---|
| `destinations.name` | `name ILIKE '%tobago%'` |
| `businesses.name` | `name ILIKE '%hilton%'` |
| `businesses.short_description` | `short_description ILIKE '%diving%'` |

---

## Row Level Security

RLS is enabled on all tables from the first migration. Current policy matrix:

| Table | Public SELECT | Authenticated write |
|---|---|---|
| `countries` | Active rows only | Blocked (admin migration) |
| `destinations` | Active rows only | Blocked |
| `categories` | Active rows only | Blocked |
| `businesses` | Published + active only | Blocked (placeholder policy) |
| `business_images` | Images of published businesses | Blocked |
| `tags` | Active tags | Blocked |
| `business_tags` | All | Blocked |

When authentication is added:
- `INSERT/UPDATE` on `businesses` will require `owner_id = auth.uid()`
- Admin bypass via a custom JWT claim (e.g. `app_role = 'admin'`)
- Service-role key continues to bypass all RLS for server-side admin operations

---

## Migration Order

```
0001_extensions.sql          pg_trgm, unaccent, pgcrypto
0002_enums.sql               business_type, destination_type, price_range, publish_status
0003_utility_functions.sql   slugify(), set_updated_at(), create_updated_at_trigger()
0004_countries.sql           countries table + indexes + trigger
0005_destinations.sql        destinations table + indexes + trigger
0006_categories.sql          categories table (self-ref FK) + indexes + trigger
0007_businesses.sql          businesses table + indexes + trigger
0008_business_images.sql     business_images + partial unique index
0009_tags.sql                tags + business_tags junction
0010_rls.sql                 Row Level Security policies
0011_seed_reference_data.sql Countries, destinations, categories, starter tags
```

Each file is idempotent where possible (`CREATE EXTENSION IF NOT EXISTS`, `CREATE OR REPLACE FUNCTION`). Tables use bare `CREATE TABLE` — re-running on an existing DB will error, which is intentional (migrations run once via `supabase db push`).

---

## Future Expansion Hooks

All hooks are **already present** in the schema — no backfill migrations needed.

### User accounts (`auth.users`)

- `businesses.owner_id TEXT` — stores a Supabase auth UUID. To activate:
  1. `ALTER TABLE businesses ALTER COLUMN owner_id TYPE UUID USING owner_id::uuid;`
  2. `ALTER TABLE businesses ADD CONSTRAINT fk_owner FOREIGN KEY (owner_id) REFERENCES auth.users(id);`
  3. Add `INSERT/UPDATE` RLS policies scoped to `owner_id = auth.uid()`

### Reviews

```sql
CREATE TABLE reviews (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id   UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES auth.users(id),
  rating        SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title         TEXT,
  body          TEXT,
  status        publish_status NOT NULL DEFAULT 'draft',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

A trigger on `reviews` will maintain `businesses.avg_rating` and `businesses.review_count` — those columns are already present.

### Bookings

```sql
CREATE TABLE bookings (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id   UUID NOT NULL REFERENCES businesses(id),
  user_id       UUID NOT NULL REFERENCES auth.users(id),
  check_in      DATE,
  check_out     DATE,
  party_size    SMALLINT,
  status        TEXT NOT NULL DEFAULT 'pending',  -- pending|confirmed|cancelled
  total_amount  DECIMAL(10,2),
  currency_code CHAR(3),
  metadata      JSONB NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### Additional islands / regions

No schema change required. Add rows to `countries` and `destinations` — the hierarchy handles any Caribbean territory.

### Admin dashboard

A separate `admin_users` table or a custom JWT claim (`app_role = 'admin'`) unlocks service-level RLS bypass. The `publish_status` enum (`draft` → `published` → `archived`) already models the editorial workflow.

---

## TypeScript Layer

```
caribgateway/lib/
├── database.types.ts    Raw Supabase-style Database interface (manually maintained until
│                        `supabase gen types typescript` replaces it)
├── types/
│   └── index.ts         Clean application types: resolved joins, UI helpers,
│                        filter param interfaces, display label maps
├── supabase.ts          createBrowserClient() and createServerClient() factories
└── ui-types.ts          Homepage display types (Destination card, Category card, NavLink)
```

Replace `lib/database.types.ts` with the auto-generated file at any time:

```bash
supabase gen types typescript --local > caribgateway/lib/database.types.ts
```

The rest of the type layer will continue to work because `lib/types/index.ts` imports from `@/lib/database.types`.
