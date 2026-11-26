import { AppError } from "@/lib/api/app-error";
import { prisma, withTransaction, type DbExecutor } from "@/lib/db/client";
import { toInvoice, toInvoiceItem, toMedicine } from "@/lib/db/mappers";
import type {
  CreateInvoiceInput,
  InvoiceFullResponse,
  InvoiceItem,
} from "@/types";
import { findOrCreateBuyer, generateInvoiceNumber } from "./invoice.helper";

interface ProcessedInvoiceItem {
  medicineId: string;
  description: string;
  batchNo: string;
  expDate: string;
  hsnCode: string;
  packSize: string;
  quantity: number;
  freeQuantity: number;
  mrp: string;
  rate: string;
  gstRate: string;
  taxableAmount: string;
  cgstAmount: string;
  sgstAmount: string;
  totalAmount: string;
}

export async function createInvoiceService(
  input: CreateInvoiceInput,
  executor: DbExecutor = prisma
): Promise<InvoiceFullResponse> {
  return withTransaction((tx) => executeCreateInvoice(input, tx), executor);
}

async function executeCreateInvoice(
  input: CreateInvoiceInput,
  executor: DbExecutor
): Promise<InvoiceFullResponse> {
  const {
    shopId,
    buyerShopId,
    buyer,
    items,
    discount = 0,
    paymentMode,
    paymentStatus,
    doctorName,
    doctorRegNo,
    note,
  } = input;

  if (!items || items.length === 0) {
    throw AppError.validation("Invoice must contain at least one item");
  }

  if (buyerShopId && buyerShopId === shopId) {
    throw AppError.validation("Cannot generate a B2B transfer invoice to your own shop");
  }

  const buyerId = await findOrCreateBuyer(buyer, executor);
  let subTotal = 0;
  let cgstTotal = 0;
  let sgstTotal = 0;
  const processedItems: ProcessedInvoiceItem[] = [];

  for (const item of items) {
    if (!item.medicineId || !Number.isInteger(item.quantity) || item.quantity < 1) {
      throw AppError.validation("Each invoice item must have a valid medicine ID and quantity >= 1");
    }

    const freeQuantity = item.freeQuantity ?? 0;
    const totalDeductQuantity = item.quantity + freeQuantity;
    const medicineRow = await executor.medicine.findFirst({
      where: { id: item.medicineId, shop_id: shopId },
    });

    if (!medicineRow) {
      throw AppError.notFound(`Medicine (${item.medicineId})`);
    }

    const medicine = toMedicine(medicineRow);
    if (medicineRow.quantity < totalDeductQuantity) {
      throw new AppError(
        `Insufficient stock for "${medicine.description}". In stock: ${medicineRow.quantity}, requested: ${totalDeductQuantity}`,
        400,
        "INSUFFICIENT_STOCK"
      );
    }

    const rate = Number(medicine.rate);
    const gstRate = Number(medicine.gst_rate);
    const taxableAmount = +(rate * item.quantity).toFixed(2);
    const halfGst = gstRate / 2;
    const cgstAmount = +((taxableAmount * halfGst) / 100).toFixed(2);
    const sgstAmount = +((taxableAmount * halfGst) / 100).toFixed(2);
    const totalAmount = +(taxableAmount + cgstAmount + sgstAmount).toFixed(2);

    subTotal += taxableAmount;
    cgstTotal += cgstAmount;
    sgstTotal += sgstAmount;

    const stockUpdate = await executor.medicine.updateMany({
      where: { id: medicine.id, quantity: { gte: totalDeductQuantity } },
      data: { quantity: { decrement: totalDeductQuantity } },
    });
    if (stockUpdate.count === 0) {
      const current = await executor.medicine.findUnique({
        where: { id: medicine.id },
        select: { quantity: true },
      });
      throw new AppError(
        `Insufficient stock for "${medicine.description}". In stock: ${current?.quantity ?? 0}, requested: ${totalDeductQuantity}`,
        400,
        "INSUFFICIENT_STOCK"
      );
    }

    if (buyerShopId) {
      const buyerMedicine = await executor.medicine.findFirst({
        where: {
          shop_id: buyerShopId,
          batch_no: { equals: medicine.batch_no, mode: "insensitive" },
          hsn_code: { equals: medicine.hsn_code, mode: "insensitive" },
        },
        select: { id: true },
      });

      if (buyerMedicine) {
        await executor.medicine.update({
          where: { id: buyerMedicine.id },
          data: { quantity: { increment: totalDeductQuantity } },
        });
      } else {
        await executor.medicine.create({
          data: {
            shop_id: buyerShopId,
            description: medicine.description,
            batch_no: medicine.batch_no,
            mrp: medicine.mrp,
            rate: medicine.rate,
            gst_rate: medicine.gst_rate,
            exp_date: medicine.exp_date,
            quantity: totalDeductQuantity,
            hsn_code: medicine.hsn_code,
            pack_size: medicine.pack_size,
          },
        });
      }
    }

    processedItems.push({
      medicineId: medicine.id,
      description: medicine.description,
      batchNo: medicine.batch_no,
      expDate: medicine.exp_date,
      hsnCode: medicine.hsn_code,
      packSize: medicine.pack_size,
      quantity: item.quantity,
      freeQuantity,
      mrp: medicine.mrp,
      rate: medicine.rate,
      gstRate: medicine.gst_rate,
      taxableAmount: taxableAmount.toFixed(2),
      cgstAmount: cgstAmount.toFixed(2),
      sgstAmount: sgstAmount.toFixed(2),
      totalAmount: totalAmount.toFixed(2),
    });
  }

  const totalTax = cgstTotal + sgstTotal;
  const netAmount = Math.max(0, +(subTotal + totalTax - discount).toFixed(2));
  const invoiceNo = await generateInvoiceNumber(shopId, executor);

  const invoiceRow = await executor.invoice.create({
    data: {
      shop_id: shopId,
      buyer_id: buyerId,
      invoice_no: invoiceNo,
      sub_total: subTotal.toFixed(2),
      discount: discount.toFixed(2),
      cgst_total: cgstTotal.toFixed(2),
      sgst_total: sgstTotal.toFixed(2),
      net_amount: netAmount.toFixed(2),
      payment_mode: paymentMode,
      payment_status: paymentStatus,
      doctor_name: doctorName?.trim() || null,
      doctor_reg_no: doctorRegNo?.trim() || null,
      note: note?.trim() || null,
    },
  });

  const createdItems: InvoiceItem[] = [];
  for (const item of processedItems) {
    const itemRow = await executor.invoiceItem.create({
      data: {
        invoice_id: invoiceRow.id,
        medicine_id: item.medicineId,
        description: item.description,
        batch_no: item.batchNo,
        exp_date: item.expDate,
        hsn_code: item.hsnCode,
        pack_size: item.packSize,
        quantity: item.quantity,
        free_quantity: item.freeQuantity,
        mrp: item.mrp,
        rate: item.rate,
        gst_rate: item.gstRate,
        taxable_amount: item.taxableAmount,
        cgst_amount: item.cgstAmount,
        sgst_amount: item.sgstAmount,
        total_amount: item.totalAmount,
      },
    });
    createdItems.push(toInvoiceItem(itemRow));
  }

  return {
    ...toInvoice(invoiceRow),
    items: createdItems,
    buyer: {
      name: buyer.name.trim(),
      phone: buyer.phone.trim(),
      email: buyer.email?.toLowerCase().trim() || null,
      gstin: buyer.gstin?.trim() || null,
    },
  };
}
