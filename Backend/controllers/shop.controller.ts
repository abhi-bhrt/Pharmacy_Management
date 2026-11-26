import type { Request, Response } from "express";
import {
  createShopService,
  deleteShopService,
  getShopByOwnerService,
  updateShopService,
} from "@/services/shops";
import { AppError } from "@/lib/api/app-error";
import { getAuthenticatedUserId } from "@/lib/auth/auth.middleware";
import { sendSuccess, withApiHandler } from "@/lib/api/api-handler";
import { getJsonBody } from "./request.utils";
import type { AddressInput } from "@/types";

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && Boolean(value.trim());
}

function isAddressInput(value: unknown): value is AddressInput {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  const address = value as Record<string, unknown>;
  return ["pincode", "state", "district", "area"].every((field) =>
    isNonEmptyString(address[field])
  );
}

export const getMyShop = withApiHandler(async (request: Request, response: Response) => {
  const shop = await getShopByOwnerService(getAuthenticatedUserId(request));
  if (!shop) {
    throw AppError.notFound("Shop profile not found");
  }
  sendSuccess(response, { shop });
});

export const createShop = withApiHandler(async (request: Request, response: Response) => {
  const ownerId = getAuthenticatedUserId(request);
  const body = getJsonBody<Record<string, unknown>>(request);
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
    !isNonEmptyString(shopName) ||
    !isNonEmptyString(phone) ||
    !isNonEmptyString(email) ||
    !isNonEmptyString(drugLicenceNumber) ||
    !isNonEmptyString(pharmacistName) ||
    !isNonEmptyString(pharmacistRegistrationNumber) ||
    !isNonEmptyString(gstin) ||
    !isAddressInput(address)
  ) {
    throw AppError.validation("All shop details and address fields are required");
  }

  const shop = await createShopService({
    ownerId,
    shopName: shopName.trim(),
    phone: phone.trim(),
    email: email.trim().toLowerCase(),
    drugLicenceNumber: drugLicenceNumber.trim(),
    pharmacistName: pharmacistName.trim(),
    pharmacistRegistrationNumber: pharmacistRegistrationNumber.trim(),
    gstin: gstin.trim(),
    location: typeof location === "string" ? location.trim() : "",
    address,
    imageId: typeof imageId === "string" ? imageId : null,
  });
  sendSuccess(response, { shop }, "Shop created successfully", 201);
});

export const updateShop = withApiHandler(async (request: Request, response: Response) => {
  const body = getJsonBody<Record<string, unknown>>(request);
  const shop = await updateShopService({
    ownerId: getAuthenticatedUserId(request),
    ...body,
  });
  sendSuccess(response, { shop }, "Shop updated successfully");
});

export const removeShop = withApiHandler(async (request: Request, response: Response) => {
  const result = await deleteShopService(getAuthenticatedUserId(request));
  sendSuccess(response, result, "Shop deleted successfully");
});
