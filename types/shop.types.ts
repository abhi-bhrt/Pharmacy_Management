// types/shop.types.ts
import type { Address, AddressInput, BaseEntity, UpdateAddressInput } from "./common.types";

export interface Shop extends BaseEntity {
  shop_name: string;
  phone: string;
  email: string;
  drug_licence_number: string;
  pharmacist_name: string;
  pharmacist_registration_number: string;
  gstin: string;
  location: string | null;
  owner_id: string;
  address_id: string;
  image_id: string | null;
}

export interface ShopResponse extends Omit<Shop, "address_id"> {
  address: Address | null;
}

export interface CreateShopInput {
  ownerId: string;
  shopName: string;
  phone: string;
  email: string;
  drugLicenceNumber: string;
  location: string;
  pharmacistName: string;
  pharmacistRegistrationNumber: string;
  gstin: string;
  address: AddressInput;
  imageId?: string | null;
}

export interface UpdateShopInput extends Partial<Omit<CreateShopInput, "ownerId" | "address">> {
  ownerId: string;
  address?: UpdateAddressInput;
}

export interface PublicShopsQuery {
  search?: string;
  city?: string;
  pincode?: string;
  page?: number;
  limit?: number;
}

export interface FindShopsQuery {
  shopName?: string;
  gstin?: string;
}

export interface ShopListResponse {
  shops: ShopResponse[];
  total: number;
}