// services/public/shops-find.service.ts
import { pool, type DbExecutor } from "@/lib/db/client";
import { AppError } from "@/lib/api/app-error";
import type { ShopResponse, PublicShopsQuery, ShopListResponse } from "@/types";

export async function getPublicShopsService(
  criteria: PublicShopsQuery,
  executor: DbExecutor = pool
): Promise<ShopListResponse> {
  const search = criteria.search?.trim() || "";
  const city = criteria.city?.trim() || "";
  const pincode = criteria.pincode?.trim() || "";
  const page = Math.max(1, criteria.page ?? 1);
  const limit = Math.min(100, Math.max(1, criteria.limit ?? 20));
  const offset = (page - 1) * limit;

  const clauses: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (search) {
    clauses.push(`s.shop_name ILIKE $${paramIndex++}`);
    values.push(`%${search}%`);
  }

  if (city) {
    clauses.push(`(a.district ILIKE $${paramIndex} OR a.area ILIKE $${paramIndex})`);
    values.push(`%${city}%`);
    paramIndex++;
  }

  if (pincode) {
    clauses.push(`a.pincode ILIKE $${paramIndex++}`);
    values.push(`%${pincode}%`);
  }

  const whereClause = clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "";

  const queryText = `
    SELECT 
      s.id,
      s.shop_name,
      s.phone,
      s.email,
      s.drug_licence_number,
      s.pharmacist_name,
      s.pharmacist_registration_number,
      s.gstin,
      s.location,
      s.owner_id,
      s.image_id,
      s.created_at,
      s.updated_at,
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
    ${whereClause}
    ORDER BY s.created_at DESC
    LIMIT $${paramIndex++} OFFSET $${paramIndex++}
  `;

  const countQueryText = `
    SELECT COUNT(*)::text AS total
    FROM shops s
    LEFT JOIN addresses a ON s.address_id = a.id
    ${whereClause}
  `;

  try {
    const [shopsRes, countRes] = await Promise.all([
      executor.query<ShopResponse>(queryText, [...values, limit, offset]),
      executor.query<{ total: string }>(countQueryText, values),
    ]);

    return {
      shops: shopsRes.rows,
      total: parseInt(countRes.rows[0]?.total || "0", 10),
    };
  } catch (error) {
    console.error("Error executing getPublicShopsService:", error);
    throw AppError.internal("Internal server error while fetching shops");
  }
}