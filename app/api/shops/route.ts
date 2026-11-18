// app/api/shops/route.ts
import { getPublicShopsService } from "@/services/public";
import { withApiHandler, sendSuccess } from "@/lib/api/api-handler";
import type { ShopListResponse } from "@/types";

export const GET = withApiHandler(async (req: Request) => {
  const { searchParams } = new URL(req.url);
  const search =
    searchParams.get("search")?.trim() ||
    searchParams.get("shopName")?.trim() ||
    "";
  const city = searchParams.get("city")?.trim() || "";
  const pincode = searchParams.get("pincode")?.trim() || "";

  const rawPage = parseInt(searchParams.get("page") || "1", 10);
  const rawLimit = parseInt(searchParams.get("limit") || "20", 10);

  const page = Number.isNaN(rawPage) || rawPage < 1 ? 1 : rawPage;
  const limit = Number.isNaN(rawLimit) || rawLimit < 1 ? 20 : Math.min(rawLimit, 100);

  const result = await getPublicShopsService({
    search,
    city,
    pincode,
    page,
    limit,
  });

  return sendSuccess<ShopListResponse>(result);
});