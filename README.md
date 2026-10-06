# Campus Equipment Booking API (Cloudflare Workers + D1)

## Run

Requirements: Node.js 20+ and npm. Wrangler is included in the project.

```bash
npm install
npm run types
npm run dev
```

The API listens at `http://localhost:8787`. `wrangler dev` uses a local D1
database and applies the migration in `migrations/0001_initial.sql`, which
seeds `eq-1` (Projector A) and `eq-2` (Camera Kit B).

The deployed production API is:
`https://campus-equipment-booking-api.course-management-api.workers.dev/api`

Run the local D1 migration explicitly if needed:

```bash
npx wrangler d1 migrations apply campus-equipment-bookings --local
```

The full contract and schema are in [API_CONTRACT.md](./API_CONTRACT.md).
The tested requests and responses are in [TEST_EVIDENCE.md](./TEST_EVIDENCE.md).
The submission-ready visual evidence is [EVIDENCE_REPORT.pdf](./EVIDENCE_REPORT.pdf).

## Connect a real Cloudflare D1 database

The checked-in `wrangler.jsonc` is already connected to the assigned production
D1 database. To connect a different Cloudflare account or database, log in and
create or select a database:

```bash
npx wrangler login
npx wrangler d1 create campus-equipment-bookings
```

Copy the returned UUID into `wrangler.jsonc` as `database_id`, then apply the
schema remotely and deploy:

```bash
npx wrangler d1 migrations apply campus-equipment-bookings --remote
npx wrangler deploy
```

Do not commit account credentials. The local and remote D1 databases are
separate; use `--local` for development and `--remote` only for the intended
Cloudflare database.

## Quality and ownership

- [PRE_30_SNAPSHOT.md](./PRE_30_SNAPSHOT.md) records the initial implementation checkpoint.
- [QUALITY_GATE_REVIEW.md](./QUALITY_GATE_REVIEW.md) records the review findings, fixes, and verification.
- [AI_LOG.md](./AI_LOG.md) records how AI assistance was used and what was verified manually.
