// app/api/protected/shops/route.ts
import {
  getShopByOwnerService,
  createShopService,
  updateShopService,
  deleteShopService,
} from "@/services/shops";
import { withApiHandler, sendSuccess } from "@/lib/api/api-handler";
import { AppError } from "@/lib/api/app-error";
import type { ShopResponse } from "@/types";

function getAuthenticatedUserId(req: Request): string {
  const userId = req.headers.get("x-user-id");
  if (!userId) {
    throw AppError.unauthorized("Authentication context missing");
  }
  return userId;
}

export const GET = withApiHandler(async (req: Request) => {
  const ownerId = getAuthenticatedUserId(req);
  const shop = await getShopByOwnerService(ownerId);

  if (!shop) {
    throw AppError.notFound("Shop profile not found");
  }

  return sendSuccess<{ shop: ShopResponse }>({ shop });
});

export const POST = withApiHandler(async (req: Request) => {
  const ownerId = getAuthenticatedUserId(req);
  const body = await req.json().catch(() => ({}));

  const {
    shopName,
    phone,
    email,
    drugLicenceNumber,
    pharmacistName,
    pharmacistRegistrationNumber,
    gstin,
    location,
    address,
    imageId,
  } = body;

  if (
    !shopName?.trim() ||
    !phone?.trim() ||
    !email?.trim() ||
    !drugLicenceNumber?.trim() ||
    !pharmacistName?.trim() ||
    !pharmacistRegistrationNumber?.trim() ||
    !gstin?.trim() ||
    !address
  ) {
    throw AppError.validation("All shop details and address fields are required");
  }

  const newShop = await createShopService({
    ownerId,
    shopName: shopName.trim(),
    phone: phone.trim(),
    email: email.trim().toLowerCase(),
    drugLicenceNumber: drugLicenceNumber.trim(),
    pharmacistName: pharmacistName.trim(),
    pharmacistRegistrationNumber: pharmacistRegistrationNumber.trim(),
    gstin: gstin.trim(),
    location: location?.trim() || "",
    address,
    imageId: imageId || null,
  });

  return sendSuccess<{ shop: ShopResponse }>({ shop: newShop }, "Shop created successfully", 201);
});

export const PATCH = withApiHandler(async (req: Request) => {
  const ownerId = getAuthenticatedUserId(req);
  const body = await req.json().catch(() => ({}));

  const updatedShop = await updateShopService({
    ownerId,
    ...body,
  });

  return sendSuccess<{ shop: ShopResponse }>({ shop: updatedShop }, "Shop updated successfully");
});

export const DELETE = withApiHandler(async (req: Request) => {
  const ownerId = getAuthenticatedUserId(req);
  const result = await deleteShopService(ownerId);

  return sendSuccess<{ message: string }>(result, "Shop deleted successfully");
});