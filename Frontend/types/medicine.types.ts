// types/medicine.types.ts
import type { BaseEntity, PaginationParams } from "./common.types";

export interface Medicine extends BaseEntity {
  shop_id: string;
  description: string;
  batch_no: string;
  mrp: string;
  rate: string;
  gst_rate: string;
  exp_date: string;
  quantity: number;
  hsn_code: string;
  pack_size: string;
}

export type MedicineItem = Omit<Medicine, "created_at" | "updated_at">;

export interface PublicMedicineResponse extends Medicine {
  shop_name: string;
  shop_address: string | null;
  shop_location: string | null;
}

export interface CreateMedicineInput {
  shopId: string;
  description: string;
  batchNo: string;
  mrp: string;
  rate: string;
  gstRate: string;
  expDate: string;
  quantity: number;
  hsnCode: string;
  packSize: string;
}

export interface UpdateMedicineInput extends Partial<Omit<CreateMedicineInput, "shopId">> {
  id: string;
  shopId: string;
}

export interface MedicineQueryParams extends PaginationParams {
  shopId: string;
  search?: string;
}

export interface PublicMedicineQueryParams extends PaginationParams {
  search?: string;
  city?: string;
  pincode?: string;
}

export interface MedicineListResponse<T = Medicine> {
  medicines: T[];
  total: number;
  page: number;
  limit: number;
}

export type PublicMedicineListResponse = MedicineListResponse<PublicMedicineResponse>;