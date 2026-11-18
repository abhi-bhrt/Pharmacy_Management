// services/medicines/medicine-delete.service.ts
import type { PoolClient } from "pg";
import { pool, withTransaction, isPool, type DbExecutor } from "@/lib/db/client";
import { AppError } from "@/lib/api/app-error";

export async function deleteMedicineService(
  id: string,
  shopId: string,
  executor: DbExecutor = pool
): Promise<{ message: string }> {
  if (isPool(executor)) {
    return withTransaction((client) => executeDeleteMedicine(id, shopId, client), executor);
  }
  return executeDeleteMedicine(id, shopId, executor);
}

async function executeDeleteMedicine(
  id: string,
  shopId: string,
  client: PoolClient
): Promise<{ message: string }> {
  try {
    const existing = await client.query<{ id: string }>(
      `SELECT id FROM medicines WHERE id = $1 AND shop_id = $2 LIMIT 1`,
      [id, shopId]
    );

    if (existing.rows.length === 0) {
      throw AppError.notFound("Medicine not found");
    }

    await client.query(`DELETE FROM medicines WHERE id = $1 AND shop_id = $2`, [id, shopId]);

    return { message: "Medicine removed successfully" };
  } catch (error) {
    if (error instanceof AppError) throw error;
    if (typeof error === "object" && error !== null && "code" in error) {
      if (error.code === "22P02") {
        throw AppError.validation("Invalid Medicine ID format");
      }
      if (error.code === "23503") {
        throw AppError.conflict(
          "Cannot delete this medicine because it is referenced by existing invoices"
        );
      }
    }
    console.error("Error executing deleteMedicineService:", error);
    throw AppError.internal("Internal server error while deleting medicine");
  }
}