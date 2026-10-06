# curl Test Evidence

Base URL: `https://campus-equipment-booking-api.course-management-api.workers.dev/api`
using the deployed Cloudflare Worker and remote Cloudflare D1.

The following production checks were run against the deployed Worker on
2026-10-06 after applying `migrations/0001_initial.sql` with
`wrangler d1 migrations apply campus-equipment-bookings --remote`.

## 1. List bookings — success

```text
GET /bookings
HTTP/2 200
[]
```

## 2. Seeded equipment — success

```text
GET /equipment
HTTP/2 200
[{"id":"eq-1","name":"Projector A","location":"Building 1"},{"id":"eq-2","name":"Camera Kit B","location":"Media Lab"}]
```

## 3. Create booking — success

```text
POST /bookings
HTTP/2 201
{"id":"04ba7f1d-16a3-49a1-aea9-dca4f159ac31","equipmentId":"eq-2","borrowerName":"Final Production Test","startAt":"2026-11-01T09:00:00.000Z","endAt":"2026-11-01T11:00:00.000Z","purpose":"Final CRUD verification"}
```

## 4. Read one booking — success

```text
GET /bookings/04ba7f1d-16a3-49a1-aea9-dca4f159ac31
HTTP/2 200
{"id":"04ba7f1d-16a3-49a1-aea9-dca4f159ac31","equipmentId":"eq-2","borrowerName":"Final Production Test","startAt":"2026-11-01T09:00:00.000Z","endAt":"2026-11-01T11:00:00.000Z","purpose":"Final CRUD verification"}
```

## 5. Overlapping booking — conflict error

```text
POST /bookings (eq-1, 10:00–12:00)
HTTP/2 409
{"error":"Booking time conflicts with an existing booking"}
```

## 6. Invalid time range — validation error

```text
POST /bookings (startAt 13:00, endAt 12:00)
HTTP/2 400
{"error":"startAt must be before endAt"}
```

## 7. Missing booking — not-found error

```text
GET /bookings/not-found
HTTP/2 404
{"error":"Booking not found"}
```

## 8. Update and delete — success

```text
PATCH /bookings/04ba7f1d-16a3-49a1-aea9-dca4f159ac31
HTTP/2 200
{"id":"04ba7f1d-16a3-49a1-aea9-dca4f159ac31","equipmentId":"eq-2","borrowerName":"Final Production Test","startAt":"2026-11-01T09:00:00.000Z","endAt":"2026-11-01T11:00:00.000Z","purpose":"Updated final CRUD verification"}

DELETE /bookings/04ba7f1d-16a3-49a1-aea9-dca4f159ac31
HTTP/2 204
```

After deletion, the same GET returned `404 Booking not found`, confirming that
the delete was persistent. The final production list returned `[]`, so the
verification booking was removed.
