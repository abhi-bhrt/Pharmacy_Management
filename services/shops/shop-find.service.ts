import { prisma, type DbExecutor } from "@/lib/db/client";
import { toAddress, toShop } from "@/lib/db/mappers";
import type { ShopResponse } from "@/types";

export async function getShopByOwnerService(
  ownerId: string,
  executor: DbExecutor = prisma
): Promise<ShopResponse | null> {
  if (!ownerId?.trim()) {
    return null;
  }

  const shop = await executor.shop.findFirst({
    where: { owner_id: ownerId.trim() },
    include: { address: true },
  });

  return shop ? toShop(shop, toAddress(shop.address)) : null;
}

export async function findShopsByQueryService(
  criteria: {
    shopName?: string;
    gstin?: string;
  },
  executor: DbExecutor = prisma
): Promise<ShopResponse[]> {
  const shopName = criteria.shopName?.trim();
  const gstin = criteria.gstin?.trim();

  if (!shopName && !gstin) {
    return [];
  }

  const shops = await executor.shop.findMany({
    where: {
      AND: [
        ...(shopName
          ? [{ shop_name: { contains: shopName, mode: "insensitive" as const } }]
          : []),
        ...(gstin ? [{ gstin: { contains: gstin, mode: "insensitive" as const } }] : []),
      ],
    },
    include: { address: true },
  });

  return shops.map((shop) => toShop(shop, toAddress(shop.address)));
}
