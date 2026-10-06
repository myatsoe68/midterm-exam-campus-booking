import { Hono } from "hono";
import { mapBooking, type Equipment } from "./db.js";

type BookingInput = {
  equipmentId: string;
  borrowerName: string;
  startAt: string;
  endAt: string;
  purpose: string;
};

export type Env = {
  Bindings: {
    DB: D1Database;
  };
};

const app = new Hono<Env>();

const error = (message: string, status: 400 | 404 | 409 | 500) =>
  new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });

function parseInput(value: unknown): { input?: BookingInput; message?: string } {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { message: "Request body must be a JSON object" };
  }

  const body = value as Record<string, unknown>;
  const fields = ["equipmentId", "borrowerName", "startAt", "endAt", "purpose"] as const;
  for (const field of fields) {
    if (typeof body[field] !== "string" || body[field].trim() === "") {
      return { message: `${field} is required and must be a non-empty string` };
    }
  }

  const start = new Date(body.startAt as string);
  const end = new Date(body.endAt as string);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return { message: "startAt and endAt must be valid ISO date-time values" };
  }
  if (start.getTime() >= end.getTime()) {
    return { message: "startAt must be before endAt" };
  }

  return {
    input: {
      equipmentId: body.equipmentId as string,
      borrowerName: body.borrowerName as string,
      startAt: start.toISOString(),
      endAt: end.toISOString(),
      purpose: body.purpose as string,
    },
  };
}

async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new Error("Request body must contain valid JSON");
  }
}

async function equipmentExists(db: D1Database, equipmentId: string) {
  const row = await db.prepare("SELECT 1 FROM equipment WHERE id = ?").bind(equipmentId).first();
  return row !== null;
}

async function hasConflict(db: D1Database, input: BookingInput, excludedId?: string) {
  const row = await db
    .prepare(`
      SELECT 1 FROM bookings
      WHERE equipment_id = ?
        AND start_at < ?
        AND end_at > ?
        AND (? IS NULL OR id != ?)
      LIMIT 1
    `)
    .bind(input.equipmentId, input.endAt, input.startAt, excludedId ?? null, excludedId ?? null)
    .first();
  return row !== null;
}

app.get("/api/equipment", async (context) => {
  const { results } = await context.env.DB
    .prepare("SELECT id, name, location FROM equipment ORDER BY id")
    .all<Equipment>();
  return context.json(results);
});

app.get("/api/bookings", async (context) => {
  const { results } = await context.env.DB.prepare("SELECT * FROM bookings ORDER BY start_at, id").all();
  return context.json(results.map((row) => mapBooking(row as Record<string, unknown>)));
});

app.get("/api/bookings/:id", async (context) => {
  const row = await context.env.DB
    .prepare("SELECT * FROM bookings WHERE id = ?")
    .bind(context.req.param("id"))
    .first();
  return row ? context.json(mapBooking(row as Record<string, unknown>)) : error("Booking not found", 404);
});

app.post("/api/bookings", async (context) => {
  let body: unknown;
  try {
    body = await readJson(context.req.raw);
  } catch (cause) {
    return error((cause as Error).message, 400);
  }
  const parsed = parseInput(body);
  if (!parsed.input) return error(parsed.message ?? "Invalid booking data", 400);
  if (!(await equipmentExists(context.env.DB, parsed.input.equipmentId))) return error("Equipment not found", 400);
  if (await hasConflict(context.env.DB, parsed.input)) {
    return error("Booking time conflicts with an existing booking", 409);
  }

  const id = crypto.randomUUID();
  await context.env.DB
    .prepare(`
      INSERT INTO bookings (id, equipment_id, borrower_name, start_at, end_at, purpose)
      VALUES (?, ?, ?, ?, ?, ?)
    `)
    .bind(id, parsed.input.equipmentId, parsed.input.borrowerName, parsed.input.startAt, parsed.input.endAt, parsed.input.purpose)
    .run();
  return context.json({ id, ...parsed.input }, 201);
});

app.patch("/api/bookings/:id", async (context) => {
  const id = context.req.param("id");
  const existing = await context.env.DB.prepare("SELECT * FROM bookings WHERE id = ?").bind(id).first();
  if (!existing) return error("Booking not found", 404);

  let body: unknown;
  try {
    body = await readJson(context.req.raw);
  } catch (cause) {
    return error((cause as Error).message, 400);
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return error("Request body must be a JSON object", 400);
  }
  const patch = body as Record<string, unknown>;
  const stored = existing as Record<string, unknown>;
  const parsed = parseInput({
    equipmentId: patch.equipmentId ?? stored.equipment_id,
    borrowerName: patch.borrowerName ?? stored.borrower_name,
    startAt: patch.startAt ?? stored.start_at,
    endAt: patch.endAt ?? stored.end_at,
    purpose: patch.purpose ?? stored.purpose,
  });
  if (!parsed.input) return error(parsed.message ?? "Invalid booking data", 400);
  if (!(await equipmentExists(context.env.DB, parsed.input.equipmentId))) return error("Equipment not found", 400);
  if (await hasConflict(context.env.DB, parsed.input, id)) {
    return error("Booking time conflicts with an existing booking", 409);
  }

  await context.env.DB
    .prepare(`
      UPDATE bookings
      SET equipment_id = ?, borrower_name = ?, start_at = ?, end_at = ?, purpose = ?
      WHERE id = ?
    `)
    .bind(parsed.input.equipmentId, parsed.input.borrowerName, parsed.input.startAt, parsed.input.endAt, parsed.input.purpose, id)
    .run();
  return context.json({ id, ...parsed.input });
});

app.delete("/api/bookings/:id", async (context) => {
  const result = await context.env.DB
    .prepare("DELETE FROM bookings WHERE id = ?")
    .bind(context.req.param("id"))
    .run();
  return result.meta.changes ? new Response(null, { status: 204 }) : error("Booking not found", 404);
});

app.notFound((context) => error(`Route not found: ${context.req.path}`, 404));

app.onError((cause) => {
  console.error(cause);
  return error("Internal server error", 500);
});

export default app;
