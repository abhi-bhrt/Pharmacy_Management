import type { Request, Response } from "express";
import { getPublicInvoiceByIdService } from "@/services/invoices";
import { getShopIdByOwner, getMedicineByIdService } from "@/services/medicines";
import { getPublicMedicinesService, getPublicShopsService } from "@/services/public";
import { findShopsByQueryService } from "@/services/shops";
import { AppError } from "@/lib/api/app-error";
import { getAuthenticatedUserId } from "@/lib/auth/auth.middleware";
import { sendSuccess, withApiHandler } from "@/lib/api/api-handler";
import { getPagination, getQueryString } from "./request.utils";

export const listMedicines = withApiHandler(async (request: Request, response: Response) => {
  const { page, limit } = getPagination(request);
  const result = await getPublicMedicinesService({
    search: getQueryString(request, "search"),
    city: getQueryString(request, "city"),
    pincode: getQueryString(request, "pincode"),
    page,
    limit,
  });
  sendSuccess(response, result);
});

export const getMedicine = withApiHandler(async (request: Request, response: Response) => {
  const userId = getAuthenticatedUserId(request);
  const shopId = await getShopIdByOwner(userId);
  const medicine = await getMedicineByIdService(request.params.id, shopId);
  sendSuccess(response, { medicine });
});

export const listShops = withApiHandler(async (request: Request, response: Response) => {
  const { page, limit } = getPagination(request);
  const result = await getPublicShopsService({
    search:
      getQueryString(request, "search") ||
      getQueryString(request, "shopName"),
    city: getQueryString(request, "city"),
    pincode: getQueryString(request, "pincode"),
    page,
    limit,
  });
  sendSuccess(response, result);
});

export const searchShops = withApiHandler(async (request: Request, response: Response) => {
  const shopName = getQueryString(request, "shopName") || undefined;
  const gstin = getQueryString(request, "gstin") || undefined;
  if (!shopName && !gstin) {
    throw AppError.validation(
      "At least one search parameter ('shopName' or 'gstin') is required"
    );
  }
  const shops = await findShopsByQueryService({ shopName, gstin });
  sendSuccess(response, { shops });
});

export const getInvoice = withApiHandler(async (request: Request, response: Response) => {
  const invoice = await getPublicInvoiceByIdService(request.params.id);
  sendSuccess(response, { invoice });
});
