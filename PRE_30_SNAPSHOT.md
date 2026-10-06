# Pre-30-Minute Snapshot

## Initial checkpoint

The first implementation checkpoint contained the Hono server, SQLite schema,
seed equipment, all five booking routes, parameterized SQL, and basic validation.
The API was first run at `http://localhost:8787`, and the initial create request
returned `201 Created`.

## Review plan

After the checkpoint I reviewed the quality risks before final testing:

1. Verify malformed JSON returns the required JSON error shape.
2. Verify PATCH merges partial input and excludes the record being updated from
   its own conflict check.
3. Verify missing resources return the correct status instead of a success-shaped
   response.
4. Verify the overlap rule for both create and update.
