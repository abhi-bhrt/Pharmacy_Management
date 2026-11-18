// services/medicines/medicine-create.service.ts
import type { PoolClient } from "pg";
import { pool, withTransaction, isPool, type DbExecutor } from "@/lib/db/client";
import { AppError } from "@/lib/api/app-error";
import type { CreateMedicineInput, Medicine } from "@/types";

export async function createMedicineService(
  input: CreateMedicineInput,
  executor: DbExecutor = pool
): Promise<Medicine> {
  if (isPool(executor)) {
    return withTransaction((client) => executeCreateMedicine(input, client), executor);
  }
  return executeCreateMedicine(input, executor);
}

async function executeCreateMedicine(
  input: CreateMedicineInput,
  client: PoolClient
): Promise<Medicine> {
  const {
    shopId,
    description,
    batchNo,
    mrp,
    rate,
    gstRate,
    expDate,
    quantity,
    hsnCode,
    packSize,
  } = input;

  try {
    const existing = await client.query<{ id: string }>(
      `SELECT id FROM medicines 
       WHERE shop_id = $1 AND LOWER(batch_no) = LOWER($2) AND LOWER(hsn_code) = LOWER($3) 
       LIMIT 1`,
      [shopId, batchNo.trim(), hsnCode.trim()]
    );

    if (existing.rows.length > 0) {
      throw AppError.conflict(
        "Medicine with this Batch Number and HSN Code already exists in your inventory"
      );
    }

    const res = await client.query<Medicine>(
      `INSERT INTO medicines (
        shop_id, description, batch_no, mrp, rate, 
        gst_rate, exp_date, quantity, hsn_code, pack_size
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        shopId,
        description.trim(),
        batchNo.trim(),
        mrp,
        rate,
        gstRate,
        expDate,
        quantity,
        hsnCode.trim(),
        packSize.trim(),
      ]
    );

    return res.rows[0];
  } catch (error) {
    if (error instanceof AppError) throw error;
    if (typeof error === "object" && error !== null && "code" in error) {
      if (error.code === "23505") {
        throw AppError.conflict("Medicine with this Batch Number and HSN Code already exists");
      }
      if (error.code === "22007" || error.code === "22008") {
        throw AppError.validation("Invalid expiry date format");
      }
    }
    console.error("Error executing createMedicineService:", error);
    throw AppError.internal("Internal server error while creating medicine");
  }
}