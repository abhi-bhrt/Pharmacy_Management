import { AppError } from "@/lib/api/app-error";
import { PAGINATION_DEFAULTS } from "@/config/constants";
import { prisma, type DbExecutor } from "@/lib/db/client";
import { toMedicine } from "@/lib/db/mappers";
import type { Medicine, MedicineListResponse, MedicineQueryParams } from "@/types";

export async function getShopIdByOwner(
  ownerId: string,
  executor: DbExecutor = prisma
): Promise<string> {
  if (!ownerId?.trim()) {
    throw AppError.unauthorized("Authentication context missing");
  }

  try {
    const shop = await executor.shop.findFirst({
      where: { owner_id: ownerId.trim() },
      select: { id: true },
    });
    if (!shop) {
      throw AppError.notFound("Shop profile not found for this account");
    }
    return shop.id;
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error("Error executing getShopIdByOwner:", error);
    throw AppError.internal("Failed to resolve store ownership");
  }
}

export async function getMedicinesService(
  params: MedicineQueryParams,
  executor: DbExecutor = prisma
): Promise<MedicineListResponse> {
  const {
    shopId = "",
    search = "",
    page = PAGINATION_DEFAULTS.PAGE,
    limit = PAGINATION_DEFAULTS.LIMIT,
  } = params;

  if (!shopId.trim()) {
    throw AppError.validation("Shop ID is required");
  }

  const safePage = Math.max(1, page);
  const safeLimit = Math.min(Math.max(1, limit), PAGINATION_DEFAULTS.MAX_LIMIT);
  const where = {
    shop_id: shopId.trim(),
    ...(search.trim()
      ? {
          OR: [
            { description: { contains: search.trim(), mode: "insensitive" as const } },
            { batch_no: { contains: search.trim(), mode: "insensitive" as const } },
            { hsn_code: { contains: search.trim(), mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  try {
    const [rows, total] = await Promise.all([
      executor.medicine.findMany({
        where,
        orderBy: { created_at: "desc" },
        skip: (safePage - 1) * safeLimit,
        take: safeLimit,
      }),
      executor.medicine.count({ where }),
    ]);

    return {
      medicines: rows.map(toMedicine),
      total,
      page: safePage,
      limit: safeLimit,
    };
  } catch (error) {
    console.error("Error executing getMedicinesService:", error);
    throw AppError.internal("Internal server error while fetching shop inventory");
  }
}

export async function getMedicineByIdService(
  id: string,
  shopId: string,
  executor: DbExecutor = prisma
): Promise<Medicine> {
  if (!id?.trim() || !shopId?.trim()) {
    throw AppError.validation("Medicine ID and Shop ID are required");
  }

  try {
    const row = await executor.medicine.findFirst({
      where: { id: id.trim(), shop_id: shopId.trim() },
    });

    if (!row) {
      throw AppError.notFound("Medicine not found");
    }

    return toMedicine(row);
  } catch (error) {
    if (error instanceof AppError) throw error;
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2023") {
      throw AppError.validation("Invalid Medicine ID format");
    }
    console.error("Error executing getMedicineByIdService:", error);
    throw AppError.internal("Internal server error while fetching medicine");
  }
}
