# curl Test Evidence

Base URL:
`https://campus-equipment-booking-api.course-management-api.workers.dev/api`

These are the captured production responses from the deployed Cloudflare Worker
and remote Cloudflare D1 database.

## Captured production responses

### Case 1 - GET /equipment

```text
curl -i "$BASE_URL/equipment"

HTTP/2 200

[{"id":"eq-1","name":"Projector A","location":"Building 1"},{"id":"eq-2","name":"Camera Kit B","location":"Media Lab"}]
```

### Case 2 - POST /bookings

```text
HTTP/2 201

{"id":"5ab82ba3-d555-47dc-a83e-c98723879619","equipmentId":"eq-2","borrowerName":"Evidence Test User","startAt":"2026-12-01T09:00:00.000Z","endAt":"2026-12-01T11:00:00.000Z","purpose":"Evidence capture"}
```

### Case 3 - GET /bookings/:id

```text
HTTP/2 200

{"id":"5ab82ba3-d555-47dc-a83e-c98723879619","equipmentId":"eq-2","borrowerName":"Evidence Test User","startAt":"2026-12-01T09:00:00.000Z","endAt":"2026-12-01T11:00:00.000Z","purpose":"Evidence capture"}
```

### Case 4 - overlapping POST /bookings

```text
HTTP/2 409

{"error":"Booking time conflicts with an existing booking"}
```

### Case 5 - invalid time POST /bookings

```text
HTTP/2 400

{"error":"startAt must be before endAt"}
```

### Case 6 - PATCH /bookings/:id

```text
HTTP/2 200

{"id":"5ab82ba3-d555-47dc-a83e-c98723879619","equipmentId":"eq-2","borrowerName":"Evidence Test User","startAt":"2026-12-01T09:00:00.000Z","endAt":"2026-12-01T11:00:00.000Z","purpose":"Updated evidence capture"}
```

### Case 7 - DELETE /bookings/:id

```text
HTTP/2 204
```

### Case 8 - GET after DELETE

```text
HTTP/2 404

{"error":"Booking not found"}
```

The temporary booking used for cases 2-7 was deleted. A final
`GET /bookings` returned an empty array, confirming cleanup.
