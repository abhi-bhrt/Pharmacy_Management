import { AppError } from "@/lib/api/app-error";
import { PAGINATION_DEFAULTS } from "@/config/constants";
import { prisma, type DbExecutor } from "@/lib/db/client";
import { toMedicine } from "@/lib/db/mappers";
import type { Medicine as DbMedicine } from "@prisma/client";
import type {
  PublicMedicineResponse,
  PublicMedicineListResponse,
  PublicMedicineQueryParams,
} from "@/types";

function toPublicMedicine(row: DbMedicine & {
  shop: {
    shop_name: string;
    location: string | null;
    address: { area: string; district: string; pincode: string };
  };
}): PublicMedicineResponse {
  const medicine = toMedicine(row);
  const address = [row.shop.address.area, row.shop.address.district, row.shop.address.pincode]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(", ");

  return {
    ...medicine,
    shop_name: row.shop.shop_name,
    shop_location: row.shop.location,
    shop_address: address || null,
  };
}

export async function getPublicMedicinesService(
  params: PublicMedicineQueryParams,
  executor: DbExecutor = prisma
): Promise<PublicMedicineListResponse> {
  const search = params.search?.trim() || "";
  const city = params.city?.trim() || "";
  const pincode = params.pincode?.trim() || "";

  const safePage = Math.max(1, params.page ?? PAGINATION_DEFAULTS.PAGE);
  const safeLimit = Math.min(
    Math.max(1, params.limit ?? PAGINATION_DEFAULTS.LIMIT),
    PAGINATION_DEFAULTS.MAX_LIMIT
  );
  const where = {
    ...(search
      ? {
          OR: [
            { description: { contains: search, mode: "insensitive" as const } },
            { batch_no: { contains: search, mode: "insensitive" as const } },
            { hsn_code: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
    ...(city || pincode
      ? {
          shop: {
            address: {
              is: {
                ...(city
                  ? {
                      OR: [
                        { district: { contains: city, mode: "insensitive" as const } },
                        { area: { contains: city, mode: "insensitive" as const } },
                      ],
                    }
                  : {}),
                ...(pincode && {
                  pincode: { contains: pincode, mode: "insensitive" as const },
                }),
              },
            },
          },
        }
      : {}),
  };

  try {
    const [rows, total] = await Promise.all([
      executor.medicine.findMany({
        where,
        include: {
          shop: {
            select: {
              shop_name: true,
              location: true,
              address: { select: { area: true, district: true, pincode: true } },
            },
          },
        },
        orderBy: { created_at: "desc" },
        skip: (safePage - 1) * safeLimit,
        take: safeLimit,
      }),
      executor.medicine.count({ where }),
    ]);

    return {
      medicines: rows.map(toPublicMedicine),
      total,
      page: safePage,
      limit: safeLimit,
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error("Error executing getPublicMedicinesService:", error);
    throw AppError.internal("Internal server error while fetching public medicines");
  }
}

export async function getPublicMedicineByIdService(
  id: string,
  executor: DbExecutor = prisma
): Promise<PublicMedicineResponse> {
  if (!id?.trim()) {
    throw AppError.validation("Medicine ID is required");
  }

  try {
    const row = await executor.medicine.findUnique({
      where: { id: id.trim() },
      include: {
        shop: {
          select: {
            shop_name: true,
            location: true,
            address: { select: { area: true, district: true, pincode: true } },
          },
        },
      },
    });

    if (!row) {
      throw AppError.notFound("Medicine not found");
    }

    return toPublicMedicine(row);
  } catch (error) {
    if (error instanceof AppError) throw error;
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2023") {
      throw AppError.validation("Invalid Medicine ID format");
    }
    console.error("Error executing getPublicMedicineByIdService:", error);
    throw AppError.internal("Internal server error while fetching medicine details");
  }
}
