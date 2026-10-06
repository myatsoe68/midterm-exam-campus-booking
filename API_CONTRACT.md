# Campus Equipment Booking API Contract

Production Base URL:
`https://campus-equipment-booking-api.course-management-api.workers.dev/api`

Local development Base URL: `http://localhost:8787/api`

The API runs on Cloudflare Workers and stores data in a D1 SQLite database
through the `DB` binding configured in `wrangler.jsonc`.

## Equipment

`GET /equipment` returns `200` and a JSON array of seeded equipment:

```json
[
  { "id": "eq-1", "name": "Projector A", "location": "Building 1" },
  { "id": "eq-2", "name": "Camera Kit B", "location": "Media Lab" }
]
```

## Bookings

| Method | Path | Success | Description |
| --- | --- | ---: | --- |
| GET | `/bookings` | 200 | List bookings ordered by start time |
| GET | `/bookings/:id` | 200 | Return one booking |
| POST | `/bookings` | 201 | Create a booking |
| PATCH | `/bookings/:id` | 200 | Partially update a booking |
| DELETE | `/bookings/:id` | 204 | Delete a booking |

Create and update fields:

```json
{
  "equipmentId": "eq-1",
  "borrowerName": "Somchai Jaidee",
  "startAt": "2026-10-20T09:00:00.000Z",
  "endAt": "2026-10-20T11:00:00.000Z",
  "purpose": "Class presentation"
}
```

All fields are required when creating. PATCH accepts one or more fields and validates
the complete booking after merging the patch with the stored record. Date-times are
normalized to ISO-8601 UTC strings. An interval ending exactly when another starts
does not overlap.

## Validation and errors

Every error is JSON: `{ "error": "..." }`.

- `400`: malformed/missing fields, invalid date order, or unknown equipment.
- `404`: requested booking or route does not exist.
- `409`: the same equipment has an existing booking where
  `existing.startAt < requested.endAt` and `existing.endAt > requested.startAt`.

## Data model

```text
equipment (1) ────────< bookings (many)
id PK                    id PK
                         equipment_id FK -> equipment.id
                         borrower_name
                         start_at
                         end_at
                         purpose
```

The SQLite schema enables foreign keys. Every SQL statement uses `?` parameter
bindings; request values are never concatenated into SQL.
