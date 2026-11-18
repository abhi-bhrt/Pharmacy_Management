// app/api/shops/search/route.ts
import { findShopsByQueryService } from "@/services/shops";
import { withApiHandler, sendSuccess } from "@/lib/api/api-handler";
import { AppError } from "@/lib/api/app-error";
import type { ShopResponse } from "@/types";

export const GET = withApiHandler(async (req: Request) => {
  const { searchParams } = new URL(req.url);
  const shopName = searchParams.get("shopName")?.trim() || undefined;
  const gstin = searchParams.get("gstin")?.trim() || undefined;

  if (!shopName && !gstin) {
    throw AppError.validation("At least one search parameter ('shopName' or 'gstin') is required");
  }

  const shops = await findShopsByQueryService({ shopName, gstin });

  return sendSuccess<{ shops: ShopResponse[] }>({ shops });
});