import type { DbExecutor } from "@/lib/db/client";
import type { BuyerInput } from "@/types";

export async function generateInvoiceNumber(
  shopId: string,
  executor: DbExecutor
): Promise<string> {
  const prefix = `INV-${new Date().getFullYear()}-`;
  const count = await executor.invoice.count({
    where: { shop_id: shopId, invoice_no: { startsWith: prefix } },
  });

  return `${prefix}${String(count + 1).padStart(4, "0")}`;
}

export async function findOrCreateBuyer(
  buyer: BuyerInput,
  executor: DbExecutor
): Promise<string> {
  const normalizedPhone = buyer.phone.trim();
  const existing = await executor.buyer.findFirst({
    where: { phone: normalizedPhone },
    select: { id: true },
  });

  if (existing) {
    await executor.buyer.update({
      where: { id: existing.id },
      data: {
        name: buyer.name.trim(),
        ...(buyer.gstin && { gstin: buyer.gstin.trim(), is_b2b: true }),
        ...(buyer.drugLicenceNumber && {
          drug_licence_number: buyer.drugLicenceNumber.trim(),
        }),
        ...(buyer.email && { email: buyer.email.toLowerCase().trim() }),
      },
    });
    return existing.id;
  }

  const created = await executor.buyer.create({
    data: {
      name: buyer.name.trim(),
      phone: normalizedPhone,
      email: buyer.email ? buyer.email.toLowerCase().trim() : null,
      gstin: buyer.gstin ? buyer.gstin.trim() : null,
      drug_licence_number: buyer.drugLicenceNumber
        ? buyer.drugLicenceNumber.trim()
        : null,
      is_b2b: Boolean(buyer.isB2b || buyer.gstin),
    },
    select: { id: true },
  });

  return created.id;
}
