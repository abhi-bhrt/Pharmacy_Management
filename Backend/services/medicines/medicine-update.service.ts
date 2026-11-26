import { AppError } from "@/lib/api/app-error";
import { prisma, withTransaction, type DbExecutor } from "@/lib/db/client";
import { toMedicine } from "@/lib/db/mappers";
import type { Medicine, UpdateMedicineInput } from "@/types";

export async function updateMedicineService(
  input: UpdateMedicineInput,
  executor: DbExecutor = prisma
): Promise<Medicine> {
  return withTransaction((tx) => executeUpdateMedicine(input, tx), executor);
}

async function executeUpdateMedicine(
  input: UpdateMedicineInput,
  executor: DbExecutor
): Promise<Medicine> {
  const { id, shopId, ...updates } = input;

  try {
    const existing = await executor.medicine.findFirst({
      where: { id, shop_id: shopId },
    });

    if (!existing) {
      throw AppError.notFound("Medicine not found");
    }

    const targetBatch = updates.batchNo?.trim() ?? existing.batch_no;
    const targetHsn = updates.hsnCode?.trim() ?? existing.hsn_code;

    if (updates.batchNo !== undefined || updates.hsnCode !== undefined) {
      const duplicate = await executor.medicine.findFirst({
        where: {
          shop_id: shopId,
          id: { not: id },
          batch_no: { equals: targetBatch, mode: "insensitive" },
          hsn_code: { equals: targetHsn, mode: "insensitive" },
        },
        select: { id: true },
      });

      if (duplicate) {
        throw AppError.conflict(
          "Another item already uses this Batch Number and HSN Code in this shop"
        );
      }
    }

    const data = {
      ...(updates.description !== undefined && { description: updates.description.trim() }),
      ...(updates.batchNo !== undefined && { batch_no: updates.batchNo.trim() }),
      ...(updates.mrp !== undefined && { mrp: updates.mrp }),
      ...(updates.rate !== undefined && { rate: updates.rate }),
      ...(updates.gstRate !== undefined && { gst_rate: updates.gstRate }),
      ...(updates.expDate !== undefined && { exp_date: updates.expDate }),
      ...(updates.quantity !== undefined && { quantity: updates.quantity }),
      ...(updates.hsnCode !== undefined && { hsn_code: updates.hsnCode.trim() }),
      ...(updates.packSize !== undefined && { pack_size: updates.packSize.trim() }),
    };

    if (Object.keys(data).length === 0) {
      return toMedicine(existing);
    }

    const updated = await executor.medicine.update({
      where: { id },
      data,
    });
    return toMedicine(updated);
  } catch (error) {
    if (error instanceof AppError) throw error;
    if (typeof error === "object" && error !== null && "code" in error) {
      if (error.code === "P2023") {
        throw AppError.validation("Invalid Medicine ID format");
      }
      if (error.code === "P2002") {
        throw AppError.conflict("Duplicate Batch Number and HSN Code");
      }
    }
    console.error("Error executing updateMedicineService:", error);
    throw AppError.internal("Internal server error while updating medicine");
  }
}
