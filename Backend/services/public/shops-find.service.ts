import { AppError } from "@/lib/api/app-error";
import { prisma, type DbExecutor } from "@/lib/db/client";
import { toAddress, toShop } from "@/lib/db/mappers";
import type { ShopListResponse } from "@/types";

export async function getPublicShopsService(
  criteria: {
    search?: string;
    city?: string;
    pincode?: string;
    page?: number;
    limit?: number;
  },
  executor: DbExecutor = prisma
): Promise<ShopListResponse> {
  const search = criteria.search?.trim() || "";
  const city = criteria.city?.trim() || "";
  const pincode = criteria.pincode?.trim() || "";
  const page = Math.max(1, criteria.page ?? 1);
  const limit = Math.min(100, Math.max(1, criteria.limit ?? 20));
  const where = {
    ...(search && {
      shop_name: { contains: search, mode: "insensitive" as const },
    }),
    ...(city || pincode
      ? {
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
              ...(pincode && { pincode: { contains: pincode, mode: "insensitive" as const } }),
            },
          },
        }
      : {}),
  };

  try {
    const [shops, total] = await Promise.all([
      executor.shop.findMany({
        where,
        include: { address: true },
        orderBy: { created_at: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      executor.shop.count({ where }),
    ]);

    return {
      shops: shops.map((shop) => toShop(shop, toAddress(shop.address))),
      total,
    };
  } catch (error) {
    console.error("Error executing getPublicShopsService:", error);
    throw AppError.internal("Internal server error while fetching shops");
  }
}
