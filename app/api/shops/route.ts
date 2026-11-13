// app/api/shops/route.ts
import { getPublicShopsService } from "@/services/public";
import { withApiHandler, sendSuccess } from "@/lib/api/api-handler";
import type { ShopListResponse } from "@/types";

export const GET = withApiHandler(async (req: Request) => {
  const { searchParams } = new URL(req.url);
  const city = searchParams.get("city") || "";
  const pincode = searchParams.get("pincode") || "";
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "20", 10);

  const result: ShopListResponse = await getPublicShopsService({
    city,
    pincode,
    page,
    limit,
  });

  return sendSuccess<ShopListResponse>(result);
});