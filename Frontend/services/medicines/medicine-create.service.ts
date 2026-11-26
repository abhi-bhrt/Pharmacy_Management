import { AppError } from "@/lib/api/app-error";
import { prisma, withTransaction, type DbExecutor } from "@/lib/db/client";
import { toMedicine } from "@/lib/db/mappers";
import type { CreateMedicineInput, Medicine } from "@/types";

export async function createMedicineService(
  input: CreateMedicineInput,
  executor: DbExecutor = prisma
): Promise<Medicine> {
  return withTransaction((tx) => executeCreateMedicine(input, tx), executor);
}

async function executeCreateMedicine(
  input: CreateMedicineInput,
  executor: DbExecutor
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
    const existing = await executor.medicine.findFirst({
      where: {
        shop_id: shopId,
        batch_no: { equals: batchNo.trim(), mode: "insensitive" },
        hsn_code: { equals: hsnCode.trim(), mode: "insensitive" },
      },
      select: { id: true },
    });

    if (existing) {
      throw AppError.conflict(
        "Medicine with this Batch Number and HSN Code already exists in your inventory"
      );
    }

    const medicine = await executor.medicine.create({
      data: {
        shop_id: shopId,
        description: description.trim(),
        batch_no: batchNo.trim(),
        mrp,
        rate,
        gst_rate: gstRate,
        exp_date: expDate,
        quantity,
        hsn_code: hsnCode.trim(),
        pack_size: packSize.trim(),
      },
    });

    return toMedicine(medicine);
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error("Error executing createMedicineService:", error);
    throw AppError.internal("Internal server error while creating medicine");
  }
}
