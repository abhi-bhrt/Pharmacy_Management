// services/public/medicine-find.service.ts
import { pool, type DbExecutor } from "@/lib/db/client";
import { AppError } from "@/lib/api/app-error";
import { PAGINATION_DEFAULTS } from "@/config/constants";
import type {
  PublicMedicineResponse,
  PublicMedicineListResponse,
  PublicMedicineQueryParams,
} from "@/types";

export async function getPublicMedicinesService(
  params: PublicMedicineQueryParams,
  executor: DbExecutor = pool
): Promise<PublicMedicineListResponse> {
  const search = params.search?.trim() || "";
  const city = params.city?.trim() || "";
  const pincode = params.pincode?.trim() || "";

  const safePage = Math.max(1, params.page ?? PAGINATION_DEFAULTS.PAGE);
  const safeLimit = Math.min(
    Math.max(1, params.limit ?? PAGINATION_DEFAULTS.LIMIT),
    PAGINATION_DEFAULTS.MAX_LIMIT
  );
  const offset = (safePage - 1) * safeLimit;

  const clauses: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (city) {
    clauses.push(`(a.district ILIKE $${paramIndex} OR a.area ILIKE $${paramIndex})`);
    values.push(`%${city}%`);
    paramIndex++;
  }

  if (pincode) {
    clauses.push(`a.pincode ILIKE $${paramIndex++}`);
    values.push(`%${pincode}%`);
  }

  if (search) {
    clauses.push(
      `(m.description ILIKE $${paramIndex} OR m.batch_no ILIKE $${paramIndex} OR m.hsn_code ILIKE $${paramIndex})`
    );
    values.push(`%${search}%`);
    paramIndex++;
  }

  const whereClause = clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "";

  const queryText = `
    SELECT 
      m.id, 
      m.shop_id, 
      m.description, 
      m.batch_no, 
      m.mrp, 
      m.rate, 
      m.gst_rate, 
      m.exp_date, 
      m.quantity, 
      m.hsn_code, 
      m.pack_size, 
      m.created_at, 
      m.updated_at,
      s.shop_name AS shop_name,
      s.location AS shop_location,
      NULLIF(CONCAT_WS(', ', NULLIF(a.area, ''), NULLIF(a.district, ''), NULLIF(a.pincode, '')), '') AS shop_address
    FROM medicines m
    JOIN shops s ON m.shop_id = s.id
    LEFT JOIN addresses a ON s.address_id = a.id
    ${whereClause}
    ORDER BY m.created_at DESC
    LIMIT $${paramIndex++} OFFSET $${paramIndex++}
  `;

  const countQueryText = `
    SELECT COUNT(*)::int AS count
    FROM medicines m
    JOIN shops s ON m.shop_id = s.id
    LEFT JOIN addresses a ON s.address_id = a.id
    ${whereClause}
  `;

  try {
    const [medicinesRes, countRes] = await Promise.all([
      executor.query<PublicMedicineResponse>(queryText, [...values, safeLimit, offset]),
      executor.query<{ count: number }>(countQueryText, values),
    ]);

    return {
      medicines: medicinesRes.rows,
      total: countRes.rows[0]?.count ?? 0,
      page: safePage,
      limit: safeLimit,
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    console.error("Error executing getPublicMedicinesService:", error);
    throw AppError.internal("Internal server error while fetching public medicines");
  }
}

export async function getPublicMedicineByIdService(
  id: string,
  executor: DbExecutor = pool
): Promise<PublicMedicineResponse> {
  if (!id?.trim()) {
    throw AppError.validation("Medicine ID is required");
  }

  try {
    const res = await executor.query<PublicMedicineResponse>(
      `
        SELECT 
          m.id, 
          m.shop_id, 
          m.description, 
          m.batch_no, 
          m.mrp, 
          m.rate, 
          m.gst_rate, 
          m.exp_date, 
          m.quantity, 
          m.hsn_code, 
          m.pack_size, 
          m.created_at, 
          m.updated_at,
          s.shop_name AS shop_name,
          s.location AS shop_location,
          NULLIF(CONCAT_WS(', ', NULLIF(a.area, ''), NULLIF(a.district, ''), NULLIF(a.pincode, '')), '') AS shop_address
        FROM medicines m
        JOIN shops s ON m.shop_id = s.id
        LEFT JOIN addresses a ON s.address_id = a.id
        WHERE m.id = $1 
        LIMIT 1
      `,
      [id.trim()]
    );

    if (res.rows.length === 0) {
      throw AppError.notFound("Medicine not found");
    }

    return res.rows[0];
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    if (typeof error === "object" && error !== null && "code" in error && error.code === "22P02") {
      throw AppError.validation("Invalid Medicine ID format");
    }

    console.error("Error executing getPublicMedicineByIdService:", error);
    throw AppError.internal("Internal server error while fetching medicine details");
  }
}