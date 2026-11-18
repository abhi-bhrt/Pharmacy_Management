// services/invoices/invoice-public.service.ts
import { pool, type DbExecutor } from "@/lib/db/client";
import { AppError } from "@/lib/api/app-error";
import type { InvoiceFullResponse, InvoiceItem } from "@/types";

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
  executor: DbExecutor = pool
): Promise<PublicInvoicePublicResponse> {
  if (!invoiceId?.trim()) {
    throw AppError.validation("Invoice ID is required");
  }

  try {
    // 1. Fetch invoice, buyer details, and shop details in a single query
    const invoiceRes = await executor.query<any>(
      `SELECT 
        i.*,
        json_build_object(
          'name', b.name,
          'phone', b.phone,
          'email', b.email,
          'gstin', b.gstin
        ) AS buyer,
        json_build_object(
          'shop_name', s.shop_name,
          'phone', s.phone,
          'email', s.email,
          'gstin', s.gstin,
          'drug_licence_number', s.drug_licence_number
        ) AS shop
      FROM invoices i
      JOIN buyers b ON i.buyer_id = b.id
      JOIN shops s ON i.shop_id = s.id
      WHERE i.id = $1
      LIMIT 1`,
      [invoiceId.trim()]
    );

    if (invoiceRes.rows.length === 0) {
      throw AppError.notFound("Invoice not found");
    }

    // 2. Fetch invoice line items
    const itemsRes = await executor.query<InvoiceItem>(
      `SELECT * FROM invoice_items WHERE invoice_id = $1 ORDER BY created_at ASC`,
      [invoiceId.trim()]
    );

    const row = invoiceRes.rows[0];

    return {
      id: row.id,
      shop_id: row.shop_id,
      buyer_id: row.buyer_id,
      invoice_no: row.invoice_no,
      invoice_date: row.invoice_date,
      sub_total: row.sub_total,
      discount: row.discount,
      cgst_total: row.cgst_total,
      sgst_total: row.sgst_total,
      net_amount: row.net_amount,
      payment_mode: row.payment_mode,
      payment_status: row.payment_status,
      doctor_name: row.doctor_name,
      doctor_reg_no: row.doctor_reg_no,
      note: row.note,
      created_at: row.created_at,
      updated_at: row.updated_at,
      buyer: row.buyer,
      shop: row.shop,
      items: itemsRes.rows,
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    if (typeof error === "object" && error !== null && "code" in error && error.code === "22P02") {
      throw AppError.validation("Invalid Invoice ID format");
    }
    console.error("Error executing getPublicInvoiceByIdService:", error);
    throw AppError.internal("Internal server error while fetching public invoice");
  }
}