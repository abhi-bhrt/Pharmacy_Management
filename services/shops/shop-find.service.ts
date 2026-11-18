// services/shops/shop-find.service.ts
import { pool, type DbExecutor } from "@/lib/db/client";
import type { ShopResponse } from "@/types";

export async function getShopByOwnerService(
  ownerId: string,
  executor: DbExecutor = pool
): Promise<ShopResponse | null> {
  if (!ownerId?.trim()) {
    return null;
  }

  const queryText = `
    SELECT 
      s.*,
      CASE 
        WHEN a.id IS NOT NULL THEN json_build_object(
          'id', a.id,
          'pincode', a.pincode,
          'state', a.state,
          'country', a.country,
          'district', a.district,
          'area', a.area,
          'created_at', a.created_at,
          'updated_at', a.updated_at
        )
        ELSE NULL
      END AS address
    FROM shops s
    LEFT JOIN addresses a ON s.address_id = a.id
    WHERE s.owner_id = $1
    LIMIT 1
  `;

  const res = await executor.query<ShopResponse>(queryText, [ownerId.trim()]);
  return res.rows[0] ?? null;
}

export async function findShopsByQueryService(
  criteria: {
    shopName?: string;
    gstin?: string;
  },
  executor: DbExecutor = pool
): Promise<ShopResponse[]> {
  const shopName = criteria.shopName?.trim();
  const gstin = criteria.gstin?.trim();

  if (!shopName && !gstin) {
    return [];
  }

  let queryText = `
    SELECT 
      s.*,
      CASE 
        WHEN a.id IS NOT NULL THEN json_build_object(
          'id', a.id,
          'pincode', a.pincode,
          'state', a.state,
          'country', a.country,
          'district', a.district,
          'area', a.area,
          'created_at', a.created_at,
          'updated_at', a.updated_at
        )
        ELSE NULL
      END AS address
    FROM shops s
    LEFT JOIN addresses a ON s.address_id = a.id
    WHERE 1=1
  `;

  const values: unknown[] = [];
  let paramIndex = 1;

  if (shopName) {
    queryText += ` AND s.shop_name ILIKE $${paramIndex++}`;
    values.push(`%${shopName}%`);
  }

  if (gstin) {
    queryText += ` AND s.gstin ILIKE $${paramIndex++}`;
    values.push(`%${gstin}%`);
  }

  const res = await executor.query<ShopResponse>(queryText, values);
  return res.rows;
}