import { AppError } from "@/lib/api/app-error";
import { prisma, type DbExecutor } from "@/lib/db/client";
import { toInvoice, toInvoiceItem } from "@/lib/db/mappers";
import type { InvoiceFullResponse } from "@/types";

export interface PublicInvoicePublicResponse extends InvoiceFullResponse {
  shop: {
    shop_name: string;
    phone: string | null;
    email: string | null;
    gstin: string | null;
    drug_licence_number: string | null;
  };
}

export async function getPublicInvoiceByIdService(
  invoiceId: string,
  executor: DbExecutor = prisma
): Promise<PublicInvoicePublicResponse> {
  if (!invoiceId?.trim()) {
    throw AppError.validation("Invoice ID is required");
  }

  try {
    const invoice = await executor.invoice.findUnique({
      where: { id: invoiceId.trim() },
      include: {
        buyer: { select: { name: true, phone: true, email: true, gstin: true } },
        shop: {
          select: {
            shop_name: true,
            phone: true,
            email: true,
            gstin: true,
            drug_licence_number: true,
          },
        },
        items: { orderBy: { created_at: "asc" } },
      },
    });

    if (!invoice) {
      throw AppError.notFound("Invoice not found");
    }

    return {
      ...toInvoice(invoice),
      buyer: invoice.buyer,
      shop: invoice.shop,
      items: invoice.items.map(toInvoiceItem),
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2023") {
      throw AppError.validation("Invalid Invoice ID format");
    }
    console.error("Error executing getPublicInvoiceByIdService:", error);
    throw AppError.internal("Internal server error while fetching public invoice");
  }
}
