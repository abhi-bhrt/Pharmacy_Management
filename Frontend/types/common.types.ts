// types/common.types.ts
export interface BaseEntity {
  id: string;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface Address extends BaseEntity {
  pincode: string;
  state: string;
  country: string;
  district: string | null;
  area: string | null;
}

export interface AddressInput extends Omit<Address, keyof BaseEntity | "country" | "district" | "area"> {
  country?: string;
  district?: string | null;
  area?: string | null;
}

export type UpdateAddressInput = Partial<AddressInput>;

export interface PaginationParams {
  search?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages?: number;
}

export type ApiResponse<T = unknown> =
  | {
      success: true;
      data: T;
      message?: string;
    }
  | {
      success: false;
      error: {
        code: string;
        message: string;
        details?: unknown;
      };
    };