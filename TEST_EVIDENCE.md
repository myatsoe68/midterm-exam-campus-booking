# cURL Test Evidence

```bash
BASE_URL="https://campus-equipment-booking-api.course-management-api.workers.dev/api"
```

The following tests were run in order against the deployed Worker and remote
D1 database on 2026-10-06. The request payloads and order match
[curl_test_guide.md](./curl_test_guide.md).

## 1. List equipment — expect `200`

```text
GET /equipment
HTTP/2 200
[{"id":"eq-1","name":"Projector A","location":"Building 1"},{"id":"eq-2","name":"Camera Kit B","location":"Media Lab"}]
```

## 2. List bookings — expect `200`

```text
GET /bookings
HTTP/2 200
[]
```

## 3. Create a booking — expect `201`

Request body:

```json
{
  "equipmentId": "eq-1",
  "borrowerName": "Somchai Jaidee",
  "startAt": "2026-10-20T09:00:00.000Z",
  "endAt": "2026-10-20T11:00:00.000Z",
  "purpose": "Class presentation"
}
```

Response:

```text
POST /bookings
HTTP/2 201
{"id":"98c768ec-5302-494a-8208-42a6913a7f45","equipmentId":"eq-1","borrowerName":"Somchai Jaidee","startAt":"2026-10-20T09:00:00.000Z","endAt":"2026-10-20T11:00:00.000Z","purpose":"Class presentation"}
```

The returned ID was used as:

```bash
BOOKING_ID="98c768ec-5302-494a-8208-42a6913a7f45"
```

## 4. Get one booking — expect `200`

```text
GET /bookings/$BOOKING_ID
HTTP/2 200
{"id":"98c768ec-5302-494a-8208-42a6913a7f45","equipmentId":"eq-1","borrowerName":"Somchai Jaidee","startAt":"2026-10-20T09:00:00.000Z","endAt":"2026-10-20T11:00:00.000Z","purpose":"Class presentation"}
```

## 5. Update a booking — expect `200`

Request body:

```json
{
  "equipmentId": "eq-1",
  "borrowerName": "Somchai Jaidee",
  "startAt": "2026-10-20T12:00:00.000Z",
  "endAt": "2026-10-20T14:00:00.000Z",
  "purpose": "Updated class presentation"
}
```

Response:

```text
PATCH /bookings/$BOOKING_ID
HTTP/2 200
{"id":"98c768ec-5302-494a-8208-42a6913a7f45","equipmentId":"eq-1","borrowerName":"Somchai Jaidee","startAt":"2026-10-20T12:00:00.000Z","endAt":"2026-10-20T14:00:00.000Z","purpose":"Updated class presentation"}
```

## 6. Invalid time range — expect `400`

Request body used the guide's values: `startAt` 11:00 and `endAt` 09:00.

```text
POST /bookings
HTTP/2 400
{"error":"startAt must be before endAt"}
```

## 7. Overlapping booking — expect `409`

The update in step 5 leaves `eq-1` booked from 12:00 to 14:00. The guide's
12:30–13:30 request was rejected:

```text
POST /bookings
HTTP/2 409
{"error":"Booking time conflicts with an existing booking"}
```

## 8. Missing booking — expect `404`

```text
GET /bookings/not-found
HTTP/2 404
{"error":"Booking not found"}
```

## 9. Delete a booking — expect `204`

```text
DELETE /bookings/$BOOKING_ID
HTTP/2 204
```

A follow-up GET for the same ID returned:

```text
HTTP/2 404
{"error":"Booking not found"}
```

This confirms that the delete persisted. All error responses used the required
JSON format `{ "error": "..." }`.
