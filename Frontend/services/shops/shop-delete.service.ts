import { AppError } from "@/lib/api/app-error";
import { prisma, withTransaction, type DbExecutor } from "@/lib/db/client";

export async function deleteShopService(
  ownerId: string,
  executor: DbExecutor = prisma
): Promise<{ message: string }> {
  if (!ownerId?.trim()) {
    throw AppError.validation("Owner ID is required to delete shop");
  }

  return withTransaction((tx) => executeDeleteShop(ownerId.trim(), tx), executor);
}

async function executeDeleteShop(
  ownerId: string,
  executor: DbExecutor
): Promise<{ message: string }> {
  const shop = await executor.shop.findFirst({
    where: { owner_id: ownerId },
    select: { id: true, address_id: true },
  });

  if (!shop) {
    throw AppError.notFound("Shop not found");
  }

  const hasInvoices = await executor.invoice.findFirst({
    where: { shop_id: shop.id },
    select: { id: true },
  });

  if (hasInvoices) {
    throw AppError.conflict(
      "Cannot delete shop with existing invoice records. Consider archiving or contacting support."
    );
  }

  await executor.shop.delete({ where: { id: shop.id } });
  await executor.address.delete({ where: { id: shop.address_id } });
  await executor.user.updateMany({
    where: { id: ownerId, role: "ADMIN" },
    data: { role: "CUSTOMER" },
  });

  return { message: "Shop deleted successfully" };
}
