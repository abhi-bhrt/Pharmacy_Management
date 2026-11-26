// app/api/protected/medicines/route.ts
import { getShopIdByOwner, getMedicinesService, createMedicineService } from "@/services/medicines";
import { withApiHandler, sendSuccess } from "@/lib/api/api-handler";
import { AppError } from "@/lib/api/app-error";
import type { Medicine, MedicineListResponse } from "@/types";

function getAuthenticatedUserId(req: Request): string {
  const userId = req.headers.get("x-user-id");
  if (!userId) {
    throw AppError.unauthorized("Authentication context missing");
  }
  return userId;
}

export const GET = withApiHandler(async (req: Request) => {
  const userId = getAuthenticatedUserId(req);
  const shopId = await getShopIdByOwner(userId);

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search")?.trim() || "";
  const rawPage = parseInt(searchParams.get("page") || "1", 10);
  const rawLimit = parseInt(searchParams.get("limit") || "20", 10);

  const page = Number.isNaN(rawPage) || rawPage < 1 ? 1 : rawPage;
  const limit = Number.isNaN(rawLimit) || rawLimit < 1 ? 20 : Math.min(rawLimit, 100);

  const result: MedicineListResponse = await getMedicinesService({
    shopId,
    search,
    page,
    limit,
  });

  return sendSuccess<MedicineListResponse>(result);
});

export const POST = withApiHandler(async (req: Request) => {
  const userId = getAuthenticatedUserId(req);
  const shopId = await getShopIdByOwner(userId);
  const body = await req.json().catch(() => ({}));

  const {
    description,
    batchNo,
    mrp,
    rate,
    gstRate,
    expDate,
    quantity,
    hsnCode,
    packSize,
  } = body;

  if (
    !description?.trim() ||
    !batchNo?.trim() ||
    mrp === undefined ||
    rate === undefined ||
    gstRate === undefined ||
    !expDate?.trim() ||
    quantity === undefined ||
    !hsnCode?.trim() ||
    !packSize?.trim()
  ) {
    throw AppError.validation("All medicine fields are required");
  }

  const parsedMrp = Number(mrp);
  const parsedRate = Number(rate);
  const parsedGstRate = Number(gstRate);
  const parsedQuantity = Number(quantity);

  if (
    Number.isNaN(parsedMrp) ||
    parsedMrp < 0 ||
    Number.isNaN(parsedRate) ||
    parsedRate < 0 ||
    Number.isNaN(parsedGstRate) ||
    parsedGstRate < 0
  ) {
    throw AppError.validation("MRP, Rate, and GST Rate must be valid non-negative numbers");
  }

  if (!Number.isInteger(parsedQuantity) || parsedQuantity < 0) {
    throw AppError.validation("Quantity must be a valid non-negative whole number");
  }

  const medicine: Medicine = await createMedicineService({
    shopId,
    description: description.trim(),
    batchNo: batchNo.trim(),
    mrp: String(parsedMrp),
    rate: String(parsedRate),
    gstRate: String(parsedGstRate),
    expDate: expDate.trim(),
    quantity: parsedQuantity,
    hsnCode: hsnCode.trim(),
    packSize: packSize.trim(),
  });

  return sendSuccess<{ medicine: Medicine }>({ medicine }, "Medicine added successfully", 201);
});