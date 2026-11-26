import type { Request, Response } from "express";
import {
  createMedicineService,
  deleteMedicineService,
  getMedicinesService,
  getMedicineByIdService,
  getShopIdByOwner,
  updateMedicineService,
} from "@/services/medicines";
import { AppError } from "@/lib/api/app-error";
import { getAuthenticatedUserId } from "@/lib/auth/auth.middleware";
import { sendSuccess, withApiHandler } from "@/lib/api/api-handler";
import { getJsonBody, getPagination, getQueryString } from "./request.utils";

export const listMedicines = withApiHandler(async (request: Request, response: Response) => {
  const shopId = await getShopIdByOwner(getAuthenticatedUserId(request));
  const { page, limit } = getPagination(request);
  const result = await getMedicinesService({
    shopId,
    search: getQueryString(request, "search"),
    page,
    limit,
  });
  sendSuccess(response, result);
});

export const createMedicine = withApiHandler(async (request: Request, response: Response) => {
  const shopId = await getShopIdByOwner(getAuthenticatedUserId(request));
  const body = getJsonBody<Record<string, unknown>>(request);
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
    typeof description !== "string" ||
    !description.trim() ||
    typeof batchNo !== "string" ||
    !batchNo.trim() ||
    mrp === undefined ||
    rate === undefined ||
    gstRate === undefined ||
    typeof expDate !== "string" ||
    !expDate.trim() ||
    quantity === undefined ||
    typeof hsnCode !== "string" ||
    !hsnCode.trim() ||
    typeof packSize !== "string" ||
    !packSize.trim()
  ) {
    throw AppError.validation("All medicine fields are required");
  }

  const parsedMrp = Number(mrp);
  const parsedRate = Number(rate);
  const parsedGstRate = Number(gstRate);
  const parsedQuantity = Number(quantity);
  if (
    !Number.isFinite(parsedMrp) ||
    parsedMrp < 0 ||
    !Number.isFinite(parsedRate) ||
    parsedRate < 0 ||
    !Number.isFinite(parsedGstRate) ||
    parsedGstRate < 0
  ) {
    throw AppError.validation("MRP, Rate, and GST Rate must be valid non-negative numbers");
  }
  if (!Number.isInteger(parsedQuantity) || parsedQuantity < 0) {
    throw AppError.validation("Quantity must be a valid non-negative whole number");
  }

  const medicine = await createMedicineService({
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
  sendSuccess(response, { medicine }, "Medicine added successfully", 201);
});

export const getMedicine = withApiHandler(async (request: Request, response: Response) => {
  const shopId = await getShopIdByOwner(getAuthenticatedUserId(request));
  const medicine = await getMedicineByIdService(request.params.id, shopId);
  sendSuccess(response, { medicine });
});

export const updateMedicine = withApiHandler(async (request: Request, response: Response) => {
  const shopId = await getShopIdByOwner(getAuthenticatedUserId(request));
  const body = getJsonBody<Record<string, unknown>>(request);
  const parsedQuantity = body.quantity === undefined ? undefined : Number(body.quantity);
  if (
    parsedQuantity !== undefined &&
    (!Number.isInteger(parsedQuantity) || parsedQuantity < 0)
  ) {
    throw AppError.validation("Quantity must be a valid non-negative whole number");
  }

  const updated = await updateMedicineService({
    id: request.params.id,
    shopId,
    ...(body.description !== undefined && { description: String(body.description).trim() }),
    ...(body.batchNo !== undefined && { batchNo: String(body.batchNo).trim() }),
    ...(body.hsnCode !== undefined && { hsnCode: String(body.hsnCode).trim() }),
    ...(body.packSize !== undefined && { packSize: String(body.packSize).trim() }),
    ...(body.expDate !== undefined && { expDate: String(body.expDate).trim() }),
    ...(body.mrp !== undefined && { mrp: String(Number(body.mrp)) }),
    ...(body.rate !== undefined && { rate: String(Number(body.rate)) }),
    ...(body.gstRate !== undefined && { gstRate: String(Number(body.gstRate)) }),
    ...(parsedQuantity !== undefined && { quantity: parsedQuantity }),
  });
  sendSuccess(response, { medicine: updated }, "Medicine updated successfully");
});

export const removeMedicine = withApiHandler(async (request: Request, response: Response) => {
  const shopId = await getShopIdByOwner(getAuthenticatedUserId(request));
  const result = await deleteMedicineService(request.params.id, shopId);
  sendSuccess(response, result, "Medicine removed successfully");
});
