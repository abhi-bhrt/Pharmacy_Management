// app/api/protected/invoices/route.ts
import { getShopIdByOwner } from "@/services/medicines";
import { getInvoicesService, createInvoiceService } from "@/services/invoices";
import { withApiHandler, sendSuccess } from "@/lib/api/api-handler";
import { AppError } from "@/lib/api/app-error";
import type { InvoiceFullResponse, InvoiceListResponse } from "@/types";

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
  const rawLimit = parseInt(searchParams.get("limit") || "15", 10);

  const page = Number.isNaN(rawPage) || rawPage < 1 ? 1 : rawPage;
  const limit = Number.isNaN(rawLimit) || rawLimit < 1 ? 15 : Math.min(rawLimit, 100);

  const data: InvoiceListResponse = await getInvoicesService({
    shopId,
    search,
    page,
    limit,
  });

  return sendSuccess<InvoiceListResponse>(data);
});

export const POST = withApiHandler(async (req: Request) => {
  const userId = getAuthenticatedUserId(req);
  const shopId = await getShopIdByOwner(userId);
  const body = await req.json().catch(() => ({}));

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

  if (!buyer?.name?.trim() || !buyer?.phone?.trim()) {
    throw AppError.validation("Customer name and phone number are required");
  }

  if (!items || !Array.isArray(items) || items.length === 0) {
    throw AppError.validation("At least one item must be added to the invoice");
  }

  const parsedDiscount = Number(discount);
  if (Number.isNaN(parsedDiscount) || parsedDiscount < 0) {
    throw AppError.validation("Discount must be a valid non-negative number");
  }

  const invoice: InvoiceFullResponse = await createInvoiceService({
    shopId,
    buyerShopId: buyerShopId || null,
    buyer,
    items,
    discount: parsedDiscount,
    paymentMode,
    paymentStatus,
    doctorName,
    doctorRegNo,
    note,
  });

  return sendSuccess<{ invoice: InvoiceFullResponse }>(
    { invoice },
    "Invoice generated successfully",
    201
  );
});