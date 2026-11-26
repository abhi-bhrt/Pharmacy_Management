import { AppError } from "@/lib/api/app-error";
import { prisma, withTransaction, type DbExecutor } from "@/lib/db/client";

export async function deleteMedicineService(
  id: string,
  shopId: string,
  executor: DbExecutor = prisma
): Promise<{ message: string }> {
  return withTransaction((tx) => executeDeleteMedicine(id, shopId, tx), executor);
}

async function executeDeleteMedicine(
  id: string,
  shopId: string,
  executor: DbExecutor
): Promise<{ message: string }> {
  try {
    const existing = await executor.medicine.findFirst({
      where: { id, shop_id: shopId },
      select: { id: true },
    });

    if (!existing) {
      throw AppError.notFound("Medicine not found");
    }

    await executor.medicine.delete({ where: { id: existing.id } });
    return { message: "Medicine removed successfully" };
  } catch (error) {
    if (error instanceof AppError) throw error;
    if (typeof error === "object" && error !== null && "code" in error) {
      if (error.code === "P2023") {
        throw AppError.validation("Invalid Medicine ID format");
      }
      if (error.code === "P2003") {
        throw AppError.conflict(
          "Cannot delete this medicine because it is referenced by existing invoices"
        );
      }
    }
    console.error("Error executing deleteMedicineService:", error);
    throw AppError.internal("Internal server error while deleting medicine");
  }
}
