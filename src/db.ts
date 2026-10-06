export type Equipment = {
  id: string;
  name: string;
  location: string;
};

export type Booking = {
  id: string;
  equipmentId: string;
  borrowerName: string;
  startAt: string;
  endAt: string;
  purpose: string;
};

export function mapBooking(row: Record<string, unknown>): Booking {
  return {
    id: String(row.id),
    equipmentId: String(row.equipment_id),
    borrowerName: String(row.borrower_name),
    startAt: String(row.start_at),
    endAt: String(row.end_at),
    purpose: String(row.purpose),
  };
}
