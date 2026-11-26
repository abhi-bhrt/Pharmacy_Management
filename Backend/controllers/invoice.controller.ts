import type { Request, Response } from "express";
import { createInvoiceService, getInvoiceDetailsByIdService, getInvoicesService } from "@/services/invoices";
import { getShopIdByOwner } from "@/services/medicines";
import { AppError } from "@/lib/api/app-error";
import { getAuthenticatedUserId } from "@/lib/auth/auth.middleware";
import { sendSuccess, withApiHandler } from "@/lib/api/api-handler";
import { getJsonBody, getPagination, getQueryString } from "./request.utils";

export const listInvoices = withApiHandler(async (request: Request, response: Response) => {
  const shopId = await getShopIdByOwner(getAuthenticatedUserId(request));
  const { page, limit } = getPagination(request, 15);
  const data = await getInvoicesService({
    shopId,
    search: getQueryString(request, "search"),
    page,
    limit,
  });
  sendSuccess(response, data);
});

export const createInvoice = withApiHandler(async (request: Request, response: Response) => {
  const shopId = await getShopIdByOwner(getAuthenticatedUserId(request));
  const body = getJsonBody<Record<string, unknown>>(request);
  const {
    buyer,
    items,
    buyerShopId,
    discount = 0,
    paymentMode = "CASH",
    paymentStatus = "PAID",
    doctorName,
    doctorRegNo,
    note,
  } = body;

  const buyerDetails = buyer as { name?: unknown; phone?: unknown } | undefined;
  if (
    typeof buyerDetails?.name !== "string" ||
    !buyerDetails.name.trim() ||
    typeof buyerDetails.phone !== "string" ||
    !buyerDetails.phone.trim()
  ) {
    throw AppError.validation("Customer name and phone number are required");
  }
  if (!Array.isArray(items) || items.length === 0) {
    throw AppError.validation("At least one item must be added to the invoice");
  }

  const parsedDiscount = Number(discount);
  if (!Number.isFinite(parsedDiscount) || parsedDiscount < 0) {
    throw AppError.validation("Discount must be a valid non-negative number");
  }

  const invoice = await createInvoiceService({
    shopId,
    buyerShopId: typeof buyerShopId === "string" ? buyerShopId : null,
    buyer: buyer as Parameters<typeof createInvoiceService>[0]["buyer"],
    items: items as Parameters<typeof createInvoiceService>[0]["items"],
    discount: parsedDiscount,
    paymentMode: paymentMode as Parameters<typeof createInvoiceService>[0]["paymentMode"],
    paymentStatus: paymentStatus as Parameters<typeof createInvoiceService>[0]["paymentStatus"],
    ...(typeof doctorName === "string" && { doctorName }),
    ...(typeof doctorRegNo === "string" && { doctorRegNo }),
    ...(typeof note === "string" && { note }),
  });
  sendSuccess(response, { invoice }, "Invoice generated successfully", 201);
});

export const getInvoiceDetails = withApiHandler(
  async (request: Request, response: Response) => {
    const shopId = await getShopIdByOwner(getAuthenticatedUserId(request));
    const invoice = await getInvoiceDetailsByIdService(request.params.id, shopId);
    sendSuccess(response, { invoice });
  }
);
