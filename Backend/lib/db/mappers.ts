import type {
  Address as DbAddress,
  Invoice as DbInvoice,
  InvoiceItem as DbInvoiceItem,
  Medicine as DbMedicine,
  Shop as DbShop,
  User as DbUser,
} from "@prisma/client";
import type {
  Address,
  Invoice,
  InvoiceItem,
  Medicine,
  PaymentMode,
  PaymentStatus,
  Shop,
  User,
  UserRole,
  UserStatus,
} from "@/types";

export function toAddress(row: DbAddress): Address {
  return row;
}

export function toUser(row: DbUser): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    mob_no: row.mob_no,
    role: row.role as UserRole,
    status: row.status as UserStatus,
    is_profile_complete: row.is_profile_complete,
    address_id: row.address_id,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export function toMedicine(row: DbMedicine): Medicine {
  return {
    ...row,
    mrp: row.mrp.toString(),
    rate: row.rate.toString(),
    gst_rate: row.gst_rate.toString(),
  };
}

export function toInvoice(row: DbInvoice): Invoice {
  return {
    ...row,
    invoice_date: row.invoice_date.toISOString(),
    sub_total: row.sub_total.toString(),
    discount: row.discount.toString(),
    cgst_total: row.cgst_total.toString(),
    sgst_total: row.sgst_total.toString(),
    net_amount: row.net_amount.toString(),
    payment_mode: row.payment_mode as PaymentMode,
    payment_status: row.payment_status as PaymentStatus,
  };
}

export function toInvoiceItem(row: DbInvoiceItem): InvoiceItem {
  return {
    ...row,
    mrp: row.mrp.toString(),
    rate: row.rate.toString(),
    gst_rate: row.gst_rate.toString(),
    taxable_amount: row.taxable_amount.toString(),
    cgst_amount: row.cgst_amount.toString(),
    sgst_amount: row.sgst_amount.toString(),
    total_amount: row.total_amount.toString(),
    created_at: row.created_at.toISOString(),
  };
}

export function toShop(row: DbShop, address: Address | null): Omit<Shop, "address_id"> & {
  address: Address | null;
} {
  return {
    id: row.id,
    shop_name: row.shop_name,
    phone: row.phone,
    email: row.email,
    drug_licence_number: row.drug_licence_number,
    pharmacist_name: row.pharmacist_name,
    pharmacist_registration_number: row.pharmacist_registration_number,
    gstin: row.gstin,
    location: row.location,
    owner_id: row.owner_id,
    image_id: row.image_id,
    created_at: row.created_at,
    updated_at: row.updated_at,
    address,
  };
}
