// services/public/shops-find.service.ts
import { pool, type DbExecutor } from "@/lib/db/client";
import type { ShopResponse } from "@/types";

export async function getPublicShopsService(
  criteria: {
    city?: string;
    pincode?: string;
    page?: number;
    limit?: number;
  },
  executor: DbExecutor = pool
): Promise<{ shops: ShopResponse[]; total: number }> {
  const { city = "", pincode = "", page = 1, limit = 20 } = criteria;
  const offset = (page - 1) * limit;

  let queryText = `
    SELECT 
      s.*,
      CASE 
        WHEN a.id IS NOT NULL THEN row_to_json(a.*)
        ELSE NULL
      END AS address
    FROM shops s
    LEFT JOIN addresses a ON s.address_id = a.id
    WHERE 1=1
  `;

  let countQueryText = `
    SELECT COUNT(*) as total
    FROM shops s
    LEFT JOIN addresses a ON s.address_id = a.id
    WHERE 1=1
  `;

  const values: any[] = [];
  let paramIndex = 1;

  if (city) {
    queryText += ` AND (a.district ILIKE $${paramIndex} OR a.area ILIKE $${paramIndex})`;
    countQueryText += ` AND (a.district ILIKE $${paramIndex} OR a.area ILIKE $${paramIndex})`;
    values.push(`%${city}%`);
    paramIndex++;
  }

  if (pincode) {
    queryText += ` AND a.pincode ILIKE $${paramIndex}`;
    countQueryText += ` AND a.pincode ILIKE $${paramIndex}`;
    values.push(`%${pincode}%`);
    paramIndex++;
  }

  queryText += ` ORDER BY s.created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
  const paginatedValues = [...values, limit, offset];

  const [shopsRes, countRes] = await Promise.all([
    executor.query<ShopResponse>(queryText, paginatedValues),
    executor.query<{ total: string }>(countQueryText, values),
  ]);

  return {
    shops: shopsRes.rows,
    total: parseInt(countRes.rows[0]?.total || "0", 10),
  };
}