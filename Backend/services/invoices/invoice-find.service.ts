import { AppError } from "@/lib/api/app-error";
import { PAGINATION_DEFAULTS } from "@/config/constants";
import { prisma, type DbExecutor } from "@/lib/db/client";
import { toInvoice, toInvoiceItem } from "@/lib/db/mappers";
import type {
  InvoiceFullResponse,
  InvoiceListQueryParams,
  InvoiceListResponse,
  InvoiceSummary,
} from "@/types";

export async function getInvoicesService(
  params: InvoiceListQueryParams,
  executor: DbExecutor = prisma
): Promise<InvoiceListResponse> {
  const {
    shopId,
    search = "",
    page = PAGINATION_DEFAULTS.PAGE,
    limit = PAGINATION_DEFAULTS.LIMIT,
  } = params;

  const safePage = Math.max(1, page);
  const safeLimit = Math.min(Math.max(1, limit), PAGINATION_DEFAULTS.MAX_LIMIT);
  const searchTerm = search.trim();
  const where = {
    shop_id: shopId,
    ...(searchTerm && {
      OR: [
        { invoice_no: { contains: searchTerm, mode: "insensitive" as const } },
        {
          buyer: {
            is: {
              OR: [
                { name: { contains: searchTerm, mode: "insensitive" as const } },
                { phone: { contains: searchTerm, mode: "insensitive" as const } },
              ],
            },
          },
        },
      ],
    }),
  };

  const [rows, total] = await Promise.all([
    executor.invoice.findMany({
      where,
      include: {
        buyer: { select: { name: true, phone: true, gstin: true } },
        _count: { select: { items: true } },
      },
      orderBy: { invoice_date: "desc" },
      skip: (safePage - 1) * safeLimit,
      take: safeLimit,
    }),
    executor.invoice.count({ where }),
  ]);

  const invoices: InvoiceSummary[] = rows.map((row) => {
    const invoice = toInvoice(row);
    return {
      id: invoice.id,
      shop_id: invoice.shop_id,
      buyer_id: invoice.buyer_id,
      invoice_no: invoice.invoice_no,
      invoice_date: invoice.invoice_date,
      sub_total: invoice.sub_total,
      discount: invoice.discount,
      cgst_total: invoice.cgst_total,
      sgst_total: invoice.sgst_total,
      net_amount: invoice.net_amount,
      payment_mode: invoice.payment_mode,
      payment_status: invoice.payment_status,
      doctor_name: invoice.doctor_name,
      created_at: invoice.created_at,
      buyer_name: row.buyer.name,
      buyer_phone: row.buyer.phone,
      buyer_gstin: row.buyer.gstin,
      item_count: row._count.items,
    };
  });

  return {
    invoices,
    total,
    page: safePage,
    limit: safeLimit,
  };
}

export async function getInvoiceDetailsByIdService(
  invoiceId: string,
  shopId: string,
  executor: DbExecutor = prisma
): Promise<InvoiceFullResponse> {
  if (!invoiceId?.trim() || !shopId?.trim()) {
    throw AppError.validation("Invoice ID and Shop ID are required");
  }

  try {
    const invoice = await executor.invoice.findFirst({
      where: { id: invoiceId.trim(), shop_id: shopId.trim() },
      include: {
        buyer: { select: { name: true, phone: true, email: true, gstin: true } },
        items: { orderBy: { created_at: "asc" } },
      },
    });

    if (!invoice) {
      throw AppError.notFound("Invoice not found");
    }

    return {
      ...toInvoice(invoice),
      buyer: invoice.buyer,
      items: invoice.items.map(toInvoiceItem),
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2023") {
      throw AppError.validation("Invalid Invoice ID format");
    }
    console.error("Error executing getInvoiceDetailsByIdService:", error);
    throw AppError.internal("Internal server error while fetching invoice details");
  }
}
